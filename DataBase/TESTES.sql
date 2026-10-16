-- 1 --TESTES PARA TABELA USUARIO
insert into Usuar (nome, email, senha, adm, karma) values
('Marceleza super', 'marcelo@email.com', 'Senha super segura123', TRUE, 120),
('Uilly ãm', 'will@hotmail.com', '123456', FALSE, -100),
('Hello Uisa', 'helois@email.com', '654321', FALSE, 0),
('An gue low', 'aggelosigmaboy@HOTmail.com', 'anguelo123', FALSE, -99),
('gUZ TAVO', 'gugashit@gmail.com', 'round67', FALSE, 14),
('Berardo gotinhas', 'averagesulista@Uol.com', 'Kanye west goat', FALSE, 119),
('Low renst zow', 'lolo@email.com', '0987654321', FALSE, 0);

-- Selects
select * from Usuar;
select id, nome, email from Usuar where adm = TRUE;
select nome, karma from Usuar order by karma desc;
select * from Usuar where email = 'aggelosigmaboy@HOTmail.com';
-- update pq sim
UPDATE Usuar
SET nome = 'Berardu gotas'
WHERE'Berardo gotinhas';
-- 2 TESTES PARA TABELA POSTS
insert into Post (idUsuar, titulo, descricao, marca, anoLancamento, karma, qtdimagem, qtdcomments) values
(1, 'Review do Controle X', 'Controle sem fio muito bom', 'Sony', 2022, 10, 2, 2),
(2, 'Notebook Gamer', 'Ótimo custo-benefício', 'Acer', 2023, 8, 1, 1),
(3, 'Fone Bluetooth', 'Bateria dura o dia todo', 'JBL', 2021, 3, 0, 0),
(1, 'Teclado Mecânico', 'Switch azul, barulhento', 'Redragon', 2020, 6, 1, 0);

-- Selects
select * from Post;
select * from Post where marca = 'Sony';
select titulo, karma from Post order by karma desc;
select * from Post where anoLancamento >= 2022;

-- Posts com o nome de quem postou
select p.id, p.titulo, u.nome as autor
from Post p
join Usuar u on u.id = p.idUsuar;
-- 3 TESTES PARA TABELA COMENTARIO
insert into comentario (id, conteudo, idUsuar, idPost) values
(1, 'Esse controle é uma bosta, recomendo!', 2, 1),
(2, 'Esse console foi feito pelo meu avô???', 3, 1),
(1, 'Qual a temperatura média?', 1, 2);
-- esses id posts e id usuar são feitos na hora quando o usuario posta um comentario em um post 

-- Selects
select * from comentario;
select * from comentario where idPost = 1;

-- Comentários com autor e título do post
select c.id, c.conteudo, u.nome as autor, p.titulo as post
from comentario c
join Usuar u on u.id = c.idUsuar
join Post p on p.id = c.idPost;
-- 4 TESTES PARA TABELA INTERACOES
insert into interacoes (idUsuar, id, idComentario, idPost, descricao, data_hora) values
(1, 1, null, 1, 'upvote', '2026-10-10 14:30:00'),
(2, 1, null, 1, 'upvote', '2026-10-11 09:15:00'),
(3, 1, 1, null, 'upvote', '2026-10-12 20:45:00'),
(4, 1, null, 2, 'downvote', '2026-10-13 11:00:00');

-- Selects
select * from interacoes;
select * from interacoes where idPost = 1;
select * from interacoes order by data_hora desc;

-- Interações com o nome de quem fez
select i.id, u.nome, i.descricao, i.data_hora, i.idPost, i.idComentario
from interacoes i
join Usuar u on u.id = i.idUsuar;
-- 5 TESTES PARA IMAGEMPOST
insert into ImagemPost (id, idPost, caminho) values
(1, 1, '/imagens/posts/1/controle_frente.jpg'),
(2, 1, '/imagens/posts/1/controle_costas.jpg'),
(1, 2, '/imagens/posts/2/notebookPODRE.png'),
(1, 4, '/imagens/posts/4/teclado.jpg');

-- Selects
select * from ImagemPost;
select * from ImagemPost where idPost = 1;

-- Imagens com o título do post
select ip.id, ip.caminho, p.titulo
from ImagemPost ip
join Post p on p.id = ip.idPost;
