import { Perfil } from '../models/enums.js';
import { Curso } from '../models/Curso.js';
import { Disciplina } from '../models/Disciplina.js';
import { Curriculo } from '../models/Curriculo.js';
import { Oferta } from '../models/Oferta.js';
import { Professor } from '../models/Professor.js';
import { Aluno } from '../models/Aluno.js';
import { PeriodoMatricula } from '../models/PeriodoMatricula.js';
import { SistemaCobrancas } from '../services/SistemaCobrancas.js';
import {
  protegerPagina, mostrarAlerta, limparAlerta, confirmar, comCarregamento,
  escapar, formatarMoeda, formatarData, linhaVazia, preencherSelect, badgeStatusOferta
} from '../utils/ui.js';

const secretaria = await protegerPagina(Perfil.SECRETARIA);

const $ = (id) => document.getElementById(id);

const estado = {
  cursos: [],
  disciplinas: [],
  professores: [],
  alunos: [],
  curriculos: [],
  ofertas: [],
  periodos: []
};

const nomeCurso = (id) => estado.cursos.find(c => c.id === id)?.nome ?? '-';

// Executa uma ação mostrando sucesso ou erro no alerta da página
async function executar(acao, mensagemSucesso, botao = null) {
  limparAlerta();
  try {
    const resultado = botao ? await comCarregamento(botao, acao) : await acao();
    if (mensagemSucesso) mostrarAlerta(mensagemSucesso, 'success');
    return resultado;
  } catch (erro) {
    mostrarAlerta(erro.message);
    return null;
  }
}

function botoesAcoes(id, { editar = true } = {}) {
  return `
    <div class="btn-group btn-group-sm">
      ${editar ? `<button class="btn btn-outline-primary" data-acao="editar" data-id="${id}" title="Editar"><i class="bi bi-pencil"></i></button>` : ''}
      <button class="btn btn-outline-danger" data-acao="excluir" data-id="${id}" title="Excluir"><i class="bi bi-trash"></i></button>
    </div>`;
}

// ---------------------------------------------------------------------
// Cursos
// ---------------------------------------------------------------------
async function carregarCursos() {
  estado.cursos = await Curso.listar();

  $('tabelaCursos').innerHTML = estado.cursos.length
    ? estado.cursos.map(curso => `
        <tr>
          <td>${escapar(curso.nome)}</td>
          <td>${curso.creditos}</td>
          <td>${curso.disciplinas.length}</td>
          <td class="text-end">${botoesAcoes(curso.id)}</td>
        </tr>`).join('')
    : linhaVazia(4, 'Nenhum curso cadastrado.');

  const opcoes = { valor: c => c.id, texto: c => c.nome };
  preencherSelect($('disciplinaCurso'), estado.cursos, { ...opcoes, placeholder: 'Selecione...' });
  preencherSelect($('alunoCurso'), estado.cursos, { ...opcoes, placeholder: 'Selecione...' });
  preencherSelect($('curriculoCurso'), estado.cursos, { ...opcoes, placeholder: 'Selecione...' });

  const filtro = $('filtroDisciplinasCurso');
  const filtroAtual = filtro.value;
  preencherSelect(filtro, estado.cursos, { ...opcoes, placeholder: 'Todos os cursos' });
  filtro.value = filtroAtual;
}

function limparFormCurso() {
  $('formCurso').reset();
  $('cursoId').value = '';
  $('tituloFormCurso').textContent = 'Novo curso';
}

$('formCurso').addEventListener('reset', () => {
  $('cursoId').value = '';
  $('tituloFormCurso').textContent = 'Novo curso';
});

$('formCurso').addEventListener('submit', async (e) => {
  e.preventDefault();
  const curso = new Curso({
    id: Number($('cursoId').value) || null,
    nome: $('cursoNome').value.trim(),
    creditos: Number($('cursoCreditos').value)
  });
  const ok = await executar(() => curso.salvar(), 'Curso salvo com sucesso.', e.submitter);
  if (ok) {
    limparFormCurso();
    await carregarCursos();
  }
});

