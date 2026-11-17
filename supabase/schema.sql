-- =====================================================================
-- Sistema de Matrículas - Estrutura do banco de dados (Supabase)
-- Executar no SQL Editor do projeto Supabase.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------
create type perfil_usuario   as enum ('ALUNO', 'PROFESSOR', 'SECRETARIA');
create type tipo_matricula   as enum ('OBRIGATORIA', 'OPTATIVA');
create type status_matricula as enum ('ATIVA', 'CANCELADA');
create type status_oferta    as enum ('ABERTA', 'ATIVA', 'CANCELADA');

-- ---------------------------------------------------------------------
-- Tabelas
-- ---------------------------------------------------------------------
create table usuarios (
  id        uuid primary key references auth.users (id) on delete cascade,
  nome      text not null,
  email     text not null unique,
  perfil    perfil_usuario not null,
  criado_em timestamptz not null default now()
);

create table cursos (
  id       bigint generated always as identity primary key,
  nome     text not null unique,
  creditos int  not null check (creditos > 0)
);

create table alunos (
  id        uuid primary key references usuarios (id) on delete cascade,
  matricula text   not null unique,
  curso_id  bigint not null references cursos (id)
);

create table disciplinas (
  id       bigint generated always as identity primary key,
  curso_id bigint not null references cursos (id) on delete cascade,
  codigo   text not null unique,
  nome     text not null,
  creditos int  not null check (creditos > 0),
  valor    numeric(10, 2) not null check (valor >= 0)
);

create table curriculos (
  id       bigint generated always as identity primary key,
  curso_id bigint not null references cursos (id) on delete cascade,
  semestre text   not null check (semestre ~ '^\d{4}/[12]$'),
  unique (curso_id, semestre)
);

create table ofertas (
  id            bigint generated always as identity primary key,
  curriculo_id  bigint not null references curriculos (id) on delete cascade,
  disciplina_id bigint not null references disciplinas (id) on delete cascade,
  professor_id  uuid references usuarios (id) on delete set null,
  status        status_oferta not null default 'ABERTA',
  unique (curriculo_id, disciplina_id)
);

create table periodos_matricula (
  id          bigint generated always as identity primary key,
  semestre    text not null unique check (semestre ~ '^\d{4}/[12]$'),
  data_inicio timestamptz not null,
  data_fim    timestamptz not null,
  encerrado   boolean not null default false,
  check (data_fim > data_inicio)
);

create table matriculas (
  id                bigint generated always as identity primary key,
  aluno_id          uuid   not null references alunos (id) on delete cascade,
  oferta_id         bigint not null references ofertas (id) on delete cascade,
  tipo              tipo_matricula   not null,
  status            status_matricula not null default 'ATIVA',
  data_matricula    timestamptz not null default now(),
  data_cancelamento timestamptz
);

-- Um aluno não pode ter duas matrículas ativas na mesma oferta
create unique index matriculas_ativa_unica
  on matriculas (aluno_id, oferta_id)
  where status = 'ATIVA';

create table cobrancas (
  id               bigint generated always as identity primary key,
  aluno_id         uuid not null references alunos (id) on delete cascade,
  semestre         text not null,
  valor_total      numeric(10, 2) not null default 0,
  data_notificacao timestamptz not null default now(),
  unique (aluno_id, semestre)
);

-- ---------------------------------------------------------------------
-- Funções auxiliares
-- ---------------------------------------------------------------------
create or replace function perfil_atual()
returns perfil_usuario
language sql stable security definer
set search_path = public
as $$
  select perfil from usuarios where id = auth.uid();
$$;

-- Ofertas com dados da disciplina, professor e total de alunos matriculados.
-- A view roda com permissão do dono, então o aluno consegue ver a quantidade
-- de vagas sem enxergar as matrículas dos colegas.
create or replace view ofertas_detalhadas as
select
  o.id,
  o.curriculo_id,
  o.status,
  c.semestre,
  c.curso_id,
  cu.nome   as curso_nome,
  d.id      as disciplina_id,
  d.codigo,
  d.nome    as disciplina_nome,
  d.creditos,
  d.valor,
  o.professor_id,
  u.nome    as professor_nome,
  (select count(*) from matriculas m
    where m.oferta_id = o.id and m.status = 'ATIVA')::int as total_matriculados
