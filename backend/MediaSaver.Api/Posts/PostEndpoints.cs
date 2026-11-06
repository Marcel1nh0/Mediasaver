using System.Security.Claims;
using MediaSaver.Api.Arquivos;
using MediaSaver.Api.Contas;
using MediaSaver.Api.Dados;
using MySqlConnector;

namespace MediaSaver.Api.Posts;

public static class PostEndpoints
{
    public const int MaximoImagens = 5;

    private static readonly string[] Categorias = { "camera", "vinil", "video", "radio", "audio", "game", "outro" };

    public static IEndpointRouteBuilder MapPostEndpoints(this IEndpointRouteBuilder app)
    {
        var grupo = app.MapGroup("/api/posts").WithTags("Posts");

        // GET /api/posts?busca=kodak&autor=3  (lista de posts, os mais novos primeiro)
        grupo.MapGet("/", async (string? busca, int? autor, Banco banco, CancellationToken ct) =>
        {
            string? padrao = null;
            if (!string.IsNullOrWhiteSpace(busca))
            {
                busca = busca.Trim();
                padrao = "%" + busca + "%"; // LIKE '%kodak%' = contém "kodak"
            }
            else
            {
                busca = null;
            }

            using var conexao = await banco.AbrirAsync(ct);

            var comando = new MySqlCommand(@"
                SELECT p.id, p.titulo, p.marca, p.anoLancamento, p.categoria, p.karma, p.qtdcomments, p.dataPost,
                       u.id AS autorId, u.nome AS autorNome, u.fotoPath AS autorFoto,
                       (SELECT i.caminho FROM ImagemPost i WHERE i.idPost = p.id ORDER BY i.id LIMIT 1) AS capa
                FROM Post p
                LEFT JOIN Usuar u ON u.id = p.idUsuar
                WHERE (@busca IS NULL OR p.titulo LIKE @padrao OR p.marca LIKE @padrao OR p.categoria LIKE @padrao)
                  AND (@autor IS NULL OR p.idUsuar = @autor)
                ORDER BY p.dataPost DESC, p.id DESC
                LIMIT 200", conexao);
            Banco.Parametro(comando, "@busca", busca);
            Banco.Parametro(comando, "@padrao", padrao);
            Banco.Parametro(comando, "@autor", autor);

            var posts = new List<PostResumo>();

            using var leitor = await comando.ExecuteReaderAsync(ct);
            while (await leitor.ReadAsync(ct))
            {
                posts.Add(new PostResumo(
                    leitor.Int("id"),
                    leitor.Texto("titulo"),
                    leitor.TextoOuNulo("marca"),
                    leitor.IntOuNulo("anoLancamento"),
                    leitor.Texto("categoria"),
                    leitor.Int("karma"),
                    leitor.Int("qtdcomments"),
                    leitor.TextoOuNulo("capa"),
                    LerAutor(leitor),
                    leitor.Data("dataPost")));
            }

            return Results.Ok(posts);
        });

        // GET /api/posts/5  (detalhes, fotos e comentários)
        grupo.MapGet("/{id:int}", async (int id, ClaimsPrincipal user, Banco banco, CancellationToken ct) =>
        {
            using var conexao = await banco.AbrirAsync(ct);
            PostDetalhe? post = await DetalharAsync(conexao, id, user, ct);

            if (post == null)
                return PostNaoEncontrado();

            return Results.Ok(post);
        });

        // POST /api/posts  (formulário: titulo, descricao, marca, anoLancamento, categoria e até 5 "fotos")
        grupo.MapPost("/", async (
            HttpRequest request, ClaimsPrincipal user, Banco banco, Imagens imagens, CancellationToken ct) =>
        {
            if (!request.HasFormContentType)
                return ContaEndpoints.Erro(400, "Envie o post como formulário (multipart/form-data).");

            var formulario = await request.ReadFormAsync(ct);

            CamposPost campos = LerCampos(formulario);
            string? erro = ValidarCampos(campos);
            if (erro != null)
                return ContaEndpoints.Erro(400, erro);

            var fotos = formulario.Files.GetFiles("fotos");
            if (fotos.Count > MaximoImagens)
                return ContaEndpoints.Erro(400, "Envie no máximo " + MaximoImagens + " fotos.");

            foreach (var foto in fotos)
            {
                string? erroFoto = Imagens.Validar(foto);
                if (erroFoto != null)
                    return ContaEndpoints.Erro(400, erroFoto);
            }

            int idUsuario = ContaEndpoints.IdUsuario(user);
            var salvas = new List<string>();

            try
            {
                foreach (var foto in fotos)
                    salvas.Add(await imagens.SalvarAsync(foto, ct));

                using var conexao = await banco.AbrirAsync(ct);

                // Transação: ou tudo é gravado (post, fotos e interação), ou nada é.
                using var transacao = await conexao.BeginTransactionAsync(ct);

                var inserir = new MySqlCommand(@"
                    INSERT INTO Post (idUsuar, titulo, descricao, marca, anoLancamento, categoria)
                    VALUES (@idUsuario, @titulo, @descricao, @marca, @ano, @categoria)", conexao, transacao);
                Banco.Parametro(inserir, "@idUsuario", idUsuario);
                Banco.Parametro(inserir, "@titulo", campos.Titulo);
                Banco.Parametro(inserir, "@descricao", campos.Descricao);
                Banco.Parametro(inserir, "@marca", campos.Marca);
                Banco.Parametro(inserir, "@ano", campos.AnoLancamento);
                Banco.Parametro(inserir, "@categoria", campos.Categoria);
                await inserir.ExecuteNonQueryAsync(ct);

                int idPost = (int)inserir.LastInsertedId;

                for (int i = 0; i < salvas.Count; i++)
                    await InserirImagemAsync(conexao, transacao, idPost, i + 1, salvas[i], ct);

                var interacao = new MySqlCommand(
                    "INSERT INTO interacoes (idUsuar, idPost, descricao) VALUES (@idUsuario, @idPost, 'post')",
                    conexao, transacao);
                Banco.Parametro(interacao, "@idUsuario", idUsuario);
                Banco.Parametro(interacao, "@idPost", idPost);
                await interacao.ExecuteNonQueryAsync(ct);

                await AtualizarContadoresAsync(conexao, transacao, idPost, new List<int> { idUsuario }, ct);
                await transacao.CommitAsync(ct);

                return Results.Created("/api/posts/" + idPost, new { id = idPost });
            }
            catch
            {
                // Deu erro no banco: apaga as fotos que já tinham sido salvas.
                foreach (string url in salvas)
                    imagens.Apagar(url);
                throw;
            }
        }).RequireAuthorization();

        // PUT /api/posts/5  (mesmo formulário do POST, mais "removerImagens" com os ids das fotos que saem)
        grupo.MapPut("/{id:int}", async (
            int id, HttpRequest request, ClaimsPrincipal user, Banco banco, Imagens imagens, CancellationToken ct) =>
        {
            if (!request.HasFormContentType)
                return ContaEndpoints.Erro(400, "Envie o post como formulário (multipart/form-data).");

            var formulario = await request.ReadFormAsync(ct);

            CamposPost campos = LerCampos(formulario);
            string? erro = ValidarCampos(campos);
            if (erro != null)
                return ContaEndpoints.Erro(400, erro);

            using var conexao = await banco.AbrirAsync(ct);

            int? dono = await DonoDoPostAsync(conexao, id, ct);
            if (dono == null)
                return PostNaoEncontrado();
            if (!PodeMexer(user, dono.Value))
                return ContaEndpoints.Erro(403, "Só quem criou o post pode editá-lo.");

            List<ImagemResposta> atuais = await ImagensDoPostAsync(conexao, id, ct);

            // Ids das fotos que o usuário quer remover (só vale se a foto for mesmo deste post).
            var remover = new List<int>();
            foreach (string? valor in formulario["removerImagens"])
            {
                if (int.TryParse(valor, out int numero) && atuais.Any(a => a.Id == numero))
                    remover.Add(numero);
            }

            var novas = formulario.Files.GetFiles("fotos");
            if (atuais.Count - remover.Count + novas.Count > MaximoImagens)
                return ContaEndpoints.Erro(400, "Um post pode ter no máximo " + MaximoImagens + " fotos.");

            foreach (var foto in novas)
            {
                string? erroFoto = Imagens.Validar(foto);
                if (erroFoto != null)
                    return ContaEndpoints.Erro(400, erroFoto);
            }

            var salvas = new List<string>();
            try
            {
                foreach (var foto in novas)
                    salvas.Add(await imagens.SalvarAsync(foto, ct));

                using var transacao = await conexao.BeginTransactionAsync(ct);

                var atualizar = new MySqlCommand(@"
                    UPDATE Post SET titulo = @titulo, descricao = @descricao, marca = @marca,
                                    anoLancamento = @ano, categoria = @categoria
                    WHERE id = @id", conexao, transacao);
                Banco.Parametro(atualizar, "@id", id);
                Banco.Parametro(atualizar, "@titulo", campos.Titulo);
                Banco.Parametro(atualizar, "@descricao", campos.Descricao);
                Banco.Parametro(atualizar, "@marca", campos.Marca);
                Banco.Parametro(atualizar, "@ano", campos.AnoLancamento);
                Banco.Parametro(atualizar, "@categoria", campos.Categoria);
                await atualizar.ExecuteNonQueryAsync(ct);

                foreach (int numero in remover)
                {
                    var apagar = new MySqlCommand(
                        "DELETE FROM ImagemPost WHERE idPost = @id AND id = @numero", conexao, transacao);
                    Banco.Parametro(apagar, "@id", id);
                    Banco.Parametro(apagar, "@numero", numero);
                    await apagar.ExecuteNonQueryAsync(ct);
                }

                // As fotos novas continuam a numeração do post (1, 2, 3...).
                int proximo = 1;
                if (atuais.Count > 0)
                    proximo = atuais.Max(a => a.Id) + 1;

                foreach (string caminho in salvas)
                {
                    await InserirImagemAsync(conexao, transacao, id, proximo, caminho, ct);
                    proximo++;
                }

                await AtualizarContadoresAsync(conexao, transacao, id, new List<int>(), ct);
                await transacao.CommitAsync(ct);
            }
            catch
            {
                foreach (string url in salvas)
                    imagens.Apagar(url);
                throw;
            }

            // Só apaga os arquivos depois que o banco confirmou a mudança.
            foreach (var imagem in atuais)
            {
                if (remover.Contains(imagem.Id))
                    imagens.Apagar(imagem.Url);
            }

            return Results.Ok(await DetalharAsync(conexao, id, user, ct));
        }).RequireAuthorization();

        // DELETE /api/posts/5
        grupo.MapDelete("/{id:int}", async (
            int id, ClaimsPrincipal user, Banco banco, Imagens imagens, CancellationToken ct) =>
        {
            using var conexao = await banco.AbrirAsync(ct);

            int? dono = await DonoDoPostAsync(conexao, id, ct);
            if (dono == null)
                return PostNaoEncontrado();
            if (!PodeMexer(user, dono.Value))
                return ContaEndpoints.Erro(403, "Só quem criou o post pode excluí-lo.");

            List<ImagemResposta> fotos = await ImagensDoPostAsync(conexao, id, ct);

            // Todo mundo que interagiu com o post tem os contadores recalculados depois.
            var afetados = new List<int>();
            var buscarAfetados = new MySqlCommand(@"
                SELECT idUsuar FROM interacoes WHERE idPost = @id
                UNION SELECT idUsuar FROM comentario WHERE idPost = @id", conexao);
            Banco.Parametro(buscarAfetados, "@id", id);

            using (var leitor = await buscarAfetados.ExecuteReaderAsync(ct))
            {
                while (await leitor.ReadAsync(ct))
                    afetados.Add(leitor.Int("idUsuar"));
            }

            if (dono.Value > 0)
                afetados.Add(dono.Value);

            using var transacao = await conexao.BeginTransactionAsync(ct);

            // Fotos, comentários e interações apagam junto (ON DELETE CASCADE no banco).
            var apagar = new MySqlCommand("DELETE FROM Post WHERE id = @id", conexao, transacao);
            Banco.Parametro(apagar, "@id", id);
            await apagar.ExecuteNonQueryAsync(ct);

            await AtualizarContadoresAsync(conexao, transacao, null, afetados, ct);
            await transacao.CommitAsync(ct);

            foreach (var foto in fotos)
                imagens.Apagar(foto.Url);

            return Results.NoContent();
        }).RequireAuthorization();

        // POST /api/posts/5/comentarios  { conteudo }
        grupo.MapPost("/{id:int}/comentarios", async (
            int id, ComentarioRequest dados, ClaimsPrincipal user, Banco banco, CancellationToken ct) =>
        {
            string conteudo = (dados.Conteudo ?? "").Trim();
            if (conteudo.Length == 0 || conteudo.Length > 500)
                return ContaEndpoints.Erro(400, "O comentário precisa ter entre 1 e 500 caracteres.");

            using var conexao = await banco.AbrirAsync(ct);

            int? dono = await DonoDoPostAsync(conexao, id, ct);
            if (dono == null)
                return PostNaoEncontrado();

            int idUsuario = ContaEndpoints.IdUsuario(user);
            int idComentario;

            using (var transacao = await conexao.BeginTransactionAsync(ct))
            {
                var inserir = new MySqlCommand(
                    "INSERT INTO comentario (conteudo, idUsuar, idPost) VALUES (@conteudo, @idUsuario, @id)",
                    conexao, transacao);
                Banco.Parametro(inserir, "@conteudo", conteudo);
                Banco.Parametro(inserir, "@idUsuario", idUsuario);
                Banco.Parametro(inserir, "@id", id);
                await inserir.ExecuteNonQueryAsync(ct);

                idComentario = (int)inserir.LastInsertedId;

                var interacao = new MySqlCommand(@"
                    INSERT INTO interacoes (idUsuar, idPost, idComentario, descricao)
                    VALUES (@idUsuario, @id, @idComentario, 'comentario')", conexao, transacao);
                Banco.Parametro(interacao, "@idUsuario", idUsuario);
                Banco.Parametro(interacao, "@id", id);
                Banco.Parametro(interacao, "@idComentario", idComentario);
                await interacao.ExecuteNonQueryAsync(ct);

                await AtualizarContadoresAsync(conexao, transacao, id, new List<int> { idUsuario }, ct);
                await transacao.CommitAsync(ct);
            }

            List<ComentarioResposta> comentarios = await ComentariosAsync(conexao, id, user, ct);
            ComentarioResposta novo = comentarios.First(c => c.Id == idComentario);

            return Results.Created("/api/posts/" + id, novo);
        }).RequireAuthorization();

        // DELETE /api/comentarios/8
        app.MapDelete("/api/comentarios/{id:int}", async (
            int id, ClaimsPrincipal user, Banco banco, CancellationToken ct) =>
        {
            using var conexao = await banco.AbrirAsync(ct);

            int autor;
            int idPost;

            var buscar = new MySqlCommand("SELECT idUsuar, idPost FROM comentario WHERE id = @id", conexao);
            Banco.Parametro(buscar, "@id", id);

            using (var leitor = await buscar.ExecuteReaderAsync(ct))
            {
                if (!await leitor.ReadAsync(ct))
                    return ContaEndpoints.Erro(404, "Comentário não encontrado.");

                autor = leitor.Int("idUsuar");
                idPost = leitor.Int("idPost");
            }

            if (!PodeMexer(user, autor))
                return ContaEndpoints.Erro(403, "Só quem escreveu o comentário pode excluí-lo.");

            using var transacao = await conexao.BeginTransactionAsync(ct);

            var apagar = new MySqlCommand("DELETE FROM comentario WHERE id = @id", conexao, transacao);
            Banco.Parametro(apagar, "@id", id);
            await apagar.ExecuteNonQueryAsync(ct);

            await AtualizarContadoresAsync(conexao, transacao, idPost, new List<int> { autor }, ct);
            await transacao.CommitAsync(ct);

            return Results.NoContent();
        }).RequireAuthorization().WithTags("Posts");

        // POST /api/posts/5/voto  { valor }: 1 (upvote), -1 (downvote) ou 0 (tirar o voto).
        // Cada pessoa tem no máximo um voto por post.
        grupo.MapPost("/{id:int}/voto", async (
            int id, VotoRequest dados, ClaimsPrincipal user, Banco banco, CancellationToken ct) =>
        {
            if (dados.Valor < -1 || dados.Valor > 1)
                return ContaEndpoints.Erro(400, "O voto precisa ser 1, -1 ou 0.");

            using var conexao = await banco.AbrirAsync(ct);

            int? dono = await DonoDoPostAsync(conexao, id, ct);
            if (dono == null)
                return PostNaoEncontrado();

            int idUsuario = ContaEndpoints.IdUsuario(user);

            using (var transacao = await conexao.BeginTransactionAsync(ct))
            {
                // Apaga o voto anterior (se houver) e grava o novo.
                var apagarVoto = new MySqlCommand(@"
                    DELETE FROM interacoes
                    WHERE idPost = @id AND idUsuar = @idUsuario AND descricao IN ('upvote', 'downvote')",
                    conexao, transacao);
                Banco.Parametro(apagarVoto, "@id", id);
                Banco.Parametro(apagarVoto, "@idUsuario", idUsuario);
                await apagarVoto.ExecuteNonQueryAsync(ct);

                if (dados.Valor != 0)
                {
                    string descricao = "downvote";
                    if (dados.Valor > 0)
                        descricao = "upvote";

                    var inserirVoto = new MySqlCommand(
                        "INSERT INTO interacoes (idUsuar, idPost, descricao) VALUES (@idUsuario, @id, @descricao)",
                        conexao, transacao);
                    Banco.Parametro(inserirVoto, "@idUsuario", idUsuario);
                    Banco.Parametro(inserirVoto, "@id", id);
                    Banco.Parametro(inserirVoto, "@descricao", descricao);
                    await inserirVoto.ExecuteNonQueryAsync(ct);
                }

                // Recalcula o post, quem votou e o dono do post.
                await AtualizarContadoresAsync(conexao, transacao, id, new List<int> { idUsuario, dono.Value }, ct);
                await transacao.CommitAsync(ct);
            }

            var buscarKarma = new MySqlCommand("SELECT karma FROM Post WHERE id = @id", conexao);
            Banco.Parametro(buscarKarma, "@id", id);
            int karma = Convert.ToInt32(await buscarKarma.ExecuteScalarAsync(ct));

            return Results.Ok(new VotoResposta(karma, dados.Valor));
        }).RequireAuthorization();

        return app;
    }

    // ---------- Funções de apoio ----------

    private static async Task<PostDetalhe?> DetalharAsync(
        MySqlConnection conexao, int id, ClaimsPrincipal user, CancellationToken ct)
    {
        string titulo;
        string? descricao;
        string? marca;
        int? ano;
        string categoria;
        int karma;
        DateTime data;
        AutorResposta? autor;

        var comando = new MySqlCommand(@"
            SELECT p.id, p.titulo, p.descricao, p.marca, p.anoLancamento, p.categoria, p.karma, p.dataPost,
                   u.id AS autorId, u.nome AS autorNome, u.fotoPath AS autorFoto
            FROM Post p
            LEFT JOIN Usuar u ON u.id = p.idUsuar
            WHERE p.id = @id", conexao);
        Banco.Parametro(comando, "@id", id);

        using (var leitor = await comando.ExecuteReaderAsync(ct))
        {
            if (!await leitor.ReadAsync(ct))
                return null;

            titulo = leitor.Texto("titulo");
            descricao = leitor.TextoOuNulo("descricao");
            marca = leitor.TextoOuNulo("marca");
            ano = leitor.IntOuNulo("anoLancamento");
            categoria = leitor.Texto("categoria");
            karma = leitor.Int("karma");
            data = leitor.Data("dataPost");
            autor = LerAutor(leitor);
        }

        // Voto de quem está vendo: 1, -1 ou 0 (sem voto ou sem login).
        int meuVoto = 0;
        if (ContaEndpoints.EstaLogado(user))
        {
            var buscarVoto = new MySqlCommand(@"
                SELECT descricao FROM interacoes
                WHERE idPost = @id AND idUsuar = @idUsuario AND descricao IN ('upvote', 'downvote')
                LIMIT 1", conexao);
            Banco.Parametro(buscarVoto, "@id", id);
            Banco.Parametro(buscarVoto, "@idUsuario", ContaEndpoints.IdUsuario(user));
            string? voto = await buscarVoto.ExecuteScalarAsync(ct) as string;

            if (voto == "upvote")
                meuVoto = 1;
            else if (voto == "downvote")
                meuVoto = -1;
        }

        int idDono = 0;
        if (autor != null)
            idDono = autor.Id;

        bool podeEditar = PodeMexer(user, idDono);

        List<ImagemResposta> imagens = await ImagensDoPostAsync(conexao, id, ct);
        List<ComentarioResposta> comentarios = await ComentariosAsync(conexao, id, user, ct);

        return new PostDetalhe(id, titulo, descricao, marca, ano, categoria, karma, data, autor,
            imagens, comentarios, meuVoto, podeEditar);
    }

    private static async Task<List<ImagemResposta>> ImagensDoPostAsync(
        MySqlConnection conexao, int idPost, CancellationToken ct)
    {
        var imagens = new List<ImagemResposta>();

        var comando = new MySqlCommand("SELECT id, caminho FROM ImagemPost WHERE idPost = @idPost ORDER BY id", conexao);
        Banco.Parametro(comando, "@idPost", idPost);

        using var leitor = await comando.ExecuteReaderAsync(ct);
        while (await leitor.ReadAsync(ct))
            imagens.Add(new ImagemResposta(leitor.Int("id"), leitor.Texto("caminho")));

        return imagens;
    }

    private static async Task<List<ComentarioResposta>> ComentariosAsync(
        MySqlConnection conexao, int idPost, ClaimsPrincipal user, CancellationToken ct)
    {
        var comentarios = new List<ComentarioResposta>();

        var comando = new MySqlCommand(@"
            SELECT c.id, c.conteudo, c.dataComent, u.id AS autorId, u.nome AS autorNome, u.fotoPath AS autorFoto
            FROM comentario c
            JOIN Usuar u ON u.id = c.idUsuar
            WHERE c.idPost = @idPost
            ORDER BY c.dataComent, c.id", conexao);
        Banco.Parametro(comando, "@idPost", idPost);

        using var leitor = await comando.ExecuteReaderAsync(ct);
        while (await leitor.ReadAsync(ct))
        {
            var autor = new AutorResposta(leitor.Int("autorId"), leitor.Texto("autorNome"), leitor.TextoOuNulo("autorFoto"));

            comentarios.Add(new ComentarioResposta(
                leitor.Int("id"),
                leitor.Texto("conteudo"),
                leitor.Data("dataComent"),
                autor,
                PodeMexer(user, autor.Id)));
        }

        return comentarios;
    }

    private static async Task InserirImagemAsync(
        MySqlConnection conexao, MySqlTransaction transacao, int idPost, int numero, string caminho, CancellationToken ct)
    {
        var comando = new MySqlCommand(
            "INSERT INTO ImagemPost (idPost, id, caminho) VALUES (@idPost, @numero, @caminho)", conexao, transacao);
        Banco.Parametro(comando, "@idPost", idPost);
        Banco.Parametro(comando, "@numero", numero);
        Banco.Parametro(comando, "@caminho", caminho);
        await comando.ExecuteNonQueryAsync(ct);
    }

    /// <summary>
    /// Recalcula karma e contadores contando direto nas tabelas, em vez de somar e subtrair na mão.
    /// Assim os números nunca ficam errados, mesmo depois de excluir coisas.
    /// </summary>
    private static async Task AtualizarContadoresAsync(
        MySqlConnection conexao, MySqlTransaction transacao, int? idPost, List<int> usuarios, CancellationToken ct)
    {
        if (idPost != null)
        {
            var atualizarPost = new MySqlCommand(@"
                UPDATE Post SET
                    karma = (SELECT COALESCE(SUM(CASE descricao WHEN 'upvote' THEN 1 WHEN 'downvote' THEN -1 ELSE 0 END), 0)
                             FROM interacoes WHERE idPost = @idPost),
                    qtdcomments = (SELECT COUNT(*) FROM comentario WHERE idPost = @idPost),
                    qtdimagem = (SELECT COUNT(*) FROM ImagemPost WHERE idPost = @idPost)
                WHERE id = @idPost", conexao, transacao);
            Banco.Parametro(atualizarPost, "@idPost", idPost);
            await atualizarPost.ExecuteNonQueryAsync(ct);
        }

        // O karma do usuário é a soma do karma dos posts dele.
        var jaAtualizados = new List<int>();
        foreach (int idUsuario in usuarios)
        {
            if (idUsuario <= 0 || jaAtualizados.Contains(idUsuario))
                continue;

            var atualizarUsuario = new MySqlCommand(@"
                UPDATE Usuar SET
                    karma = (SELECT COALESCE(SUM(karma), 0) FROM Post WHERE idUsuar = @idUsuario),
                    qtdPost = (SELECT COUNT(*) FROM Post WHERE idUsuar = @idUsuario),
                    qtdInt = (SELECT COUNT(*) FROM interacoes WHERE idUsuar = @idUsuario)
                WHERE id = @idUsuario", conexao, transacao);
            Banco.Parametro(atualizarUsuario, "@idUsuario", idUsuario);
            await atualizarUsuario.ExecuteNonQueryAsync(ct);

            jaAtualizados.Add(idUsuario);
        }
    }

    /// <summary>Id do dono do post (0 se a conta dele foi apagada), ou null se o post não existe.</summary>
    private static async Task<int?> DonoDoPostAsync(MySqlConnection conexao, int id, CancellationToken ct)
    {
        var comando = new MySqlCommand("SELECT idUsuar FROM Post WHERE id = @id", conexao);
        Banco.Parametro(comando, "@id", id);

        using var leitor = await comando.ExecuteReaderAsync(ct);
        if (!await leitor.ReadAsync(ct))
            return null;

        int? dono = leitor.IntOuNulo("idUsuar");
        if (dono == null)
            return 0;

        return dono;
    }

    /// <summary>Só o dono (ou um administrador) pode editar ou excluir.</summary>
    private static bool PodeMexer(ClaimsPrincipal user, int idDono)
    {
        if (!ContaEndpoints.EstaLogado(user))
            return false;

        return ContaEndpoints.IdUsuario(user) == idDono || ContaEndpoints.EhAdm(user);
    }

    private static CamposPost LerCampos(IFormCollection formulario)
    {
        var campos = new CamposPost();
        campos.Titulo = Campo(formulario, "titulo") ?? "";
        campos.Descricao = Campo(formulario, "descricao");
        campos.Marca = Campo(formulario, "marca");
        campos.TextoAno = Campo(formulario, "anoLancamento");
        campos.Categoria = Campo(formulario, "categoria") ?? "outro";
        return campos;
    }

    /// <summary>Devolve a mensagem de erro, ou null se estiver tudo certo.</summary>
    private static string? ValidarCampos(CamposPost campos)
    {
        if (campos.Titulo.Length < 3 || campos.Titulo.Length > 100)
            return "O título precisa ter entre 3 e 100 caracteres.";
        if (campos.Descricao != null && campos.Descricao.Length > 1000)
            return "A descrição pode ter no máximo 1000 caracteres.";
        if (campos.Marca != null && campos.Marca.Length > 50)
            return "A marca pode ter no máximo 50 caracteres.";
        if (!Categorias.Contains(campos.Categoria))
            return "Escolha uma categoria da lista.";

        if (campos.TextoAno != null)
        {
            int anoMaximo = DateTime.Now.Year + 1;

            if (!int.TryParse(campos.TextoAno, out int ano) || ano < 1800 || ano > anoMaximo)
                return "O ano de lançamento precisa ser um número entre 1800 e " + anoMaximo + ".";

            campos.AnoLancamento = ano;
        }

        return null;
    }

    /// <summary>Valor de um campo do formulário, ou null se veio vazio.</summary>
    private static string? Campo(IFormCollection formulario, string nome)
    {
        string valor = formulario[nome].ToString().Trim();

        if (valor.Length == 0)
            return null;

        return valor;
    }

    private static AutorResposta? LerAutor(MySqlDataReader leitor)
    {
        int? idAutor = leitor.IntOuNulo("autorId");
        if (idAutor == null)
            return null; // a conta do autor foi apagada

        return new AutorResposta(idAutor.Value, leitor.Texto("autorNome"), leitor.TextoOuNulo("autorFoto"));
    }

    private static IResult PostNaoEncontrado()
    {
        return ContaEndpoints.Erro(404, "Post não encontrado.");
    }
}