$('tabelaCursos').addEventListener('click', async (e) => {
  const botao = e.target.closest('[data-acao]');
  if (!botao) return;
  const curso = estado.cursos.find(c => c.id === Number(botao.dataset.id));

  if (botao.dataset.acao === 'editar') {
    $('cursoId').value = curso.id;
    $('cursoNome').value = curso.nome;
    $('cursoCreditos').value = curso.creditos;
    $('tituloFormCurso').textContent = 'Editar curso';
    $('cursoNome').focus();
    return;
  }

  if (await confirmar(`Excluir o curso "${curso.nome}" e todas as suas disciplinas?`, 'Excluir')) {
    const ok = await executar(() => curso.excluir().then(() => true), 'Curso excluído.');
    if (ok) await Promise.all([carregarCursos(), carregarDisciplinas(), carregarCurriculos()]);
  }
});

// ---------------------------------------------------------------------
// Disciplinas
// ---------------------------------------------------------------------
async function carregarDisciplinas() {
  estado.disciplinas = await Disciplina.listarPorCurso();
  renderizarDisciplinas();
}

function renderizarDisciplinas() {
  const cursoId = Number($('filtroDisciplinasCurso').value) || null;
  const lista = estado.disciplinas.filter(d => !cursoId || d.cursoId === cursoId);

  $('tabelaDisciplinas').innerHTML = lista.length
    ? lista.map(d => `
        <tr>
          <td><span class="badge text-bg-light">${escapar(d.codigo)}</span></td>
          <td>${escapar(d.nome)}</td>
          <td>${escapar(nomeCurso(d.cursoId))}</td>
          <td>${d.creditos}</td>
          <td>${formatarMoeda(d.valor)}</td>
          <td class="text-end">${botoesAcoes(d.id)}</td>
        </tr>`).join('')
    : linhaVazia(6, 'Nenhuma disciplina cadastrada.');
}

$('filtroDisciplinasCurso').addEventListener('change', renderizarDisciplinas);

$('formDisciplina').addEventListener('reset', () => {
  $('disciplinaId').value = '';
  $('tituloFormDisciplina').textContent = 'Nova disciplina';
});

$('formDisciplina').addEventListener('submit', async (e) => {
  e.preventDefault();
  const disciplina = new Disciplina({
    id: Number($('disciplinaId').value) || null,
    codigo: $('disciplinaCodigo').value.trim().toUpperCase(),
    nome: $('disciplinaNome').value.trim(),
    creditos: Number($('disciplinaCreditos').value),
    valor: Number($('disciplinaValor').value),
    cursoId: Number($('disciplinaCurso').value)
  });
  const ok = await executar(() => disciplina.salvar(), 'Disciplina salva com sucesso.', e.submitter);
  if (ok) {
    $('formDisciplina').reset();
    await Promise.all([carregarDisciplinas(), carregarCursos()]);
  }
});

$('tabelaDisciplinas').addEventListener('click', async (e) => {
  const botao = e.target.closest('[data-acao]');
  if (!botao) return;
  const disciplina = estado.disciplinas.find(d => d.id === Number(botao.dataset.id));

  if (botao.dataset.acao === 'editar') {
    $('disciplinaId').value = disciplina.id;
    $('disciplinaCurso').value = disciplina.cursoId;
    $('disciplinaCodigo').value = disciplina.codigo;
    $('disciplinaNome').value = disciplina.nome;
    $('disciplinaCreditos').value = disciplina.creditos;
    $('disciplinaValor').value = disciplina.valor;
    $('tituloFormDisciplina').textContent = 'Editar disciplina';
    $('disciplinaNome').focus();
    return;
  }

  if (await confirmar(`Excluir a disciplina "${disciplina.nome}"? As ofertas dela também serão removidas.`, 'Excluir')) {
    const ok = await executar(() => disciplina.excluir().then(() => true), 'Disciplina excluída.');
    if (ok) await Promise.all([carregarDisciplinas(), carregarCursos(), carregarOfertasCurriculo()]);
  }
});

