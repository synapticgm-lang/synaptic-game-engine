import { ArrowLeft } from 'lucide-react';
import { TERMS_DOC, PRIVACY_DOC } from '@/legal/legalDocs';
import { CREDIT_SECTIONS, CREDITS_LAST_UPDATED, CREDITS_PATH } from '@/legal/credits';

/** Public credits page — fonts, icons, folklore, and other free / third-party materials. */
export function CreditsPage() {
  return (
    <div className="sgm-scroll-page bg-slate-950 text-slate-200">
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
            <a href={TERMS_DOC.path} className="text-slate-500 hover:text-slate-300">
              Terms
            </a>
            <a href={PRIVACY_DOC.path} className="text-slate-500 hover:text-slate-300">
              Privacy
            </a>
            <a href={CREDITS_PATH} className="text-cyan-300">
              Credits
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">SynapticGM</p>
        <h1 className="mt-2 font-serif text-3xl font-bold text-slate-50">Credits</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: {CREDITS_LAST_UPDATED}</p>
        <p className="mt-4 text-sm leading-relaxed text-slate-400">
          Free typefaces, icons, and other third-party materials the live game uses — who made them,
          where they come from, and what we use them for. Original SynapticGM stories and rules are
          listed too. This is not a claim that every file in the repo is public domain.
        </p>

        <div className="mt-10 space-y-10">
          {CREDIT_SECTIONS.map((section) => (
            <section key={section.id}>
              <h2 className="text-lg font-semibold text-slate-100">{section.title}</h2>
              {section.intro ? (
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{section.intro}</p>
              ) : null}
              <ul className="mt-3 divide-y divide-slate-800 overflow-hidden rounded-lg border border-slate-800 bg-slate-900/40">
                {section.rows.map((row) => (
                  <li key={`${section.id}-${row.work}`} className="px-4 py-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                      {row.url ? (
                        <a
                          href={row.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-cyan-300 hover:underline"
                        >
                          {row.work}
                        </a>
                      ) : (
                        <span className="text-sm font-medium text-slate-100">{row.work}</span>
                      )}
                      <span className="text-[11px] uppercase tracking-wide text-slate-500">{row.license}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-400">{row.source}</p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-500">{row.usedFor}</p>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <p className="mt-12 border-t border-slate-800 pt-6 text-xs text-slate-600">
          Also see{' '}
          <a href={TERMS_DOC.path} className="text-cyan-400 hover:underline">
            {TERMS_DOC.title}
          </a>{' '}
          and{' '}
          <a href={PRIVACY_DOC.path} className="text-cyan-400 hover:underline">
            {PRIVACY_DOC.title}
          </a>
          .
        </p>
      </main>
    </div>
  );
}
