import { supabase, criarClienteCadastro, traduzirErro, verificar } from '../supabaseClient.js';
import { Perfil } from '../models/enums.js';
import { Aluno } from '../models/Aluno.js';
import { Professor } from '../models/Professor.js';
import { Secretaria } from '../models/Secretaria.js';

export class AuthService {
  static async login(email, senha) {
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) throw traduzirErro(error);

    const usuario = await AuthService.usuarioAtual();
    if (!usuario) {
      await supabase.auth.signOut();
      throw new Error('Usuário sem perfil cadastrado no sistema. Procure a secretaria.');
    }
    return usuario;
  }

  static async logout() {
    await supabase.auth.signOut();
  }

  static async usuarioAtual() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const linha = verificar(await supabase
      .from('usuarios')
      .select('id, nome, email, perfil, alunos(matricula, curso_id)')
      .eq('id', session.user.id)
      .maybeSingle());

    return linha ? AuthService.criarUsuario(linha) : null;
  }

  // Cria a conta no Supabase Auth e devolve o id gerado
  static async criarConta(email, senha) {
    const cliente = criarClienteCadastro();
    const { data, error } = await cliente.auth.signUp({ email, password: senha });
    if (error) throw traduzirErro(error);
    if (!data.user || data.user.identities?.length === 0) {
      throw new Error('Já existe um usuário com este e-mail.');
    }
    return data.user.id;
  }

  static criarUsuario(linha) {
    const dados = { id: linha.id, nome: linha.nome, email: linha.email };
    switch (linha.perfil) {
      case Perfil.ALUNO: {
        const aluno = Array.isArray(linha.alunos) ? linha.alunos[0] : linha.alunos;
        return new Aluno({ ...dados, matricula: aluno?.matricula, cursoId: aluno?.curso_id });
      }
      case Perfil.PROFESSOR:
        return new Professor(dados);
      case Perfil.SECRETARIA:
        return new Secretaria(dados);
      default:
        return null;
    }
  }
}
