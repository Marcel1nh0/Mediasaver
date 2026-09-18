using MediaSaver.Api.Endpoints;
using MediaSaver.Application.Comum;
using MediaSaver.Infrastructure;
using Microsoft.AspNetCore.Diagnostics;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddInfrastructure(builder.Configuration);

// Libera o front-end para chamar a API. Em produção, troque AllowAnyOrigin
// por WithOrigins("https://seu-site.com").
builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();

// Tratamento global de erros: falha no eBay vira 502, o resto vira 500.
app.UseExceptionHandler(erro => erro.Run(async contexto =>
{
    var ex = contexto.Features.Get<IExceptionHandlerFeature>()?.Error;

    if (ex is ServicoExternoException)
    {
        contexto.Response.StatusCode = StatusCodes.Status502BadGateway;
        await contexto.Response.WriteAsJsonAsync(new { erro = ex.Message });
    }
    else
    {
        contexto.Response.StatusCode = StatusCodes.Status500InternalServerError;
        await contexto.Response.WriteAsJsonAsync(new { erro = "Erro interno no servidor." });
    }
}));

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi(); // documento em /openapi/v1.json
}

app.UseHttpsRedirection();
app.UseCors();

app.MapEbayEndpoints();

app.Run();
