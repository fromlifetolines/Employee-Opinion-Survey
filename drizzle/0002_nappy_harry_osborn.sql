CREATE TABLE `adminNotifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`surveyId` int NOT NULL,
	`type` enum('submission','milestone') NOT NULL,
	`title` text NOT NULL,
	`content` text,
	`isRead` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `adminNotifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shareStats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`surveyId` int NOT NULL,
	`link` text NOT NULL,
	`shareCount` int NOT NULL DEFAULT 0,
	`clickCount` int NOT NULL DEFAULT 0,
	`lastSharedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shareStats_id` PRIMARY KEY(`id`)
);
