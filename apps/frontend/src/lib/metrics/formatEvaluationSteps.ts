export const STEP_SEPARATOR = '\n---\n' as const;

export function formatEvaluationSteps(steps: readonly string[]): string {
  const nonEmpty = steps.map((s) => s.trim()).filter(Boolean);
  return nonEmpty
    .map((s, i) => `Step ${i + 1}:\n${s}`)
    .join(STEP_SEPARATOR);
}