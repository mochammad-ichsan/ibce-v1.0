/**
 * km-panel.tsx
 * Kaplan-Meier survival curve + prognostic associations table.
 * Panel B in the IBCE dossier.
 */

import React, { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Legend,
} from 'recharts';
import {
  ChartToolbar, PanelLabel, useBgMode, chartColors,
  computeKM, mergeKMSteps,
  HIGH_COLOR, LOW_COLOR,
} from './chart-kit';
import { InfoTooltip, ScientificTooltip } from './scientific-tooltip';
import { useIbceLocale } from './locale';

interface PrognosisEntry {
  cancer: string;
  classification: string;
  pValue?: number | null;
}

interface SurvivalData {
  high: { time: number; event: number }[];
  low: { time: number; event: number }[];
  medianExpression: number;
  nHigh: number;
  nLow: number;
  logRankP: number | null;
  quality: {
    nSourceRnaRows: number;
    nExcludedNonPrimaryRnaRows: number;
    nEligibleCases: number;
    nMatchedClinicalCases: number;
    nAnalyzedCases: number;
    nEvents: number;
    nCensored: number;
    nExcludedUnknownVitalStatus: number;
    nExcludedInvalidFollowUp: number;
    nExcludedInvalidExpressionCases: number;
    nExcludedDiscordantExpressionCases: number;
  };
}

interface KmPanelProps {
  prognosis: PrognosisEntry[];
  gene: string;
  ensemblId: string | null;
  comparePrognosis?: PrognosisEntry[];
  compareGene?: string;
  interpretation?: React.ReactNode;
}

function classLabel(cls: string): { text: string; cls: string } {
  const s = cls.replace(/_/g, ' ');
  if (s.includes('favorable')) return { text: s, cls: 'ibce-prog-favorable' };
  if (s.includes('unfavorable')) return { text: s, cls: 'ibce-prog-unfavorable' };
  return { text: s, cls: 'ibce-prog-unprognostic' };
}

function formatPValue(p: number | null | undefined): string {
  if (p === null || p === undefined) return '-';
  if (p < 0.001) return p.toExponential(2);
  return p.toFixed(4);
}

function useIbceSurvival(gene: string) {
  return useQuery<SurvivalData>({
    queryKey: ['ibce', 'survival', gene],
    enabled: !!gene,
    staleTime: 10 * 60 * 1000,
    retry: false,
    queryFn: async () => {
      const res = await fetch(`/api/ibce/gene/${encodeURIComponent(gene)}/survival`);
      if (!res.ok) throw new Error(`Survival data unavailable (${res.status})`);
      return res.json();
    },
  });
}

const KMTooltip = ({ active, payload, label, bg, t }: any) => {
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
    }}>
       <div style={{ fontFamily: 'monospace', marginBottom: 4 }}>{label} {t('daysShort')}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <span style={{ color: p.stroke }}>{p.name}</span>
          <span style={{ fontFamily: 'monospace' }}>{(Number(p.value) * 100).toFixed(1)}%</span>
        </div>
      ))}
    </div>
  );
};

