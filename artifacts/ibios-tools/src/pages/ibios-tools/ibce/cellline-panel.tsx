/**
 * cellline-panel.tsx
 * RNA expression across breast cancer cell lines - interactive horizontal bar chart.
 * Supports gene comparison, sorting, top-N selection, BG toggle, and export.
 */

import React, { useRef, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Cell, ResponsiveContainer,
} from 'recharts';
import {
  ChartToolbar, PanelLabel, useBgMode, chartColors,
  PRIMARY_COLOR, COMPARE_COLOR,
} from './chart-kit';
import { InfoTooltip } from './scientific-tooltip';
import { useIbceLocale } from './locale';

interface CellLineEntry {
  cellLine: string;
  diseaseSubtype?: string | null;
  nTPM: number | null;
  tpm?: number | null;
  pTPM?: number | null;
  status?: string;
}

interface CellLinePanelProps {
  data: CellLineEntry[];
  gene: string;
  compareData?: CellLineEntry[];
  compareGene?: string;
  interpretation?: React.ReactNode;
}

type SortKey = 'nTPM' | 'name' | 'subtype';
const TOP_OPTIONS = [5, 10, 20, 50, 0] as const; // 0 = all

function formatNTPM(v: number | null) {
  if (v == null) return '';
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
  return v.toFixed(1);
}

const CustomTooltip = ({ active, payload, label, bg, compareGene, gene }: any) => {
  if (!active || !payload?.length) return null;
  const c = chartColors(bg);
  return (
    <div style={{
      background: c.tooltip.bg,
      border: `1px solid ${c.tooltip.border}`,
      color: c.tooltip.text,
      padding: '8px 12px',
      borderRadius: 6,
      fontSize: 12,
      minWidth: 160,
    }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>{label}</div>
      {payload[0]?.payload?.conflict && (
        <div style={{ color: '#ef4444', marginBottom: 6, fontWeight: 600 }}>(!) Discordant duplicate measurements</div>
      )}
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <span style={{ color: p.fill }}>{p.name}</span>
          <span style={{ fontFamily: 'monospace' }}>{p.value === undefined ? 'Conflict/No Data' : `${Number(p.value).toFixed(2)} nTPM`}</span>
        </div>
      ))}
    </div>
  );
};

const CustomYAxisTick = (props: any) => {
  const { x, y, payload, bg, chartData, apiMap } = props;
  const c = chartColors(bg);
  const row = chartData?.find((d: any) => d.name === payload.value);
  const apiInfo = apiMap?.get(payload.value);

  let titleText = payload.value;
  if (apiInfo) {
    const age = apiInfo.ageYears ? `${apiInfo.ageYears}y` : (apiInfo.ageRaw || 'Unknown age');
    const sex = apiInfo.sex || 'Unknown sex';
    const hpaOrigin = apiInfo.origin || 'Unknown origin';
    const hpaSite = apiInfo.site || 'Unknown site';
    const hpaSubtype = apiInfo.diseaseSubtype || 'Unknown subtype';
    const cellosaurusDerived = apiInfo.derivedSiteRaw || 'Unknown derived site';
    const cellosaurusClass = apiInfo.diseaseClassificationRaw || 'Unknown classification';

    titleText = `${payload.value}
Patient: ${sex}, ${age}
HPA Origin/Site: ${hpaOrigin} / ${hpaSite}
HPA Subtype: ${hpaSubtype}
Cellosaurus Derived: ${cellosaurusDerived}
Cellosaurus Classification: ${cellosaurusClass}${row?.conflict ? '\n\n[!] Discordant duplicate measurements' : ''}`;
  } else if (row) {
    titleText = `${row.name}\nSubtype: ${row.subtype === '-' || row.subtype === 'unknown' ? 'Unknown/Unreported' : row.subtype}\nSource: IBCE Curated${row.conflict ? '\n[!] Discordant duplicate measurements' : ''}`;
  }

  const content = (
    <text x={0} y={0} dy={4} textAnchor="end" fill={row?.conflict ? '#ef4444' : c.tick} fontSize={11} fontFamily="'Space Mono', monospace" style={apiInfo?.sourceUrl ? { textDecoration: 'underline' } : {}}>
      {payload.value}{row?.conflict ? ' (!)' : ''}
    </text>
  );

  return (
    <g transform={`translate(${x},${y})`} tabIndex={0} style={{ cursor: apiInfo?.sourceUrl ? 'pointer' : 'help', outline: 'none' }}>
      <title>{titleText}</title>
      {apiInfo?.sourceUrl ? (
        <a href={apiInfo.sourceUrl} target="_blank" rel="noreferrer" aria-label={`View ${payload.value} in Cellosaurus`}>
          {content}
        </a>
      ) : content}
    </g>
  );
};

