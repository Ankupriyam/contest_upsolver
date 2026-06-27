type CacheRecord<T> = {
  expiresAt: number;
  value: Promise<T>;
};

export class TtlPromiseCache<T> {
  private readonly entries = new Map<string, CacheRecord<T>>();

  constructor(private readonly ttlMs: number) {}

  get(key: string, factory: () => Promise<T>) {
    const now = Date.now();
    const existing = this.entries.get(key);
    if (existing && existing.expiresAt > now) {
      return existing.value;
    }

    const value = factory().catch((error) => {
      this.entries.delete(key);
      throw error;
    });

    this.entries.set(key, {
      expiresAt: now + this.ttlMs,
      value,
    });

    return value;
  }
}

export class RateLimitedQueue {
  private active = 0;
  private lastStart = 0;
  private scheduled = false;
  private readonly waiting: Array<() => void> = [];

  constructor(
    private readonly concurrency: number,
    private readonly minStartGapMs: number,
  ) {}

  async run<T>(task: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await task();
    } finally {
      this.active -= 1;
      this.drain();
    }
  }

  private acquire() {
    return new Promise<void>((resolve) => {
      this.waiting.push(resolve);
      this.drain();
    });
  }

  private drain() {
    if (this.scheduled || this.active >= this.concurrency || this.waiting.length === 0) return;

    const waitMs = Math.max(0, this.minStartGapMs - (Date.now() - this.lastStart));
    this.scheduled = true;
    windowlessSetTimeout(() => {
      this.scheduled = false;
      if (this.active >= this.concurrency) return;
      const resolve = this.waiting.shift();
      if (!resolve) return;
      this.active += 1;
      this.lastStart = Date.now();
      resolve();
      this.drain();
    }, waitMs);
  }
}

function windowlessSetTimeout(callback: () => void, ms: number) {
  setTimeout(callback, ms);
}
