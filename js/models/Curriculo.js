import { supabase, verificar } from '../supabaseClient.js';
import { Oferta } from './Oferta.js';

export class Curriculo {
  constructor({ id = null, cursoId = null, semestre = '', ofertas = [] } = {}) {
    this.id = id;
    this.cursoId = cursoId;
    this.semestre = semestre;
    this.ofertas = ofertas;
  }

  async adicionarOferta(disciplina, professor) {
    if (disciplina.cursoId !== this.cursoId) {
      throw new Error('A disciplina não pertence ao curso deste currículo.');
    }
    const oferta = new Oferta({ curriculoId: this.id, semestre: this.semestre, disciplina, professor });
    await oferta.salvar();
    this.ofertas.push(oferta);
    return oferta;
  }

  async carregarOfertas() {
    this.ofertas = await Oferta.listarPorCurriculo(this.id);
    return this.ofertas;
  }

  async salvar() {
    const dados = { curso_id: this.cursoId, semestre: this.semestre };
    const consulta = this.id
      ? supabase.from('curriculos').update(dados).eq('id', this.id)
      : supabase.from('curriculos').insert(dados);
    const linha = verificar(await consulta.select().single());
    this.id = linha.id;
    return this;
  }

  async excluir() {
    verificar(await supabase.from('curriculos').delete().eq('id', this.id));
  }

  static async listarPorSemestre(semestre = null) {
    let consulta = supabase.from('curriculos').select('*').order('semestre', { ascending: false });
    if (semestre) consulta = consulta.eq('semestre', semestre);
    return verificar(await consulta).map(linha => new Curriculo({
      id: linha.id,
      cursoId: linha.curso_id,
      semestre: linha.semestre
    }));
  }
}
