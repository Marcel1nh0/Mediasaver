create database mediaSaver;
create table Usuar(
id int primary key auto_increment,
nome varchar(70) not null,
email varchar(50) not null,
senha varchar(20) not null,
adm tinyint(1) default FALSE,
karma tinyint
);
create table Post(
id int primary key auto_increment,
idUsuar int,
titulo varchar(40) not null,
descricao varchar(50),
marca varchar(20),
anoLancamento int unsigned,
karma tinyint,
qtdimagem tinyint unsigned default 0,
qtdcomments tinyint unsigned default 0,
primary key(id),
foreign key (idUsuar) references Usuar(id)
);
create table comentario(
id smallint unsigned not null,
conteudo text not null,
idUsuar int not null,
primary key(idUser, idPost, id),
foreign key(idPost) references Post(id),
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
foreign key (idComentario) references Comentario(id),
foreign key (idPost) references Post(id)
);
CREATE TABLE ImagemPost (
    id INT,
    idPost INT NOT NULL,
    caminho VARCHAR(500) NOT NULL,
	primary key(idPost,id),
    
    FOREIGN KEY (idPost)
        REFERENCES Post(id)
        ON DELETE CASCADE
);

    
