CREATE TABLE `social_projects` (`id` text PRIMARY KEY NOT NULL,`user_id` text NOT NULL,`platform` text NOT NULL,`post_url` text NOT NULL,`creator_handle` text NOT NULL,`title` text NOT NULL,`summary` text NOT NULL,`build_idea` text NOT NULL,`tags` text NOT NULL,`status` text NOT NULL DEFAULT 'pending',`created_at` integer NOT NULL,`updated_at` integer NOT NULL);
CREATE UNIQUE INDEX `social_projects_url` ON `social_projects` (`post_url`);
CREATE INDEX `social_projects_status_created` ON `social_projects` (`status`,`created_at`);
CREATE INDEX `social_projects_user_created` ON `social_projects` (`user_id`,`created_at`);
