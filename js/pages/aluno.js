import { Perfil, TipoMatricula, StatusOferta } from '../models/enums.js';
import { Curso } from '../models/Curso.js';
import { Oferta } from '../models/Oferta.js';
import { Matricula } from '../models/Matricula.js';
import { PeriodoMatricula } from '../models/PeriodoMatricula.js';
import {
  protegerPagina, mostrarAlerta, limparAlerta, confirmar, comCarregamento,
  escapar, formatarMoeda, formatarData, linhaVazia, badgeStatusOferta
} from '../utils/ui.js';

const aluno = await protegerPagina(Perfil.ALUNO);

const $ = (id) => document.getElementById(id);

let periodo = null;
let ofertas = [];
let matriculas = [];

const TIPOS = {
  OBRIGATORIA: { texto: 'Obrigatória', classe: 'text-bg-primary' },
  OPTATIVA: { texto: 'Optativa', classe: 'text-bg-secondary' }
};

const periodoAberto = () => periodo?.estaAberto() ?? false;
const quantidade = (tipo) => matriculas.filter(m => m.tipo === tipo).length;

function renderizarPeriodo() {
  const info = $('infoPeriodo');
  if (!periodo) {
    info.innerHTML = '<span class="badge text-bg-secondary p-2">Nenhum período de matrículas cadastrado</span>';
    return;
  }

  const situacao = periodo.situacao();
  const textos = {
    Aberto: ['text-bg-success', `Matrículas ${periodo.semestre} abertas até ${formatarData(periodo.dataFim)}`],
    Agendado: ['text-bg-info', `Matrículas ${periodo.semestre} abrem em ${formatarData(periodo.dataInicio)}`],
    'Prazo finalizado': ['text-bg-warning', `Prazo de matrículas ${periodo.semestre} finalizado`],
    Encerrado: ['text-bg-secondary', `Período ${periodo.semestre} encerrado`]
  };
  const [classe, texto] = textos[situacao];
  info.innerHTML = `<span class="badge ${classe} p-2"><i class="bi bi-calendar-event me-1"></i>${escapar(texto)}</span>`;
}

function renderizarResumo() {
  $('qtdObrigatorias').textContent = quantidade(TipoMatricula.OBRIGATORIA);
  $('qtdOptativas').textContent = quantidade(TipoMatricula.OPTATIVA);

  const total = matriculas
    .filter(m => m.oferta.status !== StatusOferta.CANCELADA)
    .reduce((soma, m) => soma + m.oferta.disciplina.valor, 0);
  $('valorSemestre').textContent = formatarMoeda(total);
}

function renderizarMatriculas() {
  if (!matriculas.length) {
    $('tabelaMatriculas').innerHTML = linhaVazia(7, 'Você não possui matrículas neste semestre.');
    return;
  }

  $('tabelaMatriculas').innerHTML = matriculas.map(m => {
    const tipo = TIPOS[m.tipo];
    const podeCancelar = periodoAberto();
    return `
      <tr>
        <td><span class="badge text-bg-light">${escapar(m.oferta.disciplina.codigo)}</span></td>
        <td>${escapar(m.oferta.disciplina.nome)}</td>
        <td>${escapar(m.oferta.professor?.nome ?? 'A definir')}</td>
        <td><span class="badge ${tipo.classe}">${tipo.texto}</span></td>
        <td>${badgeStatusOferta(m.oferta.status)}</td>
        <td>${formatarMoeda(m.oferta.disciplina.valor)}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-danger" data-cancelar="${m.id}" ${podeCancelar ? '' : 'disabled'}>
            <i class="bi bi-x-circle me-1"></i>Cancelar
          </button>
        </td>
      </tr>`;
  }).join('');
}

function botaoMatricula(oferta, tipo, habilitado) {
  const limiteAtingido = tipo === TipoMatricula.OBRIGATORIA
    ? quantidade(tipo) >= Matricula.MAX_OBRIGATORIAS
    : quantidade(tipo) >= Matricula.MAX_OPTATIVAS;
  const ativo = habilitado && !limiteAtingido;
  const estilo = tipo === TipoMatricula.OBRIGATORIA ? 'btn-primary' : 'btn-outline-primary';
  return `
    <button class="btn btn-sm ${estilo}" data-matricular="${oferta.id}" data-tipo="${tipo}" ${ativo ? '' : 'disabled'}>
      ${TIPOS[tipo].texto}
    </button>`;
}

function renderizarOfertas() {
  const termo = $('filtroOfertas').value.trim().toLowerCase();
  const lista = ofertas.filter(o =>
    !termo ||
    o.disciplina.nome.toLowerCase().includes(termo) ||
    o.disciplina.codigo.toLowerCase().includes(termo));

  if (!lista.length) {
    $('tabelaOfertas').innerHTML = linhaVazia(7, periodo
      ? 'Nenhuma disciplina ofertada para o seu curso neste semestre.'
      : 'Aguarde a abertura do período de matrículas.');
    return;
  }

  const idsMatriculados = new Set(matriculas.map(m => m.oferta.id));

  $('tabelaOfertas').innerHTML = lista.map(o => {
    const vagas = o.vagasRestantes();
    const ocupacao = Math.round((o.totalMatriculados / Oferta.MAX_ALUNOS) * 100);
    const corBarra = vagas === 0 ? 'bg-danger' : ocupacao >= 80 ? 'bg-warning' : 'bg-success';

    let acoes;
    if (idsMatriculados.has(o.id)) {
      acoes = '<span class="badge text-bg-success"><i class="bi bi-check2 me-1"></i>Matriculado</span>';
    } else if (o.status !== StatusOferta.ABERTA) {
      acoes = badgeStatusOferta(o.status);
    } else if (vagas === 0) {
      acoes = '<span class="badge text-bg-danger">Inscrições encerradas</span>';
    } else {
      const habilitado = periodoAberto() && o.possuiVagas();
      acoes = `<div class="d-inline-flex gap-1">
        ${botaoMatricula(o, TipoMatricula.OBRIGATORIA, habilitado)}
        ${botaoMatricula(o, TipoMatricula.OPTATIVA, habilitado)}
      </div>`;
    }

    return `
      <tr>
        <td><span class="badge text-bg-light">${escapar(o.disciplina.codigo)}</span></td>
        <td>${escapar(o.disciplina.nome)}</td>
        <td>${escapar(o.professor?.nome ?? 'A definir')}</td>
        <td>${o.disciplina.creditos}</td>
        <td>${formatarMoeda(o.disciplina.valor)}</td>
        <td>
          <div class="small">${vagas} de ${Oferta.MAX_ALUNOS}</div>
          <div class="progress vagas-barra"><div class="progress-bar ${corBarra}" style="width: ${ocupacao}%"></div></div>
        </td>
        <td class="text-end">${acoes}</td>
      </tr>`;
  }).join('');
}

async function carregar() {
  periodo = await PeriodoMatricula.buscarAtual();
  renderizarPeriodo();

  if (periodo) {
    [ofertas, matriculas] = await Promise.all([
      aluno.listarOfertasDisponiveis(periodo.semestre),
      aluno.listarMatriculas(periodo.semestre)
    ]);
  }

  renderizarResumo();
  renderizarMatriculas();
  renderizarOfertas();
}

$('filtroOfertas').addEventListener('input', renderizarOfertas);

$('tabelaOfertas').addEventListener('click', async (e) => {
  const botao = e.target.closest('[data-matricular]');
  if (!botao) return;

  const oferta = ofertas.find(o => o.id === Number(botao.dataset.matricular));
  const tipo = botao.dataset.tipo;
  limparAlerta();

  try {
    await comCarregamento(botao, () => aluno.matricular(oferta, tipo));
    await carregar();
    mostrarAlerta(`Matrícula em ${oferta.disciplina.nome} (${TIPOS[tipo].texto.toLowerCase()}) realizada. O sistema de cobranças foi notificado.`, 'success');
  } catch (erro) {
    mostrarAlerta(erro.message);
    await carregar();
  }
});

$('tabelaMatriculas').addEventListener('click', async (e) => {
  const botao = e.target.closest('[data-cancelar]');
  if (!botao) return;

  const matricula = matriculas.find(m => m.id === Number(botao.dataset.cancelar));
  const confirmado = await confirmar(`Cancelar a matrícula em ${matricula.oferta.disciplina.nome}?`, 'Cancelar matrícula');
  if (!confirmado) return;
  limparAlerta();

  try {
    await comCarregamento(botao, () => aluno.cancelarMatricula(matricula));
    await carregar();
    mostrarAlerta('Matrícula cancelada. O sistema de cobranças foi notificado.', 'success');
  } catch (erro) {
    mostrarAlerta(erro.message);
  }
});

if (aluno) {
  try {
    const cursos = await Curso.listar();
    const curso = cursos.find(c => c.id === aluno.cursoId);
    $('infoAluno').textContent = `Matrícula ${aluno.matricula} · ${curso?.nome ?? ''}`;
    await carregar();
  } catch (erro) {
    mostrarAlerta(erro.message);
  }
}
