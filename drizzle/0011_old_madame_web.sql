ALTER TABLE `review_comments` ADD `anchor_type` text DEFAULT 'general';--> statement-breakpoint
ALTER TABLE `review_comments` ADD `anchor_data` text;--> statement-breakpoint
ALTER TABLE `review_comments` ADD `comment_type` text DEFAULT 'comment';--> statement-breakpoint
ALTER TABLE `review_comments` ADD `suggestion_text` text;--> statement-breakpoint
ALTER TABLE `review_comments` ADD `batch_id` text;--> statement-breakpoint
ALTER TABLE `review_comments` ADD `applied_at` integer;--> statement-breakpoint
CREATE INDEX `review_comments_session_batch_idx` ON `review_comments` (`session_id`,`batch_id`);