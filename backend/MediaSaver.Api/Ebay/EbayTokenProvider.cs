using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using Microsoft.Extensions.Options;

namespace MediaSaver.Api.Ebay;

/// <summary>
/// Obtém e guarda em cache o token de aplicação do eBay (client credentials).
/// Registrado como Singleton para o cache valer para toda a aplicação.
/// </summary>
public class EbayTokenProvider(
    IHttpClientFactory httpFactory,
    IOptions<EbayOptions> opcoes,
    ILogger<EbayTokenProvider> logger)
{
    private const string Escopo = "https://api.ebay.com/oauth/api_scope";

    private readonly EbayOptions _opcoes = opcoes.Value;
    private readonly SemaphoreSlim _trava = new(1, 1);
    private string? _token;
    private DateTimeOffset _expiraEm;

    public async Task<string> ObterTokenAsync(CancellationToken ct)
    {
        if (TokenValido) return _token!;

        await _trava.WaitAsync(ct);
        try
        {
            if (TokenValido) return _token!;

            if (string.IsNullOrWhiteSpace(_opcoes.ClientId) || string.IsNullOrWhiteSpace(_opcoes.ClientSecret))
                throw new ServicoExternoException(
                    "Credenciais do eBay não configuradas (Ebay:ClientId / Ebay:ClientSecret).");

            var credenciais = Convert.ToBase64String(
                Encoding.UTF8.GetBytes($"{_opcoes.ClientId}:{_opcoes.ClientSecret}"));

            using var requisicao = new HttpRequestMessage(
                HttpMethod.Post, $"{_opcoes.BaseUrl}/identity/v1/oauth2/token");
            requisicao.Headers.Authorization = new AuthenticationHeaderValue("Basic", credenciais);
            requisicao.Content = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["grant_type"] = "client_credentials",
                ["scope"] = Escopo
            });

            using var resposta = await httpFactory.CreateClient().SendAsync(requisicao, ct);

            if (!resposta.IsSuccessStatusCode)
            {
                var corpo = await resposta.Content.ReadAsStringAsync(ct);
                logger.LogError("Falha ao obter token do eBay ({Status}): {Corpo}",
                    (int)resposta.StatusCode, corpo);
                throw new ServicoExternoException("Não foi possível autenticar no eBay.");
            }

            var token = await resposta.Content.ReadFromJsonAsync<EbayTokenResponse>(ct)
                ?? throw new ServicoExternoException("Resposta de token do eBay vazia.");

            _token = token.AccessToken;
            _expiraEm = DateTimeOffset.UtcNow.AddSeconds(token.ExpiresIn - 60);
            logger.LogInformation("Novo token do eBay obtido, válido até {Expira}", _expiraEm);

            return _token;
        }
        finally
        {
            _trava.Release();
        }
    }

    private bool TokenValido => _token is not null && DateTimeOffset.UtcNow < _expiraEm;
}
