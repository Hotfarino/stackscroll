CREATE TABLE `personal_stack_versions` (
	`stack_id` text NOT NULL,
	`version` integer NOT NULL,
	`user_id` text NOT NULL,
	`edition` text NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`stack_id`, `version`),
	FOREIGN KEY (`stack_id`) REFERENCES `personal_stacks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `personal_stacks` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`draft` text NOT NULL,
	`revision` integer NOT NULL,
	`active_version` integer,
	`last_operation_id` text NOT NULL,
	`last_operation_hash` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `personal_stacks_user_updated` ON `personal_stacks` (`user_id`,`updated_at`);--> statement-breakpoint
CREATE TABLE `stack_accounts` (
	`user_id` text PRIMARY KEY NOT NULL,
	`age_policy` text NOT NULL,
	`age_method` text NOT NULL,
	`attested_at` integer NOT NULL
);
