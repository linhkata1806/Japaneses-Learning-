CREATE TABLE `account_emails` (
	`email` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_account_emails_user` ON `account_emails` (`user_id`);--> statement-breakpoint
CREATE TABLE `account_identities` (
	`identity_id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_account_identities_user` ON `account_identities` (`user_id`);