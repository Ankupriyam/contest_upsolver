export interface CodeforcesRatingChange {
  contestId: number;
  contestName: string;
  rank: number;
  ratingUpdateTimeSeconds: number;
}

export interface CodeforcesProblem {
  contestId?: number;
  problemsetName?: string;
  index: string;
  name: string;
  type?: string;
  points?: number;
  rating?: number;
  tags?: string[];
}

export interface CodeforcesParty {
  participantType?: string;
  members?: Array<{ handle: string }>;
}

export interface CodeforcesSubmission {
  id: number;
  contestId?: number;
  creationTimeSeconds: number;
  relativeTimeSeconds?: number;
  problem: CodeforcesProblem;
  author?: CodeforcesParty;
  programmingLanguage?: string;
  verdict?: string;
}

interface CodeforcesOkResponse<T> {
  status: "OK";
  result: T;
}

interface CodeforcesFailedResponse {
  status: "FAILED";
  comment?: string;
}

type CodeforcesResponse<T> = CodeforcesOkResponse<T> | CodeforcesFailedResponse;

export class CodeforcesApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 502,
  ) {
    super(message);
    this.name = "CodeforcesApiError";
  }
}

const CODEFORCES_API_BASE = "https://codeforces.com/api";
const REQUEST_TIMEOUT_MS = 12_000;

function friendlyCodeforcesError(comment?: string) {
  const text = comment ?? "Codeforces returned an unexpected error.";
  if (/not found/i.test(text)) return "That Codeforces handle was not found.";
  if (/limit/i.test(text) || /too many/i.test(text)) {
    return "Codeforces is rate limiting requests right now. Please try again shortly.";
  }
  return text;
}

export class CodeforcesApiClient {
  async getUserRating(handle: string) {
    return this.request<CodeforcesRatingChange[]>("user.rating", { handle });
  }

  async getUserSubmissions(handle: string) {
    return this.request<CodeforcesSubmission[]>("user.status", { handle });
  }

  async getProblemsetProblems() {
    const result = await this.request<{ problems: CodeforcesProblem[] }>("problemset.problems", {});
    return result.problems;
  }

  async getContestProblems(contestId: number) {
    const result = await this.request<{ problems: CodeforcesProblem[] }>("contest.standings", {
      contestId: String(contestId),
      from: "1",
      count: "1",
      showUnofficial: "true",
    });
    return result.problems;
  }

  private async request<T>(method: string, params: Record<string, string>): Promise<T> {
    const url = new URL(`${CODEFORCES_API_BASE}/${method}`);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    let response: Response;
    try {
      response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    } catch {
      throw new CodeforcesApiError(
        "Unable to reach Codeforces right now. Please try again in a moment.",
      );
    }

    if (response.status === 429) {
      throw new CodeforcesApiError(
        "Codeforces is rate limiting requests right now. Please try again shortly.",
        429,
      );
    }

    let body: CodeforcesResponse<T> | null = null;
    try {
      body = (await response.json()) as CodeforcesResponse<T>;
    } catch {
      // Ignored here
    }

    if (body && body.status === "FAILED") {
      throw new CodeforcesApiError(
        friendlyCodeforcesError(body.comment),
        /not found/i.test(body.comment ?? "") ? 404 : 400,
      );
    }

    if (!response.ok) {
      throw new CodeforcesApiError(
        "Codeforces is unavailable right now. Please try again in a moment.",
        response.status >= 500 ? 502 : response.status,
      );
    }

    if (!body) {
      throw new CodeforcesApiError("Codeforces returned an invalid response.");
    }

    return body.result;
  }
}
