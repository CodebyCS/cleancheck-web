# Tarefas e atribuição na web

## Implementado

A página **Tarefas** está disponível na navegação para Administrador e Supervisor. Consulta `GET /api/tasks` para a lista e `GET /api/tasks/{id}` ao selecionar uma tarefa. Mostra apenas os campos devolvidos por estes endpoints.

A seleção de prestador usa `GET /api/service-providers?active=1`. O formulário envia `service_provider_id` para `PATCH /api/tasks/{id}` através da sessão web e do cookie CSRF. Uma confirmação de sucesso só é apresentada quando a resposta do `PATCH` devolve o ID da tarefa e o ID do prestador selecionado. A lista e o detalhe são consultados novamente após a alteração.

A página apresenta carregamento, lista vazia, erro de rede e opção de tentar novamente. Uma resposta `401` regressa ao login; `403` indica falta de permissão; `404` indica tarefa indisponível; `422` mostra a mensagem de validação, incluindo prestador inativo ou regra de estado. Uma falha na atualização posterior não transforma uma atribuição já confirmada em falha de gravação.

## Limitação do contrato atual

Os endpoints `GET /api/tasks` e `GET /api/tasks/{id}` não incluem o responsável atual nem o histórico de atribuições. Por isso, a web mostra o prestador confirmado pela resposta do `PATCH` apenas no contexto dessa ação. Após recarregar a página, não apresenta um responsável nem um histórico presumidos.

### Proposta para acordar com a equipa

Manter as respostas atuais dos dois endpoints `GET` e definir uma consulta específica, por exemplo `GET /api/tasks/{id}/assignment`, autorizada apenas a Administrador e Supervisor. A resposta proposta inclui:

- `task_id`;
- `current_service_provider`: `id` e `name`, ou `null`;
- `history`: entradas ordenadas por data com prestador anterior, novo prestador, autor e `created_at`.

Confirmar nomes, permissões, ordenação e formato de erro com Guilherme e Carlos antes de implementar a consulta. A tabela de histórico já existe na API; esta proposta não altera a resposta atual da lista ou do detalhe.

## Validação

- `npm run lint`: passou.
- `npm run build`: passou.
- O teste E2E da página e a troca de acesso entre dois prestadores **não foram executados nesta validação**, porque a API local estava indisponível.

Para completar o teste integrado: entrar na web como Administrador ou Supervisor, atribuir uma tarefa pendente ao prestador A, confirmar que A vê a tarefa e B não; reatribuir a B, atualizar as listas e confirmar que A perde o acesso e B passa a abrir o detalhe. Registar os resultados no PR.

