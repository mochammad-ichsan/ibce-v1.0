/**
 * patient-rna-panel.tsx
 * RNA expression across patient cancer samples - horizontal bar chart.
 * Colored by cancer type, sortable, with export.
 */

import React, { useRef, useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import {
  ChartToolbar, PanelLabel, useBgMode, chartColors,
  PRIMARY_COLOR, COMPARE_COLOR,
} from './chart-kit';
import { InfoTooltip } from './scientific-tooltip';
import { useIbceLocale } from './locale';

interface PatientRnaEntry {
  sample: string;
  tissue: string;
  pTPM: number;
}

interface PatientRnaPanelProps {
  data: PatientRnaEntry[];
  gene: string;
  compareData?: PatientRnaEntry[];
  compareGene?: string;
  interpretation?: React.ReactNode;
}

type SortKey = 'pTPM' | 'name' | 'tissue';
const TOP_OPTIONS = [10, 20, 50, 0] as const;

// Distinct colors for cancer type differentiation
const TISSUE_COLORS = [
  '#f97316', '#3b82f6', '#22c55e', '#a855f7', '#ec4899',
  '#14b8a6', '#f59e0b', '#6366f1', '#ef4444', '#84cc16',
];

const CustomTooltip = ({ active, payload, label, bg }: any) => {
  if (!active || !payload?.length) return null;
  const c = chartColors(bg);
  const entry = payload[0]?.payload;
  return (
    <div style={{
      background: c.tooltip.bg,
      border: `1px solid ${c.tooltip.border}`,
      color: c.tooltip.text,
      padding: '8px 12px',
      borderRadius: 6,
      fontSize: 12,
      maxWidth: 280,
    }}>
      <div style={{ fontWeight: 700, marginBottom: 4, wordBreak: 'break-all' }}>{label}</div>
      <div style={{ color: c.tick, marginBottom: 4 }}>{entry?.tissue}</div>
      {payload.map((item: any) => (
        <div key={item.dataKey} style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <span style={{ color: item.fill }}>{item.name}</span>
          <span style={{ fontFamily: 'monospace' }}>{Number(item.value).toFixed(2)} pTPM</span>
        </div>
      ))}
    </div>
  );
};

export function PatientRnaPanel({ data, gene, compareData, compareGene, interpretation }: PatientRnaPanelProps) {
  const [bg, toggleBg] = useBgMode();
  const { t } = useIbceLocale();
  const [sort, setSort] = useState<SortKey>('pTPM');
  const [topN, setTopN] = useState<number>(20);
  const panelRef = useRef<HTMLDivElement>(null);
  const c = chartColors(bg);
  const isComparison = !!compareGene;
  const isCompareOnly = isComparison && !data.length && !!compareData?.length;
  const isPrimaryOnly = isComparison && !!data.length && !compareData?.length;

  // Build tissue color map
  const tissueMap = useMemo(() => {
    const types = [...new Set([...data, ...(compareData ?? [])].map(r => r.tissue))];
    const map = new Map<string, string>();
    types.forEach((t, i) => map.set(t, TISSUE_COLORS[i % TISSUE_COLORS.length]));
    return map;
  }, [data, compareData]);

  const chartData = useMemo(() => {
    if (isCompareOnly) {
      let rows = [...(compareData ?? [])];
      if (sort === 'pTPM') rows.sort((a, b) => b.pTPM - a.pTPM);
      else if (sort === 'name') rows.sort((a, b) => a.sample.localeCompare(b.sample));
      else if (sort === 'tissue') rows.sort((a, b) => a.tissue.localeCompare(b.tissue) || b.pTPM - a.pTPM);
      return (topN > 0 ? rows.slice(0, topN) : rows).map(r => ({
        name: r.sample.substring(0, 16) + (r.sample.length > 16 ? '..' : ''),
        fullName: r.sample,
        tissue: r.tissue,
        primary: undefined,
        compare: r.pTPM,
        color: tissueMap.get(r.tissue) ?? COMPARE_COLOR,
      }));
    }
    const compareMap = new Map((compareData ?? []).map(r => [r.sample, r]));
    let rows = data
      .filter(r => !isComparison || !compareData?.length || compareMap.has(r.sample))
      .map(r => ({
        ...r,
        compare: compareMap.get(r.sample)?.pTPM,
      }));
    if (sort === 'pTPM') rows.sort((a, b) => Math.max(b.pTPM, b.compare ?? 0) - Math.max(a.pTPM, a.compare ?? 0));
    else if (sort === 'name') rows.sort((a, b) => a.sample.localeCompare(b.sample));
    else if (sort === 'tissue') rows.sort((a, b) => a.tissue.localeCompare(b.tissue) || b.pTPM - a.pTPM);
    return (topN > 0 ? rows.slice(0, topN) : rows).map(r => ({
      name: r.sample.substring(0, 16) + (r.sample.length > 16 ? '..' : ''),
      fullName: r.sample,
      tissue: r.tissue,
      primary: r.pTPM,
      compare: r.compare,
      color: tissueMap.get(r.tissue) ?? PRIMARY_COLOR,
    }));
  }, [data, compareData, isComparison, isCompareOnly, sort, topN, tissueMap]);

  const rowsForExport = (rows: PatientRnaEntry[], geneName: string, role: string) =>
    rows.map(r => ({
      role,
      gene: geneName,
      sample: r.sample,
      tissue: r.tissue,
      pTPM: r.pTPM,
    }));
  const csvData = [
    ...(!data.length && compareGene
      ? [{ role: 'primary', gene, sample: '', tissue: 'data unavailable', pTPM: '' }]
      : []),
    ...rowsForExport(data, gene, 'primary'),
    ...(compareData?.length && compareGene
      ? rowsForExport(compareData, compareGene, 'comparison')
      : compareGene
        ? [{ role: 'comparison', gene: compareGene, sample: '', tissue: 'data unavailable', pTPM: '' }]
      : []),
  ];

  const rowHeight = 28;
  const chartHeight = Math.max(200, chartData.length * rowHeight + 40);

  // Tissue legend
  const uniqueTissues = useMemo(() => {
    const seen = new Set<string>();
    const result: { tissue: string; color: string }[] = [];
    for (const r of chartData) {
      if (!seen.has(r.tissue)) {
        seen.add(r.tissue);
        result.push({ tissue: r.tissue, color: r.color });
      }
    }
    return result;
  }, [chartData]);

  return (
    <div className={`ibce-chart-section bg-${bg}`} ref={panelRef}>
      <div className="ibce-chart-section-head">
         <h2 className="ibce-section-h"><PanelLabel letter="D" /> {t('patientRna')} <InfoTooltip entryKey="patientSample" /></h2>
        <span className="ibce-src-tag">HPA RNA CANCER SAMPLE <InfoTooltip entryKey="ptpm" /></span>
      </div>

      <ChartToolbar
        panelRef={panelRef}
        filename={`PatientRNA_${gene}${compareGene ? `_vs_${compareGene}` : ''}`}
        csvData={csvData}
        exportHeaders={{ role: t('role'), gene: t('gene'), sample: 'Sample', tissue: 'Tissue', pTPM: 'pTPM' }}
        sheetName="PatientRNA"
        bg={bg}
        onBgToggle={toggleBg}
      >
        <div className="ck-ctrl-group">
           <span className="ck-ctrl-label">{t('sort')}</span>
          <InfoTooltip entryKey="ranking" />
          {(['pTPM', 'name', 'tissue'] as SortKey[]).map(k => (
            <button
              key={k}
              className={`ck-ctrl-btn ${sort === k ? 'active' : ''}`}
              onClick={() => setSort(k)}
              aria-pressed={sort === k}
              aria-label={`Sort patient samples by ${k}`}
            >
               {k === 'pTPM' ? 'pTPM' : k === 'name' ? 'A-Z' : t('cancerType')}
            </button>
          ))}
        </div>
        <div className="ck-ctrl-group">
           <span className="ck-ctrl-label">{t('show')}</span>
          <InfoTooltip entryKey="ranking" />
          {TOP_OPTIONS.map(n => (
            <button
              key={n}
              className={`ck-ctrl-btn ${topN === n ? 'active' : ''}`}
              onClick={() => setTopN(n)}
              aria-pressed={topN === n}
               aria-label={n === 0 ? t('showAllSamples') : t('showTopSamples', { count: n })}
            >
               {n === 0 ? t('all') : t('top', { count: n })}
            </button>
          ))}
        </div>
      </ChartToolbar>

      {isPrimaryOnly && (
        <div className="ibce-missing-data-notice" role="status">
           {t('noPatientData', { gene: compareGene, other: gene })}
        </div>
      )}
      {isCompareOnly && (
        <div className="ibce-missing-data-notice" role="status">
           {t('noPatientData', { gene, other: compareGene })}
        </div>
      )}
      {!data.length && !isComparison ? (
         <div className="ibce-empty-small">{t('patientUnavailable')}</div>
      ) : isComparison && !chartData.length ? (
        <div className="ibce-empty-small">
          {!data.length && !compareData?.length
             ? t('noEitherPatient', { gene, other: compareGene })
            : compareData?.length
             ? t('noSharedPatient', { gene, other: compareGene })
             : t('patientUnavailable')}
        </div>
      ) : (
        <>
          <div
            className="ibce-chart-body"
            style={{ height: chartHeight }}
            role="img"
             aria-label={isComparison
               ? t('patientCompareChartAria', { gene, other: compareGene ?? '', count: chartData.length })
               : t('patientChartAria', { gene, count: chartData.length })}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={chartData}
                margin={{ top: 4, right: 40, bottom: 4, left: 8 }}
                barCategoryGap={isComparison ? '20%' : '28%'}
              >
                <CartesianGrid horizontal={false} stroke={c.grid} strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  tick={{ fill: c.tick, fontSize: 11, fontFamily: "'Space Mono', monospace" }}
                  axisLine={{ stroke: c.axisLine }}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={130}
                  tick={{ fill: c.tick, fontSize: 10, fontFamily: "'Space Mono', monospace" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={<CustomTooltip bg={bg} />}
                  cursor={{ fill: bg === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}
                />
                <Bar
                  dataKey="primary"
                  name={gene}
                  fill={isComparison ? PRIMARY_COLOR : undefined}
                  radius={[0, 3, 3, 0]}
                  maxBarSize={20}
                >
                  {!isComparison && chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
                {isComparison && (
                  <Bar
                    dataKey="compare"
                    name={compareGene}
                    fill={COMPARE_COLOR}
                    radius={[0, 3, 3, 0]}
                    maxBarSize={20}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="ibce-chart-key" style={{ color: c.tick }}>
            <span className="ibce-chart-unit">pTPM</span>
            {isComparison && !isPrimaryOnly && !isCompareOnly && (
              <div className="ibce-chart-series">
                <span><i style={{ background: PRIMARY_COLOR }} aria-hidden="true" />{gene}</span>
                <span><i style={{ background: COMPARE_COLOR }} aria-hidden="true" />{compareGene}</span>
              </div>
            )}
          </div>

          {!isComparison && uniqueTissues.length > 1 && (
             <div className="pat-tissue-legend" aria-label={t('tissueLegendAria')}>
              {uniqueTissues.map(({ tissue, color }) => (
                <div key={tissue} className="pat-tissue-item">
                  <span className="pat-tissue-dot" style={{ background: color }} />
                  <span className="pat-tissue-label">{tissue}</span>
                </div>
              ))}
              <InfoTooltip entryKey="tissueColors" />
            </div>
          )}

          <div className="ibce-chart-footer">
             {t('samplesShown', { count: chartData.length })}
            {isCompareOnly
               ? ` ${t('availableFor', { gene: compareGene, other: gene })}`
              : isPrimaryOnly
               ? ` ${t('availableFor', { gene, other: compareGene })}`
              : isComparison
               ? ` ${t('sharedBy', { gene, other: compareGene })}`
               : data.length > chartData.length ? ` ${t('total', { count: data.length })}` : ''}
            {isComparison && !isPrimaryOnly && !isCompareOnly && chartData.length > 0
               ? ` | ${t('colorComparison', { gene, other: compareGene })}`
              : ''}
            {' '}<InfoTooltip entryKey={isComparison ? 'chartColors' : 'rnaExpression'} />
          </div>
        </>
      )}
      {interpretation}
    </div>
  );
}
