import * as readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';

// Aqui importar o banco e as tabelas depois
import { db } from './db/index.ts';
import { uf, cidade, noticia } from './db/schema.ts';
import { desc, asc, eq } from 'drizzle-orm';

async function main() {
  const rl = readline.createInterface({ input, output });

  while (true) {
    console.log(`
      ===== MENU =====
      0. Cadastrar Notícia
      1. Listar Notícias (Mais recentes primeiro)
      2. Listar Notícias (Mais antigas primeiro)
      3. Listar Notícias (Por Estado)
      4. Listar Agrupado
      5. Cadastrar UF
      6. Cadastrar Cidade
      7. Sair
    `);

    const opcao = await rl.question("Escolha uma opção: ");

    switch (opcao) {
      case '0':
        // Cadastrar notícia
        try {
          const titulo = await rl.question("Informe o Título: ");
          const conteudo = await rl.question("Insira o texto: ");

          // Listar cidades cadastradas
          const cidades = await db.select().from(cidade);

          if (cidades.length === 0) {
            console.log("Nenhuma cidade cadastrada. Cadastre uma cidade antes de adicionar notícias.");
            break;
          }

          console.log("\nCidades disponíveis:");
          cidades.forEach((c, index) => {
            console.log(`${index + 1}. ${c.nome}`);
          });

          const escolhaCidade = await rl.question("Selecione uma cidade (número): ");
          const indexCidade = parseInt(escolhaCidade) - 1;

          if (indexCidade < 0 || indexCidade >= cidades.length) {
            console.log("Cidade inválida!");
            break;
          }

          const cidadeSelecionada = cidades[indexCidade]!;

          await db.insert(noticia).values({
            titulo,
            conteudo,
            cidadeId: cidadeSelecionada.id,
          });

          console.log("✓ Notícia cadastrada com sucesso!");
        } catch (error) {
          console.error("Erro ao cadastrar notícia:", error);
        }
        break;

      case '1':
        // Listar notícias (mais recentes primeiro)
        try {
          const noticiasMaisRecentes = await db
            .select()
            .from(noticia)
            .orderBy(desc(noticia.data_criacao));

          if (noticiasMaisRecentes.length === 0) {
            console.log("Nenhuma notícia cadastrada.");
          } else {
            console.log("\n===== NOTÍCIAS (MAIS RECENTES PRIMEIRO) =====\n");
            noticiasMaisRecentes.forEach((n, index) => {
              console.log(`${index + 1}. ${n.titulo}`);
              console.log(`   Conteúdo: ${n.conteudo}`);
              console.log(`   Data: ${n.data_criacao}`);
              console.log(`   ---`);
            });
          }

          await rl.question("\n( z ) Voltar");
        } catch (error) {
          console.error("Erro ao listar notícias:", error);
        }
        break;

      case '2':
        // Listar notícias (mais antigas primeiro)
        try {
          const noticiasMaisAntigas = await db
            .select()
            .from(noticia)
            .orderBy(asc(noticia.data_criacao));

          if (noticiasMaisAntigas.length === 0) {
            console.log("Nenhuma notícia cadastrada.");
          } else {
            console.log("\n===== NOTÍCIAS (MAIS ANTIGAS PRIMEIRO) =====\n");
            noticiasMaisAntigas.forEach((n, index) => {
              console.log(`${index + 1}. ${n.titulo}`);
              console.log(`   Conteúdo: ${n.conteudo}`);
              console.log(`   Data: ${n.data_criacao}`);
              console.log(`   ---`);
            });
          }

          await rl.question("\n( z ) Voltar");
        } catch (error) {
          console.error("Erro ao listar notícias:", error);
        }
        break;

      case '3':
        // Listar notícias de um estado específico
        try {
          // Listar todos os estados (UF)
          const estados = await db.select().from(uf);

          if (estados.length === 0) {
            console.log("Nenhum estado cadastrado.");
            break;
          }

          console.log("\nEstados disponíveis:");
          estados.forEach((e, index) => {
            console.log(`${index + 1}. ${e.nome} (${e.sigla})`);
          });

          const escolhaEstado = await rl.question("Selecione um estado (número): ");
          const indexEstado = parseInt(escolhaEstado) - 1;

          if (indexEstado < 0 || indexEstado >= estados.length) {
            console.log("Estado inválido!");
            break;
          }

          const estadoSelecionado = estados[indexEstado]!;

          // Perguntar como ordenar
          console.log("\nComo deseja ordenar?");
          console.log("( a ) Ordenar por mais recentes");
          console.log("( b ) Ordenar por mais antigas");
          console.log("( z ) Voltar");
          
          const opcaoOrdenacao = await rl.question("Escolha uma opção: ");

          let noticiasEstado;

          if (opcaoOrdenacao === 'a') {
            // Mais recentes primeiro
            noticiasEstado = await db
              .select()
              .from(noticia)
              .innerJoin(cidade, eq(cidade.id, noticia.cidadeId))
              .where(eq(cidade.ufId, estadoSelecionado.id))
              .orderBy(desc(noticia.data_criacao));

            console.log(`\n===== NOTÍCIAS DE ${estadoSelecionado.nome.toUpperCase()} (MAIS RECENTES PRIMEIRO) =====\n`);
          } else if (opcaoOrdenacao === 'b') {
            // Mais antigas primeiro
            noticiasEstado = await db
              .select()
              .from(noticia)
              .innerJoin(cidade, eq(cidade.id, noticia.cidadeId))
              .where(eq(cidade.ufId, estadoSelecionado.id))
              .orderBy(asc(noticia.data_criacao));

            console.log(`\n===== NOTÍCIAS DE ${estadoSelecionado.nome.toUpperCase()} (MAIS ANTIGAS PRIMEIRO) =====\n`);
          } else if (opcaoOrdenacao === 'z') {
            break;
          } else {
            console.log("Opção inválida!");
            break;
          }

          if (noticiasEstado.length === 0) {
            console.log("Nenhuma notícia encontrada para este estado.");
          } else {
            noticiasEstado.forEach((item, index) => {
              console.log(`${index + 1}. ${item.noticia.titulo}`);
              console.log(`   Conteúdo: ${item.noticia.conteudo}`);
              console.log(`   Cidade: ${item.cidade.nome}`);
              console.log(`   Data: ${item.noticia.data_criacao}`);
              console.log(`   ---`);
            });
          }

          await rl.question("\n( z ) Voltar");
        } catch (error) {
          console.error("Erro ao listar notícias por estado:", error);
        }
        break;

      case '4':
        // Lógica de agrupamento usando 'join'
        try {
          // Buscar todas as notícias com suas cidades e estados
          const noticiasAgrupadas = await db
            .select()
            .from(noticia)
            .innerJoin(cidade, eq(cidade.id, noticia.cidadeId))
            .innerJoin(uf, eq(uf.id, cidade.ufId))
            .orderBy(uf.sigla, noticia.data_criacao);

          if (noticiasAgrupadas.length === 0) {
            console.log("Nenhuma notícia cadastrada.");
            break;
          }

          // Agrupar notícias por estado
          const noticiasPorEstado: { [key: string]: typeof noticiasAgrupadas } = {};
          noticiasAgrupadas.forEach((item) => {
            const ufSigla = item.uf.sigla;
            if (!noticiasPorEstado[ufSigla]) {
              noticiasPorEstado[ufSigla] = [];
            }
            noticiasPorEstado[ufSigla].push(item);
          });

          // Exibir notícias agrupadas
          console.log("\n--- LISTA AGRUPADA POR ESTADOS ---\n");
          let numeracao = 1;
          const noticiasMap = new Map<number, typeof noticiasAgrupadas[0]>(); // Para referência posterior

          Object.entries(noticiasPorEstado).forEach(([sigla, noticiasDoEstado]) => {
            console.log(`# ${sigla}`);
            noticiasDoEstado.forEach((item) => {
              console.log(`${numeracao} - ${item.noticia.titulo} - ${item.cidade.nome}`);
              noticiasMap.set(numeracao, item);
              numeracao++;
            });
            console.log("");
          });

          // Menu de opções
          while (true) {
            const opcaoDetalhes = await rl.question("(d) Detalhar notícia\n(z) Voltar\n\nEscolha uma opção: ");

            if (opcaoDetalhes === 'z') {
              break;
            } else if (opcaoDetalhes === 'd') {
              const numeroNoticia = await rl.question("Digite o número da notícia: ");
              const indexNoticia = parseInt(numeroNoticia);

              const noticiaDetalhada = noticiasMap.get(indexNoticia);
              if (noticiaDetalhada) {
                console.log(`\n=== DETALHES DA NOTÍCIA ===`);
                console.log(`Título: ${noticiaDetalhada.noticia.titulo}`);
                console.log(`Texto : ${noticiaDetalhada.noticia.conteudo}`);
                console.log(`Cidade: ${noticiaDetalhada.cidade.nome}`);
                console.log(`Estado: ${noticiaDetalhada.uf.nome} (${noticiaDetalhada.uf.sigla})`);
                console.log(`Data: ${noticiaDetalhada.noticia.data_criacao}`);
                console.log(`========================\n`);
              } else {
                console.log("Notícia não encontrada!");
              }
            } else {
              console.log("Opção inválida!");
            }
          }
        } catch (error) {
          console.error("Erro ao listar notícias agrupadas:", error);
        }
        break;
        
      case '5':
        // Cadastrar UF
        try {
          const nome = await rl.question("Informe o nome da UF: ");
          const sigla = await rl.question("Informe a sigla da UF: ");

          if (nome.trim() === "" || sigla.trim() === "") {
            console.log("Nome e sigla não podem estar vazios!");
            break;
          }

          await db.insert(uf).values({
            nome,
            sigla: sigla.toUpperCase(),
          });

          console.log("UF cadastrada com sucesso!");
        } catch (error) {
          console.error("Erro ao cadastrar UF:", error);
        }
        break;

      case '6':
        // Cadastrar Cidade
        try {
          const nomeCidade = await rl.question("Informe o nome da cidade: ");

          if (nomeCidade.trim() === "") {
            console.log("Nome da cidade não pode estar vazio!");
            break;
          }

          // Listar UFs disponíveis
          const estados = await db.select().from(uf);

          if (estados.length === 0) {
            console.log("Nenhuma UF cadastrada. Cadastre uma UF antes de adicionar cidades.");
            break;
          }

          console.log("\nUFs disponíveis:");
          estados.forEach((e, index) => {
            console.log(`${index + 1}. ${e.nome} (${e.sigla})`);
          });

          const escolhaUF = await rl.question("Selecione uma UF (número): ");
          const indexUF = parseInt(escolhaUF) - 1;

          if (indexUF < 0 || indexUF >= estados.length) {
            console.log("UF inválida!");
            break;
          }

          const ufSelecionada = estados[indexUF]!;

          await db.insert(cidade).values({
            nome: nomeCidade,
            ufId: ufSelecionada.id,
          });

          console.log("Cidade cadastrada com sucesso!");
        } catch (error) {
          console.error("Erro ao cadastrar cidade:", error);
        }
        break;

      

      case '7':
        console.log("Saindo do programa...");
        rl.close();
        return; // O 'return' quebra o while(true) e finaliza o programa

      default:
        console.log("Opção inválida. Tente novamente.");
    }
  }
}

main();