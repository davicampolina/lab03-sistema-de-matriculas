---

# 🎓 Sistema de Matrículas 👨‍💻

> [!NOTE]
> Sistema web para informatizar as matrículas de uma universidade: a secretaria monta o currículo do semestre, os alunos se matriculam nas disciplinas pela internet e os professores acompanham suas turmas.

Laboratório 03 da disciplina **Desenvolvimento de Interfaces Web (DIW)** — Engenharia de Software, PUC Minas.

---

## 📝 Sobre o Projeto

A universidade deseja informatizar seu sistema de matrículas. A secretaria gera o currículo de cada semestre e mantém as informações sobre cursos, disciplinas, professores e alunos. Durante o período de matrículas, os alunos escolhem até **4 disciplinas obrigatórias** (1ª opção) e **2 optativas**, podendo também cancelar matrículas feitas anteriormente.

Ao final do período, cada disciplina só fica **ativa** se tiver pelo menos **3 alunos** matriculados; caso contrário, é **cancelada**. Cada disciplina aceita no máximo **60 alunos**. Após a inscrição do aluno, o **sistema de cobranças** é notificado para que ele seja cobrado pelas disciplinas do semestre. Os professores consultam quais alunos estão matriculados em suas disciplinas e todos os usuários acessam o sistema com login e senha.

---

## 📋 Modelo de Análise

### Diagrama de Casos de Uso

<img src="https://www.plantuml.com/plantuml/proxy?cache=no&src=https://raw.githubusercontent.com/davicampolina/lab03-sistema-de-matriculas/main/docs/diagramas/v1/casos-de-uso.puml" alt="Diagrama de Casos de Uso">

Fonte: [`docs/diagramas/v1/casos-de-uso.puml`](docs/diagramas/v1/casos-de-uso.puml)

### Histórias de Usuário

#### Todos os usuários

**US01 – Efetuar login**
> Como **usuário do sistema** (aluno, professor ou secretaria), eu quero **entrar com meu e-mail e senha**, para **acessar somente as funcionalidades do meu perfil**.

Critérios de aceitação:
- O login é validado pelo Supabase Auth.
- Após o login, o usuário é direcionado para a página do seu perfil.
- Credenciais inválidas exibem uma mensagem de erro.
- O usuário pode sair do sistema (logout) a qualquer momento.

#### Aluno

**US02 – Matricular-se em disciplina**
> Como **aluno**, eu quero **me matricular nas disciplinas ofertadas no semestre**, escolhendo se cada uma é de 1ª opção (obrigatória) ou alternativa (optativa), para **montar minha grade do próximo semestre**.

Critérios de aceitação:
- A matrícula só é permitida durante um período de matrículas aberto.
- O aluno pode ter no máximo 4 matrículas obrigatórias e 2 optativas por semestre.
- Não é possível se matricular em uma disciplina que já atingiu 60 alunos.
- Não é possível se matricular duas vezes na mesma disciplina.

**US03 – Cancelar matrícula**
> Como **aluno**, eu quero **cancelar uma matrícula feita anteriormente**, para **ajustar minha grade enquanto o período de matrículas estiver aberto**.

Critérios de aceitação:
- O cancelamento só é permitido durante o período de matrículas.
- A vaga liberada volta a ficar disponível para outros alunos.

**US04 – Consultar minhas matrículas**
> Como **aluno**, eu quero **ver as disciplinas em que estou matriculado e o valor do semestre**, para **acompanhar minha grade e minha cobrança**.

**US05 – Notificar o sistema de cobranças**
> Como **aluno**, eu quero que **o sistema de cobranças seja avisado sempre que eu me inscrever ou cancelar uma disciplina**, para **ser cobrado corretamente pelas disciplinas do semestre**.

Critérios de aceitação:
- A cobrança do semestre é atualizada com a soma do valor das disciplinas em que o aluno está matriculado.

#### Professor

**US06 – Consultar alunos matriculados**
> Como **professor**, eu quero **ver a lista de alunos matriculados em cada disciplina que leciono**, para **me preparar para as turmas do semestre**.

Critérios de aceitação:
- O professor visualiza apenas as disciplinas que leciona.
- A lista mostra nome, matrícula e e-mail de cada aluno.

#### Secretaria

**US07 – Gerar currículo do semestre**
> Como **secretaria**, eu quero **gerar o currículo de cada semestre**, definindo quais disciplinas serão ofertadas e qual professor ministrará cada uma, para **disponibilizá-las para matrícula**.

**US08 – Manter cursos**
> Como **secretaria**, eu quero **cadastrar, editar e excluir cursos** (nome e número de créditos), para **manter o catálogo da universidade atualizado**.

**US09 – Manter disciplinas**
> Como **secretaria**, eu quero **cadastrar, editar e excluir disciplinas** de cada curso, para **compor os currículos semestrais**.

**US10 – Manter professores**
> Como **secretaria**, eu quero **cadastrar professores com login e senha**, para **que possam acessar o sistema**.

**US11 – Manter alunos**
> Como **secretaria**, eu quero **cadastrar alunos com matrícula, curso, login e senha**, para **que possam se matricular nas disciplinas**.

**US12 – Abrir período de matrículas**
> Como **secretaria**, eu quero **definir as datas de início e fim do período de matrículas de um semestre**, para **controlar quando os alunos podem se matricular ou cancelar matrículas**.

**US13 – Encerrar período de matrículas**
> Como **secretaria**, eu quero **encerrar o período de matrículas**, para que **as disciplinas com pelo menos 3 alunos fiquem ativas e as demais sejam canceladas**.

Critérios de aceitação:
- Disciplinas com 3 ou mais alunos passam para o status **ATIVA**.
- Disciplinas com menos de 3 alunos passam para o status **CANCELADA**.
- Após o encerramento, não é mais possível se matricular ou cancelar matrículas naquele semestre.

---

## 🧩 Projeto Estrutural

### Diagrama de Classes

<img src="https://www.plantuml.com/plantuml/proxy?cache=no&src=https://raw.githubusercontent.com/davicampolina/lab03-sistema-de-matriculas/main/docs/diagramas/v1/classes.puml" alt="Diagrama de Classes">

Fonte: [`docs/diagramas/v1/classes.puml`](docs/diagramas/v1/classes.puml)

---
