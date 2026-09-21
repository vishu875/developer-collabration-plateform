CREATE TABLE "developer_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"recipient_id" uuid NOT NULL,
	"message" text DEFAULT '' NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "developer_invites" ADD CONSTRAINT "developer_invites_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "developer_invites" ADD CONSTRAINT "developer_invites_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "developer_invites" ADD CONSTRAINT "developer_invites_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "developer_invites_uniq_idx" ON "developer_invites" USING btree ("project_id","recipient_id","status");--> statement-breakpoint
CREATE INDEX "developer_invites_project_idx" ON "developer_invites" USING btree ("project_id","status");--> statement-breakpoint
CREATE INDEX "developer_invites_recipient_idx" ON "developer_invites" USING btree ("recipient_id","status");--> statement-breakpoint
CREATE INDEX "developer_invites_sender_idx" ON "developer_invites" USING btree ("sender_id");