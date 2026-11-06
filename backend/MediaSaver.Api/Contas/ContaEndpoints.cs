using System.Security.Claims;
using MediaSaver.Api.Arquivos;
using MediaSaver.Api.Dados;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;
using MySqlConnector;

namespace MediaSaver.Api.Contas;

// Dados que chegam do site (JSON) e que voltam para ele.
public record CadastroRequest(string? Nome, string? Email, string? Senha);
public record LoginRequest(string? Email, string? Senha);

public record UsuarioResposta(
    int Id, string Nome, string Email, bool Adm, int Karma, int QtdPost, string? Foto, DateTime DataConta);

public static class ContaEndpoints
{
    // Gera e confere o hash das senhas (PBKDF2 com salt aleatório), do próprio ASP.NET Core.
    private static readonly PasswordHasher<object> Hasher = new PasswordHasher<object>();
    private static readonly object Ninguem = new object();

    public static IEndpointRouteBuilder MapContaEndpoints(this IEndpointRouteBuilder app)
    {
        var grupo = app.MapGroup("/api/auth").WithTags("Conta");

        // POST /api/auth/cadastro  { nome, email, senha }
        grupo.MapPost("/cadastro", async (CadastroRequest dados, Banco banco, HttpContext http, CancellationToken ct) =>
        {
            string nome = (dados.Nome ?? "").Trim();
            string email = (dados.Email ?? "").Trim().ToLower();
            string senha = dados.Senha ?? "";

            if (nome.Length < 2 || nome.Length > 100)
                return Erro(400, "Informe um nome entre 2 e 100 caracteres.");
            if (email.Length > 255 || !email.Contains('@') || !email.Contains('.'))
                return Erro(400, "Informe um e-mail válido.");
            if (senha.Length < 6)
                return Erro(400, "A senha precisa ter pelo menos 6 caracteres.");

            using var conexao = await banco.AbrirAsync(ct);

            var contar = new MySqlCommand("SELECT COUNT(*) FROM Usuar WHERE email = @email", conexao);
            Banco.Parametro(contar, "@email", email);
            int existentes = Convert.ToInt32(await contar.ExecuteScalarAsync(ct));

            if (existentes > 0)
                return Erro(409, "Já existe uma conta com esse e-mail. Entre com ela.");

            var inserir = new MySqlCommand(
                "INSERT INTO Usuar (nome, email, senha) VALUES (@nome, @email, @senha)", conexao);
            Banco.Parametro(inserir, "@nome", nome);
            Banco.Parametro(inserir, "@email", email);
            Banco.Parametro(inserir, "@senha", Hasher.HashPassword(Ninguem, senha)); // só o hash vai para o banco
            await inserir.ExecuteNonQueryAsync(ct);

            int novoId = (int)inserir.LastInsertedId;
            UsuarioResposta? usuario = await BuscarAsync(conexao, novoId, ct);

            await EntrarAsync(http, usuario!);
            return Results.Created("/api/auth/eu", usuario);
        });

        // POST /api/auth/login  { email, senha }
        grupo.MapPost("/login", async (LoginRequest dados, Banco banco, HttpContext http, CancellationToken ct) =>
        {
            string email = (dados.Email ?? "").Trim().ToLower();

            using var conexao = await banco.AbrirAsync(ct);

            int id;
            string hash;

            var buscar = new MySqlCommand("SELECT id, senha FROM Usuar WHERE email = @email", conexao);
            Banco.Parametro(buscar, "@email", email);

            using (var leitor = await buscar.ExecuteReaderAsync(ct))
            {
                if (!await leitor.ReadAsync(ct))
                    return Erro(401, "E-mail ou senha incorretos.");

                id = leitor.Int("id");
                hash = leitor.Texto("senha");
            }

            // Compara a senha digitada com o hash guardado.
            var resultado = Hasher.VerifyHashedPassword(Ninguem, hash, dados.Senha ?? "");
            if (resultado == PasswordVerificationResult.Failed)
                return Erro(401, "E-mail ou senha incorretos.");

            UsuarioResposta? usuario = await BuscarAsync(conexao, id, ct);
            await EntrarAsync(http, usuario!);
            return Results.Ok(usuario);
        });

        // POST /api/auth/logout
        grupo.MapPost("/logout", async (HttpContext http) =>
        {
            await http.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return Results.NoContent();
        });

        // GET /api/auth/eu: quem está logado agora (o site chama ao abrir). Sem login, devolve null.
        grupo.MapGet("/eu", async (ClaimsPrincipal user, Banco banco, HttpContext http, CancellationToken ct) =>
        {
            if (!EstaLogado(user))
                return Results.Json<UsuarioResposta?>(null);

            using var conexao = await banco.AbrirAsync(ct);
            UsuarioResposta? usuario = await BuscarAsync(conexao, IdUsuario(user), ct);

            // Se a conta foi apagada do banco, encerra a sessão.
            if (usuario == null)
                await http.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);

            return Results.Json(usuario);
        });

