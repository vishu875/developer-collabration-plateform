import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { projects, users, projectUsers } from "@/lib/db/schema";
import { generateMatchReasoning, recommendTeammates } from "@/lib/groq";
import { eq, and, not, notInArray } from "drizzle-orm";

/**
 * POST /api/ai/match
 * Smart Matchmaker: Finds top 3 developers matching a project's requirements,
 * with Groq AI-generated justifications.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await req.json();
    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
    }

    // 1. Fetch the project
    const projectResult = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    const project = projectResult[0];

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // 2. Fetch existing team members
    const teamMembers = await db
      .select({ userId: projectUsers.userId })
      .from(projectUsers)
      .where(eq(projectUsers.projectId, projectId));

    const memberIds = teamMembers.map((m) => m.userId);

    // 3. Fetch all other users
    const candidateUsers = await db
      .select({
        id: users.id,
        username: users.username,
        profilePicture: users.profilePicture,
        bio: users.bio,
        skills: users.skills,
      })
      .from(users)
      .where(
        and(
          not(eq(users.id, project.ownerId)),
          // Filter out existing members if any exist
          memberIds.length > 0 ? notInArray(users.id, memberIds) : undefined
        )
      );

    // 4. Run AI Teammate Matchmaker Engine
    let recommendations: {
      id: string;
      username: string;
      profilePicture: string;
      skills: string[];
      matchingSkills: string[];
      reason: string;
    }[] = [];
    if (candidateUsers.length > 0) {
      const aiRecommendations = await recommendTeammates(
        {
          title: project.title,
          description: project.description,
          technologies: project.technologies,
          requiredSkills: project.requiredSkills,
        },
        candidateUsers
      );

      if (aiRecommendations.length > 0) {
        // Map user profile details back to the recommended IDs
        recommendations = aiRecommendations
          .map((rec) => {
            const candidate = candidateUsers.find((u) => u.id === rec.id);
            if (!candidate) return null;

            return {
              id: candidate.id,
              username: candidate.username,
              profilePicture: candidate.profilePicture,
              skills: candidate.skills,
              matchingSkills: rec.matchingSkills,
              reason: rec.reason,
            };
          })
          .filter((item): item is NonNullable<typeof item> => item !== null);
      }
    }

    // 5. Fallback to Local Search Matchmaking if AI returned no recommendations
    if (recommendations.length === 0 && candidateUsers.length > 0) {
      const projectSkillsLower = project.requiredSkills.map((s) => s.toLowerCase());

      const scoredCandidates = candidateUsers
        .map((candidate) => {
          const intersection = candidate.skills.filter((skill) =>
            projectSkillsLower.includes(skill.toLowerCase())
          );

          return {
            ...candidate,
            matchingSkills: intersection,
            score: intersection.length,
          };
        })
        .filter((candidate) => candidate.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

      recommendations = await Promise.all(
        scoredCandidates.map(async (candidate) => {
          let reason = "";
          try {
            reason = await generateMatchReasoning(
              project.title,
              project.requiredSkills,
              candidate.skills,
              candidate.username
            );
          } catch (err) {
            reason = `Matches skills in ${candidate.matchingSkills.join(", ")}.`;
          }

          return {
            id: candidate.id,
            username: candidate.username,
            profilePicture: candidate.profilePicture,
            skills: candidate.skills,
            matchingSkills: candidate.matchingSkills,
            reason,
          };
        })
      );
    }

    return NextResponse.json(recommendations);
  } catch (error) {
    console.error("Error in matchmaking API:", error);
    return NextResponse.json(
      { error: "Failed to perform matching search" },
      { status: 500 }
    );
  }
}
