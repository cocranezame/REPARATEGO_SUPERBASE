// Drizzle wraps Postgres errors so the PG error code lives on err.cause, not err itself.
export function isDuplicateKeyError(err: unknown): boolean {
  const code = (err as { code?: string })?.code;
  if (code === "23505") return true;
  const causeCode = (err as { cause?: { code?: string } })?.cause?.code;
  return causeCode === "23505";
}
