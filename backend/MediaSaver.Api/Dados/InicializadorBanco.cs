using System.Reflection;
using MySqlConnector;

namespace MediaSaver.Api.Dados;

/// <summary>
/// Ao iniciar a API: cria o banco e as tabelas que faltarem (DataBase/Modelagem.sql)
/// e, se não houver nenhum usuário, coloca os dados de exemplo (DataBase/DadosExemplo.sql).
/// </summary>
public static class InicializadorBanco
{
    public static async Task ExecutarAsync(IServiceProvider servicos)
    {
        var banco = servicos.GetRequiredService<Banco>();
        var logger = servicos.GetRequiredService<ILoggerFactory>().CreateLogger("Banco");

        // Conecta sem escolher o banco, porque ele pode ainda não existir.
        var semBanco = new MySqlConnectionStringBuilder(banco.StringDeConexao) { Database = "" };

        await using (var conexao = new MySqlConnection(semBanco.ConnectionString))
        {
            try
            {
                await conexao.OpenAsync();
            }
            catch (MySqlException ex)
            {
                throw new InvalidOperationException(
                    "Não foi possível conectar ao MySQL. Confira se ele está rodando e se a senha " +
                    $"na connection string está certa. Detalhe: {ex.Message}", ex);
            }

            await conexao.Sql(LerScript("Modelagem.sql")).ExecuteNonQueryAsync();
        }

        await using var conexaoBanco = await banco.AbrirAsync();

        // Um banco criado pelo script antigo não tem a coluna "categoria" e quebraria a API.
        var temCategoria = Convert.ToInt32(await conexaoBanco.Sql("""
            SELECT COUNT(*) FROM information_schema.columns
            WHERE LOWER(table_schema) = 'mediasaver' AND LOWER(table_name) = 'post'
              AND LOWER(column_name) = 'categoria'
            """).ExecuteScalarAsync());

        if (temCategoria == 0)
            throw new InvalidOperationException(
                "O banco MEDIASAVER foi criado com o script antigo. Rode DataBase/Resetar.sql " +
                "no MySQL Workbench e inicie a API de novo.");

        var usuarios = Convert.ToInt32(await conexaoBanco.Sql("SELECT COUNT(*) FROM Usuar").ExecuteScalarAsync());
        if (usuarios == 0)
        {
            await conexaoBanco.Sql(LerScript("DadosExemplo.sql")).ExecuteNonQueryAsync();
            logger.LogInformation("Banco criado com os dados de exemplo (senha dos usuários: mediasaver123).");
        }
    }

    private static string LerScript(string nome)
    {
        using var fluxo = Assembly.GetExecutingAssembly().GetManifestResourceStream(nome)
            ?? throw new InvalidOperationException($"Script {nome} não encontrado dentro da API.");
        using var leitor = new StreamReader(fluxo);
        return leitor.ReadToEnd();
    }
}
