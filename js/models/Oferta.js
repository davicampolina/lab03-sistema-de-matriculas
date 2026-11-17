import { supabase, verificar } from '../supabaseClient.js';
import { StatusOferta, StatusMatricula } from './enums.js';
import { Disciplina } from './Disciplina.js';
import { Professor } from './Professor.js';
import { Aluno } from './Aluno.js';

// Disciplina ofertada em um currículo semestral
export class Oferta {
  static MIN_ALUNOS = 3;
  static MAX_ALUNOS = 60;

  constructor({ id = null, curriculoId = null, semestre = '', disciplina = null, professor = null, status = StatusOferta.ABERTA, totalMatriculados = 0 } = {}) {
    this.id = id;
    this.curriculoId = curriculoId;
    this.semestre = semestre;
    this.disciplina = disciplina;
    this.professor = professor;
    this.status = status;
    this.totalMatriculados = totalMatriculados;
  }

  vagasRestantes() {
    return Math.max(0, Oferta.MAX_ALUNOS - this.totalMatriculados);
  }

  possuiVagas() {
    return this.status === StatusOferta.ABERTA && this.vagasRestantes() > 0;
  }

  // Regra aplicada ao final do período de matrículas
  verificarAtivacao() {
    return this.totalMatriculados >= Oferta.MIN_ALUNOS
      ? StatusOferta.ATIVA
      : StatusOferta.CANCELADA;
  }

  async listarAlunos() {
    const linhas = verificar(await supabase
      .from('matriculas')
      .select('tipo, alunos(id, matricula, curso_id, usuarios(nome, email))')
      .eq('oferta_id', this.id)
      .eq('status', StatusMatricula.ATIVA));

    return linhas
      .map(linha => {
        const aluno = new Aluno({
          id: linha.alunos.id,
          nome: linha.alunos.usuarios?.nome,
          email: linha.alunos.usuarios?.email,
          matricula: linha.alunos.matricula,
          cursoId: linha.alunos.curso_id
        });
        aluno.tipoMatricula = linha.tipo;
        return aluno;
      })
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }

  async salvar() {
    const dados = {
      curriculo_id: this.curriculoId,
      disciplina_id: this.disciplina.id,
      professor_id: this.professor?.id ?? null,
      status: this.status
    };
    const consulta = this.id
      ? supabase.from('ofertas').update(dados).eq('id', this.id)
      : supabase.from('ofertas').insert(dados);
    const linha = verificar(await consulta.select().single());
    this.id = linha.id;
    return this;
  }

  async excluir() {
    verificar(await supabase.from('ofertas').delete().eq('id', this.id));
  }

  static async listarPorCurriculo(curriculoId) {
    return Oferta.buscar(q => q.eq('curriculo_id', curriculoId));
  }

  static async listarPorSemestre(semestre, cursoId = null) {
    return Oferta.buscar(q => {
      q = q.eq('semestre', semestre);
      return cursoId ? q.eq('curso_id', cursoId) : q;
    });
  }

  static async listarPorProfessor(professorId, semestre = null) {
    return Oferta.buscar(q => {
      q = q.eq('professor_id', professorId);
      return semestre ? q.eq('semestre', semestre) : q;
    });
  }

  static async listarPorIds(ids) {
    if (!ids.length) return [];
    return Oferta.buscar(q => q.in('id', ids));
  }

  static async buscar(filtro) {
    const consulta = filtro(supabase.from('ofertas_detalhadas').select('*'));
    const linhas = verificar(await consulta.order('codigo'));
    return linhas.map(Oferta.deLinha);
  }

  static deLinha(linha) {
    return new Oferta({
      id: linha.id,
      curriculoId: linha.curriculo_id,
      semestre: linha.semestre,
      status: linha.status,
      totalMatriculados: linha.total_matriculados,
      disciplina: new Disciplina({
        id: linha.disciplina_id,
        codigo: linha.codigo,
        nome: linha.disciplina_nome,
        creditos: linha.creditos,
        valor: Number(linha.valor),
        cursoId: linha.curso_id
      }),
      professor: linha.professor_id
        ? new Professor({ id: linha.professor_id, nome: linha.professor_nome })
        : null
    });
  }
}
