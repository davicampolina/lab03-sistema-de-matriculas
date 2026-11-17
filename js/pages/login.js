import { AuthService } from '../services/AuthService.js';
import { mostrarAlerta, limparAlerta, comCarregamento } from '../utils/ui.js';

const form = document.getElementById('formLogin');
const botao = document.getElementById('btnEntrar');

// Se já existe sessão, vai direto para a página do perfil
const usuarioLogado = await AuthService.usuarioAtual().catch(() => null);
if (usuarioLogado) {
  window.location.replace(usuarioLogado.paginaInicial());
}

form.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  limparAlerta();

  if (!form.checkValidity()) {
    form.classList.add('was-validated');
    return;
  }

  const email = document.getElementById('email').value.trim();
  const senha = document.getElementById('senha').value;

  try {
    const usuario = await comCarregamento(botao, () => AuthService.login(email, senha));
    window.location.replace(usuario.paginaInicial());
  } catch (erro) {
    mostrarAlerta(erro.message);
  }
});
