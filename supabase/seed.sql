-- =====================================================================
-- Dados iniciais
-- =====================================================================

-- 1) Usuário da secretaria
--    Crie antes o usuário em Authentication > Users > Add user
--    (marque "Auto Confirm User") e troque o e-mail abaixo.
insert into usuarios (id, nome, email, perfil)
select id, 'Secretaria Acadêmica', email, 'SECRETARIA'
  from auth.users
 where email = 'secretaria@universidade.edu.br';

-- 2) Cursos e disciplinas de exemplo
insert into cursos (nome, creditos) values
  ('Engenharia de Software', 240),
  ('Ciência da Computação', 260);

insert into disciplinas (curso_id, codigo, nome, creditos, valor)
select c.id, d.codigo, d.nome, d.creditos, d.valor
  from cursos c
  join (values
    ('Engenharia de Software', 'ES101', 'Algoritmos e Estruturas de Dados I', 4, 850.00),
    ('Engenharia de Software', 'ES102', 'Desenvolvimento de Interfaces Web', 4, 850.00),
    ('Engenharia de Software', 'ES103', 'Modelagem de Sistemas', 4, 850.00),
    ('Engenharia de Software', 'ES104', 'Banco de Dados', 4, 850.00),
    ('Engenharia de Software', 'ES105', 'Engenharia de Requisitos', 2, 450.00),
    ('Engenharia de Software', 'ES106', 'Fundamentos de Teste de Software', 2, 450.00),
    ('Engenharia de Software', 'ES107', 'Interação Humano-Computador', 2, 450.00),
    ('Ciência da Computação', 'CC201', 'Cálculo I', 4, 900.00),
    ('Ciência da Computação', 'CC202', 'Arquitetura de Computadores', 4, 900.00)
  ) as d (curso, codigo, nome, creditos, valor) on d.curso = c.nome;
