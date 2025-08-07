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

// Semantic (embedding-based) score for a text against a seed word array
export async function semanticScore(
  text: string,
  seedWords: string[],
  runtime: any // IAgentRuntime
): Promise<number> {
  try {
    const embed = runtime.embeddingProvider?.embed;
    if (!embed) return 0;
    const textVec = await embed(text);
    let score = 0;
    let count = 0;
    for (const word of seedWords) {
      const wordVec = await embed(word);
      // Cosine similarity
      const dot =
        textVec.reduce((acc: number, x: number, i: number) => acc + x * wordVec[i], 0);
      const magA = Math.sqrt(textVec.reduce((acc: number, x: number) => acc + x * x, 0));
      const magB = Math.sqrt(wordVec.reduce((acc: number, x: number) => acc + x * x, 0));
      const cos = magA && magB ? dot / (magA * magB) : 0;
      if (cos > 0.5) score++;
      count++;
    }
    return count > 0 ? score : 0;
  } catch {
    return 0;
  }
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

// LLM-based multi-category classification (fallback to countKeywords)
export async function classifyByCategories(
  text: string,
  categories: KeywordCategory[],
  runtime: any // IAgentRuntime type
): Promise<KeywordResult> {
  const { generateObject } = runtime;
  try {
    // Build schema and prompt
    const schema = categories.map(cat => `"${cat.id}": int`).join(", ");
    const wordsPrompt = categories
      .map(cat => `${cat.id}: [${cat.words.join(", ")}]`)
      .join("; ");
    const prompt = `Answer with JSON {${schema}}. For each category, count how many words (as in ${wordsPrompt}) appear in <<<TEXT>>>. TEXT:\n${text}`;
    const fallback = Object.fromEntries(categories.map(cat => [cat.id, 0]));
    const result = await generateObject(
      {
        prompt,
        model: "SMALL"
      },
      fallback
    );
    if (
      typeof result === "object" &&
      categories.every(cat => typeof result[cat.id] === "number")
    ) {
      return result;
    }
  } catch (err) {
    // fallback below
  }
  return countKeywords(text, categories);
}