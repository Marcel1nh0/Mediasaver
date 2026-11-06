using MediaSaver.Api.Posts;

namespace MediaSaver.Api.Endpoints;

public static class PostEndpoints
{
    public static IEndpointRouteBuilder MapPostEndpoints(this IEndpointRouteBuilder app)
    {
        var grupo = app.MapGroup("/api/posts").WithTags("Catálogo social");

        grupo.MapGet("/", async (
            string? busca,
            int? limite,
            int? offset,
            IPostCatalogoService catalogo,
            CancellationToken cancellationToken) =>
        {
            var pagina = Math.Clamp(limite ?? 20, 1, 100);
            var deslocamento = Math.Max(offset ?? 0, 0);
            var resultado = await catalogo.BuscarAsync(
                busca, pagina, deslocamento, cancellationToken);
            return Results.Ok(resultado);
        })
        .WithSummary("Lista e busca posts do catálogo social");

        grupo.MapGet("/{id}", async (
            uint id,
            IPostCatalogoService catalogo,
            CancellationToken cancellationToken) =>
        {
            var post = await catalogo.ObterAsync(id, cancellationToken);
            return post is null
                ? Results.NotFound(new { erro = "Post não encontrado." })
                : Results.Ok(post);
        })
        .WithSummary("Retorna os detalhes de um post");

        return app;
    }
}
