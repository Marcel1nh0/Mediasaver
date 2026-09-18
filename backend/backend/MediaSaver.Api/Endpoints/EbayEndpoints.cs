using MediaSaver.Application.Ebay;

namespace MediaSaver.Api.Endpoints;

public static class EbayEndpoints
{
    public static IEndpointRouteBuilder MapEbayEndpoints(this IEndpointRouteBuilder app)
    {
        var grupo = app.MapGroup("/api/ebay").WithTags("eBay");

        // GET /api/ebay/anuncios?busca=vhs&limite=20&offset=0&categoriaId=11232
        grupo.MapGet("/anuncios", async (
            string? busca,
            int? limite,
            int? offset,
            string? categoriaId,
            IEbayService ebay,
            CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(busca))
                return Results.BadRequest(new { erro = "Informe o parâmetro 'busca'." });

            var lim = Math.Clamp(limite ?? 20, 1, 200); // eBay aceita até 200 por página
            var off = Math.Max(offset ?? 0, 0);

            var resultado = await ebay.BuscarAnunciosAsync(busca.Trim(), lim, off, categoriaId, ct);
            return Results.Ok(resultado);
        })
        .WithName("BuscarAnunciosEbay")
        .WithSummary("Busca anúncios no eBay por palavra-chave");

        // GET /api/ebay/anuncios/v1|123456789012|0
        grupo.MapGet("/anuncios/{id}", async (string id, IEbayService ebay, CancellationToken ct) =>
        {
            var anuncio = await ebay.ObterAnuncioAsync(id, ct);
            return anuncio is null
                ? Results.NotFound(new { erro = "Anúncio não encontrado." })
                : Results.Ok(anuncio);
        })
        .WithName("ObterAnuncioEbay")
        .WithSummary("Detalhes de um anúncio do eBay");

        return app;
    }
}
