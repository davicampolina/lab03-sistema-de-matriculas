import { Usuario } from './Usuario.js';
import { Perfil } from './enums.js';

export class Secretaria extends Usuario {
  constructor(dados = {}) {
    super({ ...dados, perfil: Perfil.SECRETARIA });
  }

  paginaInicial() {
    return 'secretaria.html';
  }

  async gerarCurriculo(curso, semestre) {
    // TODO
  }

  async cadastrarAluno(aluno, senha) {
    // TODO
  }

  async cadastrarProfessor(professor, senha) {
    // TODO
  }

  async abrirPeriodoMatricula(semestre, inicio, fim) {
    // TODO
  }

  async encerrarPeriodoMatricula(periodo) {
    // TODO: ativar ofertas com 3+ alunos e cancelar as demais
  }
}
