export class Curso {
  constructor({ id = null, nome = '', creditos = 0, disciplinas = [] } = {}) {
    this.id = id;
    this.nome = nome;
    this.creditos = creditos;
    this.disciplinas = disciplinas;
  }

  async salvar() {
    // TODO
  }

  async excluir() {
    // TODO
  }

  static async listar() {
    // TODO
  }
}
