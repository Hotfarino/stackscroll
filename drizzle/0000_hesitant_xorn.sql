CREATE TABLE `content_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`video_id` text NOT NULL,
	`category` text NOT NULL,
	`details` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `reports_user_created` ON `content_reports` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `reports_status_created` ON `content_reports` (`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `video_moderation` (
	`video_id` text PRIMARY KEY NOT NULL,
	`blocked` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL
);
