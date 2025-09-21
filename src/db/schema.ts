import { relations } from "drizzle-orm";
import { integer, pgEnum, serial, timestamp } from "drizzle-orm/pg-core";
import { pgTable, text } from "drizzle-orm/pg-core";

export const messageRole = pgEnum("message_role", [
  "user",
  "assistant",
  "system",
]);

export const chat = pgTable("chat", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const message = pgTable("message", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id")
    .references(() => chat.id, { onDelete: "cascade" })
    .notNull(),
  content: text("content").notNull(),
  role: messageRole("role").default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const doc = pgTable("doc", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id")
    .references(() => chat.id, { onDelete: "cascade" })
    .notNull(),

  collectionName: text("collection_name").notNull(),

  fileName: text("file_name").notNull(),
  mimeType: text("mime_type"),
  size: integer("size"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const chatRelations = relations(chat, ({ many }) => ({
  messages: many(message),
  docs: many(doc),
}));

export const messageRelations = relations(message, ({ one }) => ({
  message: one(chat, {
    fields: [message.chatId],
    references: [chat.id],
  }),
}));

export const docRelations = relations(doc, ({ one }) => ({
  doc: one(chat, {
    fields: [doc.chatId],
    references: [chat.id],
  }),
}));
