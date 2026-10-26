# CleanCheck Web

Aplicação web do projeto CleanCheck, uma aplicação de apoio à gestão de serviços de limpeza e acompanhamento de prestadores em alojamentos.

O frontend utiliza React com TypeScript e comunica com a API Laravel do projeto.

## Estado atual

 - Projeto em fase inicial de configuração e desenvolvimento.

 - Implementação inicial da integração com a API:

 - Verificação da ligação à API.

 - Apresentação dos estados de carregamento, sucesso e erro.

 - Login e logout através de sessão e cookies.

 - Consulta do utilizador autenticado e apresentação do respetivo perfil.


As permissões por perfil e as funcionalidades de negócio serão desenvolvidas nos passos seguintes.


## Tecnologias

- React
- TypeScript
- Vite
- Axios
- Node.js
- npm

Após a criação da aplicação, as dependências e os requisitos de versão encontram-se no ficheiro `package.json`. O ficheiro `package-lock.json` regista as versões utilizadas pelo projeto.

## Requisitos

- Git
- Node.js numa versão LTS compatível com a versão de Vite do projeto
- npm, incluído na instalação do Node.js
- API Laravel configurada e em execução
- Base de dados utilizada pela API em execução e com as migrações aplicadas.

A API Laravel deve estar em execução para utilizar as funcionalidades que dependem do backend. As versões exatas das ferramentas devem ser registadas quando o ambiente da equipa estiver definido.

## Instalação local

### 1. Clonar o repositório

```bash
git clone https://github.com/CodebyCS/cleancheck-web.git
cd cleancheck-web/frontend
```

### 2. Instalar as dependências

```bash
npm ci
```

Este comando utiliza o `package-lock.json` versionado. Na preparação inicial do projeto, executar `npm install` para gerar esse ficheiro, caso ainda não exista.

### 3. Criar o ficheiro de configuração

No Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

No Linux ou macOS:

```bash
cp .env.example .env.local
```

### 4. Configurar a ligação à API

Edita o ficheiro `.env.local` com o endereço da tua API local:

```dotenv
VITE_API_URL=http://localhost:8000
```

O endereço base não deve terminar em /api. Os pedidos acrescentam o caminho de cada operação, incluindo /api/health, /api/user e /login.

O cliente em src/api.ts lê import.meta.env.VITE_API_URL e está configurado para enviar cookies e o token CSRF nos pedidos.

Reinicia o Vite sempre que alterares .env.local.

### 5. Preparar e iniciar a API

No repositório cleancheck-api, dentro da pasta api/, segue o README desse projeto para preparar o ambiente, a base de dados e as contas fictícias.

Para a integração local, confirma que o .env da API contém:
```bash
SANCTUM_STATEFUL_DOMAINS=localhost:5173
```
A configuração de CORS da API deve permitir:

