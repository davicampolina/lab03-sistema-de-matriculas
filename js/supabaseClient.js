import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Cliente sem sessão persistida, usado pela secretaria para criar contas
// de alunos e professores sem perder o próprio login.
export function criarClienteCadastro() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storageKey: 'sm-cadastro'
    }
  });
}

const MENSAGENS = {
  'Invalid login credentials': 'E-mail ou senha inválidos.',
  'Email not confirmed': 'E-mail ainda não confirmado.',
  'User already registered': 'Já existe um usuário com este e-mail.'
};

export function traduzirErro(error) {
  if (!error) return null;
  if (MENSAGENS[error.message]) return new Error(MENSAGENS[error.message]);
  if (error.code === '23505') return new Error('Já existe um registro com estes dados.');
  if (error.code === '23503') return new Error('Este registro está sendo usado por outros dados e não pode ser removido.');
  if (error.code === '42501') return new Error('Você não tem permissão para esta operação.');
  return new Error(error.message || 'Erro inesperado.');
}

// Retorna os dados da resposta do Supabase ou lança o erro traduzido
export function verificar({ data, error }) {
  if (error) throw traduzirErro(error);
  return data;
}
