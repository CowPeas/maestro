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

// Threat Alerts table for real-time threat detection
export const threatAlerts = pgTable('threat_alerts', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  severity: varchar('severity', { length: 20 }).notNull(), // Critical, High, Medium, Low
  layer: varchar('layer', { length: 50 }).notNull(),
  source: varchar('source', { length: 50 }).notNull(), // auto-scan, manual, external
  status: varchar('status', { length: 20 }).notNull().default('Active'), // Active, Acknowledged, Resolved
  detectedAt: timestamp('detected_at').defaultNow().notNull(),
  acknowledgedAt: timestamp('acknowledged_at'),
  resolvedAt: timestamp('resolved_at'),
  metadata: text('metadata'), // JSON for additional data
  userId: integer('user_id').references(() => users.id).notNull(),
  relatedThreatId: integer('related_threat_id').references(() => threats.id),
});

// Detection Rules table for configurable threat detection
export const detectionRules = pgTable('detection_rules', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description').notNull(),
  pattern: text('pattern').notNull(), // Detection pattern/keywords
  severity: varchar('severity', { length: 20 }).notNull(),
  layer: varchar('layer', { length: 50 }).notNull(),
  isActive: integer('is_active').notNull().default(1), // 1 = active, 0 = inactive
  notifyEmail: integer('notify_email').notNull().default(1),
  notifyWebhook: integer('notify_webhook').notNull().default(0),
  webhookUrl: text('webhook_url'),
  userId: integer('user_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations for new tables
export const threatAlertsRelations = relations(threatAlerts, ({ one }) => ({
  user: one(users, {
    fields: [threatAlerts.userId],
    references: [users.id],
  }),
  relatedThreat: one(threats, {
    fields: [threatAlerts.relatedThreatId],
    references: [threats.id],
  }),
}));

export const detectionRulesRelations = relations(detectionRules, ({ one }) => ({
  user: one(users, {
    fields: [detectionRules.userId],
    references: [users.id],
  }),
}));

// Image Intelligence table for geolocation analysis
export const imageIntelligence = pgTable('image_intelligence', {
  id: serial('id').primaryKey(),
  imageUrl: text('image_url').notNull(),
  fileName: varchar('file_name', { length: 255 }),
  analysisType: varchar('analysis_type', { length: 50 }).notNull().default('geolocation'),
  location: text('location'), // Identified location/country/city
  coordinates: text('coordinates'), // Lat/long if identified
  landmarks: text('landmarks'), // JSON array of landmarks
  confidence: integer('confidence').notNull(), // 1-100
  environmentalContext: text('environmental_context'), // Weather, time of day, etc
  securityIndicators: text('security_indicators'), // JSON array of security concerns
  fullAnalysis: text('full_analysis').notNull(), // Complete AI response
  metadata: text('metadata'), // Additional metadata JSON
  userId: integer('user_id').references(() => users.id).notNull(),
  relatedThreatId: integer('related_threat_id').references(() => threats.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations for image intelligence
export const imageIntelligenceRelations = relations(imageIntelligence, ({ one }) => ({
  user: one(users, {
    fields: [imageIntelligence.userId],
    references: [users.id],
  }),
  relatedThreat: one(threats, {
    fields: [imageIntelligence.relatedThreatId],
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
export type ThreatPrediction = typeof threatPredictions.$inferSelect;
export type NewThreatPrediction = typeof threatPredictions.$inferInsert;
export type AnalyticsSnapshot = typeof analyticsSnapshots.$inferSelect;
export type NewAnalyticsSnapshot = typeof analyticsSnapshots.$inferInsert;
export type ThreatAlert = typeof threatAlerts.$inferSelect;
export type NewThreatAlert = typeof threatAlerts.$inferInsert;
export type DetectionRule = typeof detectionRules.$inferSelect;
export type NewDetectionRule = typeof detectionRules.$inferInsert;
export type ImageIntelligence = typeof imageIntelligence.$inferSelect;
export type NewImageIntelligence = typeof imageIntelligence.$inferInsert;
