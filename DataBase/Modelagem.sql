DROP DATABASE IF EXISTS MEDIASAVER;
CREATE DATABASE MEDIASAVER;
USE MEDIASAVER;
create table Usuar(
    id int unsigned primary key auto_increment,
    nome varchar(70) not null,
    email varchar(50) not null,
    senha varchar(50) not null,
    adm tinyint(1) default FALSE,
    karma smallint default 0
);

create table Post(
    id int unsigned auto_increment,
    idUsuar int unsigned,
    titulo varchar(50) not null,
    descricao varchar(200),
    marca varchar(25),
    anoLancamento smallint unsigned,
    karma tinyint,
    qtdimagem tinyint unsigned default 0, -- a ideia é ter um limite de imagens 
    qtdcomments tinyint unsigned default 0,
    primary key(id),
    foreign key (idUsuar) references Usuar(id)
);

create table comentario(
    id smallint unsigned not null,
    conteudo text not null,
    idUsuar int unsigned not null,
    idPost int unsigned not null,
    primary key(idUsuar, idPost, id),
    index idx_comentario_id (id),
    foreign key (idPost) references Post(id),
    foreign key (idUsuar) references Usuar(id)
);

create table interacoes(
    idUsuar int unsigned not null,
    id int unsigned not null,
    idComentario smallint unsigned,
    idPost int unsigned,
    descricao varchar(10),
    data_hora datetime,
    primary key(idUsuar, id),
    foreign key (idUsuar) references Usuar(id),
    foreign key (idComentario) references comentario(id),
    foreign key (idPost) references Post(id)
);

create table ImagemPost (
    id int,
    idPost int unsigned not null,
    caminho varchar(500) not null,
    primary key(idPost, id),
    foreign key (idPost) references Post(id) on delete cascade
);
