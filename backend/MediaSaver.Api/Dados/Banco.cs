using MySqlConnector;

namespace MediaSaver.Api.Dados;

/// <summary>Abre conexões com o MySQL usando a connection string "MediaSaver".</summary>
public class Banco(IConfiguration configuracao)
{
    public string StringDeConexao { get; } =
        configuracao.GetConnectionString("MediaSaver") is { Length: > 0 } texto
            ? texto
            : throw new InvalidOperationException(
                "Connection string do MySQL não configurada. Rode: dotnet user-secrets set " +
                "\"ConnectionStrings:MediaSaver\" \"Server=localhost;Database=MEDIASAVER;User=root;Password=SUA_SENHA;AllowPublicKeyRetrieval=True\"");

    public async Task<MySqlConnection> AbrirAsync(CancellationToken ct = default)
    {
        var conexao = new MySqlConnection(StringDeConexao);
        await conexao.OpenAsync(ct);
        return conexao;
    }
}

internal static class ExtensoesBanco
{
    /// <summary>
    /// Cria um comando com parâmetros vindos de um objeto anônimo:
    /// conexao.Sql("SELECT * FROM Post WHERE id = @id", new { id }).
    /// Os valores sempre vão como parâmetros, nunca colados no SQL (evita SQL injection).
    /// </summary>
    public static MySqlCommand Sql(
        this MySqlConnection conexao, string sql, object? parametros = null, MySqlTransaction? transacao = null)
    {
        var comando = new MySqlCommand(sql, conexao, transacao);

        if (parametros is not null)
            foreach (var propriedade in parametros.GetType().GetProperties())
                comando.Parameters.AddWithValue("@" + propriedade.Name, propriedade.GetValue(parametros) ?? DBNull.Value);

        return comando;
    }

    public static int Int(this MySqlDataReader leitor, string coluna) =>
        leitor[coluna] is DBNull ? 0 : Convert.ToInt32(leitor[coluna]);

    public static int? IntOuNulo(this MySqlDataReader leitor, string coluna) =>
        leitor[coluna] is DBNull ? null : Convert.ToInt32(leitor[coluna]);

    public static string Texto(this MySqlDataReader leitor, string coluna) =>
        leitor[coluna] is DBNull ? string.Empty : Convert.ToString(leitor[coluna])!;

    public static string? TextoOuNulo(this MySqlDataReader leitor, string coluna) =>
        leitor[coluna] is DBNull ? null : Convert.ToString(leitor[coluna]);

    public static DateTime Data(this MySqlDataReader leitor, string coluna) =>
        Convert.ToDateTime(leitor[coluna]);
}
