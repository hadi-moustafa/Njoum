// ============================================================
// AI content moderation — OpenAI Moderation API
// Called before community posts become visible.
// Falls back to "allow" if the API is unavailable, so posts
// still go through human review queue regardless.
// ============================================================

export interface ModerationResult {
  flagged:    boolean;
  categories: Record<string, boolean>;
  reason?:    string;
}

const OPENAI_URL = 'https://api.openai.com/v1/moderations';

/**
 * Checks text content against OpenAI's Moderation API.
 * Returns `flagged: false` silently if OPENAI_API_KEY is not set
 * (posts will still enter human review queue).
 */
export async function moderateContent(text: string): Promise<ModerationResult> {
  const apiKey = process.env['OPENAI_API_KEY'];

  if (!apiKey) {
    // No key configured — allow through, human moderators review
    return { flagged: false, categories: {} };
  }

  try {
    const res = await fetch(OPENAI_URL, {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input: text }),
      signal: AbortSignal.timeout(5000), // 5s timeout — don't block post creation
    });

    if (!res.ok) return { flagged: false, categories: {} };

    const data = await res.json() as {
      results: Array<{
        flagged:    boolean;
        categories: Record<string, boolean>;
      }>;
    };

    const result = data.results[0];
    if (!result) return { flagged: false, categories: {} };

    // Collect categories that fired
    const activeCategories = Object.fromEntries(
      Object.entries(result.categories).filter(([, v]) => v)
    );

    return {
      flagged:    result.flagged,
      categories: activeCategories,
      reason:     result.flagged
        ? `Flagged by AI: ${Object.keys(activeCategories).join(', ')}`
        : undefined,
    };
  } catch {
    // Network error / timeout — fail open (human review catches it)
    return { flagged: false, categories: {} };
  }
}

/**
 * Convenience: returns true if the content should be auto-hidden
 * (high-confidence violations like hate, violence, self-harm).
 */
export function shouldAutoHide(result: ModerationResult): boolean {
  if (!result.flagged) return false;
  const highSeverity = ['hate', 'hate/threatening', 'self-harm', 'violence/graphic'];
  return highSeverity.some(cat => result.categories[cat]);
}
