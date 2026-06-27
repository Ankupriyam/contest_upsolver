import { CodeforcesApiClient, type CodeforcesProblem, type CodeforcesRatingChange, type CodeforcesSubmission } from "./codeforces";

export type ProblemStatus = "attempted" | "unattempted";

export interface UpsolveProblem {
  index: string;
  name: string;
  rating: number | null;
  tags: string[];
  url: string;
  status: ProblemStatus;
}

export interface UpsolveContest {
  contestId: number;
  contestName: string;
  contestDate: string | null;
  problem: UpsolveProblem;
}

export interface UpsolveFilters {
  search?: string;
  tags: string[];
  minRating?: number;
  maxRating?: number;
  contestId?: number;
}

export interface UpsolveFilterOptions {
  contests: Array<{ contestId: number; contestName: string }>;
  tags: string[];
}

function problemKey(contestId: number, index: string) {
  return `${contestId}:${index}`;
}

function contestDate(change: CodeforcesRatingChange) {
  return new Date(change.ratingUpdateTimeSeconds * 1000).toISOString();
}

function isSolvedSubmission(submission: CodeforcesSubmission) {
  return submission.verdict === "OK";
}

function hasProblemContestId(problem: CodeforcesProblem): problem is CodeforcesProblem & {
  contestId: number;
} {
  return typeof problem.contestId === "number";
}

export async function buildNextUpsolveProblems(
  ratingHistory: CodeforcesRatingChange[],
  submissions: CodeforcesSubmission[],
  loadAllProblems: () => Promise<CodeforcesProblem[]>,
) {
  const contestById = new Map<number, CodeforcesRatingChange>();
  for (const change of ratingHistory) {
    contestById.set(change.contestId, change);
  }

  const solved = new Set<string>();
  const attempted = new Set<string>();

  for (const submission of submissions) {
    if (!hasProblemContestId(submission.problem)) continue;
    const key = problemKey(submission.problem.contestId, submission.problem.index);
    attempted.add(key);
    if (isSolvedSubmission(submission)) solved.add(key);
  }

  const allProblems = await loadAllProblems();
  const problemsByContest = new Map<number, CodeforcesProblem[]>();
  
  for (const problem of allProblems) {
    if (problem.contestId == null) continue;
    if (!problemsByContest.has(problem.contestId)) {
      problemsByContest.set(problem.contestId, []);
    }
    problemsByContest.get(problem.contestId)!.push(problem);
  }
  
  const missingContestIds = [...contestById.keys()].filter(
    (id) => !problemsByContest.has(id)
  );
  
  if (missingContestIds.length > 0) {
    const api = new CodeforcesApiClient();
    await Promise.all(
      missingContestIds.map(async (id) => {
        try {
          const problems = await api.getContestProblems(id);
          problemsByContest.set(id, problems);
        } catch {
          // Ignore if API fails for a specific missing contest
        }
      })
    );
  }

  for (const problems of problemsByContest.values()) {
    problems.sort((a, b) => a.index.localeCompare(b.index, undefined, { numeric: true }));
  }

  const contests = [...contestById.values()].map((contest) => {
    const problems = problemsByContest.get(contest.contestId) ?? [];
    
    const nextProblem = problems.find((problem) => {
      const contestId = problem.contestId ?? contest.contestId;
      return !solved.has(problemKey(contestId, problem.index));
    });

    if (!nextProblem) return null;

    const contestId = nextProblem.contestId ?? contest.contestId;
    const key = problemKey(contestId, nextProblem.index);

    return {
      contestId: contest.contestId,
      contestName: contest.contestName,
      contestDate: contestDate(contest),
      problem: {
        index: nextProblem.index,
        name: nextProblem.name,
        rating: nextProblem.rating ?? null,
        tags: nextProblem.tags ?? [],
        url: `https://codeforces.com/contest/${contest.contestId}/problem/${nextProblem.index}`,
        status: attempted.has(key) ? "attempted" : "unattempted",
      },
    } satisfies UpsolveContest;
  });

  return contests.filter((contest): contest is UpsolveContest => contest != null);
}

export function buildFilterOptions(contests: UpsolveContest[]): UpsolveFilterOptions {
  const tagSet = new Set<string>();
  const contestMap = new Map<number, string>();

  for (const contest of contests) {
    contestMap.set(contest.contestId, contest.contestName);
    for (const tag of contest.problem.tags) tagSet.add(tag);
  }

  return {
    contests: [...contestMap.entries()]
      .map(([contestId, contestName]) => ({ contestId, contestName }))
      .sort((a, b) => b.contestId - a.contestId),
    tags: [...tagSet].sort((a, b) => a.localeCompare(b)),
  };
}

export function applyUpsolveFilters(contests: UpsolveContest[], filters: UpsolveFilters) {
  const search = filters.search?.trim().toLowerCase();

  return contests.filter((contest) => {
    const problem = contest.problem;

    if (search && !problem.name.toLowerCase().includes(search)) return false;
    if (filters.contestId != null && contest.contestId !== filters.contestId) return false;

    if (filters.minRating != null || filters.maxRating != null) {
      if (problem.rating == null) return false;
      if (filters.minRating != null && problem.rating < filters.minRating) return false;
      if (filters.maxRating != null && problem.rating > filters.maxRating) return false;
    }

    if (filters.tags.length > 0) {
      const problemTags = new Set(problem.tags);
      if (!filters.tags.every((tag) => problemTags.has(tag))) return false;
    }

    return true;
  });
}

export function sortUpsolveContests(contests: UpsolveContest[], sort: string | null) {
  const sorted = [...contests];

  switch (sort) {
    case "rating-asc":
      sorted.sort((a, b) => (a.problem.rating ?? Infinity) - (b.problem.rating ?? Infinity));
      break;
    case "rating-desc":
      sorted.sort((a, b) => (b.problem.rating ?? -Infinity) - (a.problem.rating ?? -Infinity));
      break;
    case "date-asc":
      sorted.sort((a, b) => (a.contestDate ?? "").localeCompare(b.contestDate ?? ""));
      break;
    case "name-asc":
      sorted.sort((a, b) => a.problem.name.localeCompare(b.problem.name));
      break;
    case "date-desc":
    default:
      sorted.sort((a, b) => (b.contestDate ?? "").localeCompare(a.contestDate ?? ""));
      break;
  }

  return sorted;
}
