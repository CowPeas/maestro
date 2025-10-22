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

// Threat Predictions table for predictive analytics
export const threatPredictions = pgTable('threat_predictions', {
  id: serial('id').primaryKey(),
  predictedThreat: text('predicted_threat').notNull(),
  layer: varchar('layer', { length: 50 }).notNull(),
  confidence: integer('confidence').notNull(), // 1-100
  predictedLikelihood: integer('predicted_likelihood').notNull(), // 1-5
  predictedImpact: integer('predicted_impact').notNull(), // 1-5
  reasoning: text('reasoning').notNull(),
  recommendedActions: text('recommended_actions').notNull(), // JSON array
  basedOnThreatsCount: integer('based_on_threats_count').notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Analytics Snapshots table for tracking trends over time
export const analyticsSnapshots = pgTable('analytics_snapshots', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  totalThreats: integer('total_threats').notNull(),
  highRiskCount: integer('high_risk_count').notNull(),
  mediumRiskCount: integer('medium_risk_count').notNull(),
  lowRiskCount: integer('low_risk_count').notNull(),
  avgRiskScore: integer('avg_risk_score').notNull(), // Stored as int (multiply by 10)
  layerDistribution: text('layer_distribution').notNull(), // JSON object
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations for new tables
export const threatPredictionsRelations = relations(threatPredictions, ({ one }) => ({
  user: one(users, {
    fields: [threatPredictions.userId],
    references: [users.id],
  }),
}));

export const analyticsSnapshotsRelations = relations(analyticsSnapshots, ({ one }) => ({
  user: one(users, {
    fields: [analyticsSnapshots.userId],
    references: [users.id],
  }),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Threat = typeof threats.$inferSelect;
export type NewThreat = typeof threats.$inferInsert;
export type Mitigation = typeof mitigations.$inferSelect;
export type NewMitigation = typeof mitigations.$inferInsert;
export type ThreatPrediction = typeof threatPredictions.$inferSelect;
export type NewThreatPrediction = typeof threatPredictions.$inferInsert;
export type AnalyticsSnapshot = typeof analyticsSnapshots.$inferSelect;
export type NewAnalyticsSnapshot = typeof analyticsSnapshots.$inferInsert;
