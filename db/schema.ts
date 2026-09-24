import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const profiles = sqliteTable("profiles", {
  id: text("id").primaryKey(),
  provider: text("provider").notNull(),
  email: text("email").notNull(),
  displayName: text("display_name").notNull(),
  timezone: text("timezone").notNull().default("Asia/Ho_Chi_Minh"),
  createdAt: text("created_at").notNull(),
}, (table) => [index("idx_profiles_email").on(table.email)]);

export const accountEmails = sqliteTable("account_emails", {
  email: text("email").primaryKey(),
  userId: text("user_id").notNull(),
}, (table) => [index("idx_account_emails_user").on(table.userId)]);

export const accountIdentities = sqliteTable("account_identities", {
  identityId: text("identity_id").primaryKey(),
  userId: text("user_id").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [index("idx_account_identities_user").on(table.userId)]);

export const authSessions = sqliteTable("auth_sessions", {
  tokenHash: text("token_hash").primaryKey(),
  userId: text("user_id").notNull(),
  email: text("email").notNull(),
  displayName: text("display_name").notNull(),
  avatarUrl: text("avatar_url"),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [index("idx_auth_sessions_expires").on(table.expiresAt)]);

export const studyPlans = sqliteTable("study_plans", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  level: text("level").notNull(),
  days: integer("days").notNull(),
  status: text("status").notNull().default("ACTIVE"),
  startedAt: text("started_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [index("idx_study_plans_user_status").on(table.userId, table.status)]);

export const questionAttempts = sqliteTable("question_attempts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  questionId: text("question_id").notNull(),
  questionVersion: integer("question_version").notNull(),
  level: text("level").notNull(),
  selectedOption: integer("selected_option").notNull(),
  isCorrect: integer("is_correct", { mode: "boolean" }).notNull(),
  mode: text("mode").notNull().default("PRACTICE"),
  answeredAt: text("answered_at").notNull(),
  localDay: text("local_day").notNull().default(""),
}, (table) => [
  index("idx_question_attempts_user_date").on(table.userId, table.answeredAt),
  index("idx_question_attempts_user_question").on(table.userId, table.questionId),
  index("idx_question_attempts_user_local_day").on(table.userId, table.localDay),
]);

export const documents = sqliteTable("documents", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull(),
  filename: text("filename").notNull(),
  mimeType: text("mime_type").notNull(),
  byteSize: integer("byte_size").notNull(),
  storageKey: text("storage_key").notNull(),
  status: text("status").notNull().default("UPLOADED"),
  visibility: text("visibility").notNull().default("PRIVATE"),
  shareToken: text("share_token"),
  createdAt: text("created_at").notNull(),
}, (table) => [
  index("idx_documents_owner_created").on(table.ownerId, table.createdAt),
  uniqueIndex("idx_documents_share_token").on(table.shareToken),
]);

export const generatedContents = sqliteTable("generated_contents", {
  id: text("id").primaryKey(),
  documentId: text("document_id").notNull(),
  ownerId: text("owner_id").notNull(),
  version: integer("version").notNull().default(1),
  status: text("status").notNull().default("DRAFT"),
  reviewStatus: text("review_status").notNull().default("NOT_SUBMITTED"),
  payloadJson: text("payload_json").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [
  index("idx_generated_document_version").on(table.documentId, table.version),
  index("idx_generated_review_status").on(table.reviewStatus),
]);

export const contentReviews = sqliteTable("content_reviews", {
  id: text("id").primaryKey(),
  contentId: text("content_id").notNull(),
  reviewerId: text("reviewer_id").notNull(),
  decision: text("decision").notNull(),
  reason: text("reason"),
  createdAt: text("created_at").notNull(),
}, (table) => [index("idx_content_reviews_content").on(table.contentId)]);

export const xpTransactions = sqliteTable("xp_transactions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  sourceType: text("source_type").notNull(),
  sourceId: text("source_id").notNull(),
  amount: integer("amount").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [
  uniqueIndex("idx_xp_once_per_source").on(table.userId, table.sourceType, table.sourceId),
]);

export const aiGenerationJobs = sqliteTable("ai_generation_jobs", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  localDay: text("local_day").notNull(),
  status: text("status").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [index("idx_ai_jobs_user_day_status").on(table.userId, table.localDay, table.status)]);
