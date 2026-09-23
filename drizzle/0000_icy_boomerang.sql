CREATE TABLE `content_reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`content_id` text NOT NULL,
	`reviewer_id` text NOT NULL,
	`decision` text NOT NULL,
	`reason` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_content_reviews_content` ON `content_reviews` (`content_id`);--> statement-breakpoint
CREATE TABLE `documents` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`filename` text NOT NULL,
	`mime_type` text NOT NULL,
	`byte_size` integer NOT NULL,
	`storage_key` text NOT NULL,
	`status` text DEFAULT 'UPLOADED' NOT NULL,
	`visibility` text DEFAULT 'PRIVATE' NOT NULL,
	`share_token` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_documents_owner_created` ON `documents` (`owner_id`,`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_documents_share_token` ON `documents` (`share_token`);--> statement-breakpoint
CREATE TABLE `generated_contents` (
	`id` text PRIMARY KEY NOT NULL,
	`document_id` text NOT NULL,
	`owner_id` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`review_status` text DEFAULT 'NOT_SUBMITTED' NOT NULL,
	`payload_json` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_generated_document_version` ON `generated_contents` (`document_id`,`version`);--> statement-breakpoint
CREATE INDEX `idx_generated_review_status` ON `generated_contents` (`review_status`);--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`provider` text NOT NULL,
	`email` text NOT NULL,
	`display_name` text NOT NULL,
	`timezone` text DEFAULT 'Asia/Ho_Chi_Minh' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_profiles_email` ON `profiles` (`email`);--> statement-breakpoint
CREATE TABLE `question_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`question_id` text NOT NULL,
	`question_version` integer NOT NULL,
	`level` text NOT NULL,
	`selected_option` integer NOT NULL,
	`is_correct` integer NOT NULL,
	`mode` text DEFAULT 'PRACTICE' NOT NULL,
	`answered_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_question_attempts_user_date` ON `question_attempts` (`user_id`,`answered_at`);--> statement-breakpoint
CREATE INDEX `idx_question_attempts_user_question` ON `question_attempts` (`user_id`,`question_id`);--> statement-breakpoint
CREATE TABLE `study_plans` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`level` text NOT NULL,
	`days` integer NOT NULL,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`started_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_study_plans_user_status` ON `study_plans` (`user_id`,`status`);--> statement-breakpoint
CREATE TABLE `xp_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`source_type` text NOT NULL,
	`source_id` text NOT NULL,
	`amount` integer NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_xp_once_per_source` ON `xp_transactions` (`user_id`,`source_type`,`source_id`);