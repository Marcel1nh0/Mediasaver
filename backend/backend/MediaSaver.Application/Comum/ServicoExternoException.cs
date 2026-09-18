namespace MediaSaver.Application.Comum;

/// <summary>
/// Erro ao se comunicar com um serviço externo (ex.: eBay).
/// A API converte esta exceção em HTTP 502 (Bad Gateway).
/// </summary>
public class ServicoExternoException : Exception
{
    public ServicoExternoException(string mensagem, Exception? interna = null)
        : base(mensagem, interna) { }
}
