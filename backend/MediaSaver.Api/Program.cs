using MediaSaver.Api.Arquivos;
using MediaSaver.Api.Contas;
using MediaSaver.Api.Dados;
using MediaSaver.Api.Ebay;
using MediaSaver.Api.Endpoints;
using MediaSaver.Api.Posts;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.Extensions.FileProviders;
using MySqlConnector;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();

// eBay
builder.Services.Configure<EbayOptions>(builder.Configuration.GetSection(EbayOptions.Secao));
builder.Services.AddHttpClient();
builder.Services.AddSingleton<EbayTokenProvider>();
builder.Services.AddHttpClient<IEbayService, EbayService>(c => c.Timeout = TimeSpan.FromSeconds(15));

// Banco e fotos
builder.Services.AddSingleton<Banco>();
builder.Services.AddSingleton<Imagens>();

// Login com cookie: o navegador guarda a sessão e manda em toda requisição.
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(o =>
    {
        o.Cookie.Name = "mediasaver.sessao";
        o.Cookie.HttpOnly = true;               // o JavaScript da página não consegue ler o cookie
        o.Cookie.SameSite = SameSiteMode.Lax;   // outros sites não conseguem usar a sessão (CSRF)
        o.ExpireTimeSpan = TimeSpan.FromDays(7);
        o.SlidingExpiration = true;

        // Numa API, sem login é 401/403 em JSON, não um redirecionamento para página de login.
        o.Events.OnRedirectToLogin = c =>
        {
            c.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return c.Response.WriteAsJsonAsync(new { erro = "Entre na sua conta para continuar." });
        };
        o.Events.OnRedirectToAccessDenied = c =>
        {
            c.Response.StatusCode = StatusCodes.Status403Forbidden;
            return c.Response.WriteAsJsonAsync(new { erro = "Você não tem permissão para isso." });
        };
    });
builder.Services.AddAuthorization();

builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();

// Cria o banco/tabelas que faltarem e os dados de exemplo antes de aceitar requisições.
await InicializadorBanco.ExecutarAsync(app.Services);

// Falhas do eBay viram 502, banco fora do ar vira 503, o resto vira 500.
app.UseExceptionHandler(erro => erro.Run(async contexto =>
{
    var ex = contexto.Features.Get<IExceptionHandlerFeature>()?.Error;
    var (status, mensagem) = ex switch
    {
        ServicoExternoException => (StatusCodes.Status502BadGateway, ex.Message),
        MySqlException => (StatusCodes.Status503ServiceUnavailable,
            "Não foi possível acessar o banco de dados. Confira se o MySQL está rodando."),
        BadHttpRequestException bad => (bad.StatusCode, "Requisição inválida. Confira os dados enviados."),
        _ => (StatusCodes.Status500InternalServerError, "Erro interno no servidor.")
    };

    contexto.Response.StatusCode = status;
    await contexto.Response.WriteAsJsonAsync(new { erro = mensagem });
}));

if (app.Environment.IsDevelopment())
    app.MapOpenApi();

app.UseHttpsRedirection();

// Fotos enviadas ficam em /uploads/...
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(app.Services.GetRequiredService<Imagens>().Pasta),
    RequestPath = Imagens.UrlBase
});

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

app.MapEbayEndpoints();
app.MapContaEndpoints();
app.MapPostEndpoints();

app.Run();
