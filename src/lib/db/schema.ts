import { pgTable, serial, text, varchar, integer, timestamp } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 50 }).notNull().default('Analyst'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Threats table
export const threats = pgTable('threats', {
  id: serial('id').primaryKey(),
  description: text('description').notNull(),
  classification: varchar('classification', { length: 10 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('Open'),
  layer: varchar('layer', { length: 50 }).notNull(),
  likelihood: integer('likelihood').notNull(),
  impact: integer('impact').notNull(),
  embedding: text('embedding'), // For vector embeddings
  userId: integer('user_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Mitigations table
export const mitigations = pgTable('mitigations', {
  id: serial('id').primaryKey(),
  threatId: integer('threat_id').references(() => threats.id).notNull(),
  description: text('description').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('Pending'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  threats: many(threats),
}));

export const threatsRelations = relations(threats, ({ one, many }) => ({
  user: one(users, {
    fields: [threats.userId],
    references: [users.id],
  }),
  mitigations: many(mitigations),
}));

export const mitigationsRelations = relations(mitigations, ({ one }) => ({
  threat: one(threats, {
    fields: [mitigations.threatId],
    references: [threats.id],
  }),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Threat = typeof threats.$inferSelect;
export type NewThreat = typeof threats.$inferInsert;
export type Mitigation = typeof mitigations.$inferSelect;
export type NewMitigation = typeof mitigations.$inferInsert;
