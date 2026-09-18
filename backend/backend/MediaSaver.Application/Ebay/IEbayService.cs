namespace MediaSaver.Application.Ebay;

/// <summary>
/// Contrato para buscar anúncios no eBay. A implementação fica na
/// camada Infrastructure, então a Application não depende de HTTP.
/// </summary>
public interface IEbayService
{
    Task<ResultadoBuscaEbay> BuscarAnunciosAsync(
        string termo,
        int limite,
        int offset,
        string? categoriaId = null,
        CancellationToken ct = default);

    /// <summary>Retorna null se o anúncio não existir.</summary>
    Task<AnuncioEbayDetalhe?> ObterAnuncioAsync(string itemId, CancellationToken ct = default);
}
