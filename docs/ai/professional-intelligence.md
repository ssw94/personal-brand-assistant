# Phase 3 Professional Intelligence

Phase 3 adds two bounded, reviewable inputs for future agents: Professional Memory and Writing Style. Existing `Profile`, `Resume`, and `ResumeVersion` records remain authoritative source records. These new records are normalized projections and preferences; they do not replace or duplicate the source domains.

## Professional Memory

`MemoryFact` stores one normalized professional fact with a typed category, bounded value, confidence, review state, and version number. `MemoryFactVersion` preserves prior values and change reasons. `MemorySource` records how the fact entered the system, while `SourceDocument` represents a profile or resume source without copying the full source document into memory.

Fact lifecycle:

`CANDIDATE → VERIFIED`

or

`CANDIDATE → REJECTED`

An existing fact may be marked `SUPERSEDED` when a later reviewed fact replaces it. AI extraction always creates `CANDIDATE` facts. It never creates verified facts.

All memory access goes through `memoryService.ts`. The context contract returns bounded, provenance-aware facts rather than Prisma rows. Context defaults to verified facts only, and all operations are owner-scoped.

## Profile/resume extraction

Extraction selects only bounded professional fields from the authenticated user’s Profile and latest ResumeVersion. Private fields such as phone, email, and website are excluded. Source text is wrapped as DATA, and the prompt explicitly treats it as untrusted content. Structured ModelGateway output is validated before candidate facts are persisted.

## Writing Style

`WritingStyleProfile` stores a deliberately small set of style dimensions and explicit preferences. `WritingStyleExample` stores representative examples separately, with source and inclusion metadata. Examples are not automatically imported from all existing content.

Style analysis runs through the Phase 2 ModelGateway with a versioned prompt and structured output schema. The profile records the `AgentRun`, analyzed example IDs, and analysis timestamp. Explicit user preferences take precedence over inferred analysis and are not overwritten by later analysis.

## Security and safety

- Every query and mutation is scoped by authenticated `userId`.
- Client input cannot select arbitrary provenance categories for user-created facts.
- AI-extracted facts remain candidates until user review.
- Profile/resume text is model DATA, not instructions.
- Raw prompts and model responses are not persisted by default.
- Future agents must consume `MemoryContext`, not query memory tables directly.

Phase 3 does not implement Research, Topic, Writer, Critic, Revision, orchestration, publishing, scheduling, analytics, billing, or UI pages.
