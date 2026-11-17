import { supabase, verificar } from '../supabaseClient.js';
import { Usuario } from './Usuario.js';
import { Perfil, TipoMatricula } from './enums.js';
import { Oferta } from './Oferta.js';
import { Matricula } from './Matricula.js';
import { PeriodoMatricula } from './PeriodoMatricula.js';
import { SistemaCobrancas } from '../services/SistemaCobrancas.js';

export class Aluno extends Usuario {
  constructor({ matricula = '', cursoId = null, ...dados } = {}) {
    super({ ...dados, perfil: Perfil.ALUNO });
    this.matricula = matricula;
    this.cursoId = cursoId;
  }

  paginaInicial() {
    return 'aluno.html';
  }

  async listarOfertasDisponiveis(semestre) {
    return Oferta.listarPorSemestre(semestre, this.cursoId);
  }

  async matricular(oferta, tipo) {
    await this.#verificarPeriodo(oferta.semestre);

    if (!oferta.possuiVagas()) {
      throw new Error('As matrículas para esta disciplina estão encerradas.');
    }

    const matriculas = await this.listarMatriculas(oferta.semestre);
    if (matriculas.some(m => m.oferta.id === oferta.id)) {
      throw new Error('Você já está matriculado nesta disciplina.');
    }

    const limite = tipo === TipoMatricula.OBRIGATORIA
      ? Matricula.MAX_OBRIGATORIAS
      : Matricula.MAX_OPTATIVAS;
    const quantidade = matriculas.filter(m => m.tipo === tipo).length;
    if (quantidade >= limite) {
      const descricao = tipo === TipoMatricula.OBRIGATORIA ? 'obrigatórias' : 'optativas';
      throw new Error(`Você já atingiu o limite de ${limite} disciplinas ${descricao} no semestre.`);
    }

    const matricula = new Matricula({ alunoId: this.id, oferta, tipo });
    await matricula.salvar();
    await SistemaCobrancas.notificar(this, oferta.semestre);
    return matricula;
  }

  async cancelarMatricula(matricula) {
    await this.#verificarPeriodo(matricula.oferta.semestre);
    await matricula.cancelar();
    await SistemaCobrancas.notificar(this, matricula.oferta.semestre);
  }

  async listarMatriculas(semestre = null) {
    return Matricula.listarPorAluno(this.id, semestre);
  }

  static async listar() {
    const linhas = verificar(await supabase
      .from('alunos')
      .select('id, matricula, curso_id, usuarios(nome, email)')
      .order('matricula'));
    return linhas.map(linha => new Aluno({
      id: linha.id,
      nome: linha.usuarios?.nome,
      email: linha.usuarios?.email,
      matricula: linha.matricula,
      cursoId: linha.curso_id
    }));
  }

  async #verificarPeriodo(semestre) {
    const periodo = await PeriodoMatricula.buscarPorSemestre(semestre);
    if (!periodo?.estaAberto()) {
      throw new Error(`O período de matrículas do semestre ${semestre} não está aberto.`);
    }
  }
}
