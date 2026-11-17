export class Cobranca {
  constructor({ id = null, alunoId = null, semestre = '', valorTotal = 0, dataNotificacao = null } = {}) {
    this.id = id;
    this.alunoId = alunoId;
    this.semestre = semestre;
    this.valorTotal = valorTotal;
    this.dataNotificacao = dataNotificacao;
  }
}
