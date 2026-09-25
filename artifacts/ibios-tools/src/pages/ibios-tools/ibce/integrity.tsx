import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  Check,
  Clipboard,
  Code2,
  ExternalLink,
  FileText,
  FlaskConical,
  Library,
  RotateCcw,
  Search,
  Sigma,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { useLocation, useRoute } from 'wouter';
import {
  getIbceGlossary,
  IBCE_GLOSSARY_CATEGORIES,
  type IbceGlossaryCategory,
  type IbceGlossaryKey,
} from './tooltip-catalog';
import { useIbceLocale } from './locale';
import { IbceSectionNav } from './section-nav';
import {
  formatIntegrityCitation,
  INTEGRITY_CITATIONS,
  INTEGRITY_RESOURCES,
  localizedText,
  type IntegrityResourceKind,
} from './integrity-data';
import './ibce.css';

type IntegritySection = 'resources' | 'glossary' | 'citation';
type CitationStyle = 'harvard' | 'apa' | 'vancouver' | 'ieee';

const kindIcons: Record<IntegrityResourceKind, typeof FlaskConical> = {
  method: FlaskConical,
  software: Code2,
  acknowledgement: Sparkles,
};

const glossaryCategories: IbceGlossaryCategory[] = [
  'navigation',
  'provenance',
  'protein',
  'survival',
  'rna',
  'visualization',
  'annotation',
  'citation',
];

const categoryLocaleKeys = {
  navigation: 'categoryNavigation',
  provenance: 'categoryProvenance',
  protein: 'categoryProtein',
  survival: 'categorySurvival',
  rna: 'categoryRna',
  visualization: 'categoryVisualization',
  annotation: 'categoryAnnotation',
  citation: 'categoryCitation',
} as const;

function useIntegritySection(): IntegritySection {
  const [isGlossary] = useRoute('/ibce/glossary');
  const [isCitation] = useRoute('/ibce/citation');
  if (isGlossary) return 'glossary';
  if (isCitation) return 'citation';
  return 'resources';
}

function BackLink() {
  const [, setLoc] = useLocation();
  const { t } = useIbceLocale();
  return (
    <button className="ibce-integrity-back" onClick={() => setLoc('/ibce')}>
      <ArrowLeft size={14} aria-hidden="true" />
      {t('navigateBack')}
    </button>
  );
}

function IntegrityHeader({ section }: { section: IntegritySection }) {
  const { t } = useIbceLocale();
  const title = section === 'resources'
    ? t('methodsTitle')
    : section === 'glossary'
      ? t('glossaryTitle')
      : t('citationTitle');
  return (
    <>
      <BackLink />
      <div className="ibce-integrity-kicker">
        <Library size={14} aria-hidden="true" />
        {t('integrity')}
      </div>
      <h1 className="ibce-integrity-title">{title}</h1>
      <p className="ibce-integrity-intro">{t('integrityDescription')}</p>
      <IbceSectionNav />
    </>
  );
}

function ResourceCard({ resource }: { resource: typeof INTEGRITY_RESOURCES[number] }) {
  const { lang, t } = useIbceLocale();
  const Icon = kindIcons[resource.kind];
  const kindLabel = t(resource.kind);
  const citations = (resource.citationIds ?? [])
    .map(id => INTEGRITY_CITATIONS.find(citation => citation.id === id))
    .filter((citation): citation is typeof INTEGRITY_CITATIONS[number] => Boolean(citation));
  return (
    <article className="ibce-integrity-resource">
      <div className="ibce-integrity-resource-top">
        <span className="ibce-integrity-icon"><Icon size={17} aria-hidden="true" /></span>
        <span className="ibce-integrity-kind">{kindLabel}</span>
      </div>
      <h2>{localizedText(resource.title, lang)}</h2>
      <p>{localizedText(resource.description, lang)}</p>
      <div className="ibce-integrity-evidence">
        <span>{t('evidence')}</span>
        {localizedText(resource.evidence, lang)}
      </div>
      <div className="ibce-resource-usage">
        <span>{t('usedInIbce')}</span>
        {localizedText(resource.usedIn, lang)}
      </div>
      {citations.length > 0 && (
        <div className="ibce-resource-citations">
          <span>{t('inlineCitation')}</span>
          {citations.map(citation => (
            <a key={citation.id} href={citation.url} target="_blank" rel="noopener noreferrer">
              <span>{formatIntegrityCitation(citation, 'harvard')}</span>
              <ArrowUpRight size={12} aria-hidden="true" />
            </a>
          ))}
        </div>
      )}
      {resource.href && citations.length === 0 && (
        <a className="ibce-integrity-source" href={resource.href} target="_blank" rel="noopener noreferrer">
          {t('openReference')} <ArrowUpRight size={13} aria-hidden="true" />
        </a>
      )}
    </article>
  );
}

