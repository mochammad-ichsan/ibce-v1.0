import { useEffect, useRef, useState } from 'react';
import { LoaderCircle, Sparkles } from 'lucide-react';
import './ai-interpretation.css';

export type InterpretationPanel = 'ihc' | 'prognosis' | 'cellLine' | 'patientRna' | 'functional';
export interface InterpretationGene {
  gene: string;
  summary?: string;
  observations: string[];
}

interface InterpretationResponse {
  source: 'ai' | 'unavailable';
  interpretation: string;
  caveats: string[];
  compared: boolean;
}

interface AiInterpretationProps {
  panel: InterpretationPanel;
  locale: 'en' | 'id';
  primary: InterpretationGene;
  comparison?: InterpretationGene;
}

export function AiInterpretation({ panel, locale, primary, comparison }: AiInterpretationProps) {
  const [result, setResult] = useState<InterpretationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const requestId = useRef(0);
  const requestBody = JSON.stringify({ panel, locale, primary, comparison });

  useEffect(() => {
    requestId.current += 1;
    setResult(null);
    setLoading(false);
    setError('');
  }, [requestBody]);

  const run = async () => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/ibce/interpretation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: requestBody,
      });
      if (!response.ok) throw new Error(`Interpretation unavailable (${response.status})`);
      const data = await response.json() as InterpretationResponse;
      if (requestId.current !== currentRequest) return;
      setResult(data);
    } catch (err) {
      if (requestId.current !== currentRequest) return;
      setResult(null);
      setError(err instanceof Error ? err.message : 'Interpretation unavailable');
    } finally {
      if (requestId.current === currentRequest) setLoading(false);
    }
  };

  return (
    <aside className="ibce-ai-interpretation" aria-live="polite">
      <div className="ibce-ai-head">
        <div>
          <span className="ibce-ai-kicker"><Sparkles size={13} /> {locale === 'id' ? 'Interpretasi berbantuan AI' : 'AI-assisted interpretation'}</span>
          <p>{locale === 'id' ? 'Ringkasan deskriptif dari data yang tampil, bukan diagnosis atau kesimpulan kausal.' : 'A descriptive summary of the displayed data, not a diagnosis or causal conclusion.'}</p>
           <p className="ibce-ai-model">{locale === 'id' ? 'Model: OpenAI GPT-5.6 Terra melalui Replit AI Integrations' : 'Model: OpenAI GPT-5.6 Terra via Replit AI Integrations'}</p>
        </div>
        {!result && !loading && (
          <button type="button" className="ibce-ai-button" onClick={() => void run()}>
            {locale === 'id' ? 'Interpretasikan' : 'Interpret'}
          </button>
        )}
        {loading && <span className="ibce-ai-loading"><LoaderCircle size={15} className="ibce-ai-spin" /> {locale === 'id' ? 'Menganalisis…' : 'Analysing…'}</span>}
      </div>
      {error && <p className="ibce-ai-error" role="alert">{error}</p>}
      {result && (
        <div className="ibce-ai-result">
          <p>{result.interpretation}</p>
          {!!result.caveats.length && <ul>{result.caveats.map((caveat, index) => <li key={`${caveat}-${index}`}>{caveat}</li>)}</ul>}
          {result.source === 'unavailable' && <small>{locale === 'id' ? 'Layanan interpretasi tidak tersedia; data asli tetap dapat digunakan.' : 'Interpretation service unavailable; the underlying data remain available.'}</small>}
          <button type="button" className="ibce-ai-retry" onClick={() => void run()}>{locale === 'id' ? 'Perbarui interpretasi' : 'Refresh interpretation'}</button>
        </div>
      )}
    </aside>
  );
}