import { supabase, verificar } from '../supabaseClient.js';
import { Usuario } from './Usuario.js';
import { Perfil } from './enums.js';
import { Oferta } from './Oferta.js';

export class Professor extends Usuario {
  constructor(dados = {}) {
    super({ ...dados, perfil: Perfil.PROFESSOR });
  }

  paginaInicial() {
    return 'professor.html';
  }

  async listarDisciplinas(semestre = null) {
    return Oferta.listarPorProfessor(this.id, semestre);
  }

  async listarAlunosMatriculados(oferta) {
    if (oferta.professor?.id !== this.id) {
      throw new Error('Esta disciplina não é lecionada por você.');
    }
    return oferta.listarAlunos();
  }

  static async listar() {
    const linhas = verificar(await supabase
      .from('usuarios')
      .select('id, nome, email')
      .eq('perfil', Perfil.PROFESSOR)
      .order('nome'));
    return linhas.map(linha => new Professor(linha));
  }
}
