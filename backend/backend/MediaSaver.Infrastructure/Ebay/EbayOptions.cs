namespace MediaSaver.Infrastructure.Ebay;

/// <summary>Configurações lidas da seção "Ebay" do appsettings / user-secrets.</summary>
public class EbayOptions
{
    public const string Secao = "Ebay";

    /// <summary>App ID (Client ID) do portal developer.ebay.com.</summary>
    public string ClientId { get; set; } = string.Empty;

    /// <summary>Cert ID (Client Secret). Nunca coloque no appsettings.json!</summary>
    public string ClientSecret { get; set; } = string.Empty;

    /// <summary>true = ambiente de testes (Sandbox); false = produção.</summary>
    public bool UsarSandbox { get; set; } = true;

    /// <summary>Marketplace consultado, ex.: EBAY_US, EBAY_GB, EBAY_DE.</summary>
    public string Marketplace { get; set; } = "EBAY_US";

    public string BaseUrl => UsarSandbox
        ? "https://api.sandbox.ebay.com"
        : "https://api.ebay.com";
}
