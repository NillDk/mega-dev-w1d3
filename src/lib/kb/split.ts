// Splits a merged ticket into the problems its reports really are. SplitTable runs it on every build.
import { causeOf, type Cause, type Report, type Tenant } from '#lib/kb/causes';

// `parser` and `hint` swap day and month (causes.ts). A swap can never move a date by one day, so
// the reports the desk read as a one-day move (desk-notes.json) are a third bug: `shift`. Like
// CauseTable, every report is counted where it is filed (by tenant); `shift` is read across them.
export type Problem = Cause | 'shift' | 'unplaced';

export type ProblemGroup = {
  problem: Problem;
  reports: Report[];
  // For `shift`: the problem its reports are filed under by tenant.
  filedUnder: Problem[];
  tenants: number;
  firstSeen: string;
  lastSeen: string;
};

function group(problem: Problem, rs: Report[], filedUnder: Problem[] = []): ProblemGroup {
  const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
  return { problem, reports: rs, filedUnder, tenants: new Set(rs.map((r) => r.tenant)).size, firstSeen: days[0], lastSeen: days[days.length - 1] };
}

export function splitByProblem(
  reports: Report[],
  tenantOf: (r: Report) => Tenant | undefined,
  shifted: readonly string[],
): ProblemGroup[] {
  const filed = (r: Report): Problem => causeOf(r, tenantOf(r)) ?? 'unplaced';
  const byFiling = (['parser', 'hint', 'unplaced'] as const).map((p) => group(p, reports.filter((r) => filed(r) === p)));
  const moved = reports.filter((r) => shifted.includes(r.id));
  return [...byFiling, group('shift', moved, [...new Set(moved.map(filed))])].filter((g) => g.reports.length > 0);
}
