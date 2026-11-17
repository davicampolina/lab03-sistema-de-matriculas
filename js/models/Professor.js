import { Usuario } from './Usuario.js';
import { Perfil } from './enums.js';

export class Professor extends Usuario {
  constructor(dados = {}) {
    super({ ...dados, perfil: Perfil.PROFESSOR });
  }

  paginaInicial() {
    return 'professor.html';
  }

  async listarDisciplinas(semestre) {
    // TODO
  }

  async listarAlunosMatriculados(oferta) {
    // TODO
  }
}
