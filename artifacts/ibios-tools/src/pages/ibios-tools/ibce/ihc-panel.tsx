/**
 * ihc-panel.tsx
 * IHC protein expression - donut chart, publication-ready.
 */

import React, { useRef, useState } from 'react';
import {
  ChartToolbar, PanelLabel, useBgMode,
  type BgMode,
} from './chart-kit';
import { InfoTooltip, ScientificTooltip } from './scientific-tooltip';
import { useIbceLocale } from './locale';

interface IhcEntry {
  cancer: string;
  high: number;
  medium: number;
  low: number;
  notDetected: number;
  total: number;
}

interface IhcPanelProps {
  data: IhcEntry[];
  gene: string;
  compareData?: IhcEntry[];
  compareGene?: string;
  interpretation?: React.ReactNode;
}

const IHC_COLORS = ['#0f766e', '#2dd4bf', '#94a3b8', '#334155'];
const IHC_KEYS = ['High', 'Medium', 'Low', 'Not detected'];

/** Pure SVG donut - no recharts, no ResizeObserver, always renders. */
function SvgDonut({ slices, size = 200, inner = 55, outer = 82, bg }: {
  slices: { name: string; value: number; color: string }[];
  size?: number;
  inner?: number;
  outer?: number;
  bg: BgMode;
}) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string } | null>(null);
  const total = slices.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;

  const cx = size / 2;
  const cy = size / 2;
  const gap = 0.02; // radians gap between slices

  let cursor = -Math.PI / 2; // start at top
  const paths: { d: string; color: string; name: string; value: number }[] = [];

  for (const sl of slices) {
    const frac = sl.value / total;
    const sweep = frac * 2 * Math.PI - gap;
    const start = cursor + gap / 2;
    const end = start + sweep;

    const x1 = cx + outer * Math.cos(start);
    const y1 = cy + outer * Math.sin(start);
    const x2 = cx + outer * Math.cos(end);
    const y2 = cy + outer * Math.sin(end);
    const ix1 = cx + inner * Math.cos(end);
    const iy1 = cy + inner * Math.sin(end);
    const ix2 = cx + inner * Math.cos(start);
    const iy2 = cy + inner * Math.sin(start);
    const lg = sweep > Math.PI ? 1 : 0;

    const d = [
      `M ${x1} ${y1}`,
      `A ${outer} ${outer} 0 ${lg} 1 ${x2} ${y2}`,
      `L ${ix1} ${iy1}`,
      `A ${inner} ${inner} 0 ${lg} 0 ${ix2} ${iy2}`,
      'Z',
    ].join(' ');

    paths.push({ d, color: sl.color, name: sl.name, value: sl.value });
    cursor += frac * 2 * Math.PI;
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <svg width={size} height={size}>
        {paths.map((p, i) => (
          <path
            key={i}
            d={p.d}
            fill={p.color}
            onMouseEnter={(e) => {
              const rect = (e.target as SVGElement).closest('svg')!.getBoundingClientRect();
              setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, label: `${p.name}: ${p.value}` });
            }}
            onMouseLeave={() => setTooltip(null)}
            onFocus={() => setTooltip({ x: cx, y: cy, label: `${p.name}: ${p.value}` })}
            onBlur={() => setTooltip(null)}
            tabIndex={0}
            role="img"
            aria-label={`${p.name} IHC staining: ${p.value} samples`}
            style={{ cursor: 'pointer' }}
          >
            <title>{`${p.name}: ${p.value} samples`}</title>
          </path>
        ))}
      </svg>
      {tooltip && (
        <div style={{
          position: 'absolute', left: tooltip.x + 8, top: tooltip.y - 10,
          background: bg === 'dark' ? 'hsl(224 71% 10%)' : '#fff', color: bg === 'dark' ? '#e2e8f0' : '#0f172a', border: `1px solid ${bg === 'dark' ? 'hsl(224 40% 22%)' : '#e2e8f0'}`,
          fontSize: 11, fontFamily: 'Space Mono,monospace', padding: '3px 8px', borderRadius: 4,
          pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 10,
        }}>
          {tooltip.label}
        </div>
      )}
    </div>
  );
}

