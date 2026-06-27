import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search, ChevronRight, ChevronDown, X, Filter, Calendar,
  Trophy, Tag as TagIcon, ArrowUpRight, Loader2, Inbox,
} from "lucide-react";
import { MOCK_PROBLEMS, ALL_TAGS, ALL_CONTESTS, type Problem } from "./mockData";

type SortKey = "rating-asc" | "rating-desc" | "date-desc" | "date-asc" | "name-asc";

const RATING_COLOR = (r: number) => {
  if (r < 1200) return "#a3a3a3";
  if (r < 1400) return "#22c55e";
  if (r < 1600) return "#06b6d4";
  if (r < 1900) return "#3D81E3";
  if (r < 2100) return "#a855f7";
  if (r < 2400) return "#f59e0b";
  return "#ef4444";
};

const gradientStyle: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(to right, #091020 0%, #0B2551 12.5%, #A4F4FD 32.5%, #00d2ff 50%, #0B2551 67.5%, #091020 87.5%, #091020 100%)",
  backgroundSize: "200% auto",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  WebkitTextFillColor: "transparent",
};

export function Upsolver() {
  const [username, setUsername] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem("aura:username");
  });

  if (!username) {
    return <UsernameGate onSubmit={(name) => {
      sessionStorage.setItem("aura:username", name);
      setUsername(name);
    }} />;
  }

  return <UpsolverApp username={username} />;
}

