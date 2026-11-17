import { supabase, verificar } from '../supabaseClient.js';
import { Cobranca } from '../models/Cobranca.js';

// Integração com o sistema de cobranças da universidade.
// A notificação é recebida pela função registrar_cobranca no banco,
// que recalcula o valor do semestre do aluno.
export class SistemaCobrancas {
  static async notificar(aluno, semestre) {
    const linha = verificar(await supabase.rpc('registrar_cobranca', {
      p_aluno_id: aluno.id,
      p_semestre: semestre
    }));
    return Cobranca.deLinha(linha);
  }

  static async listar() {
    const linhas = verificar(await supabase
      .from('cobrancas')
      .select('*, alunos(matricula, usuarios(nome))')
      .order('data_notificacao', { ascending: false }));

    return linhas.map(linha => {
      const cobranca = Cobranca.deLinha(linha);
      cobranca.nomeAluno = linha.alunos?.usuarios?.nome ?? '-';
      cobranca.matriculaAluno = linha.alunos?.matricula ?? '-';
      return cobranca;
    });
  }
}