function KmGeneResult({
  prognosis,
  gene,
  role,
  survival,
  isLoading,
  isError,
  bg,
}: {
  prognosis: PrognosisEntry[];
  gene: string;
  role: 'Primary gene' | 'Comparison gene';
  survival?: SurvivalData;
  isLoading: boolean;
  isError: boolean;
  bg: 'dark' | 'light';
}) {
   const { t } = useIbceLocale();
  const c = chartColors(bg);
  const kmData = React.useMemo(() => {
    if (!survival) return null;
    return mergeKMSteps(computeKM(survival.high), computeKM(survival.low));
  }, [survival]);

  return (
    <section className="km-gene-result" aria-label={`${role}: ${gene}`}>
      <div className={`ibce-gene-result-label ${role === 'Comparison gene' ? 'comparison' : 'primary'}`}>
        <span className="ibce-gene-result-dot" />
        <span>{role === 'Primary gene' ? t('primaryGene') : t('comparisonGene')}</span>
        <strong>{gene}</strong>
      </div>

      {prognosis.length > 0 ? (
        <table className="ibce-prog-table">
          <thead>
            <tr>
               <th><ScientificTooltip entryKey="cancerContext">{t('cancerContext')}</ScientificTooltip></th>
               <th><ScientificTooltip entryKey="prognosisClass">{t('classification')}</ScientificTooltip></th>
              <th><ScientificTooltip entryKey="pValue">p-value</ScientificTooltip></th>
            </tr>
          </thead>
          <tbody>
            {prognosis.map((r, i) => {
              const { text, cls } = classLabel(r.classification);
              return (
                <tr key={`${r.cancer}-${i}`}>
                  <td className="km-cancer-cell">{r.cancer}</td>
                  <td><ScientificTooltip entryKey="prognosisClass"><span className={`ibce-prog-badge ${cls}`}>{text}</span></ScientificTooltip></td>
                  <td className="km-pval-cell">{formatPValue(r.pValue)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
         <div className="ibce-empty-small">{t('noPrognosis', { gene })}</div>
      )}

      {survival && (
        <div className="km-stats-box">
          <div className="km-stat">
            <span className="km-stat-dot" style={{ background: HIGH_COLOR }} />
             <span>{t('highExpression', { gene, count: survival.nHigh })}</span>
          </div>
          <div className="km-stat">
            <span className="km-stat-dot" style={{ background: LOW_COLOR }} />
             <span>{t('lowExpression', { gene, count: survival.nLow })}</span>
          </div>
          <div className="km-stat km-stat-p">
             <ScientificTooltip entryKey="logRank">{t('logRank', { value: survival.logRankP !== null ? survival.logRankP.toExponential(2) : t('notAvailable') })}</ScientificTooltip>
          </div>
          <div className="km-stat km-stat-note">
             <ScientificTooltip entryKey="medianCutoff">{t('cutoff', { value: survival.medianExpression.toFixed(2) })}</ScientificTooltip>
          </div>
        </div>
      )}

      <div className="km-right">
         {isLoading && <div className="km-loading">{t('computingKm', { gene })}</div>}
        {isError && (
          <div className="km-unavailable">
             <div className="km-unavailable-title">{t('noSurvival', { gene })}</div>
            <div className="km-unavailable-sub">
               {t('survivalRequirement')}
            </div>
          </div>
        )}
        {kmData && survival && (
         <div className="km-chart-wrap" role="img" aria-label={t('kmAria', { gene })}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={kmData} margin={{ top: 8, right: 24, bottom: 36, left: 8 }}>
                <CartesianGrid stroke={c.grid} strokeDasharray="3 3" />
                <XAxis
                  dataKey="time"
                  type="number"
                  domain={[0, 'dataMax']}
                   tickFormatter={v => `${v}${t('daysShort')}`}
                  tick={{ fill: c.tick, fontSize: 11, fontFamily: "'Space Mono', monospace" }}
                  axisLine={{ stroke: c.axisLine }}
                  tickLine={false}
                  label={{
                     value: t('timeDays'),
                    position: 'insideBottom',
                    offset: -20,
                    fill: c.tick,
                    fontSize: 12,
                    fontFamily: 'Outfit, sans-serif',
                  }}
                />
                <YAxis
                  domain={[0, 1]}
                  tickFormatter={v => `${(v * 100).toFixed(0)}%`}
                  tick={{ fill: c.tick, fontSize: 11, fontFamily: "'Space Mono', monospace" }}
                  axisLine={{ stroke: c.axisLine }}
                  tickLine={false}
                  label={{
                     value: t('survivalProbability'),
                    angle: -90,
                    position: 'insideLeft',
                    offset: 12,
                    fill: c.tick,
                    fontSize: 12,
                    fontFamily: 'Outfit, sans-serif',
                  }}
                />
                 <Tooltip content={<KMTooltip bg={bg} t={t} />} />
                <ReferenceLine y={0.5} stroke={c.grid} strokeDasharray="6 3" />
                <Legend wrapperStyle={{ fontSize: 11, color: c.legend, paddingTop: 8 }} verticalAlign="top" />
                 <Line type="stepAfter" dataKey="high" name={`${t('high')} ${gene}`} stroke={HIGH_COLOR} strokeWidth={2} dot={false} activeDot={{ r: 3 }} />
                 <Line type="stepAfter" dataKey="low" name={`${t('low')} ${gene}`} stroke={LOW_COLOR} strokeWidth={2} dot={false} activeDot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
            <div className="km-citation">
               {t('survivalCitation', { count: survival.quality.nAnalyzedCases, gene })}
              {' '}{t('survivalQuality', {
                events: survival.quality.nEvents,
                censored: survival.quality.nCensored,
                eligible: survival.quality.nEligibleCases,
                matched: survival.quality.nMatchedClinicalCases,
                nonPrimary: survival.quality.nExcludedNonPrimaryRnaRows,
                excluded: survival.quality.nExcludedUnknownVitalStatus
                  + survival.quality.nExcludedInvalidFollowUp
                  + survival.quality.nExcludedInvalidExpressionCases
                  + survival.quality.nExcludedDiscordantExpressionCases,
              })}
              {' '}{t('survivalCaveat')}
              {' '}<InfoTooltip entryKey="kaplanMeier" />
              <InfoTooltip entryKey="survivalProbability" />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export function KmPanel({
  prognosis,
  gene,
  ensemblId: _ensemblId,
  comparePrognosis,
  compareGene,
  interpretation,
}: KmPanelProps) {
  const [bg, toggleBg] = useBgMode();
  const { t } = useIbceLocale();
  const panelRef = useRef<HTMLDivElement>(null);
  const survivalQuery = useIbceSurvival(gene);
  const compareSurvivalQuery = useIbceSurvival(compareGene ?? '');
  const hasComparison = !!compareGene;

  const rowsForExport = (
    entries: PrognosisEntry[],
    survival: SurvivalData | undefined,
    geneName: string,
    role: string,
  ) => {
    const emptyAudit = {
      survivalScope: '',
      eligibleRnaCases: '',
      clinicalMatches: '',
      analyzedCases: '',
      observedDeaths: '',
      censoredCases: '',
      excludedNonPrimaryRnaRows: '',
      excludedInvalidExpressionCases: '',
      excludedDiscordantExpressionCases: '',
      excludedUnknownVitalStatus: '',
      excludedInvalidFollowUp: '',
      pValueStatus: '',
    };
    const audit = survival ? {
      survivalScope: 'Exploratory overall survival; HPA TCGA sample type 01 primary tumor pTPM matched to TCGA-BRCA clinical; unadjusted median split',
      eligibleRnaCases: survival.quality.nEligibleCases,
      clinicalMatches: survival.quality.nMatchedClinicalCases,
      analyzedCases: survival.quality.nAnalyzedCases,
      observedDeaths: survival.quality.nEvents,
      censoredCases: survival.quality.nCensored,
      excludedNonPrimaryRnaRows: survival.quality.nExcludedNonPrimaryRnaRows,
      excludedInvalidExpressionCases: survival.quality.nExcludedInvalidExpressionCases,
      excludedDiscordantExpressionCases: survival.quality.nExcludedDiscordantExpressionCases,
      excludedUnknownVitalStatus: survival.quality.nExcludedUnknownVitalStatus,
      excludedInvalidFollowUp: survival.quality.nExcludedInvalidFollowUp,
      pValueStatus: survival.logRankP === null ? 'not estimable: sparse events or zero variance' : 'exploratory unadjusted',
    } : emptyAudit;
    return [
    ...entries.map(r => ({
      recordType: 'prognostic_association',
      role,
      gene: geneName,
      cancer: r.cancer,
      classification: r.classification,
      pValue: r.pValue ?? '',
      expressionGroup: '',
      medianExpression: '',
      timeDays: '',
      event: '',
      ...emptyAudit,
    })),
    ...(survival
      ? [
          ...survival.high.map(r => ({
            recordType: 'survival_observation',
            role,
            gene: geneName,
            cancer: 'TCGA-BRCA',
            classification: '',
            pValue: survival.logRankP ?? '',
            expressionGroup: 'high',
            medianExpression: survival.medianExpression,
            timeDays: r.time,
            event: r.event,
            ...audit,
          })),
          ...survival.low.map(r => ({
            recordType: 'survival_observation',
            role,
            gene: geneName,
            cancer: 'TCGA-BRCA',
            classification: '',
            pValue: survival.logRankP ?? '',
            expressionGroup: 'low',
            medianExpression: survival.medianExpression,
            timeDays: r.time,
            event: r.event,
            ...audit,
          })),
        ]
      : []),
    ];
  };
  const csvData = [
    ...rowsForExport(prognosis, survivalQuery.data, gene, 'primary'),
    ...(hasComparison
      ? rowsForExport(comparePrognosis ?? [], compareSurvivalQuery.data, compareGene, 'comparison')
      : []),
  ];

  return (
    <div className={`ibce-chart-section bg-${bg}`} ref={panelRef}>
      <div className="ibce-chart-section-head">
         <h2 className="ibce-section-h"><PanelLabel letter="B" /> {t('prognosis')} <InfoTooltip entryKey="prognosis" /></h2>
        <span className="ibce-src-tag">BREAST CANCER COHORTS</span>
      </div>
      <ChartToolbar
        panelRef={panelRef}
        filename={`Survival_${gene}${compareGene ? `_vs_${compareGene}` : ''}`}
        csvData={csvData}
        exportHeaders={{ role: t('role'), gene: t('gene'), cancer: t('cancer'), classification: t('classification'), pValue: t('pValue') }}
        sheetName="Survival"
        bg={bg}
        onBgToggle={toggleBg}
      />
      <div className={`km-comparison-grid ${hasComparison ? 'active' : ''}`}>
        <KmGeneResult
          prognosis={prognosis}
          gene={gene}
          role="Primary gene"
          survival={survivalQuery.data}
          isLoading={survivalQuery.isLoading}
          isError={survivalQuery.isError}
          bg={bg}
        />
        {hasComparison && (
          <KmGeneResult
            prognosis={comparePrognosis ?? []}
            gene={compareGene}
            role="Comparison gene"
            survival={compareSurvivalQuery.data}
            isLoading={compareSurvivalQuery.isLoading}
            isError={compareSurvivalQuery.isError}
            bg={bg}
          />
        )}
      </div>
      {interpretation}
    </div>
  );
}
