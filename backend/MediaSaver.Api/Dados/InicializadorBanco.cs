using MySqlConnector;

namespace MediaSaver.Api.Dados;

/// <summary>
/// Roda quando a API inicia:
/// 1. cria o banco e as tabelas que faltarem (DataBase/Modelagem.sql);
/// 2. se ainda não houver nenhum usuário, coloca os dados de exemplo (DataBase/DadosExemplo.sql).
/// </summary>
public static class InicializadorBanco
{
    public static async Task ExecutarAsync(IServiceProvider servicos)
    {
        var banco = servicos.GetRequiredService<Banco>();
        var ambiente = servicos.GetRequiredService<IWebHostEnvironment>();
        var logger = servicos.GetRequiredService<ILoggerFactory>().CreateLogger("Banco");

        // Os scripts ficam na pasta DataBase, na raiz do repositório (duas pastas acima da API).
        string pastaScripts = Path.Combine(ambiente.ContentRootPath, "..", "..", "DataBase");

        // 1. Conecta sem escolher o banco, porque ele pode ainda não existir.
        var semBanco = new MySqlConnectionStringBuilder(banco.StringDeConexao);
        semBanco.Database = "";

        using (var conexao = new MySqlConnection(semBanco.ConnectionString))
        {
            try
            {
                await conexao.OpenAsync();
            }
            catch (MySqlException ex)
            {
                throw new InvalidOperationException(
                    "Não foi possível conectar ao MySQL. Confira se ele está rodando e se a senha " +
                    "na connection string está certa. Detalhe: " + ex.Message, ex);
            }

            string modelagem = File.ReadAllText(Path.Combine(pastaScripts, "Modelagem.sql"));
            var comandoModelagem = new MySqlCommand(modelagem, conexao);
            await comandoModelagem.ExecuteNonQueryAsync();
        }

        using var conexaoBanco = await banco.AbrirAsync();

        // Um banco criado pelo script antigo não tem a coluna "categoria" e quebraria a API.
        var verificar = new MySqlCommand(
            @"SELECT COUNT(*) FROM information_schema.columns
              WHERE LOWER(table_schema) = 'mediasaver' AND LOWER(table_name) = 'post'
                AND LOWER(column_name) = 'categoria'", conexaoBanco);
        int temCategoria = Convert.ToInt32(await verificar.ExecuteScalarAsync());

        if (temCategoria == 0)
        {
            throw new InvalidOperationException(
                "O banco MEDIASAVER foi criado com o script antigo. Rode DataBase/Resetar.sql " +
                "no MySQL Workbench e inicie a API de novo.");
        }

        // 2. Dados de exemplo, só se o banco estiver vazio.
        var contarUsuarios = new MySqlCommand("SELECT COUNT(*) FROM Usuar", conexaoBanco);
        int usuarios = Convert.ToInt32(await contarUsuarios.ExecuteScalarAsync());

        if (usuarios == 0)
        {
            string dados = File.ReadAllText(Path.Combine(pastaScripts, "DadosExemplo.sql"));
            var comandoDados = new MySqlCommand(dados, conexaoBanco);
            await comandoDados.ExecuteNonQueryAsync();

            logger.LogInformation("Banco criado com os dados de exemplo (senha dos usuários: mediasaver123).");
        }
    }
}
