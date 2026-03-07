/**
 * Export Reports — generates downloadable CSV and PDF files
 * from the user's session history and profile data.
 *
 * PDF is generated as a styled HTML document rendered via the
 * browser's print-to-PDF pipeline (window.print or Blob).
 */

import type { SessionLog } from "@/hooks/useSessionLogs";
import type { ConnoisseurProfile } from "@/lib/connoisseurProfile";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type ExportFormat = "csv" | "pdf";

export interface ExportData {
  sessions: SessionLog[];
  profile: ConnoisseurProfile | null;
  displayName?: string;
}

/* ------------------------------------------------------------------ */
/*  CSV export                                                         */
/* ------------------------------------------------------------------ */

const CSV_COLUMNS: { key: keyof SessionLog | string; label: string }[] = [
  { key: "created_at", label: "Date" },
  { key: "strain_name_text", label: "Strain" },
  { key: "strain_type", label: "Type" },
  { key: "intent", label: "Intent" },
  { key: "method", label: "Method" },
  { key: "dose", label: "Dose" },
  { key: "dose_level", label: "Dose Level" },
  { key: "outcome", label: "Outcome" },
  { key: "comfort_score", label: "Comfort" },
  { key: "effect_relaxation", label: "Relaxation" },
  { key: "effect_focus", label: "Focus" },
  { key: "effect_euphoria", label: "Euphoria" },
  { key: "effect_anxiety", label: "Anxiety" },
  { key: "effect_pain_relief", label: "Pain Relief" },
  { key: "effect_sleepiness", label: "Sleepiness" },
  { key: "time_of_day", label: "Time of Day" },
  { key: "setting", label: "Setting" },
  { key: "aroma_tags", label: "Aromas" },
  { key: "flavor_tags", label: "Flavors" },
  { key: "notes", label: "Notes" },
];

function escapeCSV(val: unknown): string {
  if (val == null) return "";
  const str = Array.isArray(val) ? val.join("; ") : String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function generateCSV(data: ExportData): Blob {
  const header = CSV_COLUMNS.map((c) => c.label).join(",");
  const rows = data.sessions.map((s) =>
    CSV_COLUMNS.map((c) => escapeCSV((s as Record<string, unknown>)[c.key])).join(","),
  );
  const content = [header, ...rows].join("\n");
  return new Blob([content], { type: "text/csv;charset=utf-8" });
}

/* ------------------------------------------------------------------ */
/*  PDF export (styled HTML → print)                                   */
/* ------------------------------------------------------------------ */

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric",
    });
  } catch { return iso; }
}

function buildDosePatterns(sessions: SessionLog[]) {
  const counts: Record<string, number> = {};
  for (const s of sessions) {
    const lvl = s.dose_level ?? "unspecified";
    counts[lvl] = (counts[lvl] ?? 0) + 1;
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([lvl, n]) => `${lvl.charAt(0).toUpperCase() + lvl.slice(1)}: ${n} sessions`)
    .join(" · ");
}

function buildTerpSummary(sessions: SessionLog[]) {
  const TERP_MAP: Record<string, string> = {
    pine: "Pinene", citrus: "Limonene", lemon: "Limonene",
    lavender: "Linalool", floral: "Linalool", mango: "Myrcene",
    earthy: "Myrcene", pepper: "Caryophyllene", spicy: "Caryophyllene",
    woody: "Humulene", berry: "Terpinolene", fruity: "Terpinolene",
  };
  const terpCounts: Record<string, number> = {};
  for (const s of sessions) {
    const tags = [...(s.aroma_tags ?? []), ...(s.flavor_tags ?? [])];
    for (const tag of tags) {
      const low = tag.toLowerCase();
      for (const [kw, terp] of Object.entries(TERP_MAP)) {
        if (low.includes(kw)) terpCounts[terp] = (terpCounts[terp] ?? 0) + 1;
      }
    }
  }
  return Object.entries(terpCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, n]) => `${name} (${n})`)
    .join(", ") || "No terpene data yet";
}

export function generatePDF(data: ExportData): Blob {
  const { sessions, profile, displayName } = data;
  const positive = sessions.filter((s) => s.outcome === "positive" || (s.comfort_score ?? 0) >= 7).length;
  const posRate = sessions.length ? Math.round((positive / sessions.length) * 100) : 0;

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8">
<title>Signal Leaf — Cannabis Report</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1a1a1a;padding:40px;max-width:800px;margin:0 auto;font-size:13px;line-height:1.5}
h1{font-size:22px;font-weight:600;margin-bottom:4px;color:#2d5a4a}
h2{font-size:16px;font-weight:600;margin:28px 0 12px;color:#2d5a4a;border-bottom:1px solid #e0e0e0;padding-bottom:6px}
.subtitle{color:#666;font-size:12px;margin-bottom:24px}
.brand{display:flex;align-items:center;gap:8px;margin-bottom:24px}
.brand svg{width:28px;height:28px}
.stat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:8px}
.stat{background:#f5faf8;border-radius:8px;padding:12px;text-align:center}
.stat .value{font-size:20px;font-weight:700;color:#2d5a4a}
.stat .label{font-size:11px;color:#666;margin-top:2px}
.profile-box{background:#f5faf8;border-radius:10px;padding:16px;margin-bottom:8px}
.profile-box .name{font-size:15px;font-weight:600;color:#2d5a4a}
.profile-box .sub{font-size:11px;color:#666;margin-top:2px}
.tag{display:inline-block;background:#e8f3ee;color:#2d5a4a;border-radius:4px;padding:2px 8px;font-size:11px;margin:2px}
table{width:100%;border-collapse:collapse;font-size:11px;margin-top:8px}
th{text-align:left;border-bottom:2px solid #2d5a4a;padding:6px 4px;color:#2d5a4a;font-weight:600}
td{padding:5px 4px;border-bottom:1px solid #eee}
tr:nth-child(even){background:#fafafa}
.footer{margin-top:32px;text-align:center;font-size:10px;color:#999;border-top:1px solid #eee;padding-top:12px}
@media print{body{padding:20px}h2{page-break-after:avoid}table{page-break-inside:auto}tr{page-break-inside:avoid}}
</style></head><body>

<div class="brand">
<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="16" cy="16" r="15" stroke="#2d5a4a" stroke-width="1.5" fill="#f5faf8"/>
<path d="M16 8c-2 3-6 6-6 10a6 6 0 0 0 12 0c0-4-4-7-6-10z" fill="#2d5a4a" opacity="0.15" stroke="#2d5a4a" stroke-width="1.2"/>
</svg>
<div>
<h1>Signal Leaf Report</h1>
<div class="subtitle">${displayName ? `${displayName} · ` : ""}Generated ${formatDate(new Date().toISOString())} · ${sessions.length} sessions</div>
</div>
</div>

${profile ? `
<h2>Connoisseur Profile</h2>
<div class="profile-box">
<div class="name">${profile.profileName}</div>
<div class="sub">${profile.subtitle}</div>
<div style="margin-top:8px">
<strong style="font-size:11px;color:#2d5a4a">Strengths:</strong>
${profile.strengths.map((s) => `<span class="tag">${s}</span>`).join(" ")}
</div>
${profile.likelyPreferences.length ? `
<div style="margin-top:6px">
<strong style="font-size:11px;color:#2d5a4a">Preferences:</strong>
${profile.likelyPreferences.map((s) => `<span class="tag">${s}</span>`).join(" ")}
</div>` : ""}
</div>` : ""}

<h2>Overview</h2>
<div class="stat-grid">
<div class="stat"><div class="value">${sessions.length}</div><div class="label">Total Sessions</div></div>
<div class="stat"><div class="value">${posRate}%</div><div class="label">Positive Rate</div></div>
<div class="stat"><div class="value">${new Set(sessions.map((s) => s.strain_name_text)).size}</div><div class="label">Unique Strains</div></div>
</div>

<h2>Dose Patterns</h2>
<p>${buildDosePatterns(sessions)}</p>

<h2>Terpene Summary</h2>
<p>${buildTerpSummary(sessions)}</p>

<h2>Session History</h2>
<table>
<thead><tr><th>Date</th><th>Strain</th><th>Intent</th><th>Dose</th><th>Outcome</th><th>Comfort</th></tr></thead>
<tbody>
${sessions
  .slice()
  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  .slice(0, 100)
  .map((s) => `<tr>
    <td>${formatDate(s.created_at)}</td>
    <td>${s.strain_name_text}</td>
    <td>${s.intent}</td>
    <td>${s.dose_level ?? s.dose}</td>
    <td>${s.outcome ?? "—"}</td>
    <td>${s.comfort_score ?? "—"}</td>
  </tr>`).join("\n")}
</tbody>
</table>
${sessions.length > 100 ? `<p style="font-size:11px;color:#999;margin-top:4px">Showing 100 of ${sessions.length} sessions. Export CSV for full data.</p>` : ""}

<div class="footer">Signal Leaf · Personal Cannabis Intelligence · signalleaf.app<br/>This report is for personal use only. Not medical advice.</div>
</body></html>`;

  return new Blob([html], { type: "text/html;charset=utf-8" });
}

/* ------------------------------------------------------------------ */
/*  Download helper                                                    */
/* ------------------------------------------------------------------ */

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

export function exportReport(format: ExportFormat, data: ExportData) {
  const dateStr = new Date().toISOString().slice(0, 10);
  if (format === "csv") {
    downloadBlob(generateCSV(data), `signal-leaf-sessions-${dateStr}.csv`);
  } else {
    downloadBlob(generatePDF(data), `signal-leaf-report-${dateStr}.html`);
  }
}
