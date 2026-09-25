import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, ExternalLink, ShieldCheck, SlidersHorizontal, X } from 'lucide-react';
import { useIbceLocale } from '../locale';
import { IbceSectionNav } from '../section-nav';
import { InfoTooltip } from '../scientific-tooltip';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CellLineRecord {
  cellLine: string;
  cellosaurusId?: string;
  sex?: string;
  ageYears?: number;
  ageRaw?: string;
  origin?: string;
  site?: string;
  diseaseSubtype?: string;
  molecularSubtype?: string | null;
  sourceUrl?: string;
  hpaSourceUrl?: string;
  derivedSiteRaw?: string;
  diseaseClassificationRaw?: string;
}

interface CellLinesResponse {
  total: number;
  cellLines: CellLineRecord[];
}

export default function IBCECellLinesDirectory() {
  const { t } = useIbceLocale();
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sexFilter, setSexFilter] = useState('all');
  const [classificationFilter, setClassificationFilter] = useState('all');
  const [originFilter, setOriginFilter] = useState('all');
  const [ageFilter, setAgeFilter] = useState('all');
  const [molecularFilter, setMolecularFilter] = useState('all');

  const { data, isLoading, error } = useQuery<CellLinesResponse>({
    queryKey: ['ibce', 'cell-lines'],
    queryFn: async () => {
      const res = await fetch('/api/ibce/cell-lines');
      if (!res.ok) throw new Error('Failed to fetch cell lines');
      return res.json();
    }
  });

  const filtered = useMemo(() => {
    if (!data?.cellLines) return [];
    const q = search.trim().toLowerCase();
    return data.cellLines.filter(c => 
      (!q || [
        c.cellLine,
        c.cellosaurusId,
        c.sex,
        c.ageRaw,
        c.origin,
        c.site,
        c.diseaseSubtype,
        c.molecularSubtype,
        c.derivedSiteRaw,
        c.diseaseClassificationRaw,
      ].some(value => value?.toLowerCase().includes(q))) &&
      (sexFilter === 'all' || (sexFilter === 'unknown' ? !c.sex : c.sex === sexFilter)) &&
      (classificationFilter === 'all' || (classificationFilter === 'unknown' ? !c.diseaseClassificationRaw : c.diseaseClassificationRaw === classificationFilter)) &&
      (originFilter === 'all' || (originFilter === 'unknown' ? !c.origin : c.origin === originFilter)) &&
      (ageFilter === 'all' || (ageFilter === 'reported' ? c.ageYears != null || Boolean(c.ageRaw) : c.ageYears == null && !c.ageRaw)) &&
      (molecularFilter === 'all' || (molecularFilter === 'reported' ? Boolean(c.molecularSubtype) : !c.molecularSubtype))
    );
  }, [data, search, sexFilter, classificationFilter, originFilter, ageFilter, molecularFilter]);

  const filterOptions = useMemo(() => {
    const records = data?.cellLines ?? [];
    const unique = (values: Array<string | undefined>) => Array.from(new Set(values.filter((value): value is string => Boolean(value)))).sort((a, b) => a.localeCompare(b));
    return {
      sexes: unique(records.map(record => record.sex)),
      classifications: unique(records.map(record => record.diseaseClassificationRaw)),
      origins: unique(records.map(record => record.origin)),
    };
  }, [data]);

  const activeFilterCount = [sexFilter, classificationFilter, originFilter, ageFilter, molecularFilter]
    .filter(value => value !== 'all').length;
  const hasFilters = Boolean(search.trim()) || activeFilterCount > 0;
  const resetFilters = () => {
    setSearch('');
    setSexFilter('all');
    setClassificationFilter('all');
    setOriginFilter('all');
    setAgeFilter('all');
    setMolecularFilter('all');
  };

  return (
    <div className="ibce-wrap">
      <div className="ibce-page">
        <section className="ibce-hero" style={{ paddingBottom: '20px' }}>
          <div className="ibce-eyebrow">IBCE / {t('cellLinesEyebrow')}</div>
          <h1>{t('cellLinesTitle')}</h1>
          <p>
            {t('cellLinesIntro')}
            {' '}<InfoTooltip entryKey="cellLine" />
          </p>
          <div className="ibce-directory-controls">
          <div className="ibce-searchbox ibce-directory-search">
            <Search size={19} aria-hidden="true" style={{ color: 'hsl(var(--primary))', flexShrink: 0 }} />
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('cellLineSearchPlaceholder')}
              aria-label="Search cell lines"
            />
          </div>
          <button
            type="button"
            className={`ibce-filter-toggle ${showFilters || activeFilterCount > 0 ? 'active' : ''}`}
            onClick={() => setShowFilters(value => !value)}
            aria-expanded={showFilters}
            aria-controls="ibce-cell-line-filters"
          >
            <SlidersHorizontal size={16} />
            {t('filters')}
            {activeFilterCount > 0 && <span className="ibce-filter-count">{activeFilterCount}</span>}
          </button>
          </div>
          {showFilters && (
            <div className="ibce-filter-panel" id="ibce-cell-line-filters">
              <div className="ibce-filter-heading">
                <div>
                  <strong>{t('filterCellLines')}</strong>
                  <span>{t('filterCellLinesDescription')}</span>
                </div>
                {hasFilters && (
                  <button type="button" className="ibce-reset-filter" onClick={resetFilters}>
                    <X size={14} /> {t('resetFilters')}
                  </button>
                )}
              </div>
              <div className="ibce-filter-grid">
                <label className="ibce-filter-field">
                  <span>{t('sexFilter')}</span>
                  <select value={sexFilter} onChange={e => setSexFilter(e.target.value)}>
                    <option value="all">{t('allFilterValues')}</option>
                    {filterOptions.sexes.map(value => <option key={value} value={value}>{value}</option>)}
                    <option value="unknown">{t('unknownFilterValue')}</option>
                  </select>
                </label>
                <label className="ibce-filter-field">
                  <span>{t('diseaseClassificationFilter')}</span>
                  <select value={classificationFilter} onChange={e => setClassificationFilter(e.target.value)}>
                    <option value="all">{t('allFilterValues')}</option>
                    {filterOptions.classifications.map(value => <option key={value} value={value}>{value}</option>)}
                    <option value="unknown">{t('unknownFilterValue')}</option>
                  </select>
                </label>
                <label className="ibce-filter-field">
                  <span>{t('originFilter')}</span>
                  <select value={originFilter} onChange={e => setOriginFilter(e.target.value)}>
                    <option value="all">{t('allFilterValues')}</option>
                    {filterOptions.origins.map(value => <option key={value} value={value}>{value}</option>)}
                    <option value="unknown">{t('unknownFilterValue')}</option>
                  </select>
                </label>
                <label className="ibce-filter-field">
                  <span>{t('donorAgeFilter')}</span>
                  <select value={ageFilter} onChange={e => setAgeFilter(e.target.value)}>
                    <option value="all">{t('allFilterValues')}</option>
                    <option value="reported">{t('reportedFilterValue')}</option>
                    <option value="unknown">{t('unknownFilterValue')}</option>
                  </select>
                </label>
                <label className="ibce-filter-field">
                  <span>{t('molecularSubtypeFilter')}</span>
                  <select value={molecularFilter} onChange={e => setMolecularFilter(e.target.value)}>
                    <option value="all">{t('allFilterValues')}</option>
                    <option value="reported">{t('reportedFilterValue')}</option>
                    <option value="unknown">{t('unknownFilterValue')}</option>
                  </select>
                </label>
              </div>
            </div>
          )}
        </section>
        <IbceSectionNav />

        {isLoading ? (
          <div className="ibce-empty">Loading curated cell lines...</div>
        ) : error ? (
          <div className="ibce-empty" style={{ borderColor: 'var(--destructive)', color: 'var(--destructive)' }}>
            Error loading data.
          </div>
        ) : (
          <>
          <div className="ibce-directory-results" role="status">
            <span>{t('cellLineResults', { shown: filtered.length, total: data?.total ?? 0 })}</span>
            {hasFilters && <button type="button" className="ibce-inline-reset" onClick={resetFilters}>{t('resetFilters')}</button>}
          </div>
          <div className="ibce-table-wrapper" style={{ overflowX: 'auto', marginTop: '30px' }}>
            <table className="ibce-table">
              <thead>
                <tr>
                  <th>Cell Line</th>
                  <th>Patient</th>
                  <th>Disease Classification</th>
                  <th>Origin / Site</th>
                  <th>Receptor / Molecular</th>
                  <th>Sources</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((cl, i) => (
                  <tr key={`${cl.cellLine}-${i}`}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'hsl(var(--foreground))' }}>{cl.cellLine}</div>
                      {cl.cellosaurusId && (
                        <div className="ibce-small ibce-muted" style={{ fontFamily: 'monospace' }}>
                          {cl.cellosaurusId}
                        </div>
                      )}
                    </td>
                    <td>
                      <div>{cl.sex || '-'}</div>
                      <div className="ibce-small ibce-muted">
                        {cl.ageYears ? `${cl.ageYears}y` : (cl.ageRaw || '-')}
                      </div>
                    </td>
                    <td>
                      <div className="ibce-small ibce-muted" style={{ marginBottom: 2 }}>
                        <strong style={{color: 'hsl(var(--primary))'}}>Cellosaurus:</strong> {cl.diseaseClassificationRaw || '-'}
                      </div>
                      <div className="ibce-small ibce-muted">
                        <strong style={{color: 'hsl(var(--primary))'}}>HPA:</strong> {cl.diseaseSubtype || '-'}
                      </div>
                    </td>
                    <td>
                      <div className="ibce-small ibce-muted" style={{ marginBottom: 2 }}>
                        <strong style={{color: 'hsl(var(--primary))'}}>Cellosaurus:</strong> {cl.derivedSiteRaw || '-'}
                      </div>
                      <div className="ibce-small ibce-muted">
                        <strong style={{color: 'hsl(var(--primary))'}}>HPA:</strong> {cl.origin ? `${cl.origin} / ${cl.site || '-'}` : '-'}
                      </div>
                    </td>
                    <td>
                      {cl.molecularSubtype ? (
                        <span className="ibce-class ibce-potential">{cl.molecularSubtype}</span>
                      ) : (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="ibce-muted ibce-small" style={{ borderBottom: '1px dotted currentColor', cursor: 'help' }}>
                                Unreported
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              Receptor status not explicitly reported in reference sources
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {cl.sourceUrl && (
                          <a href={cl.sourceUrl} target="_blank" rel="noreferrer" className="ibce-avail on" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
                            <ShieldCheck size={10} /> Cellosaurus
                          </a>
                        )}
                        {cl.hpaSourceUrl && (
                          <a href={cl.hpaSourceUrl} target="_blank" rel="noreferrer" className="ibce-avail on" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
                            <ExternalLink size={10} /> HPA
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6}>
                      <div className="ibce-empty" style={{ textAlign: 'center' }}>No cell lines found.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>
    </div>
  );
}
