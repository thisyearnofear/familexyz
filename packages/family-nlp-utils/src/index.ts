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