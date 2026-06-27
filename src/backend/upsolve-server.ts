import { createServerFn } from "@tanstack/react-start";

import { CodeforcesApiError } from "./codeforces";
import { getUpsolveData, type UpsolveRequestInput } from "./upsolve-handler";

export type UpsolveServerResult =
  | Awaited<ReturnType<typeof getUpsolveData>>
  | {
      error: string;
      contests: [];
      total: 0;
      page: 1;
      hasMore: false;
      filters: {
        contests: [];
        tags: [];
      };
    };

export const fetchUpsolveData = createServerFn({ method: "GET" })
  .validator((data: UpsolveRequestInput) => data)
  .handler(async ({ data }): Promise<UpsolveServerResult> => {
    try {
      return await getUpsolveData(data);
    } catch (error) {
      if (error instanceof CodeforcesApiError) {
        return emptyResult(error.message);
      }

      console.error(error);
      return emptyResult("Something went wrong while building your upsolving list.");
    }
  });

function emptyResult(error: string): UpsolveServerResult {
  return {
    error,
    contests: [],
    total: 0,
    page: 1,
    hasMore: false,
    filters: {
      contests: [],
      tags: [],
    },
  };
}

