export interface Problem {
  id: number;
  name: string;
  contestName: string;
  contestId: number;
  rating: number;
  tags: string[];
  contestDate: string;
  solved: boolean;
}

const TAG_POOL = [
  "dp", "greedy", "graphs", "math", "implementation", "binary search",
  "data structures", "constructive", "number theory", "trees", "strings",
  "two pointers", "bitmasks", "geometry", "combinatorics", "sortings",
];

const CONTESTS = [
  { id: 1899, name: "Codeforces Round 925", date: "2024-02-08" },
  { id: 1903, name: "Codeforces Round 928", date: "2024-02-18" },
  { id: 1915, name: "Educational Round 162", date: "2024-01-09" },
  { id: 1921, name: "Codeforces Round 920 (Div. 3)", date: "2024-01-15" },
  { id: 1932, name: "Codeforces Round 932", date: "2024-03-02" },
  { id: 1945, name: "Codeforces Round 936", date: "2024-03-18" },
  { id: 1950, name: "Educational Round 165", date: "2024-04-02" },
  { id: 1968, name: "Codeforces Round 943 (Div. 3)", date: "2024-05-06" },
  { id: 1975, name: "Codeforces Round 947", date: "2024-05-22" },
  { id: 1985, name: "Codeforces Round 951 (Div. 2)", date: "2024-06-15" },
];

const NAMES = [
  "Tree of Life", "Permutation Counting", "Binary String Sorting",
  "Maximum GCD Sum", "Polycarp and the Coins", "Funny Game", "XOR Construction",
  "Two Movies", "Replace on Segment", "Distinct Split", "Card Game",
  "Bessie and Friends", "Manhattan Triangle", "Bitwise Paradox", "Lazy Narek",
  "Photoshoot for Gorillas", "Hungry Sequence", "Sakurako's Box", "Robin Hood",
  "Klee's SUPER DUPER LARGE Array!!!", "Med-imize", "Sliding", "Final Boss",
  "Splittable Permutations", "Money Buys Happiness", "Sakurako and Hazelnut",
  "Cat, Fox and Maximum Array", "Two Arrays", "Tower Defense", "Subsequence Update",
];

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export const MOCK_PROBLEMS: Problem[] = (() => {
  const rand = seededRandom(42);
  const arr: Problem[] = [];
  for (let i = 0; i < 48; i++) {
    const contest = CONTESTS[Math.floor(rand() * CONTESTS.length)];
    const ratingSteps = [800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000, 2100, 2300, 2500];
    const rating = ratingSteps[Math.floor(rand() * ratingSteps.length)];
    const tagCount = 1 + Math.floor(rand() * 3);
    const tags = new Set<string>();
    while (tags.size < tagCount) tags.add(TAG_POOL[Math.floor(rand() * TAG_POOL.length)]);
    arr.push({
      id: i + 1,
      name: NAMES[i % NAMES.length] + (i >= NAMES.length ? " II" : ""),
      contestName: contest.name,
      contestId: contest.id,
      rating,
      tags: Array.from(tags),
      contestDate: contest.date,
      solved: false,
    });
  }
  return arr;
})();

export const ALL_TAGS = TAG_POOL;
export const ALL_CONTESTS = CONTESTS;