function ResourcesView() {
  const { lang, t } = useIbceLocale();
  const groups: Array<{ kind: IntegrityResourceKind; title: string; icon: typeof FlaskConical }> = [
    { kind: 'method', title: t('methodsAndAlgorithms'), icon: FlaskConical },
    { kind: 'software', title: t('softwareAndPlatforms'), icon: Wrench },
    { kind: 'acknowledgement', title: t('acknowledgements'), icon: Sparkles },
  ];
  return (
    <div className="ibce-integrity-sections">
      {groups.map(group => {
        const resources = INTEGRITY_RESOURCES.filter(resource => resource.kind === group.kind);
        if (!resources.length) return null;
        const Icon = group.icon;
        return (
          <section key={group.kind} className="ibce-integrity-section">
            <div className="ibce-integrity-section-heading">
              <Icon size={17} aria-hidden="true" />
              <h2>{group.title}</h2>
              <span>{resources.length.toString().padStart(2, '0')}</span>
            </div>
            <div className="ibce-integrity-resource-grid">
              {resources.map(resource => <ResourceCard key={localizedText(resource.title, lang)} resource={resource} />)}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function GlossaryView() {
  const { lang, t } = useIbceLocale();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<'all' | IbceGlossaryCategory>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'with' | 'without'>('all');
  const [sortOrder, setSortOrder] = useState<'az' | 'za'>('az');
  const glossary = getIbceGlossary(lang);
  const entries = Object.entries(glossary) as Array<[IbceGlossaryKey, typeof glossary[IbceGlossaryKey]]>;
  const normalizedQuery = query.trim().toLocaleLowerCase(lang);
  const filteredEntries = entries
    .filter(([key, entry]) => {
      if (category !== 'all' && IBCE_GLOSSARY_CATEGORIES[key] !== category) return false;
      if (sourceFilter === 'with' && entry.sources.length === 0) return false;
      if (sourceFilter === 'without' && entry.sources.length > 0) return false;
      if (!normalizedQuery) return true;
      return `${entry.title} ${entry.definition} ${entry.interpretation ?? ''} ${key}`
        .toLocaleLowerCase(lang)
        .includes(normalizedQuery);
    })
    .sort(([, left], [, right]) => {
      const comparison = left.title.localeCompare(right.title, lang, { sensitivity: 'base' });
      return sortOrder === 'az' ? comparison : -comparison;
    });
  const resetFilters = () => {
    setQuery('');
    setCategory('all');
    setSourceFilter('all');
    setSortOrder('az');
  };
  return (
    <section className="ibce-integrity-section">
      <div className="ibce-integrity-section-heading">
        <BookOpen size={17} aria-hidden="true" />
        <h2>{t('glossaryEntries', { count: entries.length })}</h2>
      </div>
      <p className="ibce-integrity-section-note">{t('glossaryDescription')}</p>
      <div className="ibce-glossary-controls">
        <label className="ibce-glossary-search">
          <span className="sr-only">{t('searchGlossaryAria')}</span>
          <Search size={16} aria-hidden="true" />
          <input
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder={t('searchGlossary')}
            aria-label={t('searchGlossaryAria')}
          />
        </label>
        <label className="ibce-glossary-select">
          <span>{t('filterCategory')}</span>
          <select value={category} onChange={event => setCategory(event.target.value as 'all' | IbceGlossaryCategory)}>
            <option value="all">{t('allCategories')}</option>
            {glossaryCategories.map(item => (
              <option key={item} value={item}>{t(categoryLocaleKeys[item])}</option>
            ))}
          </select>
        </label>
        <label className="ibce-glossary-select">
          <span>{t('filterSources')}</span>
          <select value={sourceFilter} onChange={event => setSourceFilter(event.target.value as 'all' | 'with' | 'without')}>
            <option value="all">{t('allSourceAvailability')}</option>
            <option value="with">{t('withSources')}</option>
            <option value="without">{t('withoutSources')}</option>
          </select>
        </label>
        <label className="ibce-glossary-select">
          <span>{t('sortGlossary')}</span>
          <select value={sortOrder} onChange={event => setSortOrder(event.target.value as 'az' | 'za')}>
            <option value="az">{t('sortAz')}</option>
            <option value="za">{t('sortZa')}</option>
          </select>
        </label>
        <button className="ibce-glossary-reset" onClick={resetFilters}>
          <RotateCcw size={14} aria-hidden="true" />
          {t('resetFilters')}
        </button>
      </div>
      <div className="ibce-glossary-result-count" role="status" aria-live="polite">
        {t('glossaryResults', { shown: filteredEntries.length, total: entries.length })}
      </div>
      <div className="ibce-glossary-list">
        {filteredEntries.map(([key, entry]) => (
          <details className="ibce-glossary-entry" key={key}>
            <summary>
              <span>
                {entry.title}
                <small>{t(categoryLocaleKeys[IBCE_GLOSSARY_CATEGORIES[key]])}</small>
              </span>
              <span className="ibce-mono">{key}</span>
            </summary>
            <div className="ibce-glossary-body">
              <p>{entry.definition}</p>
              {entry.interpretation && (
                <div className="ibce-integrity-evidence">
                  <span>{t('interpretation')}</span>
                  {entry.interpretation}
                </div>
              )}
              {entry.sources.length > 0 && (
                <div className="ibce-glossary-sources">
                  {entry.sources.map(source => (
                    <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer">
                      {source.label} <ExternalLink size={11} aria-hidden="true" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </details>
        ))}
      </div>
      {filteredEntries.length === 0 && (
        <div className="ibce-glossary-empty">
          <Search size={20} aria-hidden="true" />
          <p>{t('noGlossaryResults')}</p>
          <button className="ibce-card-action" onClick={resetFilters}>{t('resetFilters')}</button>
        </div>
      )}
    </section>
  );
}

function CitationCard({
  citation,
  style,
  onCopy,
  copied,
}: {
  citation: typeof INTEGRITY_CITATIONS[number];
  style: CitationStyle;
  onCopy: (citation: typeof INTEGRITY_CITATIONS[number]) => void;
  copied: boolean;
}) {
  const { t } = useIbceLocale();
  return (
    <article className={`ibce-citation-card ${citation.kind === 'manuscript' ? 'ibce-citation-manuscript' : ''}`}>
      <div className="ibce-citation-meta">
        <span>{t(citation.kind)}</span>
        <span>{citation.year}</span>
      </div>
      <h2>{citation.title}</h2>
      <p className="ibce-citation-venue">{citation.authors} · {citation.venue}</p>
      <div className="ibce-citation-output">{formatIntegrityCitation(citation, style)}</div>
      <div className="ibce-citation-actions">
        <button className="ibce-card-action" onClick={() => onCopy(citation)}>
          {copied ? <Check size={13} aria-hidden="true" /> : <Clipboard size={13} aria-hidden="true" />}
          {copied ? t('copied') : t('copyCitation')}
        </button>
        <a className="ibce-integrity-source" href={citation.url} target="_blank" rel="noopener noreferrer">
          {t('openReference')} <ArrowUpRight size={13} aria-hidden="true" />
        </a>
      </div>
    </article>
  );
}

function CitationView() {
  const { t } = useIbceLocale();
  const [style, setStyle] = useState<CitationStyle>('harvard');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const manuscript = INTEGRITY_CITATIONS.find(citation => citation.kind === 'manuscript');
  const researchReferences = useMemo(
    () => INTEGRITY_CITATIONS.filter(citation => citation.kind === 'publication' || citation.kind === 'method'),
    [],
  );
  const softwareReferences = useMemo(
    () => INTEGRITY_CITATIONS.filter(citation => citation.kind === 'software'),
    [],
  );

  const copyCitation = async (citation: typeof INTEGRITY_CITATIONS[number]) => {
    await navigator.clipboard.writeText(formatIntegrityCitation(citation, style));
    setCopiedId(citation.id);
    window.setTimeout(() => setCopiedId(current => current === citation.id ? null : current), 1800);
  };

  return (
    <div className="ibce-integrity-sections">
      <section className="ibce-citation-status">
        <div className="ibce-integrity-icon"><FileText size={18} aria-hidden="true" /></div>
        <div>
          <div className="ibce-integrity-kind">{t('citationNoteTitle')}</div>
          <p>{t('citationNoteBody')}</p>
          {manuscript && (
            <a href={manuscript.url} target="_blank" rel="noopener noreferrer">
              ICATBIO 2026 <ExternalLink size={12} aria-hidden="true" />
            </a>
          )}
        </div>
      </section>
      <section className="ibce-integrity-section">
        <div className="ibce-citation-toolbar">
          <div className="ibce-integrity-section-heading">
            <Sigma size={17} aria-hidden="true" />
            <h2>{t('publishedResearch')}</h2>
          </div>
          <label className="ibce-citation-select">
            <span>{t('citationStyle')}</span>
            <select value={style} onChange={event => setStyle(event.target.value as CitationStyle)}>
              <option value="harvard">{t('harvard')}</option>
              <option value="apa">{t('apa')}</option>
              <option value="vancouver">{t('vancouver')}</option>
              <option value="ieee">{t('ieee')}</option>
            </select>
          </label>
        </div>
        <p className="ibce-integrity-section-note">{t('allSources')}</p>
        <div className="ibce-citation-list">
          {researchReferences.map(citation => (
            <CitationCard
              key={citation.id}
              citation={citation}
              style={style}
              copied={copiedId === citation.id}
              onCopy={copyCitation}
            />
          ))}
        </div>
      </section>
      <section className="ibce-integrity-section">
        <div className="ibce-integrity-section-heading">
          <Code2 size={17} aria-hidden="true" />
          <h2>{t('softwareAttribution')}</h2>
          <span>{softwareReferences.length.toString().padStart(2, '0')}</span>
        </div>
        <div className="ibce-citation-list">
          {softwareReferences.map(citation => (
            <CitationCard
              key={citation.id}
              citation={citation}
              style={style}
              copied={copiedId === citation.id}
              onCopy={copyCitation}
            />
          ))}
        </div>
      </section>
      {manuscript && (
        <section className="ibce-integrity-section">
          <div className="ibce-integrity-section-heading">
            <FileText size={17} aria-hidden="true" />
            <h2>{t('manuscript')}</h2>
          </div>
          <CitationCard citation={manuscript} style={style} copied={copiedId === manuscript.id} onCopy={copyCitation} />
        </section>
      )}
    </div>
  );
}

export default function IBCEIntegrity() {
  const section = useIntegritySection();
  return (
    <div className="ibce-wrap">
      <div className="ibce-page ibce-integrity-page">
        <IntegrityHeader section={section} />
        {section === 'resources' ? <ResourcesView /> : section === 'glossary' ? <GlossaryView /> : <CitationView />}
      </div>
    </div>
  );
}