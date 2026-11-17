export class Curriculo {
  constructor({ id = null, cursoId = null, semestre = '', ofertas = [] } = {}) {
    this.id = id;
    this.cursoId = cursoId;
    this.semestre = semestre;
    this.ofertas = ofertas;
  }

  async adicionarOferta(disciplina, professor) {
    // TODO
  }

  async salvar() {
    // TODO
  }

  static async listarPorSemestre(semestre) {
    // TODO
  }
}
