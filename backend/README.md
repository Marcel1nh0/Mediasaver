# API do catálogo

O catálogo social usa as tabelas `Post`, `Usuar` e `ImagemPost` definidas em
[`../DataBase/Modelagem.sql`](../DataBase/Modelagem.sql).

Configure uma conexão MySQL pela variável de ambiente
`ConnectionStrings__Mediasaver`, por exemplo:

```text
ConnectionStrings__Mediasaver=Server=localhost;Port=3306;Database=MEDIASAVER;User ID=mediasaver;Password=<sua-senha>
```

Importe o modelo SQL antes de iniciar a API:

```sh
mysql < DataBase/Modelagem.sql
dotnet run --project backend/MediaSaver.Api
```

A API fica disponível em `http://localhost:5095` no perfil HTTP de
desenvolvimento. A ausência de conexão configurada ou a indisponibilidade do
banco retorna HTTP 503 para o frontend.

## Endpoints

- `GET /api/posts?busca=câmera&limite=20&offset=0` lista o catálogo ou busca
  por título, descrição, marca, ano de lançamento ou autor. O limite é de
  1 a 100 itens.
- `GET /api/posts/{id}` retorna os detalhes de uma publicação.
- A busca externa já existente permanece em
  `GET /api/ebay/anuncios?busca=...`.

O Vite encaminha `/api` para `http://localhost:5095` por padrão. Para outra
origem, configure `VITE_API_URL` no ambiente do frontend.
