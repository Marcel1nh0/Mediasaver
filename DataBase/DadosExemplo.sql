-- MediaSaver: dados de exemplo
--
-- A API coloca estes dados sozinha quando o banco ainda não tem nenhum usuário.
-- Todos os usuários abaixo têm a senha: mediasaver123
-- (no banco fica só o hash da senha, gerado pelo PasswordHasher do ASP.NET Core).

USE MEDIASAVER;

INSERT INTO Usuar (id, nome, email, senha, adm, dataConta) VALUES
(1, 'Marcelo', 'marcelo@mediasaver.com', 'AQAAAAIAAYagAAAAEO5atd6K+5fw5qVTBxcopSeJkMNyKUs2kavD7hwo4pfQEoIvSY/GH9T3/u1jW40g6A==', TRUE, NOW() - INTERVAL 60 DAY),
(2, 'Will', 'will@mediasaver.com', 'AQAAAAIAAYagAAAAEF+4q/jV3J7WZXb6bUCf3yI+82QAqibm7F5DcedXbVCVVBJKdpfG/sw0b9ylUXZLWA==', FALSE, NOW() - INTERVAL 45 DAY),
(3, 'Angelo', 'angelo@mediasaver.com', 'AQAAAAIAAYagAAAAENc/YEKriu6Q9JlegUC8uQXghBmDnjQxpLYm78HfMipqYt+q4m1B3EojRYuhmodrlg==', FALSE, NOW() - INTERVAL 40 DAY),
(4, 'Lorenzo', 'lorenzo@mediasaver.com', 'AQAAAAIAAYagAAAAEN3azt85kAfK46rkZZkceIGCvTuTVQdSYOl8U2kTHplSyUY1hEnFyL1EH6CLLFbvKQ==', FALSE, NOW() - INTERVAL 30 DAY),
(5, 'Heloísa', 'heloisa@mediasaver.com', 'AQAAAAIAAYagAAAAELdT0szKiMtQZ5xn8EKQuhmxs9HSY3zVvJgPXajJxD4Vv+uND9DfTRufbtISlQ5Qrg==', FALSE, NOW() - INTERVAL 20 DAY);

INSERT INTO Post (id, idUsuar, titulo, descricao, marca, anoLancamento, categoria, dataPost) VALUES
(1, 1, 'Câmera Kodak Brownie dos anos 60', 'Era do meu avô e ainda tem o estojo de couro original. O obturador funciona, mas nunca testei com filme.', 'Kodak', 1962, 'camera', NOW() - INTERVAL 9 DAY),
(2, 5, 'Disco de vinil de MPB', 'Achei numa caixa no sótão da casa da minha tia. A capa está gasta, mas o disco toca sem pular.', 'Philips', 1975, 'vinil', NOW() - INTERVAL 7 DAY),
(3, 2, 'Fita VHS de aniversário de família', 'Gravação de um aniversário dos anos 90. Alguém sabe onde digitalizar sem estragar a fita?', NULL, NULL, 'video', NOW() - INTERVAL 5 DAY),
(4, 3, 'Rádio de válvula', 'Liga e pega rádio AM depois de uns minutos esquentando. A madeira foi restaurada pelo meu pai.', 'Philco', NULL, 'radio', NOW() - INTERVAL 4 DAY),
(5, 4, 'Walkman com fita cassete', 'Funciona com pilha e ainda veio com uma fita gravada do rádio.', 'Sony', 1984, 'audio', NOW() - INTERVAL 2 DAY),
(6, 2, 'Super Nintendo com dois controles', 'Console completo, com caixa. Os cartuchos ainda salvam o progresso.', 'Nintendo', 1993, 'game', NOW() - INTERVAL 1 DAY);

-- Cada post criado também vira uma interação do tipo 'post'.
INSERT INTO interacoes (idUsuar, idPost, descricao, dataHora)
SELECT idUsuar, id, 'post', dataPost FROM Post;

INSERT INTO comentario (id, conteudo, idUsuar, idPost, dataComent) VALUES
(1, 'Lembro de uma igual na casa do meu avô!', 3, 1, NOW() - INTERVAL 8 DAY),
(2, 'Ainda dá para achar filme 620 para ela? Seria lindo ver fotos novas tiradas com ela.', 4, 1, NOW() - INTERVAL 8 DAY),
(3, 'Tenta limpar o disco com água destilada e um pano de microfibra, faz muita diferença.', 1, 2, NOW() - INTERVAL 6 DAY),
(4, 'Tem lugares que digitalizam VHS sem danificar. Pergunta em lojas de fotografia antigas.', 5, 3, NOW() - INTERVAL 4 DAY),
(5, 'Esse modelo é muito bonito! Quanto tempo levou a restauração?', 2, 4, NOW() - INTERVAL 3 DAY);

INSERT INTO interacoes (idUsuar, idPost, idComentario, descricao, dataHora)
SELECT idUsuar, idPost, id, 'comentario', dataComent FROM comentario;

-- Votos: cada pessoa tem no máximo um voto por post.
INSERT INTO interacoes (idUsuar, idPost, descricao) VALUES
(2, 1, 'upvote'), (3, 1, 'upvote'), (4, 1, 'upvote'), (5, 1, 'upvote'),
(1, 2, 'upvote'), (2, 2, 'upvote'), (3, 2, 'upvote'),
(1, 3, 'upvote'), (4, 3, 'upvote'),
(1, 4, 'upvote'), (2, 4, 'upvote'), (5, 4, 'upvote'), (4, 4, 'downvote'),
(1, 5, 'upvote'), (3, 5, 'upvote'),
(3, 6, 'upvote'), (4, 6, 'upvote'), (5, 6, 'upvote');

-- Contadores calculados a partir das tabelas (a API faz a mesma conta a cada mudança).
UPDATE Post p SET
    karma = (SELECT COALESCE(SUM(CASE i.descricao WHEN 'upvote' THEN 1 WHEN 'downvote' THEN -1 ELSE 0 END), 0)
             FROM interacoes i WHERE i.idPost = p.id),
    qtdcomments = (SELECT COUNT(*) FROM comentario c WHERE c.idPost = p.id),
    qtdimagem = (SELECT COUNT(*) FROM ImagemPost m WHERE m.idPost = p.id)
WHERE p.id > 0; -- o WHERE na chave deixa rodar também no Workbench (safe update mode)

UPDATE Usuar u SET
    karma = (SELECT COALESCE(SUM(p.karma), 0) FROM Post p WHERE p.idUsuar = u.id),
    qtdPost = (SELECT COUNT(*) FROM Post p WHERE p.idUsuar = u.id),
    qtdInt = (SELECT COUNT(*) FROM interacoes i WHERE i.idUsuar = u.id)
WHERE u.id > 0;
