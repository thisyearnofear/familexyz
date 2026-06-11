export interface AgentMeta {
  id: string;
  name: string;
  emoji: string;
  color: string;
  focus: string;
  slug: string;
  influence: string;
  influenceBio: string;
  tagline: string;
  desc: string;
}

export interface DailyTake {
  date: string;
  story: {
    headline: string;
    source: string;
    url?: string;
    summary: string;
  };
  takes: Array<{
    agent: string;
    emoji: string;
    influence: string;
    take: string;
  }>;
  generatedAt: number;
  isFallback?: boolean;
}

export interface AgentStatus {
  id: string;
  name: string;
  status: string;
  emoji: string;
}

export const AGENTS: AgentMeta[] = [
  {
    id: "wisdom",
    name: "Wisdom",
    emoji: "\u{1F9E0}",
    color: "#6d28d9",
    focus: "Emotional education & conflict resolution",
    slug: "wisdom",
    influence: "Alain de Botton",
    influenceBio: "Philosopher and author exploring love, art, and modern life",
    tagline: "Philosophy & Emotional Intelligence",
    desc: "Philosophy & EQ",
  },
  {
    id: "intimacy",
    name: "Intimacy",
    emoji: "\u{1F496}",
    color: "#db2777",
    focus: "Relationship quality & deep connection",
    slug: "intimacy",
    influence: "Esther Perel",
    influenceBio: "Therapist and author on relationships and intimacy",
    tagline: "Relationships & Connection",
    desc: "Relationships",
  },
  {
    id: "presence",
    name: "Presence",
    emoji: "\u{1F9D8}",
    color: "#0d9488",
    focus: "Mindfulness & digital wellness",
    slug: "presence",
    influence: "Thich Nhat Hanh",
    influenceBio: "Buddhist monk, peace activist, and mindfulness teacher",
    tagline: "Mindfulness & Digital Wellness",
    desc: "Mindfulness",
  },
  {
    id: "growth",
    name: "Growth",
    emoji: "\u{1F331}",
    color: "#d97706",
    focus: "Habits, resilience & family challenges",
    slug: "growth",
    influence: "James Clear",
    influenceBio: "Author of Atomic Habits, focused on habit formation",
    tagline: "Development & Achievements",
    desc: "Challenges",
  },
  {
    id: "bridge",
    name: "Bridge",
    emoji: "\u{1F9D3}",
    color: "#2563eb",
    focus: "Cross-generational bonds & legacy",
    slug: "bridge",
    influence: "StoryCorps",
    influenceBio: "Nonprofit preserving and sharing humanity's stories",
    tagline: "Generational Connections",
    desc: "Generational",
  },
];

export function getAgent(id: string): AgentMeta | undefined {
  return AGENTS.find((a) => a.id === id);
}

export function getAgentColor(id: string): string {
  return AGENTS.find((a) => a.id === id)?.color ?? "#c4542b";
}

export const CONTEXT_WELCOME: Record<string, (story?: DailyTake) => string> = {
  today: (story) =>
    story
      ? `You just read my take on today's council story \u2014 "${story.story.headline}". Want to explore it further through my lens?`
      : "I see you just came from today's Daily Council. Want to explore today's story through my lens? Ask me anything about it.",
};

export const SUGGESTIONS: Record<string, string[]> = {
  today: [
    "Tell me more about today's story through your lens",
    "How does this apply to our family?",
    "What would you focus on here?",
  ],
};

export const DEFAULT_SUGGESTIONS = [
  "How can we build healthier communication habits?",
  "Suggest a family activity that strengthens our bond",
  "Help me work through a disagreement with empathy",
  "What family goals should we set this month?",
];
