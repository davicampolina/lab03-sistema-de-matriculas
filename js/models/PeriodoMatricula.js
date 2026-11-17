export class PeriodoMatricula {
  constructor({ id = null, semestre = '', dataInicio = null, dataFim = null, encerrado = false } = {}) {
    this.id = id;
    this.semestre = semestre;
    this.dataInicio = dataInicio;
    this.dataFim = dataFim;
    this.encerrado = encerrado;
  }

  estaAberto() {
    // TODO
  }

  async salvar() {
    // TODO
  }

  async encerrar() {
    // TODO
  }

  static async buscarAtual() {
    // TODO
  }
}
