namespace MediaSaver.Api.Posts;

public record AutorResposta(int Id, string Nome, string? Foto);

public record PostResumo(
    int Id,
    string Titulo,
    string? Marca,
    int? AnoLancamento,
    string Categoria,
    int Karma,
    int QtdComentarios,
    string? Capa,
    AutorResposta? Autor,
    DateTime DataPost);

public record ImagemResposta(int Id, string Url);

public record ComentarioResposta(int Id, string Conteudo, DateTime Data, AutorResposta Autor, bool PodeExcluir);

public record PostDetalhe(
    int Id,
    string Titulo,
    string? Descricao,
    string? Marca,
    int? AnoLancamento,
    string Categoria,
    int Karma,
    DateTime DataPost,
    AutorResposta? Autor,
    IReadOnlyList<ImagemResposta> Imagens,
    IReadOnlyList<ComentarioResposta> Comentarios,
    int MeuVoto,
    bool PodeEditar);

public record ComentarioRequest(string? Conteudo);
public record VotoRequest(int Valor);
public record VotoResposta(int Karma, int MeuVoto);

/// <summary>Campos do formulário de criar/editar post, já validados.</summary>
internal record CamposPost(string Titulo, string? Descricao, string? Marca, int? AnoLancamento, string Categoria);
