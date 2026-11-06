using System.Security.Claims;
using MediaSaver.Api.Arquivos;
using MediaSaver.Api.Contas;
using MediaSaver.Api.Dados;
using MySqlConnector;

namespace MediaSaver.Api.Posts;

public static class PostEndpoints
{
    public const int MaximoImagens = 5;

    private static readonly string[] Categorias = ["camera", "vinil", "video", "radio", "audio", "game", "outro"];

    public static IEndpointRouteBuilder MapPostEndpoints(this IEndpointRouteBuilder app)
    {
        var grupo = app.MapGroup("/api/posts").WithTags("Posts");

        // GET /api/posts?busca=kodak&autor=3
        grupo.MapGet("/", async (string? busca, int? autor, Banco banco, CancellationToken ct) =>
        {
            busca = string.IsNullOrWhiteSpace(busca) ? null : busca.Trim();
            var padrao = busca is null ? null : $"%{EscaparLike(busca)}%";

            await using var conexao = await banco.AbrirAsync(ct);
            await using var leitor = await conexao.Sql("""
                SELECT p.id, p.titulo, p.marca, p.anoLancamento, p.categoria, p.karma, p.qtdcomments, p.dataPost,
                       u.id AS autorId, u.nome AS autorNome, u.fotoPath AS autorFoto,
                       (SELECT i.caminho FROM ImagemPost i WHERE i.idPost = p.id ORDER BY i.id LIMIT 1) AS capa
                FROM Post p
                LEFT JOIN Usuar u ON u.id = p.idUsuar
                WHERE (@busca IS NULL OR p.titulo LIKE @padrao OR p.marca LIKE @padrao OR p.categoria LIKE @padrao)
                  AND (@autor IS NULL OR p.idUsuar = @autor)
                ORDER BY p.dataPost DESC, p.id DESC
                LIMIT 200
                """, new { busca, padrao, autor }).ExecuteReaderAsync(ct);

            var posts = new List<PostResumo>();
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

        grupo.MapGet("/{id:int}", async (int id, ClaimsPrincipal user, Banco banco, CancellationToken ct) =>
        {
            await using var conexao = await banco.AbrirAsync(ct);
            var post = await DetalharAsync(conexao, id, user, ct);
            return post is null ? Erro404() : Results.Ok(post);
        });

        // Formulário multipart: titulo, descricao, marca, anoLancamento, categoria e até 5 "fotos".
        grupo.MapPost("/", async (
            HttpRequest request, ClaimsPrincipal user, Banco banco, Imagens imagens, CancellationToken ct) =>
        {
            if (!request.HasFormContentType)
                return ContaEndpoints.Erro(400, "Envie o post como formulário (multipart/form-data).");

            var formulario = await request.ReadFormAsync(ct);
            var (campos, erro) = LerCampos(formulario);
            if (erro is not null) return ContaEndpoints.Erro(400, erro);

            var fotos = formulario.Files.GetFiles("fotos");
            if (fotos.Count > MaximoImagens)
                return ContaEndpoints.Erro(400, $"Envie no máximo {MaximoImagens} fotos.");
            foreach (var foto in fotos)
                if (Imagens.Validar(foto) is { } erroFoto) return ContaEndpoints.Erro(400, erroFoto);

            var idUsuario = user.IdUsuario();
            var salvas = new List<string>();
            try
            {
                foreach (var foto in fotos) salvas.Add(await imagens.SalvarAsync(foto, ct));

                await using var conexao = await banco.AbrirAsync(ct);
                await using var transacao = await conexao.BeginTransactionAsync(ct);

                var inserir = conexao.Sql("""
                    INSERT INTO Post (idUsuar, titulo, descricao, marca, anoLancamento, categoria)
                    VALUES (@idUsuario, @titulo, @descricao, @marca, @ano, @categoria)
                    """, new
                {
                    idUsuario,
                    titulo = campos!.Titulo,
                    descricao = campos.Descricao,
                    marca = campos.Marca,
                    ano = campos.AnoLancamento,
                    categoria = campos.Categoria
                }, transacao);
                await inserir.ExecuteNonQueryAsync(ct);
                var idPost = (int)inserir.LastInsertedId;

                for (var i = 0; i < salvas.Count; i++)
                    await conexao.Sql(
                        "INSERT INTO ImagemPost (idPost, id, caminho) VALUES (@idPost, @numero, @caminho)",
                        new { idPost, numero = i + 1, caminho = salvas[i] }, transacao).ExecuteNonQueryAsync(ct);

                await conexao.Sql(
                    "INSERT INTO interacoes (idUsuar, idPost, descricao) VALUES (@idUsuario, @idPost, 'post')",
                    new { idUsuario, idPost }, transacao).ExecuteNonQueryAsync(ct);

                await AtualizarContadoresAsync(conexao, transacao, idPost, [idUsuario], ct);
                await transacao.CommitAsync(ct);

                return Results.Created($"/api/posts/{idPost}", new { id = idPost });
            }
            catch
            {
                foreach (var url in salvas) imagens.Apagar(url);
                throw;
            }
        }).RequireAuthorization();

        // Mesmo formulário do POST, mais "removerImagens" (ids das fotos que saem).
        grupo.MapPut("/{id:int}", async (
            int id, HttpRequest request, ClaimsPrincipal user, Banco banco, Imagens imagens, CancellationToken ct) =>
        {
            if (!request.HasFormContentType)
                return ContaEndpoints.Erro(400, "Envie o post como formulário (multipart/form-data).");

            var formulario = await request.ReadFormAsync(ct);
            var (campos, erro) = LerCampos(formulario);
            if (erro is not null) return ContaEndpoints.Erro(400, erro);

            await using var conexao = await banco.AbrirAsync(ct);

            var dono = await DonoDoPostAsync(conexao, id, ct);
            if (dono is null) return Erro404();
            if (!PodeMexer(user, dono.Value))
                return ContaEndpoints.Erro(403, "Só quem criou o post pode editá-lo.");

            var atuais = await ImagensDoPostAsync(conexao, id, ct);
            var remover = formulario["removerImagens"]
                .Select(v => int.TryParse(v, out var n) ? n : -1)
                .Where(n => atuais.Any(a => a.Id == n))
                .ToHashSet();

            var novas = formulario.Files.GetFiles("fotos");
            if (atuais.Count - remover.Count + novas.Count > MaximoImagens)
                return ContaEndpoints.Erro(400, $"Um post pode ter no máximo {MaximoImagens} fotos.");
            foreach (var foto in novas)
                if (Imagens.Validar(foto) is { } erroFoto) return ContaEndpoints.Erro(400, erroFoto);

            var salvas = new List<string>();
            try
            {
                foreach (var foto in novas) salvas.Add(await imagens.SalvarAsync(foto, ct));

                await using var transacao = await conexao.BeginTransactionAsync(ct);

                await conexao.Sql("""
                    UPDATE Post SET titulo = @titulo, descricao = @descricao, marca = @marca,
                                    anoLancamento = @ano, categoria = @categoria
                    WHERE id = @id
                    """, new
                {
                    id,
                    titulo = campos!.Titulo,
                    descricao = campos.Descricao,
                    marca = campos.Marca,
                    ano = campos.AnoLancamento,
                    categoria = campos.Categoria
                }, transacao).ExecuteNonQueryAsync(ct);

                foreach (var numero in remover)
                    await conexao.Sql("DELETE FROM ImagemPost WHERE idPost = @id AND id = @numero",
                        new { id, numero }, transacao).ExecuteNonQueryAsync(ct);

                var proximo = atuais.Count == 0 ? 1 : atuais.Max(a => a.Id) + 1;
                foreach (var caminho in salvas)
                    await conexao.Sql(
                        "INSERT INTO ImagemPost (idPost, id, caminho) VALUES (@id, @numero, @caminho)",
                        new { id, numero = proximo++, caminho }, transacao).ExecuteNonQueryAsync(ct);

                await AtualizarContadoresAsync(conexao, transacao, id, [], ct);
                await transacao.CommitAsync(ct);
            }
            catch
            {
                foreach (var url in salvas) imagens.Apagar(url);
                throw;
            }

            // Só apaga os arquivos depois que o banco confirmou a mudança.
            foreach (var imagem in atuais.Where(a => remover.Contains(a.Id))) imagens.Apagar(imagem.Url);

            return Results.Ok(await DetalharAsync(conexao, id, user, ct));
        }).RequireAuthorization();

        grupo.MapDelete("/{id:int}", async (
            int id, ClaimsPrincipal user, Banco banco, Imagens imagens, CancellationToken ct) =>
        {
            await using var conexao = await banco.AbrirAsync(ct);

            var dono = await DonoDoPostAsync(conexao, id, ct);
            if (dono is null) return Erro404();
            if (!PodeMexer(user, dono.Value))
                return ContaEndpoints.Erro(403, "Só quem criou o post pode excluí-lo.");

            var fotos = await ImagensDoPostAsync(conexao, id, ct);

            // Todo mundo que interagiu com o post tem os contadores recalculados.
            var afetados = new List<int>();
            await using (var leitor = await conexao.Sql("""
                SELECT idUsuar FROM interacoes WHERE idPost = @id
                UNION SELECT idUsuar FROM comentario WHERE idPost = @id
                """, new { id }).ExecuteReaderAsync(ct))
            {
                while (await leitor.ReadAsync(ct)) afetados.Add(leitor.Int("idUsuar"));
            }
            if (dono.Value > 0) afetados.Add(dono.Value);

            await using var transacao = await conexao.BeginTransactionAsync(ct);
            // As tabelas filhas (imagens, comentários, interações) apagam junto (ON DELETE CASCADE).
            await conexao.Sql("DELETE FROM Post WHERE id = @id", new { id }, transacao).ExecuteNonQueryAsync(ct);
            await AtualizarContadoresAsync(conexao, transacao, null, afetados, ct);
            await transacao.CommitAsync(ct);

            foreach (var foto in fotos) imagens.Apagar(foto.Url);
            return Results.NoContent();
        }).RequireAuthorization();

        grupo.MapPost("/{id:int}/comentarios", async (
            int id, ComentarioRequest dados, ClaimsPrincipal user, Banco banco, CancellationToken ct) =>
        {
            var conteudo = dados.Conteudo?.Trim() ?? "";
            if (conteudo.Length is 0 or > 500)
                return ContaEndpoints.Erro(400, "O comentário precisa ter entre 1 e 500 caracteres.");

            await using var conexao = await banco.AbrirAsync(ct);
            var dono = await DonoDoPostAsync(conexao, id, ct);
            if (dono is null) return Erro404();

            var idUsuario = user.IdUsuario();
            await using var transacao = await conexao.BeginTransactionAsync(ct);

            var inserir = conexao.Sql(
                "INSERT INTO comentario (conteudo, idUsuar, idPost) VALUES (@conteudo, @idUsuario, @id)",
                new { conteudo, idUsuario, id }, transacao);
            await inserir.ExecuteNonQueryAsync(ct);
            var idComentario = (int)inserir.LastInsertedId;

            await conexao.Sql("""
                INSERT INTO interacoes (idUsuar, idPost, idComentario, descricao)
                VALUES (@idUsuario, @id, @idComentario, 'comentario')
                """, new { idUsuario, id, idComentario }, transacao).ExecuteNonQueryAsync(ct);

            await AtualizarContadoresAsync(conexao, transacao, id, [idUsuario], ct);
            await transacao.CommitAsync(ct);

            var comentarios = await ComentariosAsync(conexao, id, user, ct);
            return Results.Created($"/api/posts/{id}", comentarios.First(c => c.Id == idComentario));
        }).RequireAuthorization();

        app.MapDelete("/api/comentarios/{id:int}", async (
            int id, ClaimsPrincipal user, Banco banco, CancellationToken ct) =>
        {
            await using var conexao = await banco.AbrirAsync(ct);

            int autor, idPost;
            await using (var leitor = await conexao.Sql(
                "SELECT idUsuar, idPost FROM comentario WHERE id = @id", new { id }).ExecuteReaderAsync(ct))
            {
                if (!await leitor.ReadAsync(ct))
                    return ContaEndpoints.Erro(404, "Comentário não encontrado.");
                autor = leitor.Int("idUsuar");
                idPost = leitor.Int("idPost");
            }

            if (!PodeMexer(user, autor))
                return ContaEndpoints.Erro(403, "Só quem escreveu o comentário pode excluí-lo.");

            await using var transacao = await conexao.BeginTransactionAsync(ct);
            await conexao.Sql("DELETE FROM comentario WHERE id = @id", new { id }, transacao).ExecuteNonQueryAsync(ct);
            await AtualizarContadoresAsync(conexao, transacao, idPost, [autor], ct);
            await transacao.CommitAsync(ct);

            return Results.NoContent();
        }).RequireAuthorization().WithTags("Posts");

        // valor: 1 (upvote), -1 (downvote) ou 0 (tirar o voto). Cada pessoa tem um voto por post.
        grupo.MapPost("/{id:int}/voto", async (
            int id, VotoRequest dados, ClaimsPrincipal user, Banco banco, CancellationToken ct) =>
        {
            if (dados.Valor is < -1 or > 1)
                return ContaEndpoints.Erro(400, "O voto precisa ser 1, -1 ou 0.");

            await using var conexao = await banco.AbrirAsync(ct);
            var dono = await DonoDoPostAsync(conexao, id, ct);
            if (dono is null) return Erro404();

            var idUsuario = user.IdUsuario();
            await using var transacao = await conexao.BeginTransactionAsync(ct);

            await conexao.Sql("""
                DELETE FROM interacoes
                WHERE idPost = @id AND idUsuar = @idUsuario AND descricao IN ('upvote', 'downvote')
                """, new { id, idUsuario }, transacao).ExecuteNonQueryAsync(ct);

            if (dados.Valor != 0)
                await conexao.Sql(
                    "INSERT INTO interacoes (idUsuar, idPost, descricao) VALUES (@idUsuario, @id, @descricao)",
                    new { idUsuario, id, descricao = dados.Valor > 0 ? "upvote" : "downvote" }, transacao)
                    .ExecuteNonQueryAsync(ct);

            await AtualizarContadoresAsync(conexao, transacao, id, [idUsuario, dono.Value], ct);
            await transacao.CommitAsync(ct);

            var karma = Convert.ToInt32(await conexao.Sql("SELECT karma FROM Post WHERE id = @id", new { id })
                .ExecuteScalarAsync(ct));
            return Results.Ok(new VotoResposta(karma, dados.Valor));
        }).RequireAuthorization();

        return app;
    }

    private static async Task<PostDetalhe?> DetalharAsync(
        MySqlConnection conexao, int id, ClaimsPrincipal user, CancellationToken ct)
    {
        string titulo, categoria;
        string? descricao, marca;
        int? ano;
        int karma;
        DateTime data;
        AutorResposta? autor;

        await using (var leitor = await conexao.Sql("""
            SELECT p.id, p.titulo, p.descricao, p.marca, p.anoLancamento, p.categoria, p.karma, p.dataPost,
                   u.id AS autorId, u.nome AS autorNome, u.fotoPath AS autorFoto
            FROM Post p
            LEFT JOIN Usuar u ON u.id = p.idUsuar
            WHERE p.id = @id
            """, new { id }).ExecuteReaderAsync(ct))
        {
            if (!await leitor.ReadAsync(ct)) return null;

            titulo = leitor.Texto("titulo");
            descricao = leitor.TextoOuNulo("descricao");
            marca = leitor.TextoOuNulo("marca");
            ano = leitor.IntOuNulo("anoLancamento");
            categoria = leitor.Texto("categoria");
            karma = leitor.Int("karma");
            data = leitor.Data("dataPost");
            autor = LerAutor(leitor);
        }

        var logado = user.Identity?.IsAuthenticated == true;
        var meuVoto = 0;
        if (logado)
        {
            var voto = await conexao.Sql("""
                SELECT descricao FROM interacoes
                WHERE idPost = @id AND idUsuar = @idUsuario AND descricao IN ('upvote', 'downvote')
                LIMIT 1
                """, new { id, idUsuario = user.IdUsuario() }).ExecuteScalarAsync(ct) as string;
            meuVoto = voto switch { "upvote" => 1, "downvote" => -1, _ => 0 };
        }

        return new PostDetalhe(
            id, titulo, descricao, marca, ano, categoria, karma, data, autor,
            await ImagensDoPostAsync(conexao, id, ct),
            await ComentariosAsync(conexao, id, user, ct),
            meuVoto,
            logado && PodeMexer(user, autor?.Id ?? 0));
    }

    private static async Task<List<ImagemResposta>> ImagensDoPostAsync(
        MySqlConnection conexao, int idPost, CancellationToken ct)
    {
        var imagens = new List<ImagemResposta>();
        await using var leitor = await conexao.Sql(
            "SELECT id, caminho FROM ImagemPost WHERE idPost = @idPost ORDER BY id",
            new { idPost }).ExecuteReaderAsync(ct);

        while (await leitor.ReadAsync(ct))
            imagens.Add(new ImagemResposta(leitor.Int("id"), leitor.Texto("caminho")));

        return imagens;
    }

    private static async Task<List<ComentarioResposta>> ComentariosAsync(
        MySqlConnection conexao, int idPost, ClaimsPrincipal user, CancellationToken ct)
    {
        var logado = user.Identity?.IsAuthenticated == true;
        var comentarios = new List<ComentarioResposta>();

        await using var leitor = await conexao.Sql("""
            SELECT c.id, c.conteudo, c.dataComent, u.id AS autorId, u.nome AS autorNome, u.fotoPath AS autorFoto
            FROM comentario c
            JOIN Usuar u ON u.id = c.idUsuar
            WHERE c.idPost = @idPost
            ORDER BY c.dataComent, c.id
            """, new { idPost }).ExecuteReaderAsync(ct);

        while (await leitor.ReadAsync(ct))
        {
            var autor = LerAutor(leitor)!;
            comentarios.Add(new ComentarioResposta(
                leitor.Int("id"),
                leitor.Texto("conteudo"),
                leitor.Data("dataComent"),
                autor,
                logado && PodeMexer(user, autor.Id)));
        }

        return comentarios;
    }

    /// <summary>
    /// Recalcula karma e contadores a partir das tabelas, em vez de somar e subtrair na mão.
    /// Assim os números nunca ficam errados, mesmo depois de excluir coisas.
    /// </summary>
    private static async Task AtualizarContadoresAsync(
        MySqlConnection conexao, MySqlTransaction transacao, int? idPost, IEnumerable<int> usuarios, CancellationToken ct)
    {
        if (idPost is not null)
            await conexao.Sql("""
                UPDATE Post SET
                    karma = (SELECT COALESCE(SUM(CASE descricao WHEN 'upvote' THEN 1 WHEN 'downvote' THEN -1 ELSE 0 END), 0)
                             FROM interacoes WHERE idPost = @idPost),
                    qtdcomments = (SELECT COUNT(*) FROM comentario WHERE idPost = @idPost),
                    qtdimagem = (SELECT COUNT(*) FROM ImagemPost WHERE idPost = @idPost)
                WHERE id = @idPost
                """, new { idPost }, transacao).ExecuteNonQueryAsync(ct);

        // O karma do usuário é a soma do karma dos posts dele.
        foreach (var idUsuario in usuarios.Where(u => u > 0).Distinct())
            await conexao.Sql("""
                UPDATE Usuar SET
                    karma = (SELECT COALESCE(SUM(karma), 0) FROM Post WHERE idUsuar = @idUsuario),
                    qtdPost = (SELECT COUNT(*) FROM Post WHERE idUsuar = @idUsuario),
                    qtdInt = (SELECT COUNT(*) FROM interacoes WHERE idUsuar = @idUsuario)
                WHERE id = @idUsuario
                """, new { idUsuario }, transacao).ExecuteNonQueryAsync(ct);
    }

    /// <summary>Id do dono do post (0 se a conta dele foi apagada), ou null se o post não existe.</summary>
    private static async Task<int?> DonoDoPostAsync(MySqlConnection conexao, int id, CancellationToken ct)
    {
        await using var leitor = await conexao.Sql("SELECT idUsuar FROM Post WHERE id = @id", new { id })
            .ExecuteReaderAsync(ct);
        if (!await leitor.ReadAsync(ct)) return null;
        return leitor.IntOuNulo("idUsuar") ?? 0;
    }

    private static bool PodeMexer(ClaimsPrincipal user, int idDono) =>
        user.Identity?.IsAuthenticated == true && (user.IdUsuario() == idDono || user.EhAdm());

    private static (CamposPost? Campos, string? Erro) LerCampos(IFormCollection formulario)
    {
        static string? Campo(IFormCollection f, string nome) =>
            f[nome].ToString().Trim() is { Length: > 0 } valor ? valor : null;

        var titulo = Campo(formulario, "titulo") ?? "";
        var descricao = Campo(formulario, "descricao");
        var marca = Campo(formulario, "marca");
        var textoAno = Campo(formulario, "anoLancamento");
        var categoria = Campo(formulario, "categoria") ?? "outro";

        if (titulo.Length is < 3 or > 100)
            return (null, "O título precisa ter entre 3 e 100 caracteres.");
        if (descricao?.Length > 1000)
            return (null, "A descrição pode ter no máximo 1000 caracteres.");
        if (marca?.Length > 50)
            return (null, "A marca pode ter no máximo 50 caracteres.");
        if (!Categorias.Contains(categoria))
            return (null, "Escolha uma categoria da lista.");

        int? ano = null;
        if (textoAno is not null)
        {
            if (!int.TryParse(textoAno, out var valor) || valor < 1800 || valor > DateTime.Now.Year + 1)
                return (null, $"O ano de lançamento precisa ser um número entre 1800 e {DateTime.Now.Year + 1}.");
            ano = valor;
        }

        return (new CamposPost(titulo, descricao, marca, ano, categoria), null);
    }

    private static AutorResposta? LerAutor(MySqlDataReader leitor) =>
        leitor.IntOuNulo("autorId") is { } idAutor
            ? new AutorResposta(idAutor, leitor.Texto("autorNome"), leitor.TextoOuNulo("autorFoto"))
            : null;

    private static string EscaparLike(string texto) =>
        texto.Replace("\\", "\\\\").Replace("%", "\\%").Replace("_", "\\_");

    private static IResult Erro404() => ContaEndpoints.Erro(404, "Post não encontrado.");
}
