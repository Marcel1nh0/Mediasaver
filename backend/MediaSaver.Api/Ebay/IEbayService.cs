namespace MediaSaver.Api.Ebay;

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
