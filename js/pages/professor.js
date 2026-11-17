import { Perfil } from '../models/enums.js';
import { Oferta } from '../models/Oferta.js';
import {
  protegerPagina, mostrarAlerta, escapar, badgeStatusOferta
} from '../utils/ui.js';

const professor = await protegerPagina(Perfil.PROFESSOR);

const $ = (id) => document.getElementById(id);

let ofertas = [];

function tabelaAlunos(alunos) {
  if (!alunos.length) {
    return '<p class="text-muted mb-0">Nenhum aluno matriculado nesta disciplina.</p>';
  }
  const linhas = alunos.map((aluno, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${escapar(aluno.matricula)}</td>
      <td>${escapar(aluno.nome)}</td>
      <td>${escapar(aluno.email)}</td>
      <td>${aluno.tipoMatricula === 'OBRIGATORIA' ? 'Obrigatória' : 'Optativa'}</td>
    </tr>`).join('');

  return `
    <div class="table-responsive">
      <table class="table table-sm table-striped align-middle mb-0">
        <thead><tr><th>#</th><th>Matrícula</th><th>Nome</th><th>E-mail</th><th>Tipo</th></tr></thead>
        <tbody>${linhas}</tbody>
      </table>
    </div>`;
}

async function renderizar() {
  const semestre = $('filtroSemestre').value;
  const lista = ofertas.filter(o => o.semestre === semestre);
  const container = $('listaDisciplinas');

  if (!lista.length) {
    container.innerHTML = `<div class="card"><div class="card-body text-center text-muted">
      Nenhuma disciplina atribuída a você${semestre ? ' neste semestre' : ''}.</div></div>`;
    return;
  }

  const alunosPorOferta = await Promise.all(lista.map(o => professor.listarAlunosMatriculados(o)));

  container.innerHTML = lista.map((oferta, i) => {
    const alunos = alunosPorOferta[i];
    return `
      <div class="accordion-item">
        <h2 class="accordion-header">
          <button class="accordion-button ${i === 0 ? '' : 'collapsed'}" type="button" data-bs-toggle="collapse" data-bs-target="#oferta${oferta.id}">
            <span class="badge text-bg-light me-2">${escapar(oferta.disciplina.codigo)}</span>
            <span class="me-auto">${escapar(oferta.disciplina.nome)}</span>
            <span class="me-3 small text-muted">${alunos.length} / ${Oferta.MAX_ALUNOS} alunos</span>
            ${badgeStatusOferta(oferta.status)}
          </button>
        </h2>
        <div id="oferta${oferta.id}" class="accordion-collapse collapse ${i === 0 ? 'show' : ''}" data-bs-parent="#listaDisciplinas">
          <div class="accordion-body">${tabelaAlunos(alunos)}</div>
        </div>
      </div>`;
  }).join('');
}

$('filtroSemestre').addEventListener('change', () => renderizar().catch(e => mostrarAlerta(e.message)));

if (professor) {
  try {
    ofertas = await professor.listarDisciplinas();
    const semestres = [...new Set(ofertas.map(o => o.semestre))].sort().reverse();
    $('filtroSemestre').innerHTML = semestres.length
      ? semestres.map(s => `<option value="${escapar(s)}">${escapar(s)}</option>`).join('')
      : '<option value="">-</option>';
    await renderizar();
  } catch (erro) {
    mostrarAlerta(erro.message);
  }
}
