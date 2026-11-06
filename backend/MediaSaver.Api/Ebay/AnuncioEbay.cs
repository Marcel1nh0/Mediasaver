namespace MediaSaver.Api.Ebay;

public record AnuncioEbay(
    string Id,
    string Titulo,
    decimal? Preco,
    string? Moeda,
    string? Condicao,
    string? ImagemUrl,
    string? LinkEbay,
    string? Vendedor);

public record ResultadoBuscaEbay(
    int Total,
    int Limite,
    int Offset,
    IReadOnlyList<AnuncioEbay> Anuncios);

public record AnuncioEbayDetalhe(
    string Id,
    string Titulo,
    string? Descricao,
    decimal? Preco,
    string? Moeda,
    string? Condicao,
    IReadOnlyList<string> Imagens,
    string? LinkEbay,
    string? Vendedor,
    string? Localizacao);
