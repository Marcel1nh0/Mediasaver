namespace MediaSaver.Api.Arquivos;

/// <summary>Salva e apaga as fotos enviadas (posts e perfil) na pasta "uploads" da API.</summary>
public class Imagens
{
    public const string UrlBase = "/uploads";
    public const long TamanhoMaximo = 5 * 1024 * 1024; // 5 MB

    private static readonly string[] Extensoes = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

    public string Pasta { get; }

    public Imagens(IWebHostEnvironment ambiente)
    {
        Pasta = Path.Combine(ambiente.ContentRootPath, "uploads");
        Directory.CreateDirectory(Pasta);
    }

    /// <summary>Retorna a mensagem de erro, ou null se o arquivo for uma imagem aceitável.</summary>
    public static string? Validar(IFormFile arquivo)
    {
        if (arquivo.Length == 0) return $"A foto \"{arquivo.FileName}\" está vazia.";
        if (arquivo.Length > TamanhoMaximo) return $"A foto \"{arquivo.FileName}\" passa de 5 MB.";

        var extensao = Path.GetExtension(arquivo.FileName).ToLowerInvariant();
        if (!Extensoes.Contains(extensao) || !PareceImagem(arquivo))
            return $"\"{arquivo.FileName}\" não é uma imagem JPG, PNG, WEBP ou GIF.";

        return null;
    }

    /// <summary>Salva com um nome aleatório e devolve a URL pública (/uploads/abc.jpg).</summary>
    public async Task<string> SalvarAsync(IFormFile arquivo, CancellationToken ct)
    {
        var extensao = Path.GetExtension(arquivo.FileName).ToLowerInvariant();
        var nome = $"{Guid.NewGuid():N}{extensao}";

        await using var destino = File.Create(Path.Combine(Pasta, nome));
        await arquivo.CopyToAsync(destino, ct);

        return $"{UrlBase}/{nome}";
    }

    public void Apagar(string? url)
    {
        if (string.IsNullOrEmpty(url) || !url.StartsWith(UrlBase + "/")) return;

        // GetFileName impede caminhos como "../../" de sair da pasta uploads.
        var caminho = Path.Combine(Pasta, Path.GetFileName(url));
        if (File.Exists(caminho)) File.Delete(caminho);
    }

    // Confere os primeiros bytes: um .exe renomeado para .jpg não passa.
    private static bool PareceImagem(IFormFile arquivo)
    {
        Span<byte> inicio = stackalloc byte[12];
        using var fluxo = arquivo.OpenReadStream();
        var lidos = fluxo.Read(inicio);
        if (lidos < 12) return false;

        var jpg = inicio[0] == 0xFF && inicio[1] == 0xD8 && inicio[2] == 0xFF;
        var png = inicio[0] == 0x89 && inicio[1] == 0x50 && inicio[2] == 0x4E && inicio[3] == 0x47;
        var gif = inicio[0] == 0x47 && inicio[1] == 0x49 && inicio[2] == 0x46;
        var webp = inicio[0] == 0x52 && inicio[1] == 0x49 && inicio[2] == 0x46 && inicio[3] == 0x46
                   && inicio[8] == 0x57 && inicio[9] == 0x45 && inicio[10] == 0x42 && inicio[11] == 0x50;

        return jpg || png || gif || webp;
    }
}
