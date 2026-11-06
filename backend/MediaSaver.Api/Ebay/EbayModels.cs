using System.Text.Json.Serialization;

namespace MediaSaver.Api.Ebay;

// Modelos que espelham o JSON do eBay; só existem dentro desta pasta.
internal record EbayTokenResponse(
    [property: JsonPropertyName("access_token")] string AccessToken,
    [property: JsonPropertyName("expires_in")] int ExpiresIn);

internal class EbaySearchResponse
{
    public int Total { get; set; }
    public List<EbayItem>? ItemSummaries { get; set; }
}

internal class EbayItem
{
    public string ItemId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? ShortDescription { get; set; }
    public EbayPreco? Price { get; set; }
    public string? Condition { get; set; }
    public EbayImagem? Image { get; set; }
    public List<EbayImagem>? AdditionalImages { get; set; }
    public string? ItemWebUrl { get; set; }
    public EbayVendedor? Seller { get; set; }
    public EbayLocalizacao? ItemLocation { get; set; }
}

internal class EbayPreco
{
    public string? Value { get; set; }
    public string? Currency { get; set; }
}

internal class EbayImagem
{
    public string? ImageUrl { get; set; }
}

internal class EbayVendedor
{
    public string? Username { get; set; }
}

internal class EbayLocalizacao
{
    public string? City { get; set; }
    public string? StateOrProvince { get; set; }
    public string? Country { get; set; }
}
