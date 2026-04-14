CREATE TABLE `article_votes` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`article_id` text NOT NULL,
	`value` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `article_votes_article_idx` ON `article_votes` (`article_id`);--> statement-breakpoint
CREATE INDEX `article_votes_user_article_idx` ON `article_votes` (`user_id`,`article_id`);--> statement-breakpoint
CREATE TABLE `bookmarks` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`article_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `bookmarks_user_idx` ON `bookmarks` (`user_id`);--> statement-breakpoint
CREATE INDEX `bookmarks_user_article_idx` ON `bookmarks` (`user_id`,`article_id`);--> statement-breakpoint
CREATE TABLE `comment_votes` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`comment_id` text NOT NULL,
	`value` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`comment_id`) REFERENCES `public_comments`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `comment_votes_comment_idx` ON `comment_votes` (`comment_id`);--> statement-breakpoint
CREATE INDEX `comment_votes_user_comment_idx` ON `comment_votes` (`user_id`,`comment_id`);--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`author_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `subscriptions_user_idx` ON `subscriptions` (`user_id`);--> statement-breakpoint
CREATE INDEX `subscriptions_user_author_idx` ON `subscriptions` (`user_id`,`author_id`);--> statement-breakpoint
ALTER TABLE `articles` ADD `view_count` integer DEFAULT 0 NOT NULL;