// ---------------------------------------------------------------------
// Professores
// ---------------------------------------------------------------------
async function carregarProfessores() {
  estado.professores = await Professor.listar();

  $('tabelaProfessores').innerHTML = estado.professores.length
    ? estado.professores.map(p => `
        <tr>
          <td>${escapar(p.nome)}</td>
          <td>${escapar(p.email)}</td>
          <td class="text-end">${botoesAcoes(p.id, { editar: false })}</td>
        </tr>`).join('')
    : linhaVazia(3, 'Nenhum professor cadastrado.');

  preencherSelect($('ofertaProfessor'), estado.professores, {
    valor: p => p.id, texto: p => p.nome, placeholder: 'Selecione...'
  });
}

$('formProfessor').addEventListener('submit', async (e) => {
  e.preventDefault();
  const professor = new Professor({
    nome: $('professorNome').value.trim(),
    email: $('professorEmail').value.trim().toLowerCase()
  });
  const senha = $('professorSenha').value;
  const ok = await executar(() => secretaria.cadastrarProfessor(professor, senha),
    'Professor cadastrado com sucesso.', e.submitter);
  if (ok) {
    $('formProfessor').reset();
    await carregarProfessores();
  }
});

$('tabelaProfessores').addEventListener('click', async (e) => {
  const botao = e.target.closest('[data-acao="excluir"]');
  if (!botao) return;
  const professor = estado.professores.find(p => p.id === botao.dataset.id);
  if (await confirmar(`Remover o professor "${professor.nome}"? Ele perderá o acesso ao sistema.`, 'Remover')) {
    const ok = await executar(() => secretaria.removerUsuario(professor).then(() => true), 'Professor removido.');
    if (ok) await Promise.all([carregarProfessores(), carregarOfertasCurriculo()]);
  }
});

// ---------------------------------------------------------------------
// Alunos
// ---------------------------------------------------------------------
async function carregarAlunos() {
  estado.alunos = await Aluno.listar();

  $('tabelaAlunos').innerHTML = estado.alunos.length
    ? estado.alunos.map(a => `
        <tr>
          <td>${escapar(a.matricula)}</td>
          <td>${escapar(a.nome)}</td>
          <td>${escapar(a.email)}</td>
          <td>${escapar(nomeCurso(a.cursoId))}</td>
          <td class="text-end">${botoesAcoes(a.id, { editar: false })}</td>
        </tr>`).join('')
    : linhaVazia(5, 'Nenhum aluno cadastrado.');
}

$('formAluno').addEventListener('submit', async (e) => {
  e.preventDefault();
  const aluno = new Aluno({
    nome: $('alunoNome').value.trim(),
    email: $('alunoEmail').value.trim().toLowerCase(),
    matricula: $('alunoMatricula').value.trim(),
    cursoId: Number($('alunoCurso').value)
  });
  const senha = $('alunoSenha').value;
  const ok = await executar(() => secretaria.cadastrarAluno(aluno, senha),
    'Aluno cadastrado com sucesso.', e.submitter);
  if (ok) {
    $('formAluno').reset();
    await carregarAlunos();
  }
});

$('tabelaAlunos').addEventListener('click', async (e) => {
  const botao = e.target.closest('[data-acao="excluir"]');
  if (!botao) return;
  const aluno = estado.alunos.find(a => a.id === botao.dataset.id);
  if (await confirmar(`Remover o aluno "${aluno.nome}"? Suas matrículas também serão removidas.`, 'Remover')) {
    const ok = await executar(() => secretaria.removerUsuario(aluno).then(() => true), 'Aluno removido.');
    if (ok) await carregarAlunos();
  }
});

// ---------------------------------------------------------------------
// Currículos e ofertas
// ---------------------------------------------------------------------
function curriculoSelecionado() {
  return estado.curriculos.find(c => c.id === Number($('selectCurriculo').value)) ?? null;
}

