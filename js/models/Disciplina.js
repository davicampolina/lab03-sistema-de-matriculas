import { supabase, verificar } from '../supabaseClient.js';

export class Disciplina {
  constructor({ id = null, codigo = '', nome = '', creditos = 0, valor = 0, cursoId = null } = {}) {
    this.id = id;
    this.codigo = codigo;
    this.nome = nome;
    this.creditos = creditos;
    this.valor = valor;
    this.cursoId = cursoId;
  }

  async salvar() {
    const dados = {
      codigo: this.codigo,
      nome: this.nome,
      creditos: this.creditos,
      valor: this.valor,
      curso_id: this.cursoId
    };
    const consulta = this.id
      ? supabase.from('disciplinas').update(dados).eq('id', this.id)
      : supabase.from('disciplinas').insert(dados);
    const linha = verificar(await consulta.select().single());
    this.id = linha.id;
    return this;
  }

  async excluir() {
    verificar(await supabase.from('disciplinas').delete().eq('id', this.id));
  }

  // Sem cursoId, lista as disciplinas de todos os cursos
  static async listarPorCurso(cursoId = null) {
    let consulta = supabase.from('disciplinas').select('*').order('codigo');
    if (cursoId) consulta = consulta.eq('curso_id', cursoId);
    return verificar(await consulta).map(Disciplina.deLinha);
  }

  static deLinha(linha) {
    return new Disciplina({
      id: linha.id,
      codigo: linha.codigo,
      nome: linha.nome,
      creditos: linha.creditos,
      valor: Number(linha.valor),
      cursoId: linha.curso_id
    });
  }
}
