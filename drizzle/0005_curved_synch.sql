CREATE TABLE `review_checklists` (
	`id` text PRIMARY KEY NOT NULL,
	`assignment_id` text NOT NULL,
	`items` text DEFAULT '[]' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`assignment_id`) REFERENCES `review_assignments`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `profile` ADD `checklist_template` text;