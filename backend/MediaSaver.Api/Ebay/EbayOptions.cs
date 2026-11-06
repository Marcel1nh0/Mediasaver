namespace MediaSaver.Api.Ebay;

/// <summary>Configurações da seção "Ebay" do appsettings / user-secrets.</summary>
public class EbayOptions
{
    public const string Secao = "Ebay";

    public string ClientId { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;
    public bool UsarSandbox { get; set; } = true;
    public string Marketplace { get; set; } = "EBAY_US";

    public string BaseUrl => UsarSandbox
        ? "https://api.sandbox.ebay.com"
        : "https://api.ebay.com";
}