function UpsolverApp({ username }: { username: string }) {
  const [query, setQuery] = useState("");
  const [minRating, setMinRating] = useState<number>(800);
  const [maxRating, setMaxRating] = useState<number>(3500);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedContest, setSelectedContest] = useState<number | "all">("all");
  const [sort, setSort] = useState<SortKey>("date-desc");
  const [loading, setLoading] = useState(true);
  const [tagsOpen, setTagsOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  const filtered = useMemo(() => {
    let list = MOCK_PROBLEMS.filter((p) => {
      if (query && !p.name.toLowerCase().includes(query.toLowerCase())) return false;
      if (p.rating < minRating || p.rating > maxRating) return false;
      if (selectedContest !== "all" && p.contestId !== selectedContest) return false;
      if (selectedTags.length && !selectedTags.every((t) => p.tags.includes(t))) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      switch (sort) {
        case "rating-asc": return a.rating - b.rating;
        case "rating-desc": return b.rating - a.rating;
        case "date-asc": return a.contestDate.localeCompare(b.contestDate);
        case "date-desc": return b.contestDate.localeCompare(a.contestDate);
        case "name-asc": return a.name.localeCompare(b.name);
      }
    });
    return list;
  }, [query, minRating, maxRating, selectedTags, selectedContest, sort]);

  const toggleTag = (t: string) =>
    setSelectedTags((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t]));

  const clearAll = () => {
    setQuery("");
    setMinRating(800);
    setMaxRating(3500);
    setSelectedTags([]);
    setSelectedContest("all");
    setSort("date-desc");
  };

  const hasFilters =
    query || minRating !== 800 || maxRating !== 3500 ||
    selectedTags.length > 0 || selectedContest !== "all";

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0c0c0c] text-white">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(900px circle at 15% -10%, rgba(0,210,255,0.10), transparent 60%), radial-gradient(800px circle at 90% 10%, rgba(61,129,227,0.10), transparent 60%)",
          }}
        />
        <div className="hidden md:block absolute top-0 bottom-0 left-1/2 -translate-x-[36rem] w-px bg-white/[0.04]" />
        <div className="hidden md:block absolute top-0 bottom-0 left-1/2 translate-x-[36rem] w-px bg-white/[0.04]" />
      </div>

      {/* SVG noise filter */}
      <svg className="absolute w-0 h-0">
        <filter id="c3-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.35 0" />
          <feComposite in2="SourceGraphic" operator="in" />
          <feBlend in="SourceGraphic" mode="multiply" />
        </filter>
      </svg>

      <div className="relative z-10">
        {/* Navbar */}
        <motion.nav
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-center"
        >
          <div className="hidden md:flex items-center gap-8">
            {["Problems", "Contests", "Solutions"].map((l, i) => (
              <motion.a
                key={l}
                href="#"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className="text-white/70 text-sm font-medium hover:text-white transition"
              >
                {l}
              </motion.a>
            ))}
          </div>
        </motion.nav>

        {/* Hero */}
        <section className="max-w-6xl mx-auto px-6 pt-10 md:pt-16 pb-10 text-center flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-white/40 mb-5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#00d2ff]" />
            Contest Upsolver
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-4xl md:text-6xl font-semibold tracking-tight leading-[0.95]"
          >
            <span className="block">Every problem you missed.</span>
            <span className="block animate-shiny" style={gradientStyle}>
              Now solvable.
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 text-white/60 max-w-lg text-base leading-[1.55]"
          >
            A single, calm surface that gathers every unsolved problem from contests you've
            entered — ready to revisit, ranked by what will sharpen you most.
          </motion.p>
        </section>

        {/* Controls */}
        <section className="max-w-6xl mx-auto px-6 pb-6">
          <div className="liquid-glass rounded-2xl p-4 md:p-5">
            <div className="flex flex-col gap-4">
              {/* Search */}
              <div className="flex flex-col md:flex-row gap-3 md:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search problems by name…"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-10 pr-3 py-2.5 text-sm placeholder:text-white/30 focus:outline-none focus:border-white/25 transition"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedContest}
                    onChange={(e) =>
                      setSelectedContest(e.target.value === "all" ? "all" : Number(e.target.value))
                    }
                    className="bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-white/25 transition min-w-[180px]"
                  >
                    <option value="all">All contests</option>
                    {ALL_CONTESTS.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>

                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortKey)}
                    className="bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-white/25 transition"
                  >
                    <option value="date-desc">Newest contest</option>
                    <option value="date-asc">Oldest contest</option>
                    <option value="rating-asc">Rating ↑</option>
                    <option value="rating-desc">Rating ↓</option>
                    <option value="name-asc">Name A–Z</option>
                  </select>
                </div>
              </div>

              {/* Rating range + tags toggle */}
              <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
                <div className="flex items-center gap-3">
                  <span className="text-xs uppercase tracking-widest text-white/40">Rating</span>
                  <input
                    type="number"
                    value={minRating}
                    min={800}
                    max={3500}
                    step={100}
                    onChange={(e) => setMinRating(Number(e.target.value) || 0)}
                    className="w-20 bg-white/[0.03] border border-white/10 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-white/25"
                  />
                  <span className="text-white/30 text-xs">to</span>
                  <input
                    type="number"
                    value={maxRating}
                    min={800}
                    max={3500}
                    step={100}
                    onChange={(e) => setMaxRating(Number(e.target.value) || 0)}
                    className="w-20 bg-white/[0.03] border border-white/10 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-white/25"
                  />
                </div>

                <button
                  onClick={() => setTagsOpen((o) => !o)}
                  className="inline-flex items-center gap-2 text-xs text-white/70 hover:text-white px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03]"
                >
                  <Filter className="w-3.5 h-3.5" />
                  Tags {selectedTags.length > 0 && (
                    <span className="text-white/50">· {selectedTags.length}</span>
                  )}
                  <ChevronDown className={`w-3.5 h-3.5 transition ${tagsOpen ? "rotate-180" : ""}`} />
                </button>

                {hasFilters && (
                  <button
                    onClick={clearAll}
                    className="ml-auto inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" /> Clear all
                  </button>
                )}
              </div>

              <AnimatePresence initial={false}>
                {tagsOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-wrap gap-2 pt-1">
                      {ALL_TAGS.map((t) => {
                        const on = selectedTags.includes(t);
                        return (
                          <button
                            key={t}
                            onClick={() => toggleTag(t)}
                            className={`text-xs px-3 py-1.5 rounded-full border transition ${
                              on
                                ? "bg-white text-black border-white"
                                : "text-white/70 border-white/10 bg-white/[0.03] hover:border-white/25"
                            }`}
                          >
                            {t}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-white/40">
            <span>{loading ? "Loading…" : `${filtered.length} unsolved problems`}</span>
            <span>Updated just now</span>
          </div>
        </section>

        {/* Results */}
        <section className="max-w-6xl mx-auto px-6 pb-24">
          {loading ? (
            <div className="liquid-glass rounded-2xl p-16 flex flex-col items-center justify-center text-white/50">
              <Loader2 className="w-6 h-6 animate-spin mb-3" />
              <span className="text-sm">Gathering your unsolved problems…</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="relative liquid-glass rounded-2xl p-16 flex flex-col items-center justify-center text-center overflow-hidden">
              {/* soft ambient glow matching the login page palette */}
              <div className="absolute inset-0 pointer-events-none">
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[28rem] h-[18rem] rounded-full opacity-60"
                  style={{
                    background:
                      "radial-gradient(circle at 30% 40%, rgba(0,210,255,0.18), transparent 55%), radial-gradient(circle at 70% 60%, rgba(61,129,227,0.14), transparent 55%)",
                    filter: "blur(40px)",
                  }}
                />
              </div>

              <div className="relative z-10 flex flex-col items-center">
                <Inbox className="w-7 h-7 text-white/40 mb-3" />
                <h3 className="text-base font-semibold">Nothing matches those filters</h3>
                <p className="text-white/50 text-sm mt-1 max-w-xs">
                  Try widening the rating range or removing a tag to see more problems.
                </p>
                <button
                  onClick={clearAll}
                  className="mt-5 rounded-full bg-white text-black text-sm font-medium px-4 py-2 hover:bg-white/90"
                >
                  Reset filters
                </button>
              </div>
            </div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              <AnimatePresence mode="popLayout">
                {filtered.map((p, i) => (
                  <ProblemCard key={p.id} problem={p} index={i} />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </section>

        <footer className="border-t border-white/10 mt-10">
          <div className="max-w-6xl mx-auto px-6 py-8 text-xs text-white/40">
            Signed in as <span className="text-white/70">{username}</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

function UsernameGate({ onSubmit }: { onSubmit: (name: string) => void }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Please enter a username to continue.");
      return;
    }
    if (trimmed.length > 40) {
      setError("Username must be 40 characters or fewer.");
      return;
    }
    onSubmit(trimmed);
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0c0c0c] text-white">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(900px circle at 15% -10%, rgba(0,210,255,0.10), transparent 60%), radial-gradient(800px circle at 90% 10%, rgba(61,129,227,0.10), transparent 60%)",
          }}
        />
        <div className="hidden md:block absolute top-0 bottom-0 left-1/2 -translate-x-[36rem] w-px bg-white/[0.04]" />
        <div className="hidden md:block absolute top-0 bottom-0 left-1/2 translate-x-[36rem] w-px bg-white/[0.04]" />
      </div>

      <svg className="absolute w-0 h-0">
        <filter id="c3-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.35 0" />
          <feComposite in2="SourceGraphic" operator="in" />
          <feBlend in="SourceGraphic" mode="multiply" />
        </filter>
      </svg>

      <main className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-white/40 mb-6"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#00d2ff]" />
          Welcome to Aura
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-4xl md:text-6xl font-semibold tracking-tight leading-[0.95] text-center"
        >
          <span className="block">Every problem you missed.</span>
          <span className="block animate-shiny" style={gradientStyle}>
            Now solvable.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="mt-6 text-white/60 max-w-md text-base leading-[1.55] text-center"
        >
          Enter your handle to surface every unsolved problem from your past contests.
        </motion.p>

        <motion.form
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          onSubmit={(e) => { e.preventDefault(); submit(); }}
          className="liquid-glass rounded-2xl p-2 mt-10 w-full max-w-md flex items-center gap-2"
        >
          <input
            autoFocus
            value={value}
            onChange={(e) => { setValue(e.target.value); if (error) setError(null); }}
            placeholder="Your username"
            maxLength={40}
            aria-label="Username"
            className="flex-1 bg-transparent px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-full bg-white text-black text-sm font-semibold px-4 py-2.5 hover:bg-white/90 active:scale-[0.98] transition"
          >
            Continue <ChevronRight className="w-4 h-4" />
          </button>
        </motion.form>

        <div className="h-6 mt-3">
          <AnimatePresence>
            {error && (
              <motion.p
                key={error}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-xs text-red-400/90"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-4 text-[11px] uppercase tracking-widest text-white/30"
        >
          Press Enter to continue
        </motion.p>
      </main>
    </div>
  );
}

function ProblemCard({ problem, index }: { problem: Problem; index: number }) {
  const color = RATING_COLOR(problem.rating);
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.02, 0.2) }}
      className="liquid-glass rounded-2xl p-5 flex flex-col gap-4 group hover:-translate-y-0.5 transition"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-white/40">
          <Trophy className="w-3 h-3" />
          <span className="truncate max-w-[180px]">{problem.contestName}</span>
        </div>
        <span
          className="text-[11px] font-semibold px-2 py-0.5 rounded-full border"
          style={{ color, borderColor: `${color}55`, background: `${color}10` }}
        >
          {problem.rating}
        </span>
      </div>

      <h3 className="text-lg font-semibold tracking-tight leading-snug">
        {problem.name}
      </h3>

      <div className="flex items-center gap-1.5 text-xs text-white/40">
        <Calendar className="w-3.5 h-3.5" />
        {new Date(problem.contestDate).toLocaleDateString(undefined, {
          month: "short", day: "numeric", year: "numeric",
        })}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {problem.tags.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 text-[11px] text-white/70 px-2 py-0.5 rounded-full border border-white/10 bg-white/[0.03]"
          >
            <TagIcon className="w-2.5 h-2.5 text-white/40" />
            {t}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-2 mt-auto pt-2">
        <button className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-white text-black text-sm font-semibold px-4 py-2 hover:bg-white/90 transition">
          Solve <ChevronRight className="w-4 h-4" />
        </button>
        <button className="inline-flex items-center justify-center gap-1.5 rounded-full border border-white/15 text-white/80 text-sm font-medium px-3 py-2 hover:bg-white/5 hover:text-white transition">
          <ArrowUpRight className="w-3.5 h-3.5" /> Contest
        </button>
      </div>
    </motion.article>
  );
}

function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 256 256" className={className} fill="white">
      <path d="M 0 128 C 70.692 128 128 185.308 128 256 L 64 256 C 64 220.654 35.346 192 0 192 Z M 256 192 C 220.654 192 192 220.654 192 256 L 128 256 C 128 185.308 185.308 128 256 128 Z M 128 0 C 128 70.692 70.692 128 0 128 L 0 64 C 35.346 64 64 35.346 64 0 Z M 192 0 C 192 35.346 220.654 64 256 64 L 256 128 C 185.308 128 128 70.692 128 0 Z" />
    </svg>
  );
}