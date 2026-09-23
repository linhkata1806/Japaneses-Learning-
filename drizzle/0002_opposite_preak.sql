CREATE TABLE `ai_generation_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`local_day` text NOT NULL,
	`status` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_ai_jobs_user_day_status` ON `ai_generation_jobs` (`user_id`,`local_day`,`status`);