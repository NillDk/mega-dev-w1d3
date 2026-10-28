<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import { uniqueById, type Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';
  import { splitByProblem, type Problem } from '#lib/kb/split';

  // issues: problem → issue number in `repo`, where each problem is filed on its own.
  let { ticket, repo, issues = {} }: { ticket: number; repo: string; issues?: Partial<Record<Problem, number>> } = $props();

  const rows = $derived(uniqueById(reports as Report[]).filter((r) => r.mergedInto === ticket));
  const groups = $derived(splitByProblem(rows, tenantOf, notes.oneDayMove));
  const exported = (reports as Report[]).filter((r) => r.mergedInto === ticket).length;
</script>

<p class="sum">
  <strong>{rows.length}</strong> reports in #{ticket} ({exported} rows in the export; overlapping pages repeat
  {exported - rows.length}) · <strong>{groups.length}</strong>
  {groups.length === 1 ? 'problem' : 'problems'}, counted where the desk files them
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>tenants</th><th>seen</th><th>ticket</th></tr>
  </thead>
  <tbody>
    {#each groups as g (g.problem)}
      <tr>
        <td><code>{g.problem}</code></td>
        <td>{g.reports.length}{#if g.filedUnder.length}<span class="also"> · also in {g.filedUnder.join(', ')}</span>{/if}</td>
        <td>{g.tenants}</td>
        <td>{g.firstSeen} → {g.lastSeen}</td>
        <td>
          {#if issues[g.problem]}
            <a href="https://github.com/{repo}/issues/{issues[g.problem]}">{repo}#{issues[g.problem]}</a>
          {:else}
            <span class="none">no ticket yet</span>
          {/if}
        </td>
      </tr>
    {/each}
  </tbody>
</table>

<style>
  .sum { font-size: 1.1rem; }
  .none { color: var(--warn); font-weight: 600; }
  .also { color: var(--muted); font-size: 0.85em; }
</style>
