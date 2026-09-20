CREATE TABLE `diagnostic_buckets` (
	`hour` integer NOT NULL,
	`code` text NOT NULL,
	`origin` text NOT NULL,
	`count` integer DEFAULT 1 NOT NULL,
	`last_seen` integer NOT NULL,
	PRIMARY KEY(`hour`, `code`, `origin`)
);
