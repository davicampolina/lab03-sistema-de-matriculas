export class Usuario {
  constructor({ id = null, nome = '', email = '', perfil = null } = {}) {
    this.id = id;
    this.nome = nome;
    this.email = email;
    this.perfil = perfil;
  }

  paginaInicial() {
    return 'index.html';
  }
}
