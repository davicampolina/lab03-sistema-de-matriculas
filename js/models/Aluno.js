import { Usuario } from './Usuario.js';
import { Perfil } from './enums.js';

export class Aluno extends Usuario {
  constructor({ matricula = '', cursoId = null, ...dados } = {}) {
    super({ ...dados, perfil: Perfil.ALUNO });
    this.matricula = matricula;
    this.cursoId = cursoId;
  }

  async listarOfertasDisponiveis(semestre) {
    // TODO
  }

  async matricular(oferta, tipo) {
    // TODO: validar período, vagas e limite de 4 obrigatórias + 2 optativas
  }

  async cancelarMatricula(matricula) {
    // TODO
  }

  async listarMatriculas(semestre) {
    // TODO
  }
}
