-- MediaSaver: estrutura do banco (MySQL 8)
--
-- A API roda este script sozinha ao iniciar. Ele só cria o que ainda não
-- existe, então pode rodar quantas vezes quiser sem perder dados.
-- Para apagar tudo e começar do zero: rode Resetar.sql e reinicie a API.

CREATE DATABASE IF NOT EXISTS MEDIASAVER CHARACTER SET utf8mb4;
USE MEDIASAVER;

CREATE TABLE IF NOT EXISTS Usuar (
    id int unsigned PRIMARY KEY AUTO_INCREMENT,
    nome varchar(100) NOT NULL,
    email varchar(255) NOT NULL UNIQUE,
    senha varchar(255) NOT NULL, -- hash da senha (PBKDF2), nunca a senha pura
    adm boolean NOT NULL DEFAULT FALSE,
    dataConta datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    karma int NOT NULL DEFAULT 0, -- soma do karma dos posts do usuário
    qtdPost smallint unsigned NOT NULL DEFAULT 0,
    qtdInt int unsigned NOT NULL DEFAULT 0,
    fotoPath varchar(255) -- uma foto por conta, então não precisa de tabela extra
);

CREATE TABLE IF NOT EXISTS Post (
    id int unsigned PRIMARY KEY AUTO_INCREMENT,
    idUsuar int unsigned,
    titulo varchar(100) NOT NULL,
    descricao varchar(1000),
    marca varchar(50),
    anoLancamento smallint unsigned, -- opcional: nem todo objeto tem ano conhecido
    categoria varchar(20) NOT NULL DEFAULT 'outro', -- camera, vinil, video, radio, audio, game, outro
    karma int NOT NULL DEFAULT 0, -- upvotes menos downvotes
    qtdimagem tinyint unsigned NOT NULL DEFAULT 0, -- limite de 5 imagens por post
    qtdcomments smallint unsigned NOT NULL DEFAULT 0,
    dataPost datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (idUsuar) REFERENCES Usuar(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS comentario (
    id int unsigned PRIMARY KEY AUTO_INCREMENT, -- id próprio: a interação aponta para um comentário só
    conteudo varchar(500) NOT NULL,
    idUsuar int unsigned NOT NULL,
    idPost int unsigned NOT NULL,
    dataComent datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (idPost) REFERENCES Post(id) ON DELETE CASCADE,
    FOREIGN KEY (idUsuar) REFERENCES Usuar(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS interacoes (
    id int unsigned PRIMARY KEY AUTO_INCREMENT,
    idUsuar int unsigned NOT NULL,
    idPost int unsigned,
    idComentario int unsigned,
    descricao varchar(10) NOT NULL, -- upvote, downvote, comentario, post
    dataHora datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_interacoes_voto (idPost, idUsuar, descricao),
    FOREIGN KEY (idUsuar) REFERENCES Usuar(id) ON DELETE CASCADE,
    FOREIGN KEY (idPost) REFERENCES Post(id) ON DELETE CASCADE,
    FOREIGN KEY (idComentario) REFERENCES comentario(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ImagemPost (
    idPost int unsigned NOT NULL,
    id tinyint unsigned NOT NULL, -- numeração dentro do post (1, 2, 3...)
    caminho varchar(255) NOT NULL,
    PRIMARY KEY (idPost, id),
    FOREIGN KEY (idPost) REFERENCES Post(id) ON DELETE CASCADE
);
