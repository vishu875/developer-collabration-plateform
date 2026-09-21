import { Octokit } from "@octokit/rest";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

type LanguageStats = {
  [key: string]: number;
};

type RepoInfo = {
  languages: LanguageStats;
  topLanguages: string[];
  repoCount: number;
  starCount: number;
};

/**
 * Analyze GitHub profile and generate an authentic technical bio
 * Returns empty string if no real activity to report
 */
export async function generateBioFromGitHub(githubUsername: string): Promise<string> {
  try {
    if (!githubUsername || githubUsername.trim() === "") {
      return "";
    }

    // Fetch user repos
    const { data: repos } = await octokit.repos.listForUser({
      username: githubUsername,
      per_page: 100,
      sort: "updated",
      direction: "desc",
    });

    if (!repos || repos.length === 0) {
      return "Fresher developer exploring GitHub.";
    }

    // Analyze languages used
    const languageStats: LanguageStats = {};
    let totalStars = 0;

    for (const repo of repos.slice(0, 30)) {
      // Check top 30 repos
      if (repo.language) {
        languageStats[repo.language] = (languageStats[repo.language] || 0) + 1;
      }
      totalStars += repo.stargazers_count || 0;
    }

    // Sort languages by frequency
    const topLanguages = Object.entries(languageStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([lang]) => lang);

    // Generate bio based on actual data
    let bio = "";

    if (topLanguages.length === 0) {
      bio = `Building across multiple tech stacks. Check out their work on GitHub: github.com/${githubUsername}`;
    } else if (topLanguages.length === 1) {
      bio = `${topLanguages[0]} developer working on real projects. ${repos.length} public repos${
        totalStars > 0 ? ` with ${totalStars} total stars` : ""
      }.`;
    } else {
      bio = `Works with ${topLanguages.slice(0, -1).join(", ")} & ${topLanguages[topLanguages.length - 1]}. ${repos.length} public repos${
        totalStars > 0 ? ` • ${totalStars} stars` : ""
      }.`;
    }

    // Add contribution indicator
    if (repos.some((r) => r.fork)) {
      bio += " Active contributor.";
    }

    return bio;
  } catch (error) {
    console.error("Error generating bio from GitHub:", error);
    return "";
  }
}

/**
 * Extract primary languages from GitHub profile
 */
export async function getPrimaryLanguagesFromGitHub(
  githubUsername: string
): Promise<string[]> {
  try {
    if (!githubUsername || githubUsername.trim() === "") {
      return [];
    }

    const { data: repos } = await octokit.repos.listForUser({
      username: githubUsername,
      per_page: 50,
      sort: "updated",
    });

    const languageStats: LanguageStats = {};

    for (const repo of repos) {
      if (repo.language) {
        languageStats[repo.language] = (languageStats[repo.language] || 0) + 1;
      }
    }

    return Object.entries(languageStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([lang]) => lang);
  } catch (error) {
    console.error("Error fetching languages from GitHub:", error);
    return [];
  }
}
