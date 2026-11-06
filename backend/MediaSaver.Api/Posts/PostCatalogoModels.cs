namespace MediaSaver.Api.Posts;

public sealed record PostCatalogo(
    uint Id,
    string Titulo,
    string? Descricao,
    string? Marca,
    int AnoLancamento,
    int Karma,
    int QuantidadeComentarios,
    string? ImagemUrl,
    string? Autor);

public sealed record ResultadoBuscaPosts(
    int Total,
    int Limite,
    int Offset,
    IReadOnlyList<PostCatalogo> Posts);

public sealed class CatalogoIndisponivelException(string message, Exception? innerException = null)
    : Exception(message, innerException);
