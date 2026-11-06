using MySqlConnector;

namespace MediaSaver.Api.Posts;

public sealed class PostCatalogoService(
    IConfiguration configuracao,
    ILogger<PostCatalogoService> logger) : IPostCatalogoService
{
    private const string SelectPost = """
        SELECT p.id, p.titulo, p.descricao, p.marca, p.anoLancamento, p.karma, p.qtdcomments,
               (SELECT ip.caminho
                FROM ImagemPost ip
                WHERE ip.idPost = p.id
                ORDER BY ip.id
                LIMIT 1) AS imagemUrl,
               u.nome AS autor
        FROM Post p
        LEFT JOIN Usuar u ON u.id = p.idUsuar
        """;

    private readonly string? _connectionString = configuracao.GetConnectionString("Mediasaver");

    public async Task<ResultadoBuscaPosts> BuscarAsync(
        string? busca,
        int limite,
        int offset,
        CancellationToken cancellationToken)
    {
        var termo = string.IsNullOrWhiteSpace(busca) ? null : $"%{busca.Trim()}%";

        try
        {
            await using var conexao = await AbrirConexaoAsync(cancellationToken);

            await using var comandoTotal = conexao.CreateCommand();
            comandoTotal.CommandText = """
                SELECT COUNT(*)
                FROM Post p
                LEFT JOIN Usuar u ON u.id = p.idUsuar
                WHERE (@busca IS NULL
                    OR p.titulo LIKE @busca
                    OR COALESCE(p.descricao, '') LIKE @busca
                    OR COALESCE(p.marca, '') LIKE @busca
                    OR CAST(p.anoLancamento AS CHAR) LIKE @busca
                    OR COALESCE(u.nome, '') LIKE @busca)
                """;
            comandoTotal.Parameters.AddWithValue("@busca", (object?)termo ?? DBNull.Value);
            var total = Convert.ToInt32(await comandoTotal.ExecuteScalarAsync(cancellationToken));

            await using var comandoPosts = conexao.CreateCommand();
            comandoPosts.CommandText = $"""
                {SelectPost}
                WHERE (@busca IS NULL
                    OR p.titulo LIKE @busca
                    OR COALESCE(p.descricao, '') LIKE @busca
                    OR COALESCE(p.marca, '') LIKE @busca
                    OR CAST(p.anoLancamento AS CHAR) LIKE @busca
                    OR COALESCE(u.nome, '') LIKE @busca)
                ORDER BY p.dataPost DESC, p.id DESC
                LIMIT @limite OFFSET @offset
                """;
            comandoPosts.Parameters.AddWithValue("@busca", (object?)termo ?? DBNull.Value);
            comandoPosts.Parameters.AddWithValue("@limite", limite);
            comandoPosts.Parameters.AddWithValue("@offset", offset);

            var posts = new List<PostCatalogo>();
            await using var leitor = await comandoPosts.ExecuteReaderAsync(cancellationToken);
            while (await leitor.ReadAsync(cancellationToken))
                posts.Add(MapearPost(leitor));

            return new ResultadoBuscaPosts(total, limite, offset, posts);
        }
        catch (MySqlException ex)
        {
            logger.LogError(ex, "Falha ao consultar o catálogo social no MySQL.");
            throw new CatalogoIndisponivelException(
                "Não foi possível conectar ao banco de dados do catálogo.");
        }
    }

    public async Task<PostCatalogo?> ObterAsync(uint id, CancellationToken cancellationToken)
    {
        try
        {
            await using var conexao = await AbrirConexaoAsync(cancellationToken);
            await using var comando = conexao.CreateCommand();
            comando.CommandText = $"{SelectPost} WHERE p.id = @id";
            comando.Parameters.AddWithValue("@id", id);

            await using var leitor = await comando.ExecuteReaderAsync(cancellationToken);
            return await leitor.ReadAsync(cancellationToken) ? MapearPost(leitor) : null;
        }
        catch (MySqlException ex)
        {
            logger.LogError(ex, "Falha ao carregar o post {PostId} no MySQL.", id);
            throw new CatalogoIndisponivelException(
                "Não foi possível conectar ao banco de dados do catálogo.");
        }
    }

    private async Task<MySqlConnection> AbrirConexaoAsync(CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(_connectionString))
            throw new CatalogoIndisponivelException(
                "Configure a conexão do banco em ConnectionStrings__Mediasaver.");

        var conexao = new MySqlConnection(_connectionString);
        var aberta = false;
        try
        {
            await conexao.OpenAsync(cancellationToken);
            aberta = true;
            return conexao;
        }
        finally
        {
            if (!aberta)
                await conexao.DisposeAsync();
        }
    }

    private static PostCatalogo MapearPost(MySqlDataReader leitor) => new(
        leitor.GetUInt32("id"),
        leitor.GetString("titulo"),
        leitor.IsDBNull(leitor.GetOrdinal("descricao")) ? null : leitor.GetString("descricao"),
        leitor.IsDBNull(leitor.GetOrdinal("marca")) ? null : leitor.GetString("marca"),
        leitor.GetUInt16("anoLancamento"),
        leitor.IsDBNull(leitor.GetOrdinal("karma")) ? 0 : leitor.GetInt16("karma"),
        leitor.IsDBNull(leitor.GetOrdinal("qtdcomments")) ? 0 : leitor.GetByte("qtdcomments"),
        leitor.IsDBNull(leitor.GetOrdinal("imagemUrl")) ? null : leitor.GetString("imagemUrl"),
        leitor.IsDBNull(leitor.GetOrdinal("autor")) ? null : leitor.GetString("autor"));
}
