import { supabase, verificar } from '../supabaseClient.js';
import { Disciplina } from './Disciplina.js';

export class Curso {
  constructor({ id = null, nome = '', creditos = 0, disciplinas = [] } = {}) {
    this.id = id;
    this.nome = nome;
    this.creditos = creditos;
    this.disciplinas = disciplinas;
  }

  async salvar() {
    const dados = { nome: this.nome, creditos: this.creditos };
    const consulta = this.id
      ? supabase.from('cursos').update(dados).eq('id', this.id)
      : supabase.from('cursos').insert(dados);
    const linha = verificar(await consulta.select().single());
    this.id = linha.id;
    return this;
  }

  async excluir() {
    verificar(await supabase.from('cursos').delete().eq('id', this.id));
  }

  static async listar() {
    const linhas = verificar(await supabase
      .from('cursos')
      .select('*, disciplinas(*)')
      .order('nome'));
    return linhas.map(Curso.deLinha);
  }

  static deLinha(linha) {
    return new Curso({
      id: linha.id,
      nome: linha.nome,
      creditos: linha.creditos,
      disciplinas: (linha.disciplinas || []).map(Disciplina.deLinha)
    });
  }
}
