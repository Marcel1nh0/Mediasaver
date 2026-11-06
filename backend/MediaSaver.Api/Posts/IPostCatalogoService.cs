namespace MediaSaver.Api.Posts;

public interface IPostCatalogoService
{
    Task<ResultadoBuscaPosts> BuscarAsync(
        string? busca,
        int limite,
        int offset,
        CancellationToken cancellationToken);

    Task<PostCatalogo?> ObterAsync(uint id, CancellationToken cancellationToken);
}
