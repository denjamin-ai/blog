ALTER TABLE `articles` ADD `author_id` text REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `users` ADD `is_blocked` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `commenting_blocked` integer DEFAULT 0 NOT NULL;