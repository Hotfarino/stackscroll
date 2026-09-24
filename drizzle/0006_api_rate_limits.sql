CREATE TABLE `api_rate_limits` (
	`scope` text PRIMARY KEY NOT NULL,
	`count` integer DEFAULT 1 NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `api_rate_limits_expires` ON `api_rate_limits` (`expires_at`);