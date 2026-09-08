CREATE TABLE `stack_sessions` (
	`user_id` text NOT NULL,
	`stack_id` text NOT NULL,
	`data` text NOT NULL,
	`revision` integer NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `stack_id`)
);
--> statement-breakpoint
CREATE TABLE `topic_feedback` (
	`user_id` text NOT NULL,
	`topic` text NOT NULL,
	`preference` text NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `topic`)
);
