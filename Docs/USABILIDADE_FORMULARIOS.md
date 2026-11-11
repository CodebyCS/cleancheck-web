# Revisão de usabilidade dos formulários (Sprint 4)

Revisão dos ecrãs de **Imóveis** e **Prestadores** (lista, detalhe e formulários de criação e edição) em diferentes dimensões, só com teclado e com textos extensos.

## Como foi feito

- Build da web com a API simulada e **dados fictícios**, incluindo textos longos:
  - nome do imóvel com 100 caracteres;
  - morada com mais de 90 caracteres;
  - instruções de acesso com cerca de 450 caracteres;
  - nome de prestador com 65 caracteres e e-mail com 80 caracteres.
- Três dimensões de ecrã: **computador** 1280 x 900, **tablet** 768 x 1024 e **telemóvel** 375 x 667 (iPhone SE).
- Navegação **só com teclado**: Tab, Shift+Tab, Enter e Esc.
- Resposta `422` da API simulada para verificar mensagens e foco depois de um erro.

## Cenários e resultados

| # | Cenário | Antes | Depois |
|---|---|---|---|
| 1 | Página em telemóvel (375 px) | O menu principal saía do ecrã: 125 px a mais na horizontal | Os itens passam para a linha seguinte; sem deslocamento horizontal |
| 2 | Editar ou desativar com detalhe longo | O painel de detalhe ficava fixo e mais alto do que o ecrã; os botões Editar e Desativar podiam ficar tapados | Fixo só no computador, com scroll próprio; no tablet e no telemóvel acompanha a página |
| 3 | Ler o cartão do imóvel | Morada e responsável na mesma linha, sem separação ("…GaiaResponsável:") | Cada informação na sua linha |
| 4 | Ler o detalhe com valores longos | Valores alinhados à direita numa coluna estreita, quase uma palavra por linha | Etiqueta por cima do valor, com a largura toda do painel; textos longos partem dentro da caixa |
| 5 | Escrever instruções de acesso longas | Campo de uma só linha; o texto ficava escondido | Campo de 4 linhas, que se pode esticar; as quebras de linha aparecem no detalhe |
| 6 | Abrir o formulário com teclado | O foco ficava no botão por trás do modal | O foco vai para o primeiro campo |
| 7 | Tab dentro do formulário | Depois de "Guardar" o foco saía para a página por trás | Tab e Shift+Tab ficam dentro do modal |
| 8 | Guardar com dados inválidos (422) | O foco perdia-se | O foco vai para o primeiro campo com erro; a mensagem aparece junto ao campo |
| 9 | Fechar com Esc | Fechava | Continua a fechar, exceto enquanto está a guardar; o foco volta ao botão que abriu o modal |
| 10 | Ordem do Tab no formulário de imóvel | Lógica | Sem alterações: Nome, Morada, Código postal, Localidade, Instruções, Prestador, Valor, Horas, Fuso, Cancelar, Guardar |
| 11 | Prestadores com nome e e-mail longos | Sem deslocamento no computador e no tablet | Também partem dentro do cartão no telemóvel |

Em todos os cenários, depois das correções: **sem deslocamento horizontal** nas três dimensões e **Editar acessível** com clique normal.

## Limitações

- Testado em Chromium. Firefox e Safari não foram testados.
- Não foi testado com leitor de ecrã real (NVDA, VoiceOver); só a ordem e o destino do foco.
- O formato das horas segue o idioma do browser (por exemplo 10:00 AM em inglês).
- Os testes usaram a API simulada; os dados reais podem ter casos não previstos.
- A secção de diagnóstico e a saudação no topo da página não fazem parte desta revisão.

## Reproduzir

1. `npm run dev` com a API a correr e os dados fictícios (`php artisan migrate --seed`).
2. Criar um imóvel com os textos longos acima.
3. Repetir os cenários 1 a 11 nas três dimensões (ferramentas de programador do browser, modo dispositivo) e só com teclado.
