DROP DATABASE IF EXISTS MEDIASAVER;
CREATE DATABASE MEDIASAVER;
USE MEDIASAVER;
create table Usuar(
    id int unsigned primary key auto_increment,
    nome varchar(255) not null,
    email varchar(255) not null unique,
    senha varchar(255) not null,
    adm boolean not null default FALSE,
    dataConta datetime not null default current_timestamp,
    karma smallint default 0,
    qtdPost smallint unsigned default 0,
    qtdInt smallint unsigned default 0,
    fotoPath varchar(255) -- por ser uma foto por conta não tem que ter um ID(sem tabela extra, eba), e como a maioria das pessoas coloca foto esse campo rararente vai ficar sem utilizar
);

create table Post(
    id int unsigned not null auto_increment,
    idUsuar int unsigned,
    titulo varchar(100) not null, -- 255 ficaria horrível de feio
    descricao varchar(255),
    marca varchar(50),
    anoLancamento smallint unsigned not null, 
    karma smallint default 0,
    qtdimagem tinyint unsigned default 0, -- a ideia é ter um limite de imagens 
    qtdcomments tinyint unsigned default 0, -- 255 comentários máximos
    dataPost datetime not null default current_timestamp,
    primary key(id),
    foreign key (idUsuar) references Usuar(id)
);

create table comentario(
    id tinyint unsigned not null, -- máximo de 255 por post, valor retirado da tabela posts 
    conteudo varchar(255) not null,
    idUsuar int unsigned not null,
    idPost int unsigned not null,
    primary key(idUsuar, idPost, id),
    index idx_comentario_id (id),
    dataComent datetime not null default current_timestamp,
    foreign key (idPost) references Post(id),
    foreign key (idUsuar) references Usuar(id)
);

create table interacoes(
    idUsuar int unsigned not null,
    id smallint unsigned not null, --pegar da tabela usuar
    idComentario tinyint unsigned,
    idPost int unsigned, 
    descricao varchar(10) not null, -- like, comentario, dislike, post, 
    dataHora datetime not null default current_timestamp,
    primary key(idUsuar, id),
    foreign key (idUsuar) references Usuar(id),
    foreign key (idComentario) references comentario(id),
    foreign key (idPost) references Post(id)
);

create table ImagemPost (
    id tinyint unsigned not null,-- vai pegar o id da tebela posts, assim como o comentario
    idPost int unsigned not null,
    caminho varchar(255) not null,
    
    primary key(idPost, id),
    foreign key (idPost) references Post(id) on delete cascade
);
