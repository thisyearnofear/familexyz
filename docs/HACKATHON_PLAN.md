# Hackathon Plan: JarvisOS + DevFactory Grid UI

**Event:** [Agents Under Pressure — Build Your Own OS](https://www.aivalley.io/hackathons/agents-under-pressure-build-your-own-os)
**Build Window:** 48 hours
**Stack:** Next.js 15 · xterm.js · Vercel AI SDK · Supabase Realtime · Tailwind v4 · Motion
**Date:** 2026-05-26

---

## Concept

Pair **JarvisOS** (identity-driven workspace) with **DevFactory's grid UI** (multi-agent visualization). The familexyz agent framework already provides identity/character configuration, multi-agent orchestration, and plugin infrastructure — we enhance what exists rather than building from scratch.

### Demo Story

1. Boot screen reveals the identity file (`~/identity.md`)
2. Drag a raw text block onto the workspace
3. The agent grid lights up — multiple agents transform the content live
4. Output appears rewritten to match the user's identity (tone, style, format)
5. The grid shows each agent's status: BUSY → DONE, with crash/retry visible

---

## Core Principles Alignment

Every decision below maps to our principles:

| Principle | Application |
|-----------|-------------|
| **ENHANCEMENT FIRST** | Build on existing `agent/`, `characters/`, and plugin system — don't rewrite |
| **CONSOLIDATION** | One unified demo app, not separate JarvisOS + DevFactory repos. Delete any scaffolding that duplicates existing infra |
| **PREVENT BLOAT** | Audit before adding: only pull in xterm.js, Motion, Supabase Realtime. No extra deps |
| **DRY** | Single character file drives identity across all agents. Shared agent status type used by both grid UI and backend |
| **CLEAN** | Frontend (Next.js) ↔ Agent API ↔ Plugin layer — explicit boundaries, no cross-layer imports |
| **MODULAR** | Each agent is an independent plugin. Grid UI cells are composable components. Identity engine is a standalone module |
| **PERFORMANT** | Supabase Realtime for live updates (no polling). Lazy-load xterm.js. Motion animations only on visible grid cells |
| **ORGANIZED** | Domain-driven structure: `identity/`, `grid/`, `terminal/` directories under a single demo app |

---

## Architecture

```
demo/hackathon/
├── app/                        # Next.js 15 app router
│   ├── page.tsx                # Boot screen → workspace
│   ├── layout.tsx              # Dark theme, fonts
│   └── api/
│       └── transform/route.ts  # POST: send content + identity → agent pipeline
├── components/
│   ├── identity/
│   │   └── IdentityPanel.tsx   # Renders ~/identity.md, editable
│   ├── grid/
│   │   ├── AgentGrid.tsx       # 2×2 or 3×2 grid of agent status cells
│   │   └── AgentCell.tsx       # Single agent: name, status, task, animation
│   ├── terminal/
│   │   └── TerminalView.tsx    # xterm.js panel showing agent logs
│   └── workspace/
│       ├── DropZone.tsx        # Drag-and-drop content input
│       └── OutputPanel.tsx     # Transformed content display
├── lib/
│   ├── supabase.ts             # Realtime subscription for agent status
│   ├── identity.ts             # Parse/validate identity file (reuses characters/ schema)
│   └── types.ts                # Shared AgentStatus, Identity types (single source of truth)
└── package.json
```

### What We Enhance (Not Rebuild)

| Existing Asset | Enhancement |
|---------------|-------------|
| `characters/*.json` | Add hackathon identity fields (tone, format, banned words) to existing character schema |
| `agent/src/services/` | Wire existing agent orchestration to emit status events via Supabase Realtime |
| Plugin system (`packages/family/plugin-*`) | Create one new plugin (`plugin-identity-transform`) that reads identity file and rewrites content |
| `agent/src/api/` | Add single `/api/transform` endpoint that accepts content + identity, returns transformed output |

### What We Delete / Skip

- No separate backend server — reuse existing `agent/` server (CONSOLIDATION)
- No custom WebSocket implementation — Supabase Realtime handles it (PREVENT BLOAT)
- No 3D visualizations — Canvas2D grid cells with Motion animations (PERFORMANT)
- No auth layer for demo — single-user hackathon demo (PREVENT BLOAT)

---

## Implementation Plan

### Phase 1: Identity Engine (Hours 0–8)

**Goal:** Identity file drives agent behavior.

1. **Enhance character schema** — Add `tone`, `format`, `banned`, `style` fields to existing `characters/` JSON schema
   - *Principle: ENHANCEMENT FIRST — extend, don't replace*
2. **Create `plugin-identity-transform`** — Single plugin that:
   - Reads identity config from character file
   - Accepts raw text input
   - Returns rewritten text matching identity constraints
   - *Principle: MODULAR — independent, testable plugin*
3. **Wire API endpoint** — Add `POST /api/transform` to existing `agent/src/api/`
   - Input: `{ content: string, identityId: string }`
   - Output: `{ transformed: string, agents: AgentStatus[] }`
   - *Principle: CLEAN — explicit API boundary*

**Deliverable:** `curl` to `/api/transform` with raw text → get identity-matched output.

---

### Phase 2: Agent Grid UI (Hours 8–20)

**Goal:** Visual multi-agent orchestration dashboard.

1. **Scaffold Next.js demo app** in `demo/hackathon/`
   - *Principle: ORGANIZED — isolated demo directory, doesn't pollute main app*
2. **Build `AgentGrid` + `AgentCell`** — Composable grid components
   - States: `IDLE` → `BUSY` → `DONE` / `CRSH` → `RETRY`
   - Motion animations for state transitions
   - *Principle: MODULAR — each cell is independent, grid is composable*
3. **Supabase Realtime integration** — Agent status channel
   - Backend emits status changes to Supabase channel
   - Frontend subscribes and updates grid cells
   - *Principle: PERFORMANT — push, not poll*
4. **Shared types** in `lib/types.ts`
   - `AgentStatus`, `Identity`, `TransformRequest`, `TransformResponse`
   - Used by both frontend and API route
   - *Principle: DRY — single source of truth*

**Deliverable:** Grid lights up with real agent activity when transform is triggered.

---

### Phase 3: Identity Panel + Drop Zone (Hours 20–32)

**Goal:** Interactive workspace for the demo.

1. **`IdentityPanel`** — Renders identity file, allows live editing
   - Reads from character file, writes back on save
   - Shows: name, role, tone, format, banned words
2. **`DropZone`** — Drag-and-drop or paste content
   - Triggers `/api/transform` on drop
   - Shows loading state while agents work
3. **`OutputPanel`** — Displays transformed content
   - Diff view: original vs. transformed
   - Highlights what each agent changed
4. **`TerminalView`** — xterm.js showing agent logs
   - Lazy-loaded (PERFORMANT)
   - Streams agent stdout via Supabase Realtime

**Deliverable:** Full workspace: drop text → watch agents → see transformed output.

---

### Phase 4: Demo Polish (Hours 32–44)

**Goal:** Hackathon-winning presentation.

1. **Boot sequence animation** — Motion-powered startup screen
   - Shows `jarvis.os · session_active` with typing effect
   - Reveals identity file line by line
2. **Crash-and-recover demo** — One agent intentionally errors
   - Grid shows `CRSH` → auto-reroute → `RETRY` → `DONE`
   - *"Judges see resilience, not just happy path"*
3. **Dark theme polish** — Consistent with existing dark mode tokens
   - Reuse `bg-background`, `text-foreground` from main app (DRY)
4. **Mobile responsive** — Grid stacks vertically on small screens

**Deliverable:** Demo-ready app with wow moments.

---

### Phase 5: Deploy + Rehearse (Hours 44–48)

1. **Deploy to Vercel** — Single command from `demo/hackathon/`
2. **Rehearse demo flow** — 3-minute pitch:
   - 0:00–0:30 — Boot screen, identity reveal
   - 0:30–1:30 — Drop content, watch grid transform
   - 1:30–2:30 — Edit identity, re-transform (different output)
   - 2:30–3:00 — Agent crash + recovery, closing slide
3. **Backup plan** — Pre-recorded video of demo flow in case of network issues

---

## Risk Mitigation

| Risk | Mitigation | Principle |
|------|-----------|-----------|
| Supabase Realtime latency | Fallback to SSE from agent server | PERFORMANT |
| LLM API rate limits | Cache transform results per content hash | PERFORMANT |
| Agent plugin complexity | Start with single mock agent, add real ones incrementally | ENHANCEMENT FIRST |
| Scope creep | No features beyond the 5-phase plan. If it's not in this doc, it doesn't ship | PREVENT BLOAT |
| Demo failure | Pre-record backup video. Identity file + grid work offline with mock data | MODULAR |

---

## Success Criteria

- [ ] Identity file editable in UI, drives agent behavior
- [ ] Agent grid shows real-time status for 3+ agents
- [ ] Content transformation visibly matches identity constraints
- [ ] At least one agent crash + recovery visible in demo
- [ ] Deployed to public URL
- [ ] 3-minute demo rehearsed and timed

---

## What We Don't Build

Keeping scope tight (PREVENT BLOAT):

- ❌ Full OS shell / filesystem emulation
- ❌ Multi-user / auth
- ❌ Persistent storage beyond demo session
- ❌ Mobile app
- ❌ Blockchain integration (existing Hedera infra stays untouched)
- ❌ Custom WebSocket server
