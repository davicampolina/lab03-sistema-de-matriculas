import { supabase, verificar } from '../supabaseClient.js';

export class PeriodoMatricula {
  constructor({ id = null, semestre = '', dataInicio = null, dataFim = null, encerrado = false } = {}) {
    this.id = id;
    this.semestre = semestre;
    this.dataInicio = dataInicio ? new Date(dataInicio) : null;
    this.dataFim = dataFim ? new Date(dataFim) : null;
    this.encerrado = encerrado;
  }

  estaAberto() {
    const agora = new Date();
    return !this.encerrado && agora >= this.dataInicio && agora <= this.dataFim;
  }

  situacao() {
    if (this.encerrado) return 'Encerrado';
    if (this.estaAberto()) return 'Aberto';
    return new Date() < this.dataInicio ? 'Agendado' : 'Prazo finalizado';
  }

  async salvar() {
    if (this.dataFim <= this.dataInicio) {
      throw new Error('A data de fim deve ser posterior à data de início.');
    }
    const dados = {
      semestre: this.semestre,
      data_inicio: this.dataInicio.toISOString(),
      data_fim: this.dataFim.toISOString(),
      encerrado: this.encerrado
    };
    const consulta = this.id
      ? supabase.from('periodos_matricula').update(dados).eq('id', this.id)
      : supabase.from('periodos_matricula').insert(dados);
    const linha = verificar(await consulta.select().single());
    this.id = linha.id;
    return this;
  }

  async encerrar() {
    verificar(await supabase
      .from('periodos_matricula')
      .update({ encerrado: true })
      .eq('id', this.id));
    this.encerrado = true;
  }

  static async listar() {
    const linhas = verificar(await supabase
      .from('periodos_matricula')
      .select('*')
      .order('data_inicio', { ascending: false }));
    return linhas.map(PeriodoMatricula.deLinha);
  }

  static async buscarPorSemestre(semestre) {
    const linha = verificar(await supabase
      .from('periodos_matricula')
      .select('*')
      .eq('semestre', semestre)
      .maybeSingle());
    return linha ? PeriodoMatricula.deLinha(linha) : null;
  }

  // Período aberto no momento ou, se não houver, o mais recente
  static async buscarAtual() {
    const periodos = await PeriodoMatricula.listar();
    return periodos.find(p => p.estaAberto()) ?? periodos[0] ?? null;
  }

  static deLinha(linha) {
    return new PeriodoMatricula({
      id: linha.id,
      semestre: linha.semestre,
      dataInicio: linha.data_inicio,
      dataFim: linha.data_fim,
      encerrado: linha.encerrado
    });
  }
}
