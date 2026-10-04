# Phase 1 Correction Notes

## Migration rollout

The Phase 1 migration must be applied with the application schema and Prisma client from the same commit. It converts the legacy `ContentDraft.status` text column to the explicit `ContentDraftStatus` enum only after checking that every existing value is supported. Unsupported values abort the migration before the type conversion.

Before production rollout:

1. Take a verified database backup and record the migration version.
2. Restore the backup into a disposable PostgreSQL database.
3. Run `prisma migrate deploy`, `prisma validate`, and `prisma generate` against that database.
4. Verify existing users, drafts, revisions, approvals, and audit events are preserved.
5. Verify the resulting foreign keys match `schema.prisma`.
6. Deploy the application code that understands the enum before enabling writes that use the new states.

The migration is transactional PostgreSQL DDL and intentionally has no destructive reset or data deletion step. If status normalization is required, perform it in a reviewed pre-migration script or corrective migration; do not change production data ad hoc.

Approval and audit evidence use restrictive owner, actor, draft, and revision foreign keys. Deleting an owner, actor, approved draft, or approved revision must be rejected rather than silently deleting evidence; evidence must be explicitly retired by a later policy if that is ever required.

## Idempotency lease and recovery

New reservations receive a five-minute lease. A duplicate request with an active lease returns `in_progress`. A request whose reservation lease has expired may atomically recover that reservation, clear incomplete response data, and execute again. Completed and failed records are replayed deterministically; callers must use a new key for a new logical operation.

Production endpoints should use `withIdempotency`, which owns reservation, completion, and failure recording. The authenticated server identity is the idempotency owner; clients provide only the key, operation, and payload.

## Audit authorization

Phase 1 audit writes require an existing actor user and require the actor to equal the owner for the supported user-owned resources. Content resources are checked through their ownership relation before the audit row is written, and unsupported resource types are rejected until registered. Future team or system actors must introduce an explicit authorization policy and actor representation before expanding this rule.

Audit metadata is bounded, JSON-serializable, and recursively rejects credential-like keys. Raw tokens, secrets, passwords, authorization headers, and provider credentials must never be logged.

## Backup and recovery expectations

The migration must be rehearsed against a disposable PostgreSQL instance before staging or production. Recovery means stopping deployment, preserving the failed migration diagnostics, restoring the verified backup if required, correcting unsupported statuses through a reviewed migration, and rerunning deployment. `prisma migrate reset` is for disposable development databases only.

The database integration suite is opt-in so normal tests never touch a configured database:

```bash
RUN_PHASE1_DB_TESTS=1 DATABASE_URL="$PHASE1_TEST_DATABASE_URL" \
  npx vitest run apps/api/src/phase1Database.integration.test.ts
```

For a status-safety rehearsal, apply the initial migration to a disposable database, insert a legacy draft with an unsupported status, then apply the Phase 1 migration. The migration must fail while the row remains a text value and unchanged. The repository's local PostgreSQL/Docker setup is intended for this rehearsal; never use the configured production or shared staging URL.
