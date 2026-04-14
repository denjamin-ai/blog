CREATE TABLE `article_changelog` (
	`id` text PRIMARY KEY NOT NULL,
	`article_id` text NOT NULL,
	`entry_date` integer NOT NULL,
	`section` text,
	`description` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`recipient_id` text,
	`is_admin_recipient` integer DEFAULT 0 NOT NULL,
	`type` text NOT NULL,
	`payload` text DEFAULT '{}' NOT NULL,
	`is_read` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`recipient_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `notifications_recipient_read_idx` ON `notifications` (`recipient_id`,`is_read`);--> statement-breakpoint
CREATE INDEX `notifications_admin_read_idx` ON `notifications` (`is_admin_recipient`,`is_read`);--> statement-breakpoint
CREATE TABLE `public_comments` (
	`id` text PRIMARY KEY NOT NULL,
	`article_id` text NOT NULL,
	`article_version_id` text NOT NULL,
	`author_id` text NOT NULL,
	`content` text NOT NULL,
	`parent_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`article_version_id`) REFERENCES `article_versions`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `public_comments_article_idx` ON `public_comments` (`article_id`);--> statement-breakpoint
CREATE INDEX `public_comments_author_idx` ON `public_comments` (`author_id`);--> statement-breakpoint
CREATE TABLE `review_assignments` (
	`id` text PRIMARY KEY NOT NULL,
	`article_id` text NOT NULL,
	`article_version_id` text NOT NULL,
	`reviewer_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`reviewer_note` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`article_version_id`) REFERENCES `article_versions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`reviewer_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `review_assignments_article_reviewer_idx` ON `review_assignments` (`article_id`,`reviewer_id`);--> statement-breakpoint
CREATE INDEX `review_assignments_reviewer_idx` ON `review_assignments` (`reviewer_id`);--> statement-breakpoint
CREATE TABLE `review_comments` (
	`id` text PRIMARY KEY NOT NULL,
	`assignment_id` text NOT NULL,
	`author_id` text,
	`is_admin_comment` integer DEFAULT 0 NOT NULL,
	`content` text NOT NULL,
	`quoted_text` text,
	`quoted_anchor` text,
	`parent_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`assignment_id`) REFERENCES `review_assignments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`password_hash` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);