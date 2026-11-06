namespace MediaSaver.Api.Ebay;

/// <summary>Falha ao comunicar com o eBay; a API responde com 502.</summary>
public class ServicoExternoException(string mensagem, Exception? interna = null)
    : Exception(mensagem, interna);