- Origem http://localhost:5173.
- Envio de credenciais.
- Caminhos api/*, sanctum/csrf-cookie, login e logout.

Depois de alterar a configuração da API, executa na pasta cleancheck-api/api:
```bash
php artisan config:clear
php artisan migrate
php artisan serve
```
Mantém o MySQL/MariaDB e a API em execução.


### 6. Iniciar o Frontend

```bash
npm run dev -- --port 5173 --strictPort
```

Abre o endereço apresentado no terminal, normalmente:

```text
http://localhost:5173
```

Para parar o servidor, utiliza `Ctrl+C`.

A opção --strictPort impede o Vite de mudar automaticamente de porta se a 5173 estiver ocupada. Nesse caso, termina o processo que a está a utilizar e volta a executar o comando.

Utiliza localhost no navegador, de acordo com a configuração de CORS e Sanctum.

## Autenticação e comunicação com a API

O frontend utiliza autenticação por sessão e cookies.

| Operação | Método e caminho |
| --- | --- |
| Verificar a ligação | `GET /api/health` |
| Obter o cookie CSRF | `GET /sanctum/csrf-cookie` |
| Iniciar sessão | `POST /login` |
| Consultar o utilizador autenticado | `GET /api/user` |
| Terminar sessão | `POST /logout` |

Antes do login, o frontend obtém o cookie CSRF. Depois de autenticar, apresenta os dados públicos do utilizador. Ao recarregar a página, consulta `/api/user` para recuperar a identidade associada à sessão.

O frontend não acede diretamente à base de dados.

## Estrutura principal

```text
cleancheck-web/
├── README.md
├── CONTRIBUTING.md
└── frontend/
    ├── public/
    ├── src/
    │   ├── api.ts
    │   ├── App.tsx
    │   ├── index.css
    │   └── main.tsx
    ├── .env.example
    ├── .env.local          # Configuração local, ignorada pelo Git
    ├── package.json
    ├── package-lock.json
    └── vite.config.ts
```

- `src/api.ts`: cliente Axios, tipo do utilizador e tratamento de mensagens de erro.
- `src/App.tsx`: diagnóstico da API e interface de autenticação.
- `src/index.css`: estilos globais.
- `src/main.tsx`: ponto de entrada da aplicação.

## Comandos úteis

Executa dentro de `frontend/`.

Verificar as regras de código:

```bash
npm run lint
```

Verificar os tipos TypeScript e gerar a versão de produção:

```bash
npm run build
```

Consultar vulnerabilidades conhecidas nas dependências:

```bash
npm audit
```

O build gera a pasta `frontend/dist/`.

Estes comandos não substituem os testes funcionais de ligação e autenticação.

## Verificação manual

Com a base de dados, a API e o frontend em execução:

1. Abre `http://localhost:5173`.
2. Carrega em **Verificar ligação** e confirma a resposta `CleanCheck: ok`.
3. Tenta iniciar sessão com uma password incorreta e confirma a mensagem de erro.
4. Inicia sessão com uma conta fictícia preparada na API.
5. Confirma que aparecem o nome, email e perfil do utilizador.
6. Recarrega a página e confirma que a sessão é recuperada.
7. Termina a sessão e confirma que o formulário de login volta a aparecer.
8. Desliga a API e carrega em **Verificar ligação**.
9. Confirma que o frontend apresenta uma mensagem de erro.
10. Volta a ligar a API e repete a verificação.

Esta lista descreve o procedimento de teste. Não constitui uma declaração de que os testes passaram.

## Resolução de problemas

### Não é possível contactar a API

Confirma:

- API em execução na porta `8000`.
- Existência de `frontend/.env.local`.
- Valor `VITE_API_URL=http://localhost:8000`.
- Reinício do Vite depois de alterar a configuração.
- Origem `http://localhost:5173` permitida no CORS da API.

### Erro de ligação ao MySQL

Se a API apresentar `SQLSTATE[HY000] [2002]`, confirma que o MySQL/MariaDB está ligado e que o host, porta e credenciais no `.env` da API estão corretos.

### Erro 419

Confirma a obtenção do cookie CSRF, o envio de cookies e a configuração do Sanctum. Utiliza `localhost` de forma consistente.

### Erro 401

Em `/api/user`, esta resposta é esperada quando ainda não existe uma sessão autenticada. Depois de um login válido, a consulta deve devolver os dados do utilizador.

### Erro 429

O limite de tentativas foi atingido. Aguarda antes de repetir o pedido.

## Configuração e ficheiros locais

- `.env.local` contém a configuração da máquina e deve ser ignorado pelo Git.
- `.env.example` deve ser versionado com valores de exemplo.
- As variáveis `VITE_*` são públicas no código enviado ao navegador; não coloques nelas passwords ou chaves privadas.
- `node_modules/` e `dist/` não devem ser versionados.
- `package-lock.json` deve permanecer no repositório.

## Contribuição

1. Atualiza a tua cópia da branch de integração definida pela equipa.
2. Cria uma branch para a alteração.
3. Implementa em TypeScript e verifica o funcionamento.
4. Envia a branch para o GitHub.
5. Abre um Pull Request para revisão antes de integrar na branch de destino.

A branch de integração deste repositório se chama `develop`, como indicado no projeto API. Consulta o [CONTRIBUTING.md](./CONTRIBUTING.md) para conhecer as convenções propostas.

Sempre que uma alteração modificar os passos de instalação ou configuração, este README deve ser atualizado.
