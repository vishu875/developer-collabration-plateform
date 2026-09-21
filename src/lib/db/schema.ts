import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  varchar,
  uniqueIndex,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// -------- Enums represented as strings --------

export const projectStatusEnum = ["open", "in-progress", "completed"] as const;
export const joinRequestStatusEnum = ["pending", "accepted", "rejected"] as const;
export const messageTypeEnum = ["text", "file", "image", "system"] as const;
export const notificationTypeEnum = [
  "join_request",
  "request_accepted",
  "request_rejected",
  "developer_invited",
  "invite_accepted",
  "invite_rejected",
  "new_message",
  "project_update",
] as const;

// -------- Tables --------

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    username: varchar("username", { length: 30 }).notNull().unique(),
    email: text("email").notNull().unique(),
    profilePicture: text("profile_picture").default(
      "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"
    ).notNull(),
    bio: text("bio").default("").notNull(),
    location: text("location").default("").notNull(),
    githubUsername: text("github_username").default("").notNull(),
    githubId: text("github_id").unique(),
    skills: text("skills").array().default([]).notNull(),
    isAdmin: boolean("is_admin").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("users_skills_idx").on(table.skills),
  ]
);

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: varchar("title", { length: 150 }).notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description").notNull(),
    technologies: text("technologies").array().default([]).notNull(),
    requiredSkills: text("required_skills").array().default([]).notNull(),
    teamSize: integer("team_size").notNull(),
    responsibilities: text("responsibilities").notNull(),
    startDate: timestamp("start_date").notNull(),
    endDate: timestamp("end_date").notNull(),
    status: varchar("status", { length: 20 })
      .default("open")
      .notNull(), // open, in-progress, completed
    ownerId: uuid("owner_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    aiSummary: text("ai_summary").default("").notNull(),
    githubRepoUrl: text("github_repo_url").default("").notNull(),
    isGithubConnected: boolean("is_github_connected").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("projects_owner_idx").on(table.ownerId),
    index("projects_status_idx").on(table.status),
  ]
);

// Join table for project members
export const projectUsers = pgTable(
  "project_users",
  {
    projectId: uuid("project_id")
      .references(() => projects.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.projectId, table.userId] }),
    index("project_users_project_idx").on(table.projectId),
    index("project_users_user_idx").on(table.userId),
  ]
);

export const joinRequests = pgTable(
  "join_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .references(() => projects.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    message: text("message").default("").notNull(),
    status: varchar("status", { length: 20 })
      .default("pending")
      .notNull(), // pending, accepted, rejected
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    // Unique combination of projectId, userId and status to ensure clean requests
    uniqueIndex("join_requests_uniq_idx").on(table.projectId, table.userId, table.status),
    index("join_requests_project_idx").on(table.projectId, table.status),
    index("join_requests_user_idx").on(table.userId, table.status),
  ]
);

// Developer invitations from project members
export const developerInvites = pgTable(
  "developer_invites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .references(() => projects.id, { onDelete: "cascade" })
      .notNull(),
    senderId: uuid("sender_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    recipientId: uuid("recipient_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    message: text("message").default("").notNull(),
    status: varchar("status", { length: 20 })
      .default("pending")
      .notNull(), // pending, accepted, rejected
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("developer_invites_uniq_idx").on(table.projectId, table.recipientId, table.status),
    index("developer_invites_project_idx").on(table.projectId, table.status),
    index("developer_invites_recipient_idx").on(table.recipientId, table.status),
    index("developer_invites_sender_idx").on(table.senderId),
  ]
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .references(() => projects.id, { onDelete: "cascade" })
      .notNull(),
    senderId: uuid("sender_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    content: text("content").notNull(),
    messageType: varchar("message_type", { length: 20 })
      .default("text")
      .notNull(), // text, file, image, system
    isDeleted: boolean("is_deleted").default(false).notNull(),
    editedAt: timestamp("edited_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("messages_project_time_idx").on(table.projectId, table.createdAt),
  ]
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    recipientId: uuid("recipient_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    senderId: uuid("sender_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    projectId: uuid("project_id")
      .references(() => projects.id, { onDelete: "set null" }),
    type: varchar("type", { length: 30 }).notNull(), // join_request, request_accepted, request_rejected, new_message, project_update
    message: text("message").notNull(),
    isRead: boolean("is_read").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("notifications_recipient_time_idx").on(table.recipientId, table.createdAt),
    index("notifications_recipient_read_idx").on(table.recipientId, table.isRead),
  ]
);

export const githubRepos = pgTable(
  "github_repos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    repoId: integer("repo_id").notNull().unique(),
    name: text("name").notNull(),
    fullName: text("full_name").notNull(),
    description: text("description").default("").notNull(),
    url: text("url").notNull(),
    language: text("language").default("").notNull(),
    stargazersCount: integer("stargazers_count").default(0).notNull(),
    forksCount: integer("forks_count").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("github_repos_user_idx").on(table.userId),
  ]
);

// -------- Relations --------

export const usersRelations = relations(users, ({ many }) => ({
  ownedProjects: many(projects, { relationName: "ownedProjects" }),
  memberProjects: many(projectUsers),
  joinRequests: many(joinRequests),
  messages: many(messages),
  sentNotifications: many(notifications, { relationName: "sentNotifications" }),
  receivedNotifications: many(notifications, { relationName: "receivedNotifications" }),
  githubRepos: many(githubRepos),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  owner: one(users, {
    fields: [projects.ownerId],
    references: [users.id],
    relationName: "ownedProjects",
  }),
  members: many(projectUsers),
  joinRequests: many(joinRequests),
  messages: many(messages),
  notifications: many(notifications),
}));

export const projectUsersRelations = relations(projectUsers, ({ one }) => ({
  project: one(projects, {
    fields: [projectUsers.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [projectUsers.userId],
    references: [users.id],
  }),
}));

export const joinRequestsRelations = relations(joinRequests, ({ one }) => ({
  project: one(projects, {
    fields: [joinRequests.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [joinRequests.userId],
    references: [users.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  project: one(projects, {
    fields: [messages.projectId],
    references: [projects.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  recipient: one(users, {
    fields: [notifications.recipientId],
    references: [users.id],
    relationName: "receivedNotifications",
  }),
  sender: one(users, {
    fields: [notifications.senderId],
    references: [users.id],
    relationName: "sentNotifications",
  }),
  project: one(projects, {
    fields: [notifications.projectId],
    references: [projects.id],
  }),
}));

export const githubReposRelations = relations(githubRepos, ({ one }) => ({
  user: one(users, {
    fields: [githubRepos.userId],
    references: [users.id],
  }),
}));
