# MediaSaver
 
O MediaSaver é um arquivo coletivo de mídias físicas: câmeras, vinis, fitas VHS, rádios, aparelhos de áudio e videogames. Cada pessoa fotografa um objeto antigo, conta a história dele e a comunidade vota e comenta. O site também busca anúncios parecidos no eBay e tem uma página de doação para apoiar acervos e museus.
 
## Funcionalidades
 
- **Contas de usuário:** cadastro e login com sessão por cookie. As senhas ficam no banco só como hash (PBKDF2 com salt).
- **Posts ("fichas"):** criar, editar e excluir, com título, descrição, categoria, marca, ano e até 5 fotos.
- **Votos (karma):** cada pessoa tem um voto por post, a favor ou contra. O karma do autor é a soma do karma dos posts dele.
- **Comentários:** quem está logado comenta; o autor do comentário pode excluí-lo.
- **Perfil:** foto de perfil, karma, número de posts e a lista "Meus posts".
- **Busca no eBay:** a API consulta a Browse API do eBay e o site mostra os anúncios com foto, preço e detalhes.
- **Permissões:** só o dono (ou um administrador) edita e exclui um post ou comentário.
## Tecnologias
 
| Parte | Tecnologia |
|---|---|
| Frontend | React 19 + Vite, React Router, lucide-react |
| Backend | ASP.NET Core 9 (Minimal APIs), MySqlConnector |
| Banco de dados | MySQL 8 |
| Integração | eBay Browse API (OAuth client credentials) |

# Como rodar
 
Precisa ter instalado: **.NET 9 SDK**, **Node.js (LTS)** e **MySQL Server 8** rodando.
 
### 1. Configurar a senha do MySQL (só na primeira vez)
 
```powershell
cd backend\MediaSaver.Api
dotnet user-secrets set "ConnectionStrings:MediaSaver" "Server=localhost;Database=MEDIASAVER;User=root;Password=SUA_SENHA;AllowPublicKeyRetrieval=True"
```
### 2. Iniciar a API (terminal 1)
 
```powershell
cd backend\MediaSaver.Api
dotnet run --launch-profile http
```
 
Na primeira vez, a API cria sozinha o banco `MEDIASAVER`, as tabelas e os dados de exemplo. Não é preciso rodar nenhum script no Workbench. A API fica em `http://localhost:5095`.
 
### 3. Iniciar o site (terminal 2)
 
```powershell
cd frontend
npm install
npm run dev
```

