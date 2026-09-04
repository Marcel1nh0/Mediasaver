create database mediaSaver;
create table User(
id int primary key auto_increment,
nome varchar(70) not null,
email varchar(50) not null,
senha varchar(20) not null,
adm tinyint(1) default FALSE,
karma tinyint
);
create table Post(
id int primary key auto_increment,
idUser int,
titulo varchar(40) not null,
descricao varchar(50),
marca varchar(20),
anoLancamento int unsigned,
karma tinyint,
primary key(id),
foreign key (idUser) references User(id)
)
create table image(

	)