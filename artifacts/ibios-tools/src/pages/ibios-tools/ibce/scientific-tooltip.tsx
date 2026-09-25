import * as Popover from '@radix-ui/react-popover';
import { CircleHelp, ExternalLink } from 'lucide-react';
import { useRef, useState, type ReactNode } from 'react';
import { getIbceGlossary, type IbceGlossaryKey } from './tooltip-catalog';
import { useIbceLocale } from './locale';

interface ScientificTooltipProps {
  entryKey: IbceGlossaryKey;
  children?: ReactNode;
  iconOnly?: boolean;
  asChild?: boolean;
  className?: string;
}

export function ScientificTooltip({
  entryKey,
  children,
  iconOnly = false,
  asChild = false,
  className = '',
}: ScientificTooltipProps) {
  const { lang, t } = useIbceLocale();
  const entry = getIbceGlossary(lang)[entryKey];
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressReopen = useRef(false);

  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };

  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), 180);
  };

  const closeWithoutFocusReopen = () => {
    suppressReopen.current = true;
    setOpen(false);
    window.setTimeout(() => {
      suppressReopen.current = false;
    }, 250);
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        asChild
        onMouseEnter={() => {
          cancelClose();
          if (!suppressReopen.current) setOpen(true);
        }}
        onMouseLeave={scheduleClose}
        onFocus={() => {
          cancelClose();
          if (!suppressReopen.current) setOpen(true);
        }}
      >
        {asChild ? children : (
          <button
            type="button"
            className={`${iconOnly ? 'ibce-help-trigger' : 'ibce-term-trigger'} ${className}`.trim()}
            aria-label={`${t('scientificGuide')}: ${entry.title}`}
            aria-expanded={open}
          >
            {children}
            <CircleHelp size={iconOnly ? 14 : 12} aria-hidden="true" />
          </button>
        )}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="ibce-scientific-tooltip"
          sideOffset={8}
          collisionPadding={12}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
          onEscapeKeyDown={closeWithoutFocusReopen}
          onPointerDownOutside={closeWithoutFocusReopen}
          onFocusOutside={closeWithoutFocusReopen}
          aria-label={`${entry.title} explanation`}
        >
          <div className="ibce-tooltip-kicker">{t('scientificGuide')}</div>
          <div className="ibce-tooltip-title">{entry.title}</div>
          <p>{entry.definition}</p>
          {entry.interpretation && (
            <div className="ibce-tooltip-limit">
               <b>{t('interpretation')}</b> {entry.interpretation}
            </div>
          )}
          {entry.sources.length > 0 && (
            <div className="ibce-tooltip-sources">
               <div className="ibce-tooltip-source-label">{t('sources')}</div>
              {entry.sources.map(source => (
                <a
                  key={source.url}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span>{source.label}</span>
                  <ExternalLink size={11} aria-hidden="true" />
                </a>
              ))}
            </div>
          )}
          <Popover.Arrow className="ibce-tooltip-arrow" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

export function InfoTooltip({ entryKey }: { entryKey: IbceGlossaryKey }) {
  return <ScientificTooltip entryKey={entryKey} iconOnly />;
}
