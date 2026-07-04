# Giving AI Agents Persistent Memory with Cognee Cloud: A Family Wellness Case Study

> How we integrated Cognee Cloud's memory layer into FamilyXYZ — a multi-agent AI platform where five philosophy-inspired agents help families strengthen their relationships across Telegram and the web.

## The Problem

FamilyXYZ has five AI agents — Wisdom (Alain de Botton), Intimacy (Esther Perel & Gottman), Presence (Thich Nhat Hanh), Growth (James Clear & Carol Dweck), and Bridge (StoryCorps & bell hooks). Families interact with them via a Telegram bot and a web dashboard.

The agents were helpful in the moment, but they had no memory. A parent could tell the Wisdom agent about a difficult conversation with their teenager on Monday, and by Wednesday the agent had no idea that conversation ever happened. For a family wellness product, this is a fundamental gap — real relationships are built on accumulated context, not single interactions.

We needed persistent, per-user memory that:
1. Stored every conversation, check-in, and interaction
2. Could be queried for relevant context before each agent response
3. Supported enrichment (building a knowledge graph from raw text)
4. Allowed full data deletion (GDPR-style right to be forgotten)
5. Was optional — the app had to keep working if the memory service was down

## Why Cognee Cloud

We evaluated several options: raw vector databases (Pinecone, Weaviate), LLM-native memory (Mem0), and Cognee. We chose Cognee Cloud for three reasons:

**1. Knowledge graph, not just vectors.** Cognee doesn't just embed text and do similarity search — it builds an actual knowledge graph with entities and relationships. When a user says "I argued with my partner Sarah about screen time," Cognee extracts the entities (user, Sarah, screen time) and relationships (argued_with, about). This means recall can find semantically related memories even without keyword overlap.

**2. The lifecycle maps perfectly to agent memory.** Cognee has four operations that map cleanly to what an agent memory layer needs:
- `remember()` — ingest text, build the knowledge graph automatically
- `recall()` — query the graph for relevant context
- `improve()` — run enrichment on the existing graph
- `forget()` — delete a user's entire memory

**3. Managed cloud, no infrastructure.** Cognee Cloud gives us a tenant-isolated instance with a REST API. No graph database to run, no embedding pipeline to maintain, no vector index to tune.

## The Integration

### Architecture

We built a standalone workspace package (`packages/memory`) that wraps the Cognee Cloud REST API. It exports a `MemoryService` interface with four methods and two implementations:

```
packages/memory/src/
├── MemoryService.ts          # Interface: remember, recall, improve, forget, isEnabled
├── CogneeMemoryService.ts    # Talks to Cognee Cloud via REST API
├── NoopMemoryService.ts      # Silent fallback — all methods are no-ops
└── index.ts                  # Factory: reads env vars, returns the right impl
```

The key design decision: **graceful degradation**. If `COGNEE_ENABLED` is not `true`, or the API key is missing, or Cognee is unreachable, the app uses `NoopMemoryService` and continues working with its existing SQLite-backed state. The memory layer is an enhancement, not a dependency.

### Authentication

Cognee Cloud uses two headers for multi-tenant auth:
```
X-Api-Key: <your-api-key>
X-Tenant-Id: <your-tenant-id>
```

We encapsulated these in an `authHeaders()` helper that injects both on every request.

### Per-User Isolation

Each user gets a dedicated Cognee dataset named `familexyz_user_<userId>`. This gives us clean isolation — one user's memories never bleed into another's — and makes `forget()` simple: delete the dataset, and all the user's graph data, vectors, and relational records are gone.

### The Four Operations

**remember()** — `POST /api/v1/remember`

After every Telegram conversation, check-in, or family interaction, we store the content plus metadata (which agent, what source, which family member) as a text blob. Cognee's `remember` endpoint handles both ingestion and graph building (add + cognify combined), so we don't need a separate processing step.

```typescript
const formData = new FormData();
formData.append("data", new Blob([enriched], { type: "text/plain" }), "memory.txt");
formData.append("datasetName", dataset);
// POST /api/v1/remember
```

**recall()** — `POST /api/v1/recall`

Before an agent responds to a user message, we call `recall()` to fetch relevant context from the user's memory graph. We use `searchType: "CHUNKS"` with `topK: 5` — this returns raw text snippets directly without an LLM call, which is cheaper, faster, and gives us text we can inject into the agent's prompt as context.

```typescript
body: JSON.stringify({
    query,
    datasets: [dataset],
    searchType: "CHUNKS",
    topK: 5,
})
```

The returned snippets are injected into the agent's system prompt as "Previous context from memory:" — giving the agent awareness of past conversations without any agent framework changes.

**improve()** — `POST /api/v1/improve`

Triggered from the web dashboard's "Improve Memory" button. Runs Cognee's enrichment pipeline (memify) on the user's knowledge graph in the background. This is fire-and-forget — if it fails, the existing graph is still usable.

**forget()** — `POST /api/v1/forget`

