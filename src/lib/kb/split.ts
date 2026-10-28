// Splits a merged ticket into the problems its reports really are. SplitTable runs it on every build.
import { causeOf, type Cause, type Report, type Tenant } from '#lib/kb/causes';

// `parser` and `hint` swap day and month (causes.ts). A swap can never move a date by one day, so
// the reports the desk read as a one-day move (desk-notes.json) are a third bug: `shift`.
export type Problem = Cause | 'shift' | 'unplaced';
export const PROBLEMS: readonly Problem[] = ['parser', 'hint', 'shift', 'unplaced'];

export function problemOf(r: Report, t: Tenant | undefined, shifted: readonly string[]): Problem {
  if (shifted.includes(r.id)) return 'shift';
  return causeOf(r, t) ?? 'unplaced';
}

export type ProblemGroup = { problem: Problem; reports: Report[]; tenants: number; firstSeen: string; lastSeen: string };

export function splitByProblem(
  reports: Report[],
  tenantOf: (r: Report) => Tenant | undefined,
  shifted: readonly string[],
): ProblemGroup[] {
  return PROBLEMS.map((problem) => {
    const rs = reports.filter((r) => problemOf(r, tenantOf(r), shifted) === problem);
    const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
    return { problem, reports: rs, tenants: new Set(rs.map((r) => r.tenant)).size, firstSeen: days[0], lastSeen: days[days.length - 1] };
  }).filter((g) => g.reports.length > 0);
}