export function CellLinePanel({ data, gene, compareData, compareGene, interpretation }: CellLinePanelProps) {
  const [bg, toggleBg] = useBgMode();
  const { t } = useIbceLocale();
  const [sort, setSort] = useState<SortKey>('nTPM');
  const [topN, setTopN] = useState<number>(20);
  const panelRef = useRef<HTMLDivElement>(null);
  const c = chartColors(bg);
  const isComparison = !!compareGene;
  const isCompareOnly = isComparison && !data.length && !!compareData?.length;
  const isPrimaryOnly = isComparison && !!data.length && !compareData?.length;

  const { data: cellLinesApiData } = useQuery({
    queryKey: ['ibce', 'cell-lines'],
    queryFn: async () => {
      const res = await fetch('/api/ibce/cell-lines');
      if (!res.ok) throw new Error('Failed to fetch cell lines');
      return res.json();
    }
  });

  const apiMap = useMemo(() => {
    const map = new Map<string, any>();
    if (cellLinesApiData?.cellLines) {
      for (const c of cellLinesApiData.cellLines) {
        map.set(c.cellLine, c);
      }
    }
    return map;
  }, [cellLinesApiData]);

  const chartData = useMemo(() => {
    if (isCompareOnly) {
      const uniqueCompare = new Map<string, CellLineEntry & { conflict?: boolean }>();
      for (const r of (compareData ?? [])) {
        const existing = uniqueCompare.get(r.cellLine);
        if (existing) {
          if (existing.nTPM !== r.nTPM || existing.diseaseSubtype !== r.diseaseSubtype || existing.tpm !== r.tpm || existing.pTPM !== r.pTPM) existing.conflict = true;
        } else {
          uniqueCompare.set(r.cellLine, { ...r });
        }
      }
      let rows = Array.from(uniqueCompare.values());
      if (sort === 'nTPM') rows.sort((a, b) => (b.nTPM ?? 0) - (a.nTPM ?? 0));
      else if (sort === 'name') rows.sort((a, b) => a.cellLine.localeCompare(b.cellLine));
      else if (sort === 'subtype') rows.sort((a, b) => (a.diseaseSubtype ?? '').localeCompare(b.diseaseSubtype ?? ''));
      const limited = topN > 0 ? rows.slice(0, topN) : rows;
      return limited.map(r => ({
        name: r.cellLine,
        primary: undefined,
        compare: (r.conflict || r.status === 'discordant' || r.nTPM == null) ? undefined : r.nTPM,
        subtype: r.diseaseSubtype ?? '-',
        conflict: r.conflict || r.status === 'discordant',
        raw: r,
      }));
    }

    const uniqueRows = new Map<string, CellLineEntry & { conflict?: boolean }>();
    for (const r of data) {
      const existing = uniqueRows.get(r.cellLine);
      if (existing) {
        if (existing.nTPM !== r.nTPM || existing.diseaseSubtype !== r.diseaseSubtype || existing.tpm !== r.tpm || existing.pTPM !== r.pTPM) {
          existing.conflict = true;
        }
      } else {
        uniqueRows.set(r.cellLine, { ...r });
      }
    }
    let rows = Array.from(uniqueRows.values());

    const cmpMap = new Map();
    const uniqueCompare = new Map<string, CellLineEntry & { conflict?: boolean }>();
    for (const r of (compareData ?? [])) {
      const existing = uniqueCompare.get(r.cellLine);
      if (existing) {
        if (existing.nTPM !== r.nTPM || existing.tpm !== r.tpm || existing.pTPM !== r.pTPM) existing.conflict = true;
      } else {
        uniqueCompare.set(r.cellLine, { ...r });
      }
    }
    for (const r of uniqueCompare.values()) {
      cmpMap.set(r.cellLine, r);
    }

    if (isComparison && compareData?.length) rows = rows.filter(r => cmpMap.has(r.cellLine));
    if (sort === 'nTPM') rows.sort((a, b) => (b.nTPM ?? 0) - (a.nTPM ?? 0));
    else if (sort === 'name') rows.sort((a, b) => a.cellLine.localeCompare(b.cellLine));
    else if (sort === 'subtype') rows.sort((a, b) => (a.diseaseSubtype ?? '').localeCompare(b.diseaseSubtype ?? ''));

    const limited = topN > 0 ? rows.slice(0, topN) : rows;

    if (!isComparison) {
      return limited.map(r => ({
        name: r.cellLine,
        primary: (r.conflict || r.status === 'discordant' || r.nTPM == null) ? undefined : r.nTPM,
        subtype: r.diseaseSubtype ?? '-',
        conflict: r.conflict || r.status === 'discordant',
        raw: r,
      }));
    }

    return limited.map(r => {
      const cmp = cmpMap.get(r.cellLine);
      const isPriConflict = r.conflict || r.status === 'discordant';
      const isCmpConflict = cmp?.conflict || cmp?.status === 'discordant';
      return {
        name: r.cellLine,
        primary: (isPriConflict || r.nTPM == null) ? undefined : r.nTPM,
        compare: (isCmpConflict || cmp?.nTPM == null) ? undefined : cmp?.nTPM,
        subtype: r.diseaseSubtype ?? '-',
        conflict: isPriConflict || isCmpConflict,
        raw: r,
      };
    });
  }, [data, compareData, sort, topN, isComparison, isCompareOnly]);

  const rowsForExport = (rows: CellLineEntry[], geneName: string, role: string) =>
    rows.map(r => ({
      role,
      gene: geneName,
      cellLine: r.cellLine,
      diseaseSubtype: r.diseaseSubtype ?? '',
      nTPM: r.nTPM ?? '',
      tpm: r.tpm ?? '',
      pTPM: r.pTPM ?? '',
      status: r.status ?? '',
    }));
  const csvData = [
    ...(!data.length && compareGene
      ? [{
          role: 'primary',
          gene,
          cellLine: '',
          diseaseSubtype: 'data unavailable',
          nTPM: '',
          tpm: '',
          pTPM: '',
          status: '',
        }]
      : []),
    ...rowsForExport(data, gene, 'primary'),
    ...(compareData?.length && compareGene
      ? rowsForExport(compareData, compareGene, 'comparison')
      : compareGene
        ? [{
            role: 'comparison',
            gene: compareGene,
            cellLine: '',
            diseaseSubtype: 'data unavailable',
            nTPM: '',
            tpm: '',
            pTPM: '',
            status: '',
          }]
      : []),
  ];

  const rowHeight = 32;
  const chartHeight = Math.max(200, chartData.length * rowHeight + 40);
  const yWidth = chartData.length
    ? Math.max(100, Math.min(170, Math.max(...chartData.map(r => r.name.length)) * 7))
    : 100;

  const totalUniqueLines = useMemo(() => {
    const s = new Set(data.map(d => d.cellLine));
    (compareData ?? []).forEach(d => s.add(d.cellLine));
    return s.size;
  }, [data, compareData]);

  return (
    <div className={`ibce-chart-section bg-${bg}`} ref={panelRef}>
      <div className="ibce-chart-section-head">
         <h2 className="ibce-section-h"><PanelLabel letter="C" /> {t('cellRna')} <InfoTooltip entryKey="cellLine" /></h2>
        <span className="ibce-src-tag">RANKED BY nTPM <InfoTooltip entryKey="ntpm" /></span>
      </div>

      <ChartToolbar
        panelRef={panelRef}
        filename={`CellLineRNA_${gene}${compareGene ? `_vs_${compareGene}` : ''}`}
        csvData={csvData}
        exportHeaders={{ role: t('role'), gene: t('gene'), cellLine: 'Cell line', diseaseSubtype: t('subtype'), nTPM: 'nTPM', tpm: 'TPM', pTPM: 'pTPM', status: 'Status' }}
        sheetName="CellLineRNA"
        bg={bg}
        onBgToggle={toggleBg}
      >
        <div className="ck-ctrl-group">
           <span className="ck-ctrl-label">{t('sort')}</span>
          <InfoTooltip entryKey="ranking" />
          {(['nTPM', 'name', 'subtype'] as SortKey[]).map(k => (
            <button
              key={k}
              className={`ck-ctrl-btn ${sort === k ? 'active' : ''}`}
              onClick={() => setSort(k)}
              aria-pressed={sort === k}
              aria-label={`Sort cell lines by ${k}`}
            >
               {k === 'nTPM' ? 'nTPM' : k === 'name' ? 'A-Z' : t('subtype')}
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
               aria-label={n === 0 ? t('showAllCellLines') : t('showTopCellLines', { count: n })}
            >
               {n === 0 ? t('all') : t('top', { count: n })}
            </button>
          ))}
        </div>
      </ChartToolbar>

      {isPrimaryOnly && (
        <div className="ibce-missing-data-notice" role="status">
           {t('noCellData', { gene: compareGene, other: gene })}
        </div>
      )}
      {isCompareOnly && (
        <div className="ibce-missing-data-notice" role="status">
           {t('noCellData', { gene, other: compareGene })}
        </div>
      )}
      {isComparison && !chartData.length ? (
        <div className="ibce-empty-small">
          {!data.length && !compareData?.length
             ? t('noEitherCell', { gene, other: compareGene })
            : compareData?.length
             ? t('noSharedCell', { gene, other: compareGene })
             : t('cellUnavailable')}
        </div>
      ) : (
      <>
      <div className="ibce-chart-body" style={{ height: chartHeight }} role="img" aria-label={isComparison ? t('cellCompareChartAria', { gene, other: compareGene ?? '', count: chartData.length }) : t('cellChartAria', { gene, count: chartData.length })}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={chartData}
            margin={{ top: 4, right: 40, bottom: 4, left: 8 }}
            barCategoryGap={isComparison ? '20%' : '30%'}
          >
            <CartesianGrid horizontal={false} stroke={c.grid} strokeDasharray="3 3" />
            <XAxis
              type="number"
              tickFormatter={formatNTPM}
              tick={{ fill: c.tick, fontSize: 11, fontFamily: "'Space Mono', monospace" }}
              axisLine={{ stroke: c.axisLine }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={yWidth}
              tick={(props: any) => <CustomYAxisTick {...props} bg={bg} chartData={chartData} apiMap={apiMap} />}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={<CustomTooltip bg={bg} gene={gene} compareGene={compareGene} />}
              cursor={{ fill: bg === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}
            />
            <Bar
              dataKey="primary"
              name={gene}
              fill={PRIMARY_COLOR}
              radius={[0, 3, 3, 0]}
              maxBarSize={24}
            />
            {isComparison && (
              <Bar
                dataKey="compare"
                name={compareGene}
                fill={COMPARE_COLOR}
                radius={[0, 3, 3, 0]}
                maxBarSize={24}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="ibce-chart-key" style={{ color: c.tick }}>
        <span className="ibce-chart-unit">nTPM</span>
        {isComparison && !isPrimaryOnly && !isCompareOnly && (
          <div className="ibce-chart-series">
            <span><i style={{ background: PRIMARY_COLOR }} aria-hidden="true" />{gene}</span>
            <span><i style={{ background: COMPARE_COLOR }} aria-hidden="true" />{compareGene}</span>
          </div>
        )}
      </div>
      </>
      )}

      {interpretation && (
        <div className="ibce-panel-interpretation" style={{ padding: '16px 20px', borderTop: `1px solid ${c.grid}`, background: bg === 'dark' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.5)', fontSize: 13, color: c.tick }}>
          {interpretation}
        </div>
      )}

      <div className="ibce-chart-footer">
         {t('cellLinesShown', { count: chartData.length })}
        {isCompareOnly
           ? ` ${t('availableFor', { gene: compareGene, other: gene })}`
          : isPrimaryOnly
           ? ` ${t('availableFor', { gene, other: compareGene })}`
          : isComparison
           ? ` ${t('sharedBy', { gene, other: compareGene })}`
           : totalUniqueLines > chartData.length ? ` ${t('total', { count: totalUniqueLines })}` : ''}
        {isComparison && !isPrimaryOnly && !isCompareOnly && chartData.length > 0
           ? ` | ${t('colorComparison', { gene, other: compareGene })}`
          : ''}
        {' '}<InfoTooltip entryKey={isComparison ? 'chartColors' : 'rnaExpression'} />
      </div>
    </div>
  );
}