Triggered from the dashboard's "Forget All" button. Sends `{ dataset: "familexyz_user_<id>" }` and Cognee handles the rest: deletes relational records, graph nodes/edges, and vector embeddings. Clean slate.

### Wiring It Into the App

The memory service is a singleton, initialized once at boot:

```typescript
// agent/src/index.ts
import { initMemoryService } from "@familexyz/memory";
initMemoryService();
```

Then in the Telegram bot's message router, before routing to an agent:

```typescript
const memory = getMemoryService();
const context = await memory.recall(userId, userMessage);
// Inject context into agent prompt
```

And after the agent responds:

```typescript
await memory.remember(userId, `User: ${userMessage}\nAgent: ${agentResponse}`, {
    source: "conversation",
    agent: "wisdom",
});
```

The web dashboard at `famile.xyz/memory` exposes the full lifecycle via REST endpoints (`/api/memory/status`, `/api/memory/recall`, `/api/memory/remember`, `/api/memory/forget`, `/api/memory/improve`) with JWT authentication.

## What We Learned

### 1. The docs don't always match the API

When we first integrated, the documentation for the `forget` endpoint was inconsistent — the OpenAPI spec listed a `forget` tag, but the API reference page 404'd. We initially assumed the REST endpoint didn't exist and built a workaround (UUID lookup via `GET /datasets` + `DELETE /datasets/{id}`).

After diving into the Cognee open-source repo to contribute a PR, we discovered `POST /api/v1/forget` does exist and accepts `{ dataset: "name" }` directly. We simplified our implementation to a single call.

**Lesson:** When the docs are unclear, read the source. Open-source projects often have better answers in the code than in the docs.

### 2. CHUNKS vs GRAPH_COMPLETION matters a lot

The default `searchType` for `recall()` is `GRAPH_COMPLETION`, which calls an LLM to generate a natural language answer from the graph. This is expensive (LLM call per recall), slow (seconds of latency), and returns an answer, not raw context.

For our use case — injecting context into an agent prompt — we want raw text snippets, not LLM-generated answers. Switching to `searchType: "CHUNKS"` was a significant improvement: no LLM call, sub-second latency, and text we can directly inject.

**Lesson:** Read the search type options carefully. The default isn't always right for your use case.

### 3. Graceful degradation is non-negotiable

The memory layer is optional. The app worked for months without it. If Cognee goes down, credits run out, or the network fails, the app must keep working.

Our `NoopMemoryService` pattern — where every method is a silent no-op — made this painless. The calling code doesn't know or care whether Cognee is active. It calls `recall()`, gets an empty array, and the agent responds without memory context. Not ideal, but not broken.

**Lesson:** When adding a cloud dependency to an existing app, wrap it in an interface with a no-op fallback. The integration becomes a feature enhancement, not a reliability risk.

### 4. Contributing back is the best documentation

We found issue #3748 in the Cognee repo — "Inconsistent API error responses in improve, forget, and recall routers." Three routers were returning raw error dicts with non-standard HTTP status codes (420, 409) instead of the canonical `ErrorResponse` DTO used by the other five routers.

We fixed it (PR #3863), and the process of reading the router source code taught us more about the API than the docs ever did. We saw exactly how each endpoint handled errors, what status codes to expect, and what the response schema looked like.

**Lesson:** The fastest way to understand an open-source API is to fix a bug in it.

## The Stack

| Layer | Technology |
|-------|-----------|
| Agent framework | ElizaOS (TypeScript) |
| Memory layer | Cognee Cloud (REST API) |
| Backend | Hono on Node.js, PM2 on Hetzner |
| Frontend | Next.js on Netlify |
| Bot | Telegram Bot API |
| Auth | JWT (HMAC-SHA256) |
| Package manager | pnpm workspaces |

## Results

The memory layer is live in production at `api.famile.xyz`. A round-trip test confirms it works:

1. **remember**: Store "User checked in: mood=good, had breakfast with family" → `{"success":true}`
2. **recall**: Query "What did the user do this morning?" → Returns the exact memory with metadata
3. **status**: `{"enabled":true,"service":"cognee"}`

The Telegram bot now remembers past conversations. The web dashboard shows memory status and lets families manage their data. And the whole thing degrades gracefully if Cognee is unavailable.

## What's Next

- **Session-scoped memory**: Cognee supports `session_id` for per-conversation context tracking. We could give each Telegram conversation its own session.
- **Node sets**: Cognee's `remember` accepts `node_set` tags for grouping related data. We could tag memories by agent (wisdom, intimacy, etc.) for more targeted recall.
- **Scope-aware recall**: Cognee's `scope` parameter can search "graph", "session", "trace", or "all" — we're currently using the default "auto" but could be more intentional about which memory sources to query.

---

*FamilyXYZ is an open-source family wellness platform. The Cognee integration code is at [github.com/thisyearnofear/familexyz](https://github.com/thisyearnofear/familexyz). The Cognee PR is at [github.com/topoteretes/cognee/pull/3863](https://github.com/topoteretes/cognee/pull/3863).*
