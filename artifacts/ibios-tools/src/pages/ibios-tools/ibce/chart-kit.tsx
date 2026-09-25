/**
 * chart-kit.tsx
 * Shared utilities and components for IBCE publication-ready chart panels.
 */

import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { InfoTooltip } from './scientific-tooltip';
import { useTheme } from '@/contexts/theme-context';
import { useIbceLocale } from './locale';

// ── Types ───────────────────────────────────────────────────────────────────

export type BgMode = 'dark' | 'light';

export { computeKM, mergeKMSteps } from './km-analysis';
export type { KMStep } from './km-analysis';

// ── Export helpers ───────────────────────────────────────────────────────────

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportCsv(rows: Record<string, unknown>[], filename: string) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const header = keys.join(',');
  const body = rows.map(r =>
    keys.map(k => {
      const v = r[k];
      if (v === null || v === undefined) return '';
      if (typeof v === 'string' && (v.includes(',') || v.includes('"'))) return `"${v.replace(/"/g, '""')}"`;
      return String(v);
    }).join(','),
  ).join('\n');
  downloadBlob(new Blob([header + '\n' + body], { type: 'text/csv' }), filename);
}

function localizeExportRows(rows: Record<string, unknown>[], headers?: Record<string, string>) {
  if (!headers) return rows;
  return rows.map(row => Object.fromEntries(Object.entries(row).map(([key, value]) => [headers[key] ?? key, value])));
}

export function exportTsv(rows: Record<string, unknown>[], filename: string) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const header = keys.join('\t');
  const body = rows.map(r => keys.map(k => String(r[k] ?? '')).join('\t')).join('\n');
  downloadBlob(new Blob([header + '\n' + body], { type: 'text/tab-separated-values' }), filename);
}

export function exportExcel(rows: Record<string, unknown>[], sheetName: string, filename: string) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31));
  XLSX.writeFile(wb, filename);
}

export async function exportPanelAsPng(el: HTMLElement, filename: string) {
  const { toPng } = await import('html-to-image');
  const dataUrl = await toPng(el, { pixelRatio: 2, cacheBust: true, skipFonts: true });
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

// ── Chart theme helpers ──────────────────────────────────────────────────────

export function chartColors(bg: BgMode) {
  return {
    tick: bg === 'dark' ? '#94a3b8' : '#475569',
    legend: bg === 'dark' ? '#e2e8f0' : '#334155',
    grid: bg === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    axisLine: bg === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
    tooltip: bg === 'dark' ? { bg: '#0f1c30', border: '#1e3a5f', text: '#e2e8f0' } : { bg: '#fff', border: '#e2e8f0', text: '#0f172a' },
  };
}

export const PRIMARY_COLOR = '#f97316';   // orange - primary gene
export const COMPARE_COLOR = '#3b82f6';  // blue - comparison gene
export const HIGH_COLOR = '#22c55e';     // green - high expression stratum (KM)
export const LOW_COLOR = '#a855f7';      // purple - low expression stratum (KM)

// ── Toolbar component ────────────────────────────────────────────────────────

interface ToolbarProps {
  panelRef: React.RefObject<HTMLDivElement | null>;
  filename: string;
  csvData?: Record<string, unknown>[];
  sheetName?: string;
  bg: BgMode;
  onBgToggle: () => void;
  exportHeaders?: Record<string, string>;
  children?: React.ReactNode;
}

export function ChartToolbar({
  panelRef, filename, csvData, sheetName, bg, onBgToggle, exportHeaders, children,
}: ToolbarProps) {
  const [exporting, setExporting] = useState(false);
  const { t } = useIbceLocale();

  const handlePng = async () => {
    if (!panelRef.current) return;
    setExporting(true);
    try { await exportPanelAsPng(panelRef.current, `${filename}.png`); }
    finally { setExporting(false); }
  };

  return (
    <div className="ck-toolbar">
      <div className="ck-toolbar-left">{children}</div>
      <div className="ck-toolbar-right">
        <span className="ck-control-with-help">
          <button
            className={`ck-bg-btn ${bg}`}
            onClick={onBgToggle}
            aria-label={bg === 'dark' ? t('switchLight') : t('switchDark')}
          >
            {bg === 'dark' ? t('lightBg') : t('darkBg')}
          </button>
          <InfoTooltip entryKey="backgroundToggle" />
        </span>
        <span className="ck-divider" />
        <span className="ck-control-with-help">
          <button className="ck-export-btn" onClick={handlePng} disabled={exporting} aria-label={t('exportPng')}>
            {exporting ? '...' : 'PNG'}
          </button>
          <InfoTooltip entryKey="exportPng" />
        </span>
        {csvData && csvData.length > 0 && (
          <>
            <span className="ck-control-with-help">
              <button className="ck-export-btn" onClick={() => exportCsv(localizeExportRows(csvData, exportHeaders), `${filename}.csv`)} aria-label={t('exportCsv')}>CSV</button>
              <InfoTooltip entryKey="exportCsv" />
            </span>
            <span className="ck-control-with-help">
              <button className="ck-export-btn" onClick={() => exportTsv(localizeExportRows(csvData, exportHeaders), `${filename}.tsv`)} aria-label={t('exportTsv')}>TSV</button>
              <InfoTooltip entryKey="exportTsv" />
            </span>
            <span className="ck-control-with-help">
              <button className="ck-export-btn" onClick={() => exportExcel(localizeExportRows(csvData, exportHeaders), sheetName ?? filename, `${filename}.xlsx`)} aria-label={t('exportXls')}>XLS</button>
              <InfoTooltip entryKey="exportXls" />
            </span>
          </>
        )}
      </div>
    </div>
  );
}

// ── Panel wrapper ────────────────────────────────────────────────────────────

interface PanelLabelProps { letter: string }
export function PanelLabel({ letter }: PanelLabelProps) {
  return <span className="ck-panel-label">{letter}</span>;
}

export function useBgMode(): [BgMode, () => void] {
  const { theme } = useTheme();
  const [bg, setBg] = useState<BgMode>(theme);
  // A toolbar toggle is local to the panel. Any later global theme change resets
  // the panel to the global theme, so panels always re-synchronize predictably.
  useEffect(() => setBg(theme), [theme]);
  return [bg, () => setBg(b => b === 'dark' ? 'light' : 'dark')];
}