        // PUT /api/usuarios/eu/foto: troca a foto do perfil (campo "foto" do formulário).
        app.MapPut("/api/usuarios/eu/foto", async (
            HttpRequest request, ClaimsPrincipal user, Banco banco, Imagens imagens, CancellationToken ct) =>
        {
            if (!request.HasFormContentType)
                return Erro(400, "Envie a foto como formulário (multipart/form-data).");

            var formulario = await request.ReadFormAsync(ct);
            IFormFile? foto = formulario.Files.GetFile("foto");

            if (foto == null)
                return Erro(400, "Escolha uma foto.");

            string? erroFoto = Imagens.Validar(foto);
            if (erroFoto != null)
                return Erro(400, erroFoto);

            int idUsuario = IdUsuario(user);
            using var conexao = await banco.AbrirAsync(ct);

            var buscarAnterior = new MySqlCommand("SELECT fotoPath FROM Usuar WHERE id = @id", conexao);
            Banco.Parametro(buscarAnterior, "@id", idUsuario);
            string? fotoAnterior = await buscarAnterior.ExecuteScalarAsync(ct) as string;

            string url = await imagens.SalvarAsync(foto, ct);

            var atualizar = new MySqlCommand("UPDATE Usuar SET fotoPath = @url WHERE id = @id", conexao);
            Banco.Parametro(atualizar, "@url", url);
            Banco.Parametro(atualizar, "@id", idUsuario);
            await atualizar.ExecuteNonQueryAsync(ct);

            imagens.Apagar(fotoAnterior); // a foto antiga não é mais usada

            return Results.Ok(await BuscarAsync(conexao, idUsuario, ct));
        }).RequireAuthorization().WithTags("Conta");

        return app;
    }

    // ---------- Funções de apoio, usadas também pelos posts ----------

    public static bool EstaLogado(ClaimsPrincipal user)
    {
        return user.Identity != null && user.Identity.IsAuthenticated;
    }

    /// <summary>Id do usuário logado, guardado no cookie de sessão.</summary>
    public static int IdUsuario(ClaimsPrincipal user)
    {
        return int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);
    }

    public static bool EhAdm(ClaimsPrincipal user)
    {
        return user.IsInRole("adm");
    }

    /// <summary>Resposta de erro em JSON: { "erro": "mensagem" }.</summary>
    public static IResult Erro(int status, string mensagem)
    {
        return Results.Json(new { erro = mensagem }, statusCode: status);
    }

    /// <summary>Cria a sessão: o navegador recebe um cookie com o id e o nome do usuário.</summary>
    private static async Task EntrarAsync(HttpContext http, UsuarioResposta usuario)
    {
        var claims = new List<Claim>();
        claims.Add(new Claim(ClaimTypes.NameIdentifier, usuario.Id.ToString()));
        claims.Add(new Claim(ClaimTypes.Name, usuario.Nome));

        if (usuario.Adm)
            claims.Add(new Claim(ClaimTypes.Role, "adm"));

        var identidade = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
        var propriedades = new AuthenticationProperties();
        propriedades.IsPersistent = true; // continua logado mesmo fechando o navegador

        await http.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, new ClaimsPrincipal(identidade), propriedades);
    }

    private static async Task<UsuarioResposta?> BuscarAsync(MySqlConnection conexao, int id, CancellationToken ct)
    {
        var comando = new MySqlCommand(
            "SELECT id, nome, email, adm, karma, qtdPost, fotoPath, dataConta FROM Usuar WHERE id = @id", conexao);
        Banco.Parametro(comando, "@id", id);

        using var leitor = await comando.ExecuteReaderAsync(ct);

        if (!await leitor.ReadAsync(ct))
            return null;

        return new UsuarioResposta(
            leitor.Int("id"),
            leitor.Texto("nome"),
            leitor.Texto("email"),
            leitor.Int("adm") == 1,
            leitor.Int("karma"),
            leitor.Int("qtdPost"),
            leitor.TextoOuNulo("fotoPath"),
            leitor.Data("dataConta"));
    }
}
