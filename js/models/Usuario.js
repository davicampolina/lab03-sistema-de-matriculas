export class Usuario {
  constructor({ id = null, nome = '', email = '', perfil = null } = {}) {
    this.id = id;
    this.nome = nome;
    this.email = email;
    this.perfil = perfil;
  }

  static async login(email, senha) {
    // TODO: autenticar no Supabase Auth
  }

  static async logout() {
    // TODO
  }

  static async usuarioAtual() {
    // TODO: recuperar a sessão e o perfil do usuário logado
  }
}
