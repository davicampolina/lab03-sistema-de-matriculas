import { supabase, verificar } from '../supabaseClient.js';
import { StatusMatricula } from './enums.js';
import { Oferta } from './Oferta.js';

export class Matricula {
  static MAX_OBRIGATORIAS = 4;
  static MAX_OPTATIVAS = 2;

  constructor({ id = null, alunoId = null, oferta = null, tipo = null, status = StatusMatricula.ATIVA, dataMatricula = null } = {}) {
    this.id = id;
    this.alunoId = alunoId;
    this.oferta = oferta;
    this.tipo = tipo;
    this.status = status;
    this.dataMatricula = dataMatricula ? new Date(dataMatricula) : null;
  }

  async salvar() {
    const linha = verificar(await supabase
      .from('matriculas')
      .insert({ aluno_id: this.alunoId, oferta_id: this.oferta.id, tipo: this.tipo })
      .select()
      .single());
    this.id = linha.id;
    this.status = linha.status;
    this.dataMatricula = new Date(linha.data_matricula);
    return this;
  }

  async cancelar() {
    verificar(await supabase
      .from('matriculas')
      .update({ status: StatusMatricula.CANCELADA, data_cancelamento: new Date().toISOString() })
      .eq('id', this.id));
    this.status = StatusMatricula.CANCELADA;
  }

  // Matrículas ativas do aluno; com semestre, filtra pelo semestre da oferta
  static async listarPorAluno(alunoId, semestre = null) {
    const linhas = verificar(await supabase
      .from('matriculas')
      .select('*')
      .eq('aluno_id', alunoId)
      .eq('status', StatusMatricula.ATIVA));

    const ofertas = await Oferta.listarPorIds(linhas.map(l => l.oferta_id));
    const ofertasPorId = new Map(ofertas.map(o => [o.id, o]));

    return linhas
      .map(linha => new Matricula({
        id: linha.id,
        alunoId: linha.aluno_id,
        oferta: ofertasPorId.get(linha.oferta_id),
        tipo: linha.tipo,
        status: linha.status,
        dataMatricula: linha.data_matricula
      }))
      .filter(m => m.oferta && (!semestre || m.oferta.semestre === semestre))
      .sort((a, b) => a.oferta.disciplina.codigo.localeCompare(b.oferta.disciplina.codigo));
  }
}
