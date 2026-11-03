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

- Em 30/10/2026, o fluxo integrado na web passou com uma conta de Administrador e a tarefa fictícia #1: atribuição ao prestador de teste A, seguida de reatribuição ao prestador de teste B. A API devolveu ao A uma lista vazia e `404` no detalhe; o B passou a ver a tarefa na lista e a abrir o detalhe com `200`. Após recarregar a página, a sessão manteve-se e a interface não apresentou responsável atual ou histórico como se fossem dados persistidos.
- Em 02/11/2026, `npm run lint` e `npm run build` passaram após a correção do erro de detalhe. Na interface, um prestador temporariamente inativo deixou de aparecer no seletor; a tentativa de reatribuir uma tarefa temporariamente concluída apresentou o erro `422`; uma conta sem permissão recebeu `403`. Nenhum destes pedidos mostrou uma confirmação indevida de sucesso.
- Uma tarefa temporariamente indisponível provocou `404` no detalhe. Foi corrigida a apresentação da mensagem para continuar visível mesmo quando a lista fica vazia. Depois de restaurar a tarefa, **Tentar novamente** recuperou a lista e o detalhe e removeu o erro antigo.
- Com a API temporariamente desligada, a web mostrou erro de ligação e **Tentar novamente** sem falhar. Depois de religar a API, a atualização recuperou a tarefa.
- As alterações de teste na base de dados local foram revertidas: a tarefa fictícia #1 ficou `pending` e atribuída ao prestador #2, os dois prestadores ficaram ativos e a conta de Administrador recuperou o perfil original.

