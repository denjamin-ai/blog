-- Шаг 1: Создать таблицу review_sessions
CREATE TABLE `review_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`article_id` text NOT NULL,
	`article_version_id` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`created_at` integer NOT NULL,
	`completed_at` integer,
	FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`article_version_id`) REFERENCES `article_versions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `review_sessions_article_idx` ON `review_sessions` (`article_id`);
--> statement-breakpoint

-- Шаг 2: Добавить session_id в review_assignments (nullable, будет backfill ниже)
ALTER TABLE `review_assignments` ADD `session_id` text REFERENCES review_sessions(id);
--> statement-breakpoint
CREATE INDEX `review_assignments_session_idx` ON `review_assignments` (`session_id`);
--> statement-breakpoint

-- Шаг 3: Backfill — создать одну сессию для каждой уникальной article_id
-- (берём первое назначение статьи как источник article_version_id и created_at)
INSERT INTO `review_sessions` (`id`, `article_id`, `article_version_id`, `status`, `created_at`)
SELECT lower(hex(randomblob(16))), ra.article_id, ra.article_version_id, 'open', ra.created_at
FROM `review_assignments` ra
INNER JOIN (
  SELECT article_id, MIN(id) AS first_id
  FROM `review_assignments`
  GROUP BY article_id
) f ON ra.id = f.first_id;
--> statement-breakpoint

-- Шаг 4: Backfill — привязать все назначения к созданной сессии
UPDATE `review_assignments`
SET `session_id` = (
  SELECT `id` FROM `review_sessions`
  WHERE `review_sessions`.`article_id` = `review_assignments`.`article_id`
  LIMIT 1
)
WHERE `session_id` IS NULL;
--> statement-breakpoint

-- Шаг 5: Пересоздать review_comments с nullable assignment_id и новым session_id
-- (backfill session_id через JOIN с review_assignments)
PRAGMA foreign_keys=OFF;
--> statement-breakpoint
CREATE TABLE `__new_review_comments` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text,
	`assignment_id` text,
	`author_id` text,
	`is_admin_comment` integer DEFAULT 0 NOT NULL,
	`content` text NOT NULL,
	`quoted_text` text,
	`quoted_anchor` text,
	`parent_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`resolved_at` integer,
	`resolved_by` text,
	FOREIGN KEY (`session_id`) REFERENCES `review_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`resolved_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_review_comments`("id", "session_id", "assignment_id", "author_id", "is_admin_comment", "content", "quoted_text", "quoted_anchor", "parent_id", "created_at", "updated_at", "resolved_at", "resolved_by")
SELECT rc.id, ra.session_id, rc.assignment_id, rc.author_id, rc.is_admin_comment, rc.content, rc.quoted_text, rc.quoted_anchor, rc.parent_id, rc.created_at, rc.updated_at, rc.resolved_at, rc.resolved_by
FROM `review_comments` rc
LEFT JOIN `review_assignments` ra ON rc.assignment_id = ra.id;
--> statement-breakpoint
DROP TABLE `review_comments`;
--> statement-breakpoint
ALTER TABLE `__new_review_comments` RENAME TO `review_comments`;
--> statement-breakpoint
PRAGMA foreign_keys=ON;
--> statement-breakpoint
CREATE INDEX `review_comments_session_idx` ON `review_comments` (`session_id`);
