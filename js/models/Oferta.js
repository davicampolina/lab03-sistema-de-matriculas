import { StatusOferta } from './enums.js';

export class Oferta {
  static MIN_ALUNOS = 3;
  static MAX_ALUNOS = 60;

  constructor({ id = null, curriculoId = null, disciplina = null, professor = null, status = StatusOferta.ABERTA, totalMatriculados = 0 } = {}) {
    this.id = id;
    this.curriculoId = curriculoId;
    this.disciplina = disciplina;
    this.professor = professor;
    this.status = status;
    this.totalMatriculados = totalMatriculados;
  }

  possuiVagas() {
    // TODO
  }

  vagasRestantes() {
    // TODO
  }

  verificarAtivacao() {
    // TODO
  }

  async salvar() {
    // TODO
  }

  async excluir() {
    // TODO
  }
}
