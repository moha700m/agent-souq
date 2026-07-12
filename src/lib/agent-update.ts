/**
 * Preserve form-field presence after Zod turns blank optional values into
 * `undefined`. Draft text/category/media can then be cleared deliberately,
 * while live listings validate the same empty values instead of silently
 * keeping stale content.
 */
export function normalizeAgentUpdates(
  rawInput: Record<string, unknown>,
  parsed: Record<string, unknown>,
): Record<string, unknown> {
  const updates = Object.fromEntries(
    Object.entries(parsed).filter(([key]) => Object.hasOwn(rawInput, key)),
  );

  for (const key of ["tagline", "description", "instructions"]) {
    if (Object.hasOwn(rawInput, key) && updates[key] === undefined) updates[key] = "";
  }
  for (const key of ["categoryId", "thumbnailUrl", "demoUrl"]) {
    if (Object.hasOwn(rawInput, key) && updates[key] === undefined) updates[key] = null;
  }

  // A listing always needs an internal name and slug. Blank edits retain the
  // current values; a new draft already receives safe generated fallbacks.
  if (updates.name === undefined) delete updates.name;
  if (updates.slug === undefined) delete updates.slug;
  return updates;
}
