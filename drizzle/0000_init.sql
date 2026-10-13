CREATE TABLE `audit_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`detail` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `audit_entity_idx` ON `audit_log` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `audit_created_idx` ON `audit_log` (`created_at`);--> statement-breakpoint
CREATE TABLE `bookmarks` (
	`user_id` text NOT NULL,
	`lesson_key` text NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `lesson_key`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `certification_translations` (
	`certification_id` integer NOT NULL,
	`locale` text NOT NULL,
	`summary` text,
	`audience_json` text DEFAULT '[]' NOT NULL,
	`prerequisites_json` text DEFAULT '[]' NOT NULL,
	`chapters_json` text,
	`study_plan_json` text DEFAULT '[]' NOT NULL,
	`practice_json` text DEFAULT '[]' NOT NULL,
	PRIMARY KEY(`certification_id`, `locale`),
	FOREIGN KEY (`certification_id`) REFERENCES `certifications`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `certifications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`issuer` text NOT NULL,
	`version` text,
	`stream` text NOT NULL,
	`source_url` text NOT NULL,
	`reviewed_on` text,
	`verified` integer DEFAULT false NOT NULL,
	`exam_json` text,
	`chapters_json` text DEFAULT '[]' NOT NULL,
	`official_links_json` text DEFAULT '[]' NOT NULL,
	`related_paths_json` text DEFAULT '[]' NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `certifications_slug_unique` ON `certifications` (`slug`);--> statement-breakpoint
CREATE INDEX `certs_stream_position_idx` ON `certifications` (`stream`,`position`);--> statement-breakpoint
CREATE TABLE `email_outbox` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`to` text NOT NULL,
	`subject` text NOT NULL,
	`text` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `learning_paths` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`starts_at` text NOT NULL,
	`leads_to` text NOT NULL,
	`skills_json` text DEFAULT '[]' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `learning_paths_slug_unique` ON `learning_paths` (`slug`);--> statement-breakpoint
CREATE INDEX `paths_status_position_idx` ON `learning_paths` (`status`,`position`);--> statement-breakpoint
CREATE TABLE `lesson_progress` (
	`user_id` text NOT NULL,
	`lesson_key` text NOT NULL,
	`status` text NOT NULL,
	`started_at` integer NOT NULL,
	`completed_at` integer,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `lesson_key`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `progress_user_updated_idx` ON `lesson_progress` (`user_id`,`updated_at`);--> statement-breakpoint
CREATE TABLE `lesson_translations` (
	`lesson_id` integer NOT NULL,
	`locale` text NOT NULL,
	`title` text NOT NULL,
	`summary` text NOT NULL,
	`body` text DEFAULT '' NOT NULL,
	`objectives_json` text DEFAULT '[]' NOT NULL,
	`prerequisites_json` text DEFAULT '[]' NOT NULL,
	`key_terms_json` text DEFAULT '[]' NOT NULL,
	`mistakes_json` text DEFAULT '[]' NOT NULL,
	`exercise_json` text,
	`quiz_json` text DEFAULT '[]' NOT NULL,
	`references_json` text DEFAULT '[]' NOT NULL,
	PRIMARY KEY(`lesson_id`, `locale`),
	FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `lessons` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`path_id` integer NOT NULL,
	`module_id` integer NOT NULL,
	`slug` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`minutes` integer NOT NULL,
	`level` text NOT NULL,
	`skills_json` text DEFAULT '[]' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`reviewed_on` text,
	`published_at` integer,
	`updated_by` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`path_id`) REFERENCES `learning_paths`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`module_id`) REFERENCES `modules`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `lessons_path_slug_uq` ON `lessons` (`path_id`,`slug`);--> statement-breakpoint
CREATE INDEX `lessons_module_position_idx` ON `lessons` (`module_id`,`position`);--> statement-breakpoint
CREATE INDEX `lessons_status_idx` ON `lessons` (`status`);--> statement-breakpoint
CREATE TABLE `module_translations` (
	`module_id` integer NOT NULL,
	`locale` text NOT NULL,
	`title` text NOT NULL,
	`summary` text NOT NULL,
	PRIMARY KEY(`module_id`, `locale`),
	FOREIGN KEY (`module_id`) REFERENCES `modules`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `modules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`path_id` integer NOT NULL,
	`slug` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`path_id`) REFERENCES `learning_paths`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `modules_path_slug_uq` ON `modules` (`path_id`,`slug`);--> statement-breakpoint
CREATE TABLE `password_reset_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`used_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `reset_user_idx` ON `password_reset_tokens` (`user_id`);--> statement-breakpoint
CREATE TABLE `path_translations` (
	`path_id` integer NOT NULL,
	`locale` text NOT NULL,
	`title` text NOT NULL,
	`summary` text NOT NULL,
	`goal` text NOT NULL,
	`prerequisites_json` text DEFAULT '[]' NOT NULL,
	`outcomes_json` text DEFAULT '[]' NOT NULL,
	`milestones_json` text DEFAULT '[]' NOT NULL,
	PRIMARY KEY(`path_id`, `locale`),
	FOREIGN KEY (`path_id`) REFERENCES `learning_paths`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `project_translations` (
	`project_id` integer NOT NULL,
	`locale` text NOT NULL,
	`title` text NOT NULL,
	`summary` text NOT NULL,
	`brief` text NOT NULL,
	`deliverables_json` text DEFAULT '[]' NOT NULL,
	`criteria_json` text DEFAULT '[]' NOT NULL,
	PRIMARY KEY(`project_id`, `locale`),
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`level` text NOT NULL,
	`skills_json` text DEFAULT '[]' NOT NULL,
	`related_paths_json` text DEFAULT '[]' NOT NULL,
	`hours` integer NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `projects_slug_unique` ON `projects` (`slug`);--> statement-breakpoint
CREATE TABLE `quiz_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`subject_key` text NOT NULL,
	`score` integer NOT NULL,
	`total` integer NOT NULL,
	`answers_json` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `attempts_user_created_idx` ON `quiz_attempts` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `sessions_user_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE TABLE `template_translations` (
	`template_id` integer NOT NULL,
	`locale` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`file_path` text NOT NULL,
	PRIMARY KEY(`template_id`, `locale`),
	FOREIGN KEY (`template_id`) REFERENCES `templates`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `templates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`format` text NOT NULL,
	`skills_json` text DEFAULT '[]' NOT NULL,
	`related_lessons_json` text DEFAULT '[]' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `templates_slug_unique` ON `templates` (`slug`);--> statement-breakpoint
CREATE TABLE `user_roles` (
	`user_id` text NOT NULL,
	`role` text NOT NULL,
	PRIMARY KEY(`user_id`, `role`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `user_roles_role_idx` ON `user_roles` (`role`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`password_hash` text NOT NULL,
	`preferred_locale` text,
	`is_demo` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `video_translations` (
	`video_id` integer NOT NULL,
	`locale` text NOT NULL,
	`description` text NOT NULL,
	PRIMARY KEY(`video_id`, `locale`),
	FOREIGN KEY (`video_id`) REFERENCES `videos`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `videos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`youtube_id` text NOT NULL,
	`title` text NOT NULL,
	`creator` text NOT NULL,
	`creator_url` text NOT NULL,
	`language` text NOT NULL,
	`level` text NOT NULL,
	`skills_json` text DEFAULT '[]' NOT NULL,
	`related_lessons_json` text DEFAULT '[]' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`verified_on` text,
	`added_by` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`added_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `videos_youtube_id_unique` ON `videos` (`youtube_id`);--> statement-breakpoint
CREATE INDEX `videos_status_idx` ON `videos` (`status`);