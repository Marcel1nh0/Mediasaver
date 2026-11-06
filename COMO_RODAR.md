# Como rodar o MediaSaver

Precisa ter instalado: **.NET 9 SDK**, **Node.js (LTS)** e **MySQL Server 8** rodando.

## 1. Senha do MySQL (só na primeira vez)

```powershell
cd backend\MediaSaver.Api
dotnet user-secrets set "ConnectionStrings:MediaSaver" "Server=localhost;Database=MEDIASAVER;User=root;Password=SUA_SENHA;AllowPublicKeyRetrieval=True"
```

Troque `SUA_SENHA` pela senha do usuário `root` do seu MySQL. A senha fica salva no seu
computador (user-secrets), nunca no código nem no GitHub.

Opcional, para a busca no eBay: `dotnet user-secrets set "Ebay:ClientId" "..."` e
`dotnet user-secrets set "Ebay:ClientSecret" "..."`.

## 2. API (terminal 1)

```powershell
cd backend\MediaSaver.Api
dotnet run --launch-profile http
```

Na primeira vez, a API cria sozinha o banco `MEDIASAVER`, as tabelas e os dados de exemplo.
Não precisa rodar nenhum script no Workbench.

## 3. Site (terminal 2)

```powershell
cd frontend
npm install
npm run dev
```

Abra o endereço que aparecer (normalmente http://localhost:5173).

## Contas de exemplo

Todas com a senha `mediasaver123`:
marcelo@mediasaver.com (administrador), will@mediasaver.com, angelo@mediasaver.com,
lorenzo@mediasaver.com e heloisa@mediasaver.com.

## Problemas comuns

- **"Connection string do MySQL não configurada"**: faça o passo 1.
- **"Não foi possível conectar ao MySQL"**: o MySQL está desligado ou a senha do passo 1 está errada.
- **"O banco MEDIASAVER foi criado com o script antigo"**: rode `DataBase/Resetar.sql` no Workbench
  e inicie a API de novo.
- **Quer apagar tudo e voltar aos dados de exemplo**: rode `DataBase/Resetar.sql` e reinicie a API.
- **O site mostra "Não foi possível falar com a API"**: a API (terminal 1) não está rodando.
