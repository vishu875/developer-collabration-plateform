CREATE TABLE "github_repos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"repo_id" integer NOT NULL,
	"name" text NOT NULL,
	"full_name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"url" text NOT NULL,
	"language" text DEFAULT '' NOT NULL,
	"stargazers_count" integer DEFAULT 0 NOT NULL,
	"forks_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "github_repos_repo_id_unique" UNIQUE("repo_id")
);
--> statement-breakpoint
CREATE TABLE "join_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"message" text DEFAULT '' NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"content" text NOT NULL,
	"message_type" varchar(20) DEFAULT 'text' NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"edited_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipient_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"project_id" uuid,
	"type" varchar(30) NOT NULL,
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_users" (
	"project_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "project_users_project_id_user_id_pk" PRIMARY KEY("project_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(150) NOT NULL,
	"slug" text NOT NULL,
	"description" text NOT NULL,
	"technologies" text[] DEFAULT '{}' NOT NULL,
	"required_skills" text[] DEFAULT '{}' NOT NULL,
	"team_size" integer NOT NULL,
	"responsibilities" text NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"status" varchar(20) DEFAULT 'open' NOT NULL,
	"owner_id" uuid NOT NULL,
	"ai_summary" text DEFAULT '' NOT NULL,
	"github_repo_url" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "projects_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar(30) NOT NULL,
	"email" text NOT NULL,
	"profile_picture" text DEFAULT 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png' NOT NULL,
	"bio" text DEFAULT '' NOT NULL,
	"location" text DEFAULT '' NOT NULL,
	"github_username" text DEFAULT '' NOT NULL,
	"github_id" text,
	"skills" text[] DEFAULT '{}' NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_github_id_unique" UNIQUE("github_id")
);
--> statement-breakpoint
ALTER TABLE "github_repos" ADD CONSTRAINT "github_repos_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "join_requests" ADD CONSTRAINT "join_requests_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "join_requests" ADD CONSTRAINT "join_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_users" ADD CONSTRAINT "project_users_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_users" ADD CONSTRAINT "project_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "github_repos_user_idx" ON "github_repos" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "join_requests_uniq_idx" ON "join_requests" USING btree ("project_id","user_id","status");--> statement-breakpoint
CREATE INDEX "join_requests_project_idx" ON "join_requests" USING btree ("project_id","status");--> statement-breakpoint
CREATE INDEX "join_requests_user_idx" ON "join_requests" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "messages_project_time_idx" ON "messages" USING btree ("project_id","created_at");--> statement-breakpoint
CREATE INDEX "notifications_recipient_time_idx" ON "notifications" USING btree ("recipient_id","created_at");--> statement-breakpoint
CREATE INDEX "notifications_recipient_read_idx" ON "notifications" USING btree ("recipient_id","is_read");--> statement-breakpoint
CREATE INDEX "project_users_project_idx" ON "project_users" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_users_user_idx" ON "project_users" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "projects_owner_idx" ON "projects" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "projects_status_idx" ON "projects" USING btree ("status");--> statement-breakpoint
CREATE INDEX "users_skills_idx" ON "users" USING btree ("skills");