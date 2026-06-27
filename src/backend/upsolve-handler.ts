import { RateLimitedQueue, TtlPromiseCache } from "./cache";
import { CodeforcesApiClient, CodeforcesApiError, type CodeforcesProblem } from "./codeforces";
import {
  applyUpsolveFilters,
  buildFilterOptions,
  buildNextUpsolveProblems,
  sortUpsolveContests,
  type UpsolveContest,
  type UpsolveFilters,
} from "./upsolver";

interface UpsolveResponse {
  contests: UpsolveContest[];
  total: number;
  page: number;
  hasMore: boolean;
  filters: ReturnType<typeof buildFilterOptions>;
}

export interface UpsolveRequestInput {
  handle: string;
  search?: string;
  tags?: string[];
  minRating?: number;
  maxRating?: number;
  contestId?: number;
  sort?: string;
  page?: number;
  limit?: number;
}

const HANDLE_PATTERN = /^[A-Za-z0-9_.-]{1,40}$/;
const DEFAULT_LIMIT = 60;
const MAX_LIMIT = 100;

const codeforces = new CodeforcesApiClient();
const problemsetCache = new TtlPromiseCache<CodeforcesProblem[]>(24 * 60 * 60 * 1000);

function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "cache-control": "no-store",
    },
  });
}

function parseInteger(value: string | null) {
  if (value == null || value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : undefined;
}

function parseFilters(searchParams: URLSearchParams): UpsolveFilters {
  let minRating = parseInteger(searchParams.get("minRating"));
  let maxRating = parseInteger(searchParams.get("maxRating"));
  if (minRating != null && maxRating != null && minRating > maxRating) {
    [minRating, maxRating] = [maxRating, minRating];
  }

  const tags = (searchParams.get("tags") ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  return {
    search: searchParams.get("search") ?? undefined,
    tags,
    minRating,
    maxRating,
    contestId: parseInteger(searchParams.get("contestId")),
  };
}

function parsePagination(searchParams: URLSearchParams) {
  const rawPage = parseInteger(searchParams.get("page"));
  const rawLimit = parseInteger(searchParams.get("limit"));
  const page = Math.max(1, rawPage ?? 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, rawLimit ?? DEFAULT_LIMIT));
  return { page, limit };
}

function normalizeInput(input: UpsolveRequestInput) {
  let minRating = input.minRating;
  let maxRating = input.maxRating;
  if (minRating != null && maxRating != null && minRating > maxRating) {
    [minRating, maxRating] = [maxRating, minRating];
  }

  return {
    handle: input.handle.trim(),
    filters: {
      search: input.search,
      tags: input.tags ?? [],
      minRating,
      maxRating,
      contestId: input.contestId,
    },
    sort: input.sort ?? null,
    page: Math.max(1, input.page ?? 1),
    limit: Math.min(MAX_LIMIT, Math.max(1, input.limit ?? DEFAULT_LIMIT)),
  };
}

function paginate<T>(items: T[], page: number, limit: number) {
  const start = (page - 1) * limit;
  const end = start + limit;
  return {
    items: items.slice(start, end),
    hasMore: end < items.length,
  };
}

async function loadAllProblems() {
  return problemsetCache.get("all_problems", () => codeforces.getProblemsetProblems());
}

export async function getUpsolveData(input: UpsolveRequestInput): Promise<UpsolveResponse> {
  const normalized = normalizeInput(input);

  if (!HANDLE_PATTERN.test(normalized.handle)) {
    throw new CodeforcesApiError("Please enter a valid Codeforces handle.", 400);
  }

  const [ratingHistory, submissions] = await Promise.all([
    codeforces.getUserRating(normalized.handle),
    codeforces.getUserSubmissions(normalized.handle),
  ]);

  const allContests = await buildNextUpsolveProblems(
    ratingHistory,
    submissions,
    loadAllProblems,
  );

  const filtered = sortUpsolveContests(
    applyUpsolveFilters(allContests, normalized.filters),
    normalized.sort,
  );
  const pageData = paginate(filtered, normalized.page, normalized.limit);

  return {
    contests: pageData.items,
    total: filtered.length,
    page: normalized.page,
    hasMore: pageData.hasMore,
    filters: buildFilterOptions(allContests),
  };
}

export async function handleUpsolveApiRequest(request: Request) {
  const url = new URL(request.url);
  const match = /^\/api\/upsolve\/([^/]+)\/?$/.exec(url.pathname);
  if (!match) return undefined;

  if (request.method !== "GET") {
    return json({ error: "This endpoint only supports GET requests." }, 405);
  }

  const handle = decodeURIComponent(match[1]).trim();
  if (!HANDLE_PATTERN.test(handle)) {
    return json({ error: "Please enter a valid Codeforces handle." }, 400);
  }

  try {
    const filters = parseFilters(url.searchParams);
    const { page, limit } = parsePagination(url.searchParams);

    const response = await getUpsolveData({
      handle,
      ...filters,
      sort: url.searchParams.get("sort") ?? undefined,
      page,
      limit,
    });

    return json(response);
  } catch (error) {
    if (error instanceof CodeforcesApiError) {
      return json({ error: error.message }, error.statusCode);
    }

    console.error(error);
    return json({ error: "Something went wrong while building your upsolving list." }, 500);
  }
}
