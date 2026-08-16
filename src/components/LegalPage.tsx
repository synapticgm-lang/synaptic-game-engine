import { ArrowLeft } from 'lucide-react';
import { getLegalDoc, type LegalDocId, TERMS_DOC, PRIVACY_DOC } from '@/legal/legalDocs';
import { CREDITS_PATH } from '@/legal/credits';

interface Props {
  docId: LegalDocId;
}

/** Public legal page — same pattern as most game/SaaS sites (/terms, /privacy). */
export function LegalPage({ docId }: Props) {
  const doc = getLegalDoc(docId);
  const other = docId === 'terms' ? PRIVACY_DOC : TERMS_DOC;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-100 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to SynapticGM
          </a>
          <nav className="flex gap-3 text-xs">
            <a
              href={TERMS_DOC.path}
              className={docId === 'terms' ? 'text-cyan-300' : 'text-slate-500 hover:text-slate-300'}
            >
              Terms
            </a>
            <a
              href={PRIVACY_DOC.path}
              className={docId === 'privacy' ? 'text-cyan-300' : 'text-slate-500 hover:text-slate-300'}
            >
              Privacy
            </a>
            <a href={CREDITS_PATH} className="text-slate-500 hover:text-slate-300">
              Credits
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">SynapticGM</p>
        <h1 className="mt-2 font-serif text-3xl font-bold text-slate-50">{doc.title}</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: {doc.lastUpdated}</p>

        <div className="mt-4 rounded-lg border border-amber-800/40 bg-amber-950/25 px-3 py-2 text-[12px] leading-relaxed text-amber-100/90">
          {doc.draftBanner}
        </div>

        <div className="mt-8 space-y-8">
          {doc.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-lg font-semibold text-slate-100">{section.heading}</h2>
              <div className="mt-2 space-y-3 text-sm leading-relaxed text-slate-400">
                {section.paragraphs.map((p) => (
                  <p key={p.slice(0, 48)}>{p}</p>
                ))}
                {section.bullets && section.bullets.length > 0 && (
                  <ul className="list-disc space-y-1.5 pl-5">
                    {section.bullets.map((b) => (
                      <li key={b.slice(0, 48)}>{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-12 border-t border-slate-800 pt-6 text-xs text-slate-600">
          Also see{' '}
          <a href={other.path} className="text-cyan-400 hover:underline">
            {other.title}
          </a>
          {' '}and{' '}
          <a href={CREDITS_PATH} className="text-cyan-400 hover:underline">
            Credits
          </a>
          .
        </p>
      </main>
    </div>
  );
}