function DonutChart({
  entry,
  bg,
  gene,
  role,
}: {
  entry: IhcEntry;
  bg: BgMode;
  gene: string;
  role: 'Primary gene' | 'Comparison gene';
}) {
  const { t } = useIbceLocale();
  const slices = [
    { name: t('high'), value: entry.high, color: IHC_COLORS[0] },
    { name: t('medium'), value: entry.medium, color: IHC_COLORS[1] },
    { name: t('low'), value: entry.low, color: IHC_COLORS[2] },
    { name: t('notDetected'), value: entry.notDetected, color: IHC_COLORS[3] },
  ].filter(s => s.value > 0);

  return (
    <div className="ihc-donut-wrap">
      <div className={`ibce-gene-result-label ${role === 'Comparison gene' ? 'comparison' : 'primary'}`}>
        <span className="ibce-gene-result-dot" />
        <span>{role === 'Primary gene' ? t('primaryGene') : t('comparisonGene')}</span>
        <strong>{gene}</strong>
      </div>
      <div className="ihc-donut-title">{entry.cancer}</div>
      <div className="ihc-donut-n"><ScientificTooltip entryKey="sampleCount">n = {entry.total}</ScientificTooltip></div>
       <SvgDonut slices={slices} size={200} inner={55} outer={82} bg={bg} />
      <div className="ihc-legend">
        {[
          { label: t('high'), count: entry.high, color: IHC_COLORS[0] },
          { label: t('medium'), count: entry.medium, color: IHC_COLORS[1] },
          { label: t('low'), count: entry.low, color: IHC_COLORS[2] },
          { label: t('notDetected'), count: entry.notDetected, color: IHC_COLORS[3] },
        ].map(({ label, count, color }) => (
          <div key={label} className="ihc-legend-item">
            <span className="ihc-legend-dot" style={{ background: color }} />
            <span className="ihc-legend-label">{label}</span>
            <span className="ihc-legend-count">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function IhcPanel({ data, gene, compareData, compareGene, interpretation }: IhcPanelProps) {
  const [bg, toggleBg] = useBgMode();
  const { t } = useIbceLocale();
  const panelRef = useRef<HTMLDivElement>(null);

  const rowsForExport = (entries: IhcEntry[], geneName: string, role: string) =>
    entries.flatMap(e => [
      { role, gene: geneName, cancer: e.cancer, level: 'High', count: e.high, total: e.total },
      { role, gene: geneName, cancer: e.cancer, level: 'Medium', count: e.medium, total: e.total },
      { role, gene: geneName, cancer: e.cancer, level: 'Low', count: e.low, total: e.total },
      { role, gene: geneName, cancer: e.cancer, level: 'Not detected', count: e.notDetected, total: e.total },
    ]);
  const csvData = [
    ...(!data.length && compareGene
      ? [{ role: 'primary', gene, cancer: '', level: 'data unavailable', count: '', total: '' }]
      : []),
    ...rowsForExport(data, gene, 'primary'),
    ...(compareData?.length && compareGene
      ? rowsForExport(compareData, compareGene, 'comparison')
      : compareGene
        ? [{ role: 'comparison', gene: compareGene, cancer: '', level: 'data unavailable', count: '', total: '' }]
      : []),
  ];

  if (!data.length && !compareGene) {
    return (
      <div className={`ibce-chart-section bg-${bg}`}>
        <div className="ibce-chart-section-head">
          <h2 className="ibce-section-h"><PanelLabel letter="A" /> {t('proteinIhc')} <InfoTooltip entryKey="ihc" /></h2>
          <span className="ibce-src-tag">HUMAN PROTEIN ATLAS</span>
        </div>
          <div className="ibce-empty-small">{t('noIhc', { gene })}</div>
          {interpretation}
      </div>
    );
  }

  return (
    <div className={`ibce-chart-section bg-${bg}`} ref={panelRef}>
      <div className="ibce-chart-section-head">
         <h2 className="ibce-section-h"><PanelLabel letter="A" /> {t('proteinIhc')} <InfoTooltip entryKey="ihc" /></h2>
        <span className="ibce-src-tag">HUMAN PROTEIN ATLAS <InfoTooltip entryKey="ihcLevels" /></span>
      </div>
      <ChartToolbar
        panelRef={panelRef}
        filename={`IHC_${gene}${compareGene ? `_vs_${compareGene}` : ''}`}
        csvData={csvData}
        exportHeaders={{ role: t('role'), gene: t('gene'), cancer: t('cancer'), level: t('level'), count: t('count'), total: t('total') }}
        sheetName="IHC"
        bg={bg}
        onBgToggle={toggleBg}
      />
      <div className="ihc-donuts-row">
        {!data.length && (
          <div className="ihc-donut-wrap ihc-comparison-empty">
            <div className="ibce-gene-result-label primary">
              <span className="ibce-gene-result-dot" />
               <span>{t('primaryGene')}</span>
              <strong>{gene}</strong>
            </div>
             <div className="ibce-empty-small">{t('noIhc', { gene })}</div>
          </div>
        )}
        {data.map(entry => (
          <DonutChart key={entry.cancer} entry={entry} bg={bg} gene={gene} role="Primary gene" />
        ))}
        {compareData?.map(entry => (
          <DonutChart
            key={`cmp-${entry.cancer}`}
            entry={entry}
            bg={bg}
            gene={compareGene ?? 'Comparison'}
            role="Comparison gene"
          />
        ))}
        {compareGene && !compareData?.length && (
          <div className="ihc-donut-wrap ihc-comparison-empty">
            <div className="ibce-gene-result-label comparison">
              <span className="ibce-gene-result-dot" />
               <span>{t('comparisonGene')}</span>
              <strong>{compareGene}</strong>
            </div>
             <div className="ibce-empty-small">{t('noIhc', { gene: compareGene })}</div>
          </div>
        )}
      </div>
      {interpretation}
    </div>
  );
}
