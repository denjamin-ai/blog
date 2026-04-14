DROP INDEX `article_votes_user_article_idx`;--> statement-breakpoint
CREATE UNIQUE INDEX `article_votes_user_article_uidx` ON `article_votes` (`user_id`,`article_id`);--> statement-breakpoint
DROP INDEX `bookmarks_user_article_idx`;--> statement-breakpoint
CREATE UNIQUE INDEX `bookmarks_user_article_uidx` ON `bookmarks` (`user_id`,`article_id`);--> statement-breakpoint
DROP INDEX `comment_votes_user_comment_idx`;--> statement-breakpoint
CREATE UNIQUE INDEX `comment_votes_user_comment_uidx` ON `comment_votes` (`user_id`,`comment_id`);--> statement-breakpoint
DROP INDEX `subscriptions_user_author_idx`;--> statement-breakpoint
CREATE UNIQUE INDEX `subscriptions_user_author_uidx` ON `subscriptions` (`user_id`,`author_id`);