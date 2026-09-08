CREATE TABLE `exam_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`exam_id` text NOT NULL,
	`data` text NOT NULL,
	`revision` integer NOT NULL,
	`last_operation_id` text NOT NULL,
	`last_operation_hash` text NOT NULL,
	`started_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`submitted_at` integer
);
--> statement-breakpoint
CREATE INDEX `exam_attempts_user_updated` ON `exam_attempts` (`user_id`,`updated_at`);