import * as readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import { asc, desc, eq } from 'drizzle-orm';

import { db } from './db/index.ts';
import { uf, cidade, noticia, tag, noticiaTag } from './db/schema.ts';

type NoticiaRegistro = typeof noticia.$inferSelect;

function normalizarTag(valor: string) {
  return valor.trim().replace(/\s+/g, ' ');
}

function extrairTagsInformadas(entrada: string) {
  const tagsUnicas = new Map<string, string>();

  for (const item of entrada.split(',')) {
    const tagNormalizada = normalizarTag(item);

    if (tagNormalizada === '') {
      continue;
    }

    const chaveTag = tagNormalizada.toLowerCase();
    if (!tagsUnicas.has(chaveTag)) {
      tagsUnicas.set(chaveTag, tagNormalizada);
    }
  }

  return [...tagsUnicas.values()];
}

function formatarTags(tagsDaNoticia: string[]) {
  return tagsDaNoticia.length > 0 ? tagsDaNoticia.join(', ') : 'Sem tags';
}

async function buscarTagsDaNoticia(noticiaId: number) {
  const tagsDaNoticia = await db
    .select({ conteudo: tag.conteudo })
    .from(noticiaTag)
    .innerJoin(tag, eq(tag.id, noticiaTag.tagId))
    .where(eq(noticiaTag.noticiaId, noticiaId))
    .orderBy(asc(tag.conteudo));

  return tagsDaNoticia.map((registro) => registro.conteudo);
}

async function obterOuCriarTags(nomesTags: string[]) {
  const tagsExistentes = await db.select().from(tag);
  const mapaTags = new Map<string, (typeof tagsExistentes)[number]>();

  for (const registro of tagsExistentes) {
    mapaTags.set(normalizarTag(registro.conteudo).toLowerCase(), registro);
  }

  const idsTags: number[] = [];

  for (const nomeTag of nomesTags) {
    const chaveTag = nomeTag.toLowerCase();
    const tagExistente = mapaTags.get(chaveTag);

    if (tagExistente) {
      idsTags.push(tagExistente.id);
      continue;
    }

    const [novaTag] = await db
      .insert(tag)
      .values({ conteudo: nomeTag })
      .returning({ id: tag.id, conteudo: tag.conteudo });

    if (!novaTag) {
      throw new Error('Nao foi possivel cadastrar a tag.');
    }

    mapaTags.set(chaveTag, novaTag);
    idsTags.push(novaTag.id);
  }

  return idsTags;
}

async function vincularTagsANoticia(noticiaId: number, idsTags: number[]) {
  if (idsTags.length === 0) {
    return;
  }

  await db.insert(noticiaTag).values(
    idsTags.map((tagId) => ({
      noticiaId,
      tagId,
    })),
  );
}

async function exibirNoticiaComTags(noticiaAtual: NoticiaRegistro, indice: number) {
  const tagsDaNoticia = await buscarTagsDaNoticia(noticiaAtual.id);

  console.log(`${indice + 1}. ${noticiaAtual.titulo}`);
  console.log(`   Conteudo: ${noticiaAtual.conteudo}`);
  console.log(`   Tags: ${formatarTags(tagsDaNoticia)}`);
  console.log(`   Data: ${noticiaAtual.data_criacao}`);
  console.log('   ---');
}

