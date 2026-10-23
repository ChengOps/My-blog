import { better, isSpec, recordKey, type Result } from "./arcade-engine";
import { isRecord } from "./comment-model";
const key = "xavier-arcade-records-v4";
export function readRecords(): Record<string, Result> {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(key) ?? "{}");
    if (!isRecord(data)) return {};
    const records: Record<string, Result> = {};
    for (const value of Object.values(data)) {
      if (!isRecord(value)) continue;
      const spec = { game: value.game, mode: value.mode, level: value.level };
      if (isSpec(spec) && Number.isInteger(value.score) && Number(value.score) > 0
        && Number.isInteger(value.elapsed) && Number(value.elapsed) > 0 && typeof value.cleared === "boolean") {
        records[recordKey(spec)] = { ...spec,
          score: Number(value.score), elapsed: Number(value.elapsed), cleared: value.cleared };
      }
    }
    return records;
  } catch { return {}; }
}
export function saveRecord(outcome: Result, existing = readRecords()) {
  const records = { ...existing };
  const previous = records[recordKey(outcome)];
  const eligible = outcome.score > 0 && (outcome.mode === "endless" || outcome.cleared);
  const first = eligible && !previous;
  const improved = eligible && !!previous && better(outcome, previous);
  if (first || improved) {
    records[recordKey(outcome)] = outcome;
    try { localStorage.setItem(key, JSON.stringify(records)); } catch { return { first, improved, saved: false, records }; }
  }
  return { first, improved, saved: true, records };
}
