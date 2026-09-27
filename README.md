# CleanCheck Web

Aplicação web do projeto CleanCheck, uma aplicação de apoio à gestão de serviços de limpeza e acompanhamento de prestadores em alojamentos.

Este repositório destina-se ao frontend em React com TypeScript, que utiliza a API Laravel do projeto.

## Estado atual

Projeto em fase inicial de configuração e desenvolvimento.

Este README descreve a configuração prevista com Vite. Os passos de instalação pressupõem que o código inicial, o `package-lock.json` e o `.env.example` já foram adicionados ao repositório.

## Tecnologias

- React
- TypeScript
- Vite
- Node.js
- npm

Após a criação da aplicação, as dependências e os requisitos de versão encontram-se no ficheiro `package.json`. O ficheiro `package-lock.json` regista as versões utilizadas pelo projeto.

## Requisitos

Antes de começar, instala:

- Git
- Node.js numa versão LTS compatível com a versão de Vite do projeto
- npm, incluído na instalação do Node.js

A API Laravel deve estar em execução para utilizar as funcionalidades que dependem do backend. As versões exatas das ferramentas devem ser registadas quando o ambiente da equipa estiver definido.

## Instalação local

### 1. Clonar o repositório

```bash
git https://github.com/CodebyCS/cleancheck-web
cd cleancheck-web
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
VITE_API_URL=http://localhost:8000/api
```

A camada de comunicação com a API deverá ler `import.meta.env.VITE_API_URL`. Definir a variável não implementa, por si só, os pedidos à API.

O backend deve permitir a origem da aplicação web na configuração de CORS. A aplicação web comunica com a API e não acede diretamente à base de dados.

### 5. Iniciar o servidor local

```bash
npm run dev
```

Abre o endereço apresentado no terminal, normalmente:

```text
http://localhost:5173
```

Para parar o servidor, utiliza `Ctrl+C`.

## Estrutura principal

Estrutura prevista para a aplicação; as pastas devem ser criadas conforme necessário:

```text
public/            Ficheiros públicos estáticos
src/assets/        Imagens e outros recursos
src/components/    Componentes reutilizáveis
src/pages/         Páginas da aplicação
src/hooks/         Hooks reutilizáveis
src/services/      Comunicação com a API
src/types/         Tipos e interfaces TypeScript
src/utils/         Funções auxiliares
src/App.tsx        Componente principal
src/main.tsx       Ponto de entrada da aplicação
```

## Comandos úteis

Depois de gerar a aplicação com o modelo React + TypeScript do Vite, confirmar os scripts em `package.json`.

Listar os scripts disponíveis:

```bash
npm run
```

Verificar as regras de código:

```bash
npm run lint
```

Verificar os tipos e gerar a versão de produção, conforme o script de build do modelo:

```bash
npm run build
```

Pré-visualizar localmente a versão gerada:

```bash
npm run preview
```

O build gera a pasta `dist/`. A pré-visualização não substitui um servidor de produção. Os testes automatizados ainda precisam de ser configurados.

## Configuração e ficheiros locais

O ficheiro `.env.local` contém a configuração de cada instalação e deve estar incluído no `.gitignore`, sem ser enviado para o GitHub.

O `.env.example` deve conter apenas configurações de exemplo, sem passwords, chaves privadas ou outros dados sensíveis. As variáveis `VITE_*` são públicas no código enviado ao navegador.

As pastas `node_modules/` e `dist/` não são incluídas no repositório. As dependências são instaladas através de `npm ci`.

O ficheiro `package-lock.json` deve permanecer no repositório para manter as versões das dependências consistentes entre os elementos da equipa.

Após alterações ao `.env.local`, reinicia o servidor local.

## Contribuição

1. Atualiza a tua cópia da branch de integração definida pela equipa.
2. Cria uma branch para a alteração.
3. Implementa em TypeScript e verifica o funcionamento.
4. Envia a branch para o GitHub.
5. Abre um Pull Request para revisão antes de integrar na branch de destino.

A branch de integração deste repositório se chama `develop`, como indicado no projeto API. Consulta o [CONTRIBUTING.md](./CONTRIBUTING.md) para conhecer as convenções propostas.

Sempre que uma alteração modificar os passos de instalação ou configuração, este README deve ser atualizado.
