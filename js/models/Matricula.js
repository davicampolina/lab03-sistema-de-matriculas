import { StatusMatricula } from './enums.js';

export class Matricula {
  static MAX_OBRIGATORIAS = 4;
  static MAX_OPTATIVAS = 2;

  constructor({ id = null, alunoId = null, oferta = null, tipo = null, status = StatusMatricula.ATIVA, dataMatricula = null } = {}) {
    this.id = id;
    this.alunoId = alunoId;
    this.oferta = oferta;
    this.tipo = tipo;
    this.status = status;
    this.dataMatricula = dataMatricula;
  }

  async salvar() {
    // TODO
  }

  async cancelar() {
    // TODO
  }
}
