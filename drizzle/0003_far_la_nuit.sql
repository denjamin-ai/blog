ALTER TABLE `review_assignments` ADD `verdict` text;--> statement-breakpoint
ALTER TABLE `review_assignments` ADD `verdict_note` text;--> statement-breakpoint
ALTER TABLE `review_comments` ADD `resolved_at` integer;--> statement-breakpoint
ALTER TABLE `review_comments` ADD `resolved_by` text REFERENCES users(id);