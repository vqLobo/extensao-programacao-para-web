import { relations, sql } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const uf = sqliteTable("uf", {
  id: integer("id_uf").primaryKey({ autoIncrement: true }),
  nome: text("nome_uf").notNull(),
  sigla: text("sigla_uf").notNull(),
});

export const cidade = sqliteTable("cidade", {
  id: integer("id_cidade").primaryKey({ autoIncrement: true }),
  nome: text("nome_cidade").notNull(),
  ufId: integer("uf_id").references(() => uf.id),
});

export const noticia = sqliteTable("noticia", {
  id: integer("id_noticia").primaryKey({ autoIncrement: true }),
  titulo: text("titulo_noticia").notNull(),
  conteudo: text("conteudo_noticia").notNull(),
  cidadeId: integer("id_cidade")
    .references(() => cidade.id)
    .notNull(),
  data_criacao: text("data_criacao")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(), // tem que usar "text" porque o sqlite não tem um tipo específico para data, como datetime por exemplo
});

export const tag = sqliteTable("tag", {
  id: integer("id_tag").primaryKey({ autoIncrement: true }),
  conteudo: text("conteudo_tag").notNull(),
});

export const noticiaTag = sqliteTable(
  "noticia_tag",
  {
    id: integer("id_noticia_tag").primaryKey({ autoIncrement: true }),
    noticiaId: integer("id_noticia")
      .references(() => noticia.id)
      .notNull(),
    tagId: integer("id_tag")
      .references(() => tag.id)
      .notNull(),
  },
  (table) => ({
    noticiaTagUnica: uniqueIndex("noticia_tag_unique_idx").on(
      table.noticiaId,
      table.tagId,
    ),
  }),
);

export const ufRelations = relations(uf, ({ many }) => ({
  cidades: many(cidade),
}));

export const cidadeRelations = relations(cidade, ({ one, many }) => ({
  uf: one(uf, {
    fields: [cidade.ufId],
    references: [uf.id],
  }),
  noticias: many(noticia),
}));

export const noticiaRelations = relations(noticia, ({ one, many }) => ({
  cidade: one(cidade, {
    fields: [noticia.cidadeId],
    references: [cidade.id],
  }),
  noticiaTags: many(noticiaTag),
}));

export const tagRelations = relations(tag, ({ many }) => ({
  noticiaTags: many(noticiaTag),
}));

export const noticiaTagRelations = relations(noticiaTag, ({ one }) => ({
  noticia: one(noticia, {
    fields: [noticiaTag.noticiaId],
    references: [noticia.id],
  }),
  tag: one(tag, {
    fields: [noticiaTag.tagId],
    references: [tag.id],
  }),
}));
