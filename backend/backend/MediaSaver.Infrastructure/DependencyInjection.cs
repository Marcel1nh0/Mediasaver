using MediaSaver.Application.Ebay;
using MediaSaver.Infrastructure.Ebay;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace MediaSaver.Infrastructure;

public static class DependencyInjection
{
    /// <summary>Registra os serviços da camada Infrastructure.</summary>
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuracao)
    {
        services.Configure<EbayOptions>(configuracao.GetSection(EbayOptions.Secao));

        services.AddHttpClient();
        services.AddSingleton<EbayTokenProvider>();
        services.AddHttpClient<IEbayService, EbayBrowseService>(c =>
        {
            c.Timeout = TimeSpan.FromSeconds(15);
        });

        return services;
    }
}
