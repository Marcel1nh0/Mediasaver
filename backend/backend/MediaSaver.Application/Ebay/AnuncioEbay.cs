namespace MediaSaver.Application.Ebay;

/// <summary>Resumo de um anúncio, usado na listagem de busca.</summary>
public record AnuncioEbay(
    string Id,
    string Titulo,
    decimal? Preco,
    string? Moeda,
    string? Condicao,
    string? ImagemUrl,
    string? LinkEbay,
    string? Vendedor);

/// <summary>Resultado paginado de uma busca.</summary>
public record ResultadoBuscaEbay(
    int Total,
    int Limite,
    int Offset,
    IReadOnlyList<AnuncioEbay> Anuncios);

/// <summary>Detalhes completos de um anúncio.</summary>
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
