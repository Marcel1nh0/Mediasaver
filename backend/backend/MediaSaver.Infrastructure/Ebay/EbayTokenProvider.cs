using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using MediaSaver.Application.Comum;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace MediaSaver.Infrastructure.Ebay;

/// <summary>
/// Obtém e guarda em cache o "Application access token" do eBay
/// (fluxo client credentials). O token dura ~2h; renovamos 60s antes.
/// Registrado como Singleton para o cache valer para toda a aplicação.
/// </summary>
public class EbayTokenProvider
{
    private const string Escopo = "https://api.ebay.com/oauth/api_scope";

    private readonly IHttpClientFactory _httpFactory;
    private readonly EbayOptions _opcoes;
    private readonly ILogger<EbayTokenProvider> _logger;
    private readonly SemaphoreSlim _trava = new(1, 1);

    private string? _token;
    private DateTimeOffset _expiraEm;

    public EbayTokenProvider(
        IHttpClientFactory httpFactory,
        IOptions<EbayOptions> opcoes,
        ILogger<EbayTokenProvider> logger)
    {
        _httpFactory = httpFactory;
        _opcoes = opcoes.Value;
        _logger = logger;
    }

    public async Task<string> ObterTokenAsync(CancellationToken ct)
    {
        if (TokenValido()) return _token!;

        await _trava.WaitAsync(ct);
        try
        {
            // Outra requisição pode ter renovado enquanto esperávamos
            if (TokenValido()) return _token!;

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

            var http = _httpFactory.CreateClient();
            using var resposta = await http.SendAsync(requisicao, ct);

            if (!resposta.IsSuccessStatusCode)
            {
                var corpo = await resposta.Content.ReadAsStringAsync(ct);
                _logger.LogError("Falha ao obter token do eBay ({Status}): {Corpo}",
                    (int)resposta.StatusCode, corpo);
                throw new ServicoExternoException("Não foi possível autenticar no eBay.");
            }

            var token = await resposta.Content.ReadFromJsonAsync<EbayTokenResponse>(ct)
                ?? throw new ServicoExternoException("Resposta de token do eBay vazia.");

            _token = token.AccessToken;
            _expiraEm = DateTimeOffset.UtcNow.AddSeconds(token.ExpiresIn - 60);
            _logger.LogInformation("Novo token do eBay obtido, válido até {Expira}", _expiraEm);

            return _token;
        }
        finally
        {
            _trava.Release();
        }
    }

    private bool TokenValido() =>
        _token is not null && DateTimeOffset.UtcNow < _expiraEm;
}
