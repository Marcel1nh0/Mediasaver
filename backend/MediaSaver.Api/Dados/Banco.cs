using MySqlConnector;

namespace MediaSaver.Api.Dados;

/// <summary>
/// Abre conexões com o MySQL. A connection string vem do user-secrets
/// (chave "ConnectionStrings:MediaSaver"), para a senha nunca ir para o GitHub.
/// </summary>
public class Banco
{
    public string StringDeConexao { get; }

    public Banco(IConfiguration configuracao)
    {
        string? texto = configuracao.GetConnectionString("MediaSaver");

        if (string.IsNullOrEmpty(texto))
        {
            throw new InvalidOperationException(
                "Connection string do MySQL não configurada. Rode: dotnet user-secrets set " +
                "\"ConnectionStrings:MediaSaver\" \"Server=localhost;Database=MEDIASAVER;User=root;Password=SUA_SENHA;AllowPublicKeyRetrieval=True\"");
        }

        StringDeConexao = texto;
    }

    public async Task<MySqlConnection> AbrirAsync(CancellationToken ct = default)
    {
        var conexao = new MySqlConnection(StringDeConexao);
        await conexao.OpenAsync(ct);
        return conexao;
    }

    /// <summary>
    /// Adiciona um parâmetro ao comando (ex.: "@id"). Os valores sempre vão como
    /// parâmetros, nunca colados no texto do SQL: é isso que evita SQL injection.
    /// </summary>
    public static void Parametro(MySqlCommand comando, string nome, object? valor)
    {
        if (valor == null)
        {
            valor = DBNull.Value; // é assim que o ADO.NET representa NULL no banco
        }

        comando.Parameters.AddWithValue(nome, valor);
    }
}

/// <summary>Atalhos para ler colunas que podem estar vazias (NULL) no banco.</summary>
public static class LeituraBanco
{
    public static int Int(this MySqlDataReader leitor, string coluna)
    {
        if (leitor.IsDBNull(leitor.GetOrdinal(coluna))) return 0;
        return Convert.ToInt32(leitor[coluna]);
    }

    public static int? IntOuNulo(this MySqlDataReader leitor, string coluna)
    {
        if (leitor.IsDBNull(leitor.GetOrdinal(coluna))) return null;
        return Convert.ToInt32(leitor[coluna]);
    }

    public static string Texto(this MySqlDataReader leitor, string coluna)
    {
        if (leitor.IsDBNull(leitor.GetOrdinal(coluna))) return "";
        return Convert.ToString(leitor[coluna])!;
    }

    public static string? TextoOuNulo(this MySqlDataReader leitor, string coluna)
    {
        if (leitor.IsDBNull(leitor.GetOrdinal(coluna))) return null;
        return Convert.ToString(leitor[coluna]);
    }

    public static DateTime Data(this MySqlDataReader leitor, string coluna)
    {
        return Convert.ToDateTime(leitor[coluna]);
    }
}
