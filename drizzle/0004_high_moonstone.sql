CREATE TABLE `feed_ingestion` (
	`id` text PRIMARY KEY NOT NULL,
	`payload` text,
	`updated_at` integer DEFAULT 0 NOT NULL,
	`lease_until` integer DEFAULT 0 NOT NULL,
	`lease_token` text
);