from ofertas o
join curriculos  c  on c.id  = o.curriculo_id
join cursos      cu on cu.id = c.curso_id
join disciplinas d  on d.id  = o.disciplina_id
left join usuarios u on u.id = o.professor_id;

revoke all on ofertas_detalhadas from anon;
grant select on ofertas_detalhadas to authenticated;

-- ---------------------------------------------------------------------
-- Regras de matrícula (garantidas também no banco)
--  * só durante o período de matrículas do semestre
--  * máximo de 60 alunos por disciplina
--  * máximo de 4 obrigatórias e 2 optativas por aluno no semestre
-- ---------------------------------------------------------------------
create or replace function validar_matricula()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  v_semestre text;
  v_status   status_oferta;
  v_total    int;
  v_qtd      int;
  v_limite   int;
begin
  select c.semestre, o.status
    into v_semestre, v_status
    from ofertas o
    join curriculos c on c.id = o.curriculo_id
   where o.id = new.oferta_id;

  if not exists (
    select 1 from periodos_matricula p
     where p.semestre = v_semestre
       and not p.encerrado
       and now() between p.data_inicio and p.data_fim
  ) then
    raise exception 'O período de matrículas do semestre % não está aberto.', v_semestre;
  end if;

  -- cancelamento: basta o período estar aberto
  if new.status = 'CANCELADA' then
    return new;
  end if;

  if v_status <> 'ABERTA' then
    raise exception 'Esta disciplina não está aberta para matrículas.';
  end if;

  -- evita que duas matrículas simultâneas ultrapassem o limite de vagas
  perform pg_advisory_xact_lock(new.oferta_id);

  select count(*) into v_total
    from matriculas
   where oferta_id = new.oferta_id and status = 'ATIVA';

  if v_total >= 60 then
    raise exception 'As matrículas para esta disciplina estão encerradas (limite de 60 alunos).';
  end if;

  select count(*) into v_qtd
    from matriculas m
    join ofertas o    on o.id = m.oferta_id
    join curriculos c on c.id = o.curriculo_id
   where m.aluno_id = new.aluno_id
     and m.status = 'ATIVA'
     and m.tipo = new.tipo
     and c.semestre = v_semestre;

  v_limite := case new.tipo when 'OBRIGATORIA' then 4 else 2 end;

  if v_qtd >= v_limite then
    raise exception 'Limite de % disciplinas do tipo % atingido no semestre.', v_limite, new.tipo;
  end if;

  return new;
end;
$$;

create trigger trg_validar_matricula
  before insert or update on matriculas
  for each row execute function validar_matricula();

-- ---------------------------------------------------------------------
-- Sistema de cobranças: recebe a notificação e recalcula o valor
-- do semestre do aluno (disciplinas canceladas não são cobradas).
-- ---------------------------------------------------------------------
create or replace function registrar_cobranca(p_aluno_id uuid, p_semestre text)
returns cobrancas
language plpgsql security definer
set search_path = public
as $$
declare
  v_total    numeric(10, 2);
  v_cobranca cobrancas;
begin
  if auth.uid() is distinct from p_aluno_id
     and perfil_atual() is distinct from 'SECRETARIA' then
    raise exception 'Operação não permitida.';
  end if;

  select coalesce(sum(d.valor), 0) into v_total
    from matriculas m
    join ofertas o     on o.id = m.oferta_id
    join curriculos c  on c.id = o.curriculo_id
    join disciplinas d on d.id = o.disciplina_id
   where m.aluno_id = p_aluno_id
     and m.status = 'ATIVA'
     and o.status <> 'CANCELADA'
     and c.semestre = p_semestre;

  insert into cobrancas (aluno_id, semestre, valor_total, data_notificacao)
  values (p_aluno_id, p_semestre, v_total, now())
  on conflict (aluno_id, semestre)
  do update set valor_total = excluded.valor_total,
                data_notificacao = now()
  returning * into v_cobranca;

  return v_cobranca;
end;
$$;

revoke execute on function registrar_cobranca(uuid, text) from anon;
grant execute on function registrar_cobranca(uuid, text) to authenticated;

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table usuarios           enable row level security;
alter table cursos             enable row level security;
alter table alunos             enable row level security;
alter table disciplinas        enable row level security;
alter table curriculos         enable row level security;
alter table ofertas            enable row level security;
alter table periodos_matricula enable row level security;
alter table matriculas         enable row level security;
alter table cobrancas          enable row level security;

-- Leitura para usuários autenticados, escrita apenas pela secretaria
create policy "leitura autenticados" on usuarios for select to authenticated using (true);
create policy "secretaria gerencia"  on usuarios for all to authenticated
  using (perfil_atual() = 'SECRETARIA') with check (perfil_atual() = 'SECRETARIA');

create policy "leitura autenticados" on cursos for select to authenticated using (true);
create policy "secretaria gerencia"  on cursos for all to authenticated
  using (perfil_atual() = 'SECRETARIA') with check (perfil_atual() = 'SECRETARIA');

create policy "leitura autenticados" on alunos for select to authenticated using (true);
create policy "secretaria gerencia"  on alunos for all to authenticated
  using (perfil_atual() = 'SECRETARIA') with check (perfil_atual() = 'SECRETARIA');

create policy "leitura autenticados" on disciplinas for select to authenticated using (true);
create policy "secretaria gerencia"  on disciplinas for all to authenticated
  using (perfil_atual() = 'SECRETARIA') with check (perfil_atual() = 'SECRETARIA');

create policy "leitura autenticados" on curriculos for select to authenticated using (true);
create policy "secretaria gerencia"  on curriculos for all to authenticated
  using (perfil_atual() = 'SECRETARIA') with check (perfil_atual() = 'SECRETARIA');

create policy "leitura autenticados" on ofertas for select to authenticated using (true);
create policy "secretaria gerencia"  on ofertas for all to authenticated
  using (perfil_atual() = 'SECRETARIA') with check (perfil_atual() = 'SECRETARIA');

create policy "leitura autenticados" on periodos_matricula for select to authenticated using (true);
create policy "secretaria gerencia"  on periodos_matricula for all to authenticated
  using (perfil_atual() = 'SECRETARIA') with check (perfil_atual() = 'SECRETARIA');

-- Matrículas: o aluno vê as próprias, o professor vê as das suas ofertas
create policy "leitura matriculas" on matriculas for select to authenticated
  using (
    aluno_id = auth.uid()
    or perfil_atual() = 'SECRETARIA'
    or exists (select 1 from ofertas o
                where o.id = matriculas.oferta_id
                  and o.professor_id = auth.uid())
  );

create policy "aluno se matricula" on matriculas for insert to authenticated
  with check (aluno_id = auth.uid() and perfil_atual() = 'ALUNO');

create policy "aluno cancela" on matriculas for update to authenticated
  using (aluno_id = auth.uid() or perfil_atual() = 'SECRETARIA')
  with check (aluno_id = auth.uid() or perfil_atual() = 'SECRETARIA');

create policy "secretaria remove" on matriculas for delete to authenticated
  using (perfil_atual() = 'SECRETARIA');

-- No update o usuário só pode alterar a situação da matrícula
revoke update on matriculas from authenticated;
grant update (status, data_cancelamento) on matriculas to authenticated;

-- Cobranças: gravadas apenas pela função registrar_cobranca
create policy "leitura cobrancas" on cobrancas for select to authenticated
  using (aluno_id = auth.uid() or perfil_atual() = 'SECRETARIA');
