interface LegalSection {
  heading: string;
  content: (string | { type: "list"; items: string[] } | { type: "table"; headers: string[]; rows: string[][] })[];
}

interface LegalPageProps {
  title: string;
  effectiveDate: string;
  lastUpdated: string;
  intro?: string;
  sections: LegalSection[];
}

export default function LegalPage({ title, effectiveDate, lastUpdated, intro, sections }: LegalPageProps) {
  return (
    <div className="bg-[var(--color-background)] min-h-screen">
      {/* Page header */}
      <div className="bg-[var(--color-background-soft)] border-b border-[var(--color-border-soft)]">
        <div className="rg-container py-12">
          <p className="font-ui text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-primary)] mb-3">
            Legal
          </p>
          <h1 className="font-display text-4xl font-semibold text-[var(--color-primary)]">
            {title}
          </h1>
          <div className="mt-4 flex flex-wrap gap-6 text-xs font-ui text-[var(--color-text-secondary)]">
            <span>Effective Date: {effectiveDate}</span>
            <span>Last Updated: {lastUpdated}</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="rg-container py-16">
        <div className="max-w-3xl">
          {intro && (
            <p className="font-body text-base text-[var(--color-text-secondary)] leading-relaxed mb-12 pb-12 border-b border-[var(--color-border-soft)]">
              {intro}
            </p>
          )}

          <div className="space-y-10">
            {sections.map((section, i) => (
              <section key={i}>
                <h2 className="font-display text-xl font-semibold text-[var(--color-primary)] mb-3">
                  {section.heading}
                </h2>
                <div className="space-y-3">
                  {section.content.map((block, j) => {
                    if (typeof block === "string") {
                      return (
                        <p key={j} className="font-body text-sm text-[var(--color-text-secondary)] leading-relaxed">
                          {block}
                        </p>
                      );
                    }
                    if (block.type === "list") {
                      return (
                        <ul key={j} className="space-y-1.5 pl-4">
                          {block.items.map((item, k) => (
                            <li key={k} className="flex items-start gap-2 font-body text-sm text-[var(--color-text-secondary)]">
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-primary)]" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      );
                    }
                    if (block.type === "table") {
                      return (
                        <div key={j} className="overflow-x-auto mt-4">
                          <table className="w-full text-sm border-collapse">
                            <thead>
                              <tr className="bg-[var(--color-background-soft)]">
                                {block.headers.map((h, k) => (
                                  <th key={k} className="text-left px-4 py-2.5 font-ui font-semibold text-xs uppercase tracking-wider text-[var(--color-primary)] border border-[var(--color-border-soft)]">
                                    {h}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {block.rows.map((row, k) => (
                                <tr key={k} className="even:bg-[var(--color-background-soft)]">
                                  {row.map((cell, l) => (
                                    <td key={l} className="px-4 py-2.5 font-body text-[var(--color-text-secondary)] border border-[var(--color-border-soft)]">
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </section>
            ))}
          </div>

          {/* Contact block */}
          <div className="mt-16 pt-8 border-t border-[var(--color-border-soft)]">
            <p className="font-body text-xs text-[var(--color-text-secondary)]">
              ThankYouDeals Inc. · New York, USA ·{" "}
              <a href="mailto:support@thankyoudeals.com" className="text-[var(--color-primary)] hover:underline">
                support@thankyoudeals.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
