import { supabase, verificar } from '../supabaseClient.js';
import { Usuario } from './Usuario.js';
import { Perfil, StatusOferta } from './enums.js';
import { Curriculo } from './Curriculo.js';
import { Oferta } from './Oferta.js';
import { PeriodoMatricula } from './PeriodoMatricula.js';
import { AuthService } from '../services/AuthService.js';
import { SistemaCobrancas } from '../services/SistemaCobrancas.js';

export class Secretaria extends Usuario {
  constructor(dados = {}) {
    super({ ...dados, perfil: Perfil.SECRETARIA });
  }

  paginaInicial() {
    return 'secretaria.html';
  }

  async gerarCurriculo(curso, semestre) {
    const curriculo = new Curriculo({ cursoId: curso.id, semestre });
    return curriculo.salvar();
  }

  async cadastrarAluno(aluno, senha) {
    aluno.id = await AuthService.criarConta(aluno.email, senha);
    await this.#inserirUsuario(aluno);
    verificar(await supabase.from('alunos').insert({
      id: aluno.id,
      matricula: aluno.matricula,
      curso_id: aluno.cursoId
    }));
    return aluno;
  }

  async cadastrarProfessor(professor, senha) {
    professor.id = await AuthService.criarConta(professor.email, senha);
    await this.#inserirUsuario(professor);
    return professor;
  }

  // Remove o perfil do usuário; sem perfil ele não acessa mais o sistema
  async removerUsuario(usuario) {
    verificar(await supabase.from('usuarios').delete().eq('id', usuario.id));
  }

  async abrirPeriodoMatricula(semestre, inicio, fim) {
    const periodo = new PeriodoMatricula({ semestre, dataInicio: inicio, dataFim: fim });
    return periodo.salvar();
  }

  // Disciplinas com pelo menos 3 alunos ficam ativas; as demais são canceladas
  async encerrarPeriodoMatricula(periodo) {
    const ofertas = await Oferta.listarPorSemestre(periodo.semestre);

    for (const oferta of ofertas) {
      oferta.status = oferta.verificarAtivacao();
      await oferta.salvar();
    }
    await periodo.encerrar();

    // Alunos de disciplinas canceladas têm a cobrança recalculada
    const canceladas = ofertas.filter(o => o.status === StatusOferta.CANCELADA);
    const alunosAfetados = new Map();
    for (const oferta of canceladas) {
      if (oferta.totalMatriculados === 0) continue;
      for (const aluno of await oferta.listarAlunos()) {
        alunosAfetados.set(aluno.id, aluno);
      }
    }
    for (const aluno of alunosAfetados.values()) {
      await SistemaCobrancas.notificar(aluno, periodo.semestre);
    }

    return {
      ativas: ofertas.filter(o => o.status === StatusOferta.ATIVA),
      canceladas
    };
  }

  async #inserirUsuario(usuario) {
    verificar(await supabase.from('usuarios').insert({
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil
    }));
  }
}