async function carregarCurriculos(idSelecionado = null) {
  estado.curriculos = await Curriculo.listarPorSemestre();
  const select = $('selectCurriculo');
  const atual = idSelecionado ?? select.value;

  preencherSelect(select, estado.curriculos, {
    valor: c => c.id,
    texto: c => `${c.semestre} - ${nomeCurso(c.cursoId)}`
  });
  if (!estado.curriculos.length) {
    select.innerHTML = '<option value="">Nenhum currículo gerado</option>';
  } else if (atual && estado.curriculos.some(c => c.id === Number(atual))) {
    select.value = atual;
  }

  $('btnExcluirCurriculo').disabled = !estado.curriculos.length;
  await carregarOfertasCurriculo();
}

async function carregarOfertasCurriculo() {
  const curriculo = curriculoSelecionado();
  const disciplinasDoCurso = curriculo
    ? estado.disciplinas.filter(d => d.cursoId === curriculo.cursoId)
    : [];
  preencherSelect($('ofertaDisciplina'), disciplinasDoCurso, {
    valor: d => d.id, texto: d => `${d.codigo} - ${d.nome}`, placeholder: 'Selecione...'
  });

  if (!curriculo) {
    estado.ofertas = [];
    $('tabelaOfertasCurriculo').innerHTML = linhaVazia(6, 'Gere um currículo para ofertar disciplinas.');
    return;
  }

  estado.ofertas = await curriculo.carregarOfertas();
  $('tabelaOfertasCurriculo').innerHTML = estado.ofertas.length
    ? estado.ofertas.map(o => `
        <tr>
          <td><span class="badge text-bg-light">${escapar(o.disciplina.codigo)}</span></td>
          <td>${escapar(o.disciplina.nome)}</td>
          <td>${escapar(o.professor?.nome ?? 'A definir')}</td>
          <td>${o.totalMatriculados} / ${Oferta.MAX_ALUNOS}</td>
          <td>${badgeStatusOferta(o.status)}</td>
          <td class="text-end">${botoesAcoes(o.id, { editar: false })}</td>
        </tr>`).join('')
    : linhaVazia(6, 'Nenhuma disciplina ofertada neste currículo.');
}

$('selectCurriculo').addEventListener('change', () => executar(carregarOfertasCurriculo));

$('formCurriculo').addEventListener('submit', async (e) => {
  e.preventDefault();
  const curso = estado.cursos.find(c => c.id === Number($('curriculoCurso').value));
  const semestre = $('curriculoSemestre').value.trim();
  const curriculo = await executar(() => secretaria.gerarCurriculo(curso, semestre),
    `Currículo ${semestre} gerado para ${curso?.nome}.`, e.submitter);
  if (curriculo) {
    $('formCurriculo').reset();
    await carregarCurriculos(curriculo.id);
  }
});

$('formOferta').addEventListener('submit', async (e) => {
  e.preventDefault();
  const curriculo = curriculoSelecionado();
  if (!curriculo) {
    mostrarAlerta('Selecione um currículo.');
    return;
  }
  const disciplina = estado.disciplinas.find(d => d.id === Number($('ofertaDisciplina').value));
  const professor = estado.professores.find(p => p.id === $('ofertaProfessor').value);
  const ok = await executar(() => curriculo.adicionarOferta(disciplina, professor),
    'Disciplina adicionada ao currículo.', e.submitter);
  if (ok) {
    $('formOferta').reset();
    await carregarOfertasCurriculo();
  }
});

$('tabelaOfertasCurriculo').addEventListener('click', async (e) => {
  const botao = e.target.closest('[data-acao="excluir"]');
  if (!botao) return;
  const oferta = estado.ofertas.find(o => o.id === Number(botao.dataset.id));
  if (await confirmar(`Remover "${oferta.disciplina.nome}" do currículo? As matrículas nela serão apagadas.`, 'Remover')) {
    const ok = await executar(() => oferta.excluir().then(() => true), 'Oferta removida.');
    if (ok) await carregarOfertasCurriculo();
  }
});

$('btnExcluirCurriculo').addEventListener('click', async () => {
  const curriculo = curriculoSelecionado();
  if (!curriculo) return;
  if (await confirmar(`Excluir o currículo ${curriculo.semestre} de ${nomeCurso(curriculo.cursoId)}?`, 'Excluir')) {
    const ok = await executar(() => curriculo.excluir().then(() => true), 'Currículo excluído.');
    if (ok) await carregarCurriculos();
  }
});