async function main() {
  const rl = readline.createInterface({ input, output });

  while (true) {
    console.log(`
      ===== MENU =====
      0. Cadastrar Noticia
      1. Listar Noticias (Mais recentes primeiro)
      2. Listar Noticias (Mais antigas primeiro)
      3. Listar Noticias (Por Estado)
      4. Listar Agrupado
      5. Cadastrar UF
      6. Cadastrar Cidade
      7. Sair
    `);

    const opcao = await rl.question('Escolha uma opcao: ');

    switch (opcao) {
      case '0':
        try {
          const titulo = await rl.question('Informe o Titulo: ');
          const conteudo = await rl.question('Insira o texto: ');

          const cidades = await db.select().from(cidade);
          if (cidades.length === 0) {
            console.log('Nenhuma cidade cadastrada. Cadastre uma cidade antes de adicionar noticias.');
            break;
          }

          console.log('\nCidades disponiveis:');
          cidades.forEach((registro, index) => {
            console.log(`${index + 1}. ${registro.nome}`);
          });

          const escolhaCidade = await rl.question('Selecione uma cidade (numero): ');
          const indexCidade = parseInt(escolhaCidade, 10) - 1;

          if (Number.isNaN(indexCidade) || indexCidade < 0 || indexCidade >= cidades.length) {
            console.log('Cidade invalida!');
            break;
          }

          const cidadeSelecionada = cidades[indexCidade]!;
          const entradaTags = await rl.question(
            'Informe as tags separadas por virgula (ou pressione Enter para nenhuma): ',
          );
          const nomesTags = extrairTagsInformadas(entradaTags);

          const [novaNoticia] = await db
            .insert(noticia)
            .values({
              titulo,
              conteudo,
              cidadeId: cidadeSelecionada.id,
            })
            .returning({ id: noticia.id });

          if (!novaNoticia) {
            throw new Error('Nao foi possivel cadastrar a noticia.');
          }

          const idsTags = await obterOuCriarTags(nomesTags);
          await vincularTagsANoticia(novaNoticia.id, idsTags);

          console.log('Noticia cadastrada com sucesso!');
          console.log(`Tags vinculadas: ${formatarTags(nomesTags)}`);
        } catch (error) {
          console.error('Erro ao cadastrar noticia:', error);
        }
        break;

      case '1':
        try {
          const noticiasMaisRecentes = await db
            .select()
            .from(noticia)
            .orderBy(desc(noticia.data_criacao));

          if (noticiasMaisRecentes.length === 0) {
            console.log('Nenhuma noticia cadastrada.');
          } else {
            console.log('\n===== NOTICIAS (MAIS RECENTES PRIMEIRO) =====\n');

            for (const [index, noticiaAtual] of noticiasMaisRecentes.entries()) {
              await exibirNoticiaComTags(noticiaAtual, index);
            }
          }

          await rl.question('\n( z ) Voltar');
        } catch (error) {
          console.error('Erro ao listar noticias:', error);
        }
        break;

      case '2':
        try {
          const noticiasMaisAntigas = await db
            .select()
            .from(noticia)
            .orderBy(asc(noticia.data_criacao));

          if (noticiasMaisAntigas.length === 0) {
            console.log('Nenhuma noticia cadastrada.');
          } else {
            console.log('\n===== NOTICIAS (MAIS ANTIGAS PRIMEIRO) =====\n');

            for (const [index, noticiaAtual] of noticiasMaisAntigas.entries()) {
              await exibirNoticiaComTags(noticiaAtual, index);
            }
          }

          await rl.question('\n( z ) Voltar');
        } catch (error) {
          console.error('Erro ao listar noticias:', error);
        }
        break;

      case '3':
        try {
          const estados = await db.select().from(uf);

          if (estados.length === 0) {
            console.log('Nenhum estado cadastrado.');
            break;
          }

          console.log('\nEstados disponiveis:');
          estados.forEach((registro, index) => {
            console.log(`${index + 1}. ${registro.nome} (${registro.sigla})`);
          });

          const escolhaEstado = await rl.question('Selecione um estado (numero): ');
          const indexEstado = parseInt(escolhaEstado, 10) - 1;

          if (Number.isNaN(indexEstado) || indexEstado < 0 || indexEstado >= estados.length) {
            console.log('Estado invalido!');
            break;
          }

          const estadoSelecionado = estados[indexEstado]!;

          console.log('\nComo deseja ordenar?');
          console.log('( a ) Ordenar por mais recentes');
          console.log('( b ) Ordenar por mais antigas');
          console.log('( z ) Voltar');

          const opcaoOrdenacao = await rl.question('Escolha uma opcao: ');
          if (opcaoOrdenacao === 'z') {
            break;
          }

          if (opcaoOrdenacao !== 'a' && opcaoOrdenacao !== 'b') {
            console.log('Opcao invalida!');
            break;
          }

          const ordemMaisRecente = opcaoOrdenacao === 'a';
          const noticiasEstado = await db
            .select()
            .from(noticia)
            .innerJoin(cidade, eq(cidade.id, noticia.cidadeId))
            .where(eq(cidade.ufId, estadoSelecionado.id))
            .orderBy(
              ordemMaisRecente
                ? desc(noticia.data_criacao)
                : asc(noticia.data_criacao),
            );

          console.log(
            `\n===== NOTICIAS DE ${estadoSelecionado.nome.toUpperCase()} (${
              ordemMaisRecente ? 'MAIS RECENTES PRIMEIRO' : 'MAIS ANTIGAS PRIMEIRO'
            }) =====\n`,
          );

          if (noticiasEstado.length === 0) {
            console.log('Nenhuma noticia encontrada para este estado.');
          } else {
            for (const [index, item] of noticiasEstado.entries()) {
              const tagsDaNoticia = await buscarTagsDaNoticia(item.noticia.id);

              console.log(`${index + 1}. ${item.noticia.titulo}`);
              console.log(`   Conteudo: ${item.noticia.conteudo}`);
              console.log(`   Cidade: ${item.cidade.nome}`);
              console.log(`   Tags: ${formatarTags(tagsDaNoticia)}`);
              console.log(`   Data: ${item.noticia.data_criacao}`);
              console.log('   ---');
            }
          }

          await rl.question('\n( z ) Voltar');
        } catch (error) {
          console.error('Erro ao listar noticias por estado:', error);
        }
        break;

      case '4':
        try {
          const noticiasAgrupadas = await db
            .select()
            .from(noticia)
            .innerJoin(cidade, eq(cidade.id, noticia.cidadeId))
            .innerJoin(uf, eq(uf.id, cidade.ufId))
            .orderBy(uf.sigla, noticia.data_criacao);

          if (noticiasAgrupadas.length === 0) {
            console.log('Nenhuma noticia cadastrada.');
            break;
          }

          const noticiasPorEstado: Record<string, typeof noticiasAgrupadas> = {};
          noticiasAgrupadas.forEach((item) => {
            const siglaUf = item.uf.sigla;
            if (!noticiasPorEstado[siglaUf]) {
              noticiasPorEstado[siglaUf] = [];
            }

            noticiasPorEstado[siglaUf].push(item);
          });

          console.log('\n--- LISTA AGRUPADA POR ESTADOS ---\n');

          let numeracao = 1;
          const noticiasMap = new Map<number, (typeof noticiasAgrupadas)[number]>();

          Object.entries(noticiasPorEstado).forEach(([sigla, noticiasDoEstado]) => {
            console.log(`# ${sigla}`);
            noticiasDoEstado.forEach((item) => {
              console.log(`${numeracao} - ${item.noticia.titulo} - ${item.cidade.nome}`);
              noticiasMap.set(numeracao, item);
              numeracao++;
            });
            console.log('');
          });

          while (true) {
            const opcaoDetalhes = await rl.question(
              '(d) Detalhar noticia\n(z) Voltar\n\nEscolha uma opcao: ',
            );

            if (opcaoDetalhes === 'z') {
              break;
            }

            if (opcaoDetalhes === 'd') {
              const numeroNoticia = await rl.question('Digite o numero da noticia: ');
              const indexNoticia = parseInt(numeroNoticia, 10);
              const noticiaDetalhada = noticiasMap.get(indexNoticia);

              if (!noticiaDetalhada) {
                console.log('Noticia nao encontrada!');
                continue;
              }

              const tagsDaNoticia = await buscarTagsDaNoticia(noticiaDetalhada.noticia.id);

              console.log('\n=== DETALHES DA NOTICIA ===');
              console.log(`Titulo: ${noticiaDetalhada.noticia.titulo}`);
              console.log(`Texto : ${noticiaDetalhada.noticia.conteudo}`);
              console.log(`Cidade: ${noticiaDetalhada.cidade.nome}`);
              console.log(`Estado: ${noticiaDetalhada.uf.nome} (${noticiaDetalhada.uf.sigla})`);
              console.log(`Tags: ${formatarTags(tagsDaNoticia)}`);
              console.log(`Data: ${noticiaDetalhada.noticia.data_criacao}`);
              console.log('========================\n');
            } else {
              console.log('Opcao invalida!');
            }
          }
        } catch (error) {
          console.error('Erro ao listar noticias agrupadas:', error);
        }
        break;

      case '5':
        try {
          const nome = await rl.question('Informe o nome da UF: ');
          const sigla = await rl.question('Informe a sigla da UF: ');

          if (nome.trim() === '' || sigla.trim() === '') {
            console.log('Nome e sigla nao podem estar vazios!');
            break;
          }

          await db.insert(uf).values({
            nome,
            sigla: sigla.toUpperCase(),
          });

          console.log('UF cadastrada com sucesso!');
        } catch (error) {
          console.error('Erro ao cadastrar UF:', error);
        }
        break;

      case '6':
        try {
          const nomeCidade = await rl.question('Informe o nome da cidade: ');

          if (nomeCidade.trim() === '') {
            console.log('Nome da cidade nao pode estar vazio!');
            break;
          }

          const estados = await db.select().from(uf);
          if (estados.length === 0) {
            console.log('Nenhuma UF cadastrada. Cadastre uma UF antes de adicionar cidades.');
            break;
          }

          console.log('\nUFs disponiveis:');
          estados.forEach((registro, index) => {
            console.log(`${index + 1}. ${registro.nome} (${registro.sigla})`);
          });

          const escolhaUF = await rl.question('Selecione uma UF (numero): ');
          const indexUF = parseInt(escolhaUF, 10) - 1;

          if (Number.isNaN(indexUF) || indexUF < 0 || indexUF >= estados.length) {
            console.log('UF invalida!');
            break;
          }

          const ufSelecionada = estados[indexUF]!;

          await db.insert(cidade).values({
            nome: nomeCidade,
            ufId: ufSelecionada.id,
          });

          console.log('Cidade cadastrada com sucesso!');
        } catch (error) {
          console.error('Erro ao cadastrar cidade:', error);
        }
        break;

      case '7':
        console.log('Saindo do programa...');
        rl.close();
        return;

      default:
        console.log('Opcao invalida. Tente novamente.');
    }
  }
}

main();
