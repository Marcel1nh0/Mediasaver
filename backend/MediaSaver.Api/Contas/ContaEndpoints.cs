using System.Security.Claims;
using MediaSaver.Api.Arquivos;
using MediaSaver.Api.Dados;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;
using MySqlConnector;

namespace MediaSaver.Api.Contas;

public record CadastroRequest(string? Nome, string? Email, string? Senha);
public record LoginRequest(string? Email, string? Senha);

public record UsuarioResposta(
    int Id, string Nome, string Email, bool Adm, int Karma, int QtdPost, string? Foto, DateTime DataConta);

public static class ContaEndpoints
{
    // Hash de senha do próprio ASP.NET Core (PBKDF2 com salt aleatório).
    private static readonly PasswordHasher<object> Hasher = new();
    private static readonly object Ninguem = new();

    public static IEndpointRouteBuilder MapContaEndpoints(this IEndpointRouteBuilder app)
    {
        var grupo = app.MapGroup("/api/auth").WithTags("Conta");

        grupo.MapPost("/cadastro", async (CadastroRequest dados, Banco banco, HttpContext http, CancellationToken ct) =>
        {
            var nome = dados.Nome?.Trim() ?? "";
            var email = dados.Email?.Trim().ToLowerInvariant() ?? "";
            var senha = dados.Senha ?? "";

            if (nome.Length is < 2 or > 100)
                return Erro(400, "Informe um nome entre 2 e 100 caracteres.");
            if (email.Length > 255 || !email.Contains('@') || !email.Contains('.'))
                return Erro(400, "Informe um e-mail válido.");
            if (senha.Length < 6)
                return Erro(400, "A senha precisa ter pelo menos 6 caracteres.");

            await using var conexao = await banco.AbrirAsync(ct);

            var existe = await conexao.Sql("SELECT COUNT(*) FROM Usuar WHERE email = @email", new { email })
                .ExecuteScalarAsync(ct);
            if (Convert.ToInt32(existe) > 0)
                return Erro(409, "Já existe uma conta com esse e-mail. Entre com ela.");

            var comando = conexao.Sql(
                "INSERT INTO Usuar (nome, email, senha) VALUES (@nome, @email, @senha)",
                new { nome, email, senha = Hasher.HashPassword(Ninguem, senha) });
            await comando.ExecuteNonQueryAsync(ct);

            var usuario = await BuscarAsync(conexao, (int)comando.LastInsertedId, ct);
            await EntrarAsync(http, usuario!);
            return Results.Created("/api/auth/eu", usuario);
        });

        grupo.MapPost("/login", async (LoginRequest dados, Banco banco, HttpContext http, CancellationToken ct) =>
        {
            var email = dados.Email?.Trim().ToLowerInvariant() ?? "";

            await using var conexao = await banco.AbrirAsync(ct);
            await using var leitor = await conexao
                .Sql("SELECT id, senha FROM Usuar WHERE email = @email", new { email })
                .ExecuteReaderAsync(ct);

            if (!await leitor.ReadAsync(ct))
                return Erro(401, "E-mail ou senha incorretos.");

            var id = leitor.Int("id");
            var hash = leitor.Texto("senha");
            await leitor.CloseAsync();

            var resultado = Hasher.VerifyHashedPassword(Ninguem, hash, dados.Senha ?? "");
            if (resultado == PasswordVerificationResult.Failed)
                return Erro(401, "E-mail ou senha incorretos.");

            var usuario = await BuscarAsync(conexao, id, ct);
            await EntrarAsync(http, usuario!);
            return Results.Ok(usuario);
        });

        grupo.MapPost("/logout", async (HttpContext http) =>
        {
            await http.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return Results.NoContent();
        });

        // Quem está logado agora (o frontend chama ao abrir o site). Sem login, devolve null.
        grupo.MapGet("/eu", async (ClaimsPrincipal user, Banco banco, HttpContext http, CancellationToken ct) =>
        {
            if (user.Identity?.IsAuthenticated != true)
                return Results.Json<UsuarioResposta?>(null);

            await using var conexao = await banco.AbrirAsync(ct);
            var usuario = await BuscarAsync(conexao, user.IdUsuario(), ct);

            // Se a conta foi apagada do banco, encerra a sessão.
            if (usuario is null)
                await http.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);

            return Results.Json(usuario);
        });

        // Troca a foto do perfil (campo "foto" do formulário).
        app.MapPut("/api/usuarios/eu/foto", async (
            HttpRequest request, ClaimsPrincipal user, Banco banco, Imagens imagens, CancellationToken ct) =>
        {
            if (!request.HasFormContentType)
                return Erro(400, "Envie a foto como formulário (multipart/form-data).");

            var formulario = await request.ReadFormAsync(ct);
            var foto = formulario.Files.GetFile("foto");
            if (foto is null) return Erro(400, "Escolha uma foto.");
            if (Imagens.Validar(foto) is { } erro) return Erro(400, erro);

            await using var conexao = await banco.AbrirAsync(ct);
            var anterior = await conexao.Sql("SELECT fotoPath FROM Usuar WHERE id = @id", new { id = user.IdUsuario() })
                .ExecuteScalarAsync(ct) as string;

            var url = await imagens.SalvarAsync(foto, ct);
            await conexao.Sql("UPDATE Usuar SET fotoPath = @url WHERE id = @id", new { url, id = user.IdUsuario() })
                .ExecuteNonQueryAsync(ct);
            imagens.Apagar(anterior);

            return Results.Ok(await BuscarAsync(conexao, user.IdUsuario(), ct));
        }).RequireAuthorization().WithTags("Conta");

        return app;
    }

    public static int IdUsuario(this ClaimsPrincipal user) =>
        int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);

    public static bool EhAdm(this ClaimsPrincipal user) => user.IsInRole("adm");

    public static IResult Erro(int status, string mensagem) =>
        Results.Json(new { erro = mensagem }, statusCode: status);

    private static async Task EntrarAsync(HttpContext http, UsuarioResposta usuario)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, usuario.Id.ToString()),
            new(ClaimTypes.Name, usuario.Nome)
        };
        if (usuario.Adm) claims.Add(new Claim(ClaimTypes.Role, "adm"));

        var identidade = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
        await http.SignInAsync(
            CookieAuthenticationDefaults.AuthenticationScheme,
            new ClaimsPrincipal(identidade),
            new AuthenticationProperties { IsPersistent = true });
    }

    private static async Task<UsuarioResposta?> BuscarAsync(MySqlConnection conexao, int id, CancellationToken ct)
    {
        await using var leitor = await conexao.Sql("""
            SELECT id, nome, email, adm, karma, qtdPost, fotoPath, dataConta
            FROM Usuar WHERE id = @id
            """, new { id }).ExecuteReaderAsync(ct);

        if (!await leitor.ReadAsync(ct)) return null;

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
