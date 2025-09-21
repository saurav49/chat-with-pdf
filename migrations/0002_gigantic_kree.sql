CREATE TYPE "public"."message_role" AS ENUM('user', 'assistant', 'system');--> statement-breakpoint
ALTER TABLE "message" ADD COLUMN "content" text NOT NULL;--> statement-breakpoint
ALTER TABLE "message" ADD COLUMN "role" "message_role" DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "message" DROP COLUMN "user_query";--> statement-breakpoint
ALTER TABLE "message" DROP COLUMN "llm_response";