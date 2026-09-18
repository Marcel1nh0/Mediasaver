using System.Globalization;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using MediaSaver.Application.Comum;
using MediaSaver.Application.Ebay;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace MediaSaver.Infrastructure.Ebay;

/// <summary>
/// Implementação de IEbayService usando a Browse API do eBay.
/// Docs: https://developer.ebay.com/develop/api/buy/browse_api
/// </summary>
public class EbayBrowseService : IEbayService
{
    private readonly HttpClient _http;
    private readonly EbayTokenProvider _tokens;
    private readonly EbayOptions _opcoes;
    private readonly ILogger<EbayBrowseService> _logger;

    public EbayBrowseService(
        HttpClient http,
        EbayTokenProvider tokens,
        IOptions<EbayOptions> opcoes,
        ILogger<EbayBrowseService> logger)
    {
        _http = http;
        _tokens = tokens;
        _opcoes = opcoes.Value;
        _logger = logger;
    }

    public async Task<ResultadoBuscaEbay> BuscarAnunciosAsync(
        string termo, int limite, int offset, string? categoriaId = null, CancellationToken ct = default)
    {
        var url = $"{_opcoes.BaseUrl}/buy/browse/v1/item_summary/search" +
                  $"?q={Uri.EscapeDataString(termo)}&limit={limite}&offset={offset}";

        if (!string.IsNullOrWhiteSpace(categoriaId))
            url += $"&category_ids={Uri.EscapeDataString(categoriaId)}";

        using var resposta = await EnviarAsync(url, ct);
        await GarantirSucessoAsync(resposta, ct);

        var dados = await resposta.Content.ReadFromJsonAsync<EbaySearchResponse>(ct)
                    ?? new EbaySearchResponse();

        var anuncios = (dados.ItemSummaries ?? new List<EbayItem>())
            .Select(i => new AnuncioEbay(
                i.ItemId,
                i.Title,
                ConverterPreco(i.Price?.Value),
                i.Price?.Currency,
                i.Condition,
                i.Image?.ImageUrl,
                i.ItemWebUrl,
                i.Seller?.Username))
            .ToList();

        return new ResultadoBuscaEbay(dados.Total, limite, offset, anuncios);
    }

    public async Task<AnuncioEbayDetalhe?> ObterAnuncioAsync(string itemId, CancellationToken ct = default)
    {
        var url = $"{_opcoes.BaseUrl}/buy/browse/v1/item/{Uri.EscapeDataString(itemId)}";

        using var resposta = await EnviarAsync(url, ct);
        if (resposta.StatusCode == HttpStatusCode.NotFound) return null;
        await GarantirSucessoAsync(resposta, ct);

        var i = await resposta.Content.ReadFromJsonAsync<EbayItem>(ct);
        if (i is null) return null;

        var imagens = new List<string>();
        if (i.Image?.ImageUrl is { } principal) imagens.Add(principal);
        imagens.AddRange((i.AdditionalImages ?? new List<EbayImagem>())
            .Select(img => img.ImageUrl)
            .OfType<string>());

        var local = i.ItemLocation is null
            ? null
            : string.Join(", ", new[] { i.ItemLocation.City, i.ItemLocation.StateOrProvince, i.ItemLocation.Country }
                .Where(p => !string.IsNullOrWhiteSpace(p)));

        return new AnuncioEbayDetalhe(
            i.ItemId,
            i.Title,
            i.ShortDescription,
            ConverterPreco(i.Price?.Value),
            i.Price?.Currency,
            i.Condition,
            imagens,
            i.ItemWebUrl,
            i.Seller?.Username,
            string.IsNullOrEmpty(local) ? null : local);
    }

    private async Task<HttpResponseMessage> EnviarAsync(string url, CancellationToken ct)
    {
        var token = await _tokens.ObterTokenAsync(ct);

        using var requisicao = new HttpRequestMessage(HttpMethod.Get, url);
        requisicao.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        requisicao.Headers.Add("X-EBAY-C-MARKETPLACE-ID", _opcoes.Marketplace);

        try
        {
            return await _http.SendAsync(requisicao, ct);
        }
        catch (HttpRequestException ex)
        {
            throw new ServicoExternoException("Não foi possível conectar ao eBay.", ex);
        }
        catch (TaskCanceledException ex) when (!ct.IsCancellationRequested)
        {
            throw new ServicoExternoException("O eBay demorou demais para responder.", ex);
        }
    }

    private async Task GarantirSucessoAsync(HttpResponseMessage resposta, CancellationToken ct)
    {
        if (resposta.IsSuccessStatusCode) return;

        var corpo = await resposta.Content.ReadAsStringAsync(ct);
        _logger.LogError("Erro da Browse API do eBay ({Status}): {Corpo}",
            (int)resposta.StatusCode, corpo);
        throw new ServicoExternoException($"O eBay retornou erro {(int)resposta.StatusCode}.");
    }

    private static decimal? ConverterPreco(string? valor) =>
        decimal.TryParse(valor, NumberStyles.Number, CultureInfo.InvariantCulture, out var preco)
            ? preco
            : null;
}
