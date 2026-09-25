import { useLocation } from 'wouter';
import { useIbceLocale } from './locale';

export function IbceSectionNav() {
  const [location, navigate] = useLocation();
  const { t } = useIbceLocale();
  const sections = [
    { href: '/ibce', label: t('discovery') },
    { href: '/ibce/cell-lines', label: t('cellLinesTitle') },
    { href: '/ibce/about', label: t('dataSources') },
    { href: '/ibce/resources', label: t('methods') },
    { href: '/ibce/glossary', label: t('glossary') },
    { href: '/ibce/citation', label: t('citation') },
    { href: '/ibce/download', label: t('downloadCenter') },
  ];

  return (
    <nav className="ibce-integrity-nav" aria-label={t('navigate')}>
      {sections.map(section => (
        <button
          key={section.href}
          type="button"
          className={location === section.href ? 'active' : ''}
          aria-current={location === section.href ? 'page' : undefined}
          onClick={() => navigate(section.href)}
        >
          {section.label}
        </button>
      ))}
    </nav>
  );
}