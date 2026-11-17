export class Disciplina {
  constructor({ id = null, codigo = '', nome = '', creditos = 0, valor = 0, cursoId = null } = {}) {
    this.id = id;
    this.codigo = codigo;
    this.nome = nome;
    this.creditos = creditos;
    this.valor = valor;
    this.cursoId = cursoId;
  }

  async salvar() {
    // TODO
  }

  async excluir() {
    // TODO
  }

  static async listarPorCurso(cursoId) {
    // TODO
  }
}
