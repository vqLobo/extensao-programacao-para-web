import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { datetime } from 'drizzle-orm/mysql-core';

export const uf = sqliteTable('uf', {
  id: integer('id_uf').primaryKey({ autoIncrement: true }),
  nome: text('nome_uf').notNull(),
  sigla: text('sigla_uf').notNull(),
});

export const cidade = sqliteTable('cidade', {
  id: integer('id_cidade').primaryKey({ autoIncrement: true }),
  nome: text('nome_cidade').notNull(),
  ufId: integer('uf_id').references(() => uf.id),
});

export const noticia = sqliteTable('noticia', {
  id: integer('id_noticia').primaryKey({ autoIncrement: true }),
  titulo: text('titulo_noticia').notNull(),
  conteudo: text('conteudo_noticia').notNull(),
  cidadeId: integer('id_cidade').references(() => cidade.id).notNull(),
  data_criacao: text('data_criacao').default(sql`CURRENT_TIMESTAMP`).notNull(), // tem que usar "text" porque o sqlite não tem um tipo específico para data, como datetime por exemplo
});