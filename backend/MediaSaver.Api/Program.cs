using MediaSaver.Api.Ebay;
using MediaSaver.Api.Endpoints;
using Microsoft.AspNetCore.Diagnostics;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();

builder.Services.Configure<EbayOptions>(builder.Configuration.GetSection(EbayOptions.Secao));
builder.Services.AddHttpClient();
builder.Services.AddSingleton<EbayTokenProvider>();
builder.Services.AddHttpClient<IEbayService, EbayService>(c => c.Timeout = TimeSpan.FromSeconds(15));

builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();

// Falhas do eBay viram 502; o resto vira 500.
app.UseExceptionHandler(erro => erro.Run(async contexto =>
{
    var ex = contexto.Features.Get<IExceptionHandlerFeature>()?.Error;
    var (status, mensagem) = ex is ServicoExternoException
        ? (StatusCodes.Status502BadGateway, ex.Message)
        : (StatusCodes.Status500InternalServerError, "Erro interno no servidor.");

    contexto.Response.StatusCode = status;
    await contexto.Response.WriteAsJsonAsync(new { erro = mensagem });
}));

if (app.Environment.IsDevelopment())
    app.MapOpenApi();

app.UseHttpsRedirection();
app.UseCors();

app.MapEbayEndpoints();

app.Run();
