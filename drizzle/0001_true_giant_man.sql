ALTER TABLE `question_attempts` ADD `local_day` text DEFAULT '' NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_question_attempts_user_local_day` ON `question_attempts` (`user_id`,`local_day`);