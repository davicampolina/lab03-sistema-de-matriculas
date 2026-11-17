export class Cobranca {
  constructor({ id = null, alunoId = null, semestre = '', valorTotal = 0, dataNotificacao = null } = {}) {
    this.id = id;
    this.alunoId = alunoId;
    this.semestre = semestre;
    this.valorTotal = valorTotal;
    this.dataNotificacao = dataNotificacao ? new Date(dataNotificacao) : null;
  }

  static deLinha(linha) {
    return new Cobranca({
      id: linha.id,
      alunoId: linha.aluno_id,
      semestre: linha.semestre,
      valorTotal: Number(linha.valor_total),
      dataNotificacao: linha.data_notificacao
    });
  }
}