// ---------------------------------------------------------------------
// Períodos de matrícula
// ---------------------------------------------------------------------
const CORES_PERIODO = {
  Aberto: 'bg-success',
  Agendado: 'bg-info',
  'Prazo finalizado': 'bg-warning text-dark',
  Encerrado: 'bg-secondary'
};

async function carregarPeriodos() {
  estado.periodos = await PeriodoMatricula.listar();

  $('tabelaPeriodos').innerHTML = estado.periodos.length
    ? estado.periodos.map(p => {
        const situacao = p.situacao();
        return `
          <tr>
            <td>${escapar(p.semestre)}</td>
            <td>${formatarData(p.dataInicio)}</td>
            <td>${formatarData(p.dataFim)}</td>
            <td><span class="badge ${CORES_PERIODO[situacao]}">${situacao}</span></td>
            <td class="text-end">
              ${p.encerrado ? '' : `<button class="btn btn-sm btn-outline-danger" data-acao="encerrar" data-id="${p.id}"><i class="bi bi-lock me-1"></i>Encerrar</button>`}
            </td>
          </tr>`;
      }).join('')
    : linhaVazia(5, 'Nenhum período cadastrado.');
}

$('formPeriodo').addEventListener('submit', async (e) => {
  e.preventDefault();
  const semestre = $('periodoSemestre').value.trim();
  const inicio = new Date($('periodoInicio').value);
  const fim = new Date($('periodoFim').value);
  const ok = await executar(() => secretaria.abrirPeriodoMatricula(semestre, inicio, fim),
    `Período de matrículas de ${semestre} cadastrado.`, e.submitter);
  if (ok) {
    $('formPeriodo').reset();
    await carregarPeriodos();
  }
});

$('tabelaPeriodos').addEventListener('click', async (e) => {
  const botao = e.target.closest('[data-acao="encerrar"]');
  if (!botao) return;
  const periodo = estado.periodos.find(p => p.id === Number(botao.dataset.id));
  const confirmado = await confirmar(
    `Encerrar o período de ${periodo.semestre}? Disciplinas com menos de ${Oferta.MIN_ALUNOS} alunos serão canceladas e não será mais possível alterar matrículas.`,
    'Encerrar período');
  if (!confirmado) return;

  const resultado = await executar(() => secretaria.encerrarPeriodoMatricula(periodo), null, botao);
  if (resultado) {
    mostrarAlerta(
      `Período ${periodo.semestre} encerrado: ${resultado.ativas.length} disciplina(s) ativa(s) e ${resultado.canceladas.length} cancelada(s).`,
      'success');
    await Promise.all([carregarPeriodos(), carregarOfertasCurriculo(), carregarCobrancas()]);
  }
});

// ---------------------------------------------------------------------
// Cobranças
// ---------------------------------------------------------------------
async function carregarCobrancas() {
  const cobrancas = await SistemaCobrancas.listar();
  $('tabelaCobrancas').innerHTML = cobrancas.length
    ? cobrancas.map(c => `
        <tr>
          <td>${escapar(c.nomeAluno)} <span class="text-muted small">(${escapar(c.matriculaAluno)})</span></td>
          <td>${escapar(c.semestre)}</td>
          <td>${formatarMoeda(c.valorTotal)}</td>
          <td>${formatarData(c.dataNotificacao)}</td>
        </tr>`).join('')
    : linhaVazia(4, 'Nenhuma notificação recebida.');
}

document.querySelector('[data-bs-target="#abaCobrancas"]')
  .addEventListener('shown.bs.tab', () => executar(carregarCobrancas));

// ---------------------------------------------------------------------
// Inicialização
// ---------------------------------------------------------------------
if (secretaria) {
  await executar(async () => {
    await carregarCursos();
    await Promise.all([carregarDisciplinas(), carregarProfessores(), carregarAlunos(), carregarPeriodos()]);
    await carregarCurriculos();
  });
}
