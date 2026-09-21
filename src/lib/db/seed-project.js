import pg from "pg";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const { Pool } = pg;

async function run() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("Missing DATABASE_URL in environment variables.");
    process.exit(1);
  }

  // Strip sslmode=require parameters if present (like in drizzle config) to prevent SSL driver issues
  const cleanUrl = connectionString.split("?")[0];

  const pool = new Pool({
    connectionString: cleanUrl,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    console.log("Connecting to database...");
    
    // 1. Fetch users
    const usersRes = await pool.query("SELECT id, username, email FROM users LIMIT 10;");
    if (usersRes.rows.length === 0) {
      console.log("No users found in database! Please sign in once via GitHub first to create your user account.");
      process.exit(0);
    }

    console.log("Found users:");
    usersRes.rows.forEach((u, i) => {
      console.log(`${i + 1}. Username: @${u.username} (ID: ${u.id})`);
    });

    const targetUser = usersRes.rows[0];
    console.log(`Seeding project for user: @${targetUser.username}`);

    const projectTitle = "RefactorAI - Smart Code Reviewer";
    const projectSlug = "refactorai-smart-code-reviewer-" + Math.floor(Math.random() * 1000);
    const description = "A collaborative platform where developers can submit pull requests and get inline code refactoring recommendations powered by local LLMs and agentic workflows.";
    const technologies = ["React", "TypeScript", "Drizzle ORM", "PostgreSQL", "AI Engine", "TailwindCSS"];
    const requiredSkills = ["React", "TypeScript", "LLM Integration", "Database Schema Design", "Frontend Styling"];
    const teamSize = 4;
    const responsibilities = "Build the code diff rendering engine, integrate pull request webhooks from GitHub, construct the AI prompt pipeline, and design a dark-mode dashboard for code review logs.";
    const aiSummary = "RefactorAI is an advanced developer tool utilizing LLM models to review pull requests and provide real-time refactoring suggestions. Great for developers looking to gain experience with AI integrations.";
    const githubRepoUrl = "https://github.com/example/refactor-ai";

    // 2. Insert project
    const projectInsertQuery = `
      INSERT INTO projects (
        id, title, slug, description, technologies, required_skills, 
        team_size, responsibilities, start_date, end_date, status, 
        owner_id, ai_summary, github_repo_url, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW(), NOW() + interval '3 months', 'open', $8, $9, $10, NOW(), NOW()
      ) RETURNING id, title, slug;
    `;

    const projectRes = await pool.query(projectInsertQuery, [
      projectTitle,
      projectSlug,
      description,
      technologies,
      requiredSkills,
      teamSize,
      responsibilities,
      targetUser.id,
      aiSummary,
      githubRepoUrl,
    ]);

    const seededProject = projectRes.rows[0];
    console.log(`Successfully seeded project: "${seededProject.title}" (Slug: ${seededProject.slug})`);

    // 3. Register user as a member of their own project
    await pool.query(
      "INSERT INTO project_users (project_id, user_id, joined_at) VALUES ($1, $2, NOW()) ON CONFLICT DO NOTHING;",
      [seededProject.id, targetUser.id]
    );
    console.log(`Registered owner @${targetUser.username} as the first team member.`);

  } catch (error) {
    console.error("Database seed error:", error);
  } finally {
    await pool.end();
  }
}

run();
