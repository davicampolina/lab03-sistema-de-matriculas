import { AuthService } from '../services/AuthService.js';

export function mostrarAlerta(mensagem, tipo = 'danger', idContainer = 'alerta') {
  const container = document.getElementById(idContainer);
  if (!container) return;
  container.innerHTML = `
    <div class="alert alert-${tipo} alert-dismissible fade show" role="alert">
      ${escapar(mensagem)}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
    </div>`;
  container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

export function limparAlerta(idContainer = 'alerta') {
  const container = document.getElementById(idContainer);
  if (container) container.innerHTML = '';
}

export function escapar(texto) {
  return String(texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatarData(data, comHora = true) {
  if (!data) return '-';
  const opcoes = comHora
    ? { dateStyle: 'short', timeStyle: 'short' }
    : { dateStyle: 'short' };
  return new Date(data).toLocaleString('pt-BR', opcoes);
}

export function linhaVazia(colunas, mensagem) {
  return `<tr class="tabela-vazia"><td colspan="${colunas}">${escapar(mensagem)}</td></tr>`;
}

export function preencherSelect(select, itens, { valor, texto, placeholder } = {}) {
  const opcoes = itens.map(item =>
    `<option value="${escapar(valor(item))}">${escapar(texto(item))}</option>`).join('');
  select.innerHTML = (placeholder ? `<option value="">${escapar(placeholder)}</option>` : '') + opcoes;
}

// Desabilita o botão enquanto a ação assíncrona executa
export async function comCarregamento(botao, acao) {
  const conteudo = botao.innerHTML;
  botao.disabled = true;
  botao.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Aguarde...';
  try {
    return await acao();
  } finally {
    botao.disabled = false;
    botao.innerHTML = conteudo;
  }
}

export function confirmar(mensagem, textoBotao = 'Confirmar') {
  return new Promise(resolve => {
    let elemento = document.getElementById('modalConfirmacao');
    if (!elemento) {
      document.body.insertAdjacentHTML('beforeend', `
        <div class="modal fade" id="modalConfirmacao" tabindex="-1" aria-hidden="true">
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">Confirmação</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
              </div>
              <div class="modal-body"></div>
              <div class="modal-footer">
                <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Voltar</button>
                <button type="button" class="btn btn-danger" data-confirmar></button>
              </div>
            </div>
          </div>
        </div>`);
      elemento = document.getElementById('modalConfirmacao');
    }

    const modal = bootstrap.Modal.getOrCreateInstance(elemento);
    const botao = elemento.querySelector('[data-confirmar]');
    elemento.querySelector('.modal-body').textContent = mensagem;
    botao.textContent = textoBotao;

    let confirmado = false;
    botao.onclick = () => { confirmado = true; modal.hide(); };
    elemento.addEventListener('hidden.bs.modal', () => resolve(confirmado), { once: true });
    modal.show();
  });
}

// Garante que só o perfil correto acesse a página e prepara a navbar
export async function protegerPagina(perfil) {
  const usuario = await AuthService.usuarioAtual();
  if (!usuario) {
    window.location.replace('index.html');
    return null;
  }
  if (usuario.perfil !== perfil) {
    window.location.replace(usuario.paginaInicial());
    return null;
  }

  const nome = document.getElementById('nomeUsuario');
  if (nome) nome.textContent = usuario.nome;

  document.getElementById('btnSair')?.addEventListener('click', async () => {
    await AuthService.logout();
    window.location.replace('index.html');
  });

  return usuario;
}
