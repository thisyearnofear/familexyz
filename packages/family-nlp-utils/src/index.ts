export interface KeywordCategory { id: string; words: string[] }
export interface KeywordResult { [id: string]: number }

export function countKeywords(text: string, categories: KeywordCategory[]): KeywordResult {
  const lower = text.toLowerCase();
  const res: KeywordResult = {};
  for (const cat of categories) {
    res[cat.id] = cat.words.reduce((acc, w) => acc + (lower.includes(w) ? 1 : 0), 0);
  }
  return res;
}

// LLM-based sentiment analysis (fallback to keyword heuristic)
export async function classifySentiment(
  text: string,
  runtime: any // IAgentRuntime type
): Promise<{ positive: number; negative: number }> {
  const { generateObject } = runtime;
  try {
    const prompt =
      'Answer with JSON {"positive":int, "negative":int} counting positive vs negative family-oriented sentiments in <<<TEXT>>>.\n\nTEXT:\n' +
      text;
    const result = await generateObject(
      {
        prompt,
        model: "SMALL"
      },
      { positive: 0, negative: 0 }
    );
    if (
      typeof result === "object" &&
      typeof result.positive === "number" &&
      typeof result.negative === "number"
    ) {
      return result;
    }
  } catch (err) {
    // fallback below
  }
  // fallback: keyword analysis
  const categories: KeywordCategory[] = [
    { id: "positive", words: ["love", "joy", "grateful", "forgive", "understand", "appreciate"] },
    { id: "negative", words: ["angry", "sad", "upset", "hate", "resent", "hurt", "conflict"] }
  ];
  const kw = countKeywords(text, categories);
  return { positive: kw.positive, negative: kw.negative };
}