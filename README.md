# VibeCoder CLI

Um aplicativo CLI para gerenciar notícias por estado usando TypeScript, Drizzle ORM e SQLite.

## 🚀 Instalação

```bash
git clone https://github.com/vqLobo/extensao-programacao-para-web.git
cd extensao-programacao-para-web
npm install
```

## 🔧 Configuração do Banco de Dados

Execute as migrações para criar as tabelas:

```bash
npx drizzle-kit push
```

## ▶️ Executando o programa

```bash
npx ts-node src/index.ts
```

## 📋 Menu de Opções

- **0** - Cadastrar Notícia
- **1** - Listar notícias (mais recentes primeiro)
- **2** - Listar notícias (mais antigas primeiro)
- **3** - Listar notícias de um estado específico
- **4** - Listar notícias agrupadas por estado
- **5** - Cadastrar UF
- **6** - Cadastrar Cidade
- **7** - Sair

## 📁 Estrutura do Projeto

```
VibeCoder/
├── src/
│   ├── index.ts          # Lógica principal do CLI
│   └── db/
│       ├── index.ts      # Configuração do Drizzle
│       └── schema.ts     # Definição das tabelas
├── drizzle.config.json   # Configuração do Drizzle Kit
├── tsconfig.json         # Configuração do TypeScript
├── package.json          # Dependências do projeto
├── .gitignore            # Arquivos a ignorar no Git
└── README.md            # Este arquivo
```

## 🛠️ Tecnologias Utilizadas

- **TypeScript** - Linguagem de programação tipada
- **Drizzle ORM** - ORM para banco de dados
- **SQLite** - Banco de dados
- **Node.js** - Runtime do JavaScript
- **ts-node** - Executor de TypeScript direto no Node.js

## 📝 Funcionalidades

### Cadastro
- Cadastrar Estados (UF) com nome e sigla
- Cadastrar Cidades vinculadas a um estado
- Cadastrar Notícias vinculadas a uma cidade

### Listagem
- Listar todas as notícias em ordem cronológica (recentes ou antigas)
- Filtrar notícias por estado com opção de ordenação
- Visualizar notícias agrupadas por estado com detalhes

### Detalhes
- Visualizar informações completas de uma notícia (título, conteúdo, cidade, estado e data)

## 📝 Licença

MIT

## 👨‍💻 Autor

Vinicius Lobo
