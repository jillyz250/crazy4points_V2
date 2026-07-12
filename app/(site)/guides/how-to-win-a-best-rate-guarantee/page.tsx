import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'How to Actually Win a Hotel Best Rate Guarantee — Tips From the Fine Print',
  description:
    '31 practical tips for winning a hotel best rate guarantee claim, drawn from the chains’ official terms — matching rules, evidence, timing, and reward tricks. Verified July 2026.',
  alternates: { canonical: 'https://www.crazy4points.com/guides/how-to-win-a-best-rate-guarantee' },
  openGraph: {
    title: 'How to Actually Win a Hotel Best Rate Guarantee',
    description:
      'The tips that actually get a best rate guarantee claim approved — straight from the fine print.',
    url: 'https://www.crazy4points.com/guides/how-to-win-a-best-rate-guarantee',
    type: 'article',
    siteName: 'crazy4points',
  },
}

export const revalidate = 86400

function Callout({ children, tone = 'soft' }: { children: React.ReactNode; tone?: 'soft' | 'warn' }) {
  const border = tone === 'warn' ? 'var(--color-accent)' : 'var(--color-primary)'
  return (
    <div style={{ background: 'var(--color-background-soft)', border: '1px solid var(--color-border-soft)', borderLeft: `4px solid ${border}`, borderRadius: 'var(--radius-card)', padding: '1rem 1.25rem', margin: '1.25rem 0', fontFamily: 'var(--font-body)', color: 'var(--color-text-primary)', lineHeight: 1.55 }}>
      {children}
    </div>
  )
}

function Tips({ start, items }: { start: number; items: React.ReactNode[] }) {
  return (
    <ol className="mt-3 flex flex-col gap-3 font-body text-[var(--color-text-primary)]" style={{ listStyle: 'decimal', paddingLeft: '1.25rem' }} start={start}>
      {items.map((it, i) => (
        <li key={i} style={{ lineHeight: 1.55 }}>{it}</li>
      ))}
    </ol>
  )
}

const H2 = 'mt-10 font-display text-2xl font-semibold text-[var(--color-primary)]'

export default function HowToWinBestRateGuarantee() {
  return (
    <main className="rg-major-section">
      <div className="rg-container rg-guide" style={{ maxWidth: '52rem' }}>
        <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-2.5 py-1 font-ui text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-[#1A1A1A]">
          Guide · Verified July 10, 2026
        </span>
        <h1 className="font-display text-3xl font-semibold text-[var(--color-primary)] md:text-4xl">
          How to Actually Win a Hotel Best Rate Guarantee
        </h1>
        <p className="mt-4 font-body text-lg text-[var(--color-text-secondary)]">
          Most best rate guarantee claims don&rsquo;t fail because the program is a gimmick — they fail on a
          technicality buried in the terms. Here&rsquo;s how to stack the deck, with every tip drawn from the chains&rsquo;
          own official terms. New here? Start with our{' '}
          <Link href="/guides/hotel-best-rate-guarantees" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>Best Rate Guarantee guide</Link>{' '}
          for who offers what.
        </p>

        <Callout tone="warn">
          <strong>Before you rely on any of this:</strong> best rate guarantee programs change constantly, and every
          claim is governed by that chain&rsquo;s <strong>official terms and conditions</strong> — which can differ by
          brand, region, and date. Always confirm the current rules on the hotel or portal&rsquo;s own terms page (linked
          in our <Link href="/guides/hotel-best-rate-guarantees" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>guide</Link>) before you book or file a claim. Nothing here is a promise of approval.
        </Callout>

        <h2 className={H2}>Before you book</h2>
        <Tips start={1} items={[
          <><strong>Book direct first — always.</strong> Every program requires a confirmed booking through the hotel&rsquo;s own channel (website/app/call center) <em>before</em> you can claim. No booking, no claim.</>,
          <><strong>Don&rsquo;t book last-minute.</strong> Many chains block claims when you book too close to arrival: Marriott, Hyatt and IHG need it <strong>≥24 hours before check-in</strong>; Wyndham, Choice, Best Western, Accor and Radisson need <strong>≥48 hours</strong>; Barceló <strong>≥72 hours</strong>; SLH <strong>3 working days</strong>. Wyndham is blunt: a reservation made within 48 hours of check-in is ineligible, period.</>,
          <><strong>Book the <em>lowest</em> direct rate.</strong> Hilton and Marriott both require that, when several direct rates exist, you booked the <strong>lowest</strong> one to be eligible. Don&rsquo;t book a pricey flexible rate and expect to claim down.</>,
          <><strong>Match the refundability you&rsquo;ll compare against.</strong> Since the competing rate must share your cancellation policy (see #6), book the rate type — refundable vs prepaid — that matches the deal you expect to find.</>,
        ]} />

        <h2 className={H2}>Make the two rates match (where most claims die)</h2>
        <Tips start={5} items={[
          <><strong>Exact same room type — bed, view, and all.</strong> Hilton&rsquo;s own examples that <em>don&rsquo;t</em> qualify: <strong>King vs 2 Queen</strong>, <strong>ocean view vs partial ocean view</strong>, <strong>confirmed connecting rooms vs not</strong>. &ldquo;A room&rdquo; isn&rsquo;t enough — match the specifics.</>,
          <><strong>Exact same cancellation policy.</strong> Hilton spells out the traps: <strong>&ldquo;fully refundable vs deposit required,&rdquo; &ldquo;2-day vs 4-day cancellation,&rdquo; &ldquo;free cancellation vs non-cancellable&rdquo;</strong> all fail. Barceló goes further — if the policies differ at all, it applies the <strong>stricter</strong> one. This is the single most common denial reason.</>,
          <><strong>Same inclusions.</strong> A rate <em>with</em> breakfast ≠ your room-only rate. Marriott requires &ldquo;same inclusions (e.g., breakfast)&rdquo;; Hilton lists <strong>&ldquo;$25 property credit vs free breakfast&rdquo;</strong> as a non-match.</>,
          <><strong>Same occupancy — watch the guest count.</strong> Match the number of guests (Marriott caps at &ldquo;up to 2&rdquo;; Choice compares single/double). Hilton&rsquo;s non-match example: <strong>2 adults + 2 kids vs 1 adult</strong>.</>,
          <><strong>Don&rsquo;t split the stay.</strong> Hilton: booking <strong>Jan 26–31</strong> vs two back-to-back reservations (26–28 + 28–30) doesn&rsquo;t match. Keep it one continuous reservation.</>,
          <><strong>They compare the <em>whole stay</em>, not one night.</strong> Hilton, Marriott, Best Western, Wyndham and Radisson evaluate the <strong>total room cost for the entire stay</strong> (Radisson averages it). A cheaper single night elsewhere won&rsquo;t win if your total is still lower.</>,
        ]} />

        <h2 className={H2}>Which competing rates actually count</h2>
        <Tips start={11} items={[
          <><strong>It must be public and immediately bookable by anyone.</strong> No member-only, login-gated, coupon/promo-code, corporate, group, or &ldquo;call for price&rdquo; rates.</>,
          <><strong>But free-membership rates often <em>do</em> count.</strong> Hyatt explicitly allows rates behind <strong>free</strong> membership (or membership auto-created at booking); only paid/invitation-only ones are out. Shangri-La even lets its <strong>own member rates</strong> count as a competing rate. Read your chain&rsquo;s rule before dismissing a &ldquo;member price.&rdquo;</>,
          <><strong>Metasearch sites don&rsquo;t count.</strong> Choice names them: <strong>Google, Bing, Kayak, Trivago, TripAdvisor are not qualifying sites.</strong> You need the actual bookable OTA the metasearch points to.</>,
          <><strong>Skip opaque/auction rates.</strong> Priceline Express Deals, Hotwire, and any &ldquo;hotel revealed after you pay&rdquo; rate are excluded everywhere.</>,
          <><strong>Add hidden &ldquo;fees&rdquo; back before you compare.</strong> Choice spells this out: some OTAs shave the room rate and tack on a separate &ldquo;fee&rdquo; so it <em>looks</em> cheaper. Compare the <strong>all-in</strong> number (Hilton and Best Western likewise compare net of taxes and fees).</>,
          <><strong>Compare same currency, and ignore resort fees.</strong> Guarantees apply to the <strong>room rate only</strong>, net of resort/destination fees and taxes (both sides equal). Currency swings don&rsquo;t count — that&rsquo;s why Hyatt requires a <strong>3% gap only when currencies differ</strong> (Marriott 2% for FX); same-currency, it&rsquo;s just $1.</>,
        ]} />

        <h2 className={H2}>Evidence &amp; how to submit</h2>
        <Tips start={17} items={[
          <><strong>Screenshot the <em>final</em> step before confirmation.</strong> Barceló and Leading Hotels require the screenshot to be the last screen before booking, clearly showing <strong>hotel name, dates, room type, guests, currency, taxes, cancellation policy — plus your device&rsquo;s date and time.</strong> A partial screenshot gets rejected.</>,
          <><strong>…but know some chains ignore screenshots.</strong> IHG says it <strong>independently verifies and will not review your documentation</strong> — you submit the form and they check the live rate themselves. For IHG, the deal must still be live when a rep looks, so claim fast.</>,
          <><strong>Match the submission method to the timing.</strong> Hilton: a competing <strong>mobile-app</strong> rate must go through the <strong>online form</strong> with screenshots; a claim the <strong>day before or day of arrival</strong> must be made by <strong>phone</strong>.</>,
          <><strong>The rate has to still exist at verification.</strong> Hilton, Radisson and Booking.com all require the lower rate to be <strong>available when they check</strong>. If it sells out first, you&rsquo;re out — submit immediately.</>,
          <><strong>Claim under your own name.</strong> The claim name must match the reservation (and your ID at check-in). Bookings by brokers/agents, or on someone else&rsquo;s reservation, don&rsquo;t qualify (Choice, Wyndham, Best Western).</>,
        ]} />

        <h2 className={H2}>Maximize your reward</h2>
        <Tips start={22} items={[
          <><strong>Choose the better reward — and choose carefully.</strong> Where you get a pick (Marriott: 25% off <em>or</em> 5,000 pts; Hyatt: 20% <em>or</em> 5,000 pts): a <strong>short/cheaper stay</strong> usually favors the points; a <strong>long/expensive stay</strong> usually favors the % off. Hyatt states the choice is <strong>final</strong>, and Marriott locks it at submission — so do the quick math first.</>,
          <><strong>You usually don&rsquo;t need to book the competing rate.</strong> Best Western, Hilton and Agoda just want proof — don&rsquo;t waste money booking the OTA to &ldquo;lock it in.&rdquo;</>,
          <><strong>You must complete the stay to get paid.</strong> Hyatt&rsquo;s points, Best Western&rsquo;s <strong>$100 gift card</strong>, and Choice&rsquo;s <strong>$50 card</strong> all post <strong>after</strong> you check out (the cards, several weeks later). Cancel and you forfeit the bonus.</>,
          <><strong>Add your loyalty number before check-out.</strong> Points rewards (IHG 5×, Hyatt/Marriott 5k, Wyndham 3k) require (free) membership on the reservation. IHG can&rsquo;t add it <strong>after</strong> check-out.</>,
          <><strong>&ldquo;Cash&rdquo; rewards are cards, not cash.</strong> Best Western = a <strong>$100 gift card</strong>; Choice = a <strong>$50 Visa/Mastercard reward card</strong>. And travel-portal refunds are <strong>travel credit</strong> (Capital One credit, OneKeyCash, AgodaCash), not money back on your card.</>,
        ]} />

        <h2 className={H2}>Limits &amp; gotchas</h2>
        <Tips start={27} items={[
          <><strong>One reward per stay — and per household/month.</strong> Best Western and Choice cap it at <strong>one card per household per 30 days</strong>; Wyndham at <strong>one claim per person/email per calendar month</strong>; Hyatt allows up to <strong>3 claims/night but only 1 reward/stay</strong>.</>,
          <><strong>&ldquo;We already have that price&rdquo; = no bonus.</strong> Choice: if a Choice channel already matches or beats the rate, you get that rate but <strong>no reward card or free night</strong>. The bonus only triggers when a third party genuinely undercuts direct.</>,
          <><strong>Don&rsquo;t touch the reservation after approval.</strong> Hyatt, Hilton and IHG void an approved claim if you change dates, the name, add guests, or shorten the stay.</>,
          <><strong>Mind the minimum gap.</strong> It usually takes <strong>$1 or 1%</strong> (Hilton denies ≤1%); <strong>Accor needs 5%/€5</strong>, SLH <strong>$5</strong>, Club Med <strong>$10</strong>, Barceló <strong>€5</strong>. A few cents lower won&rsquo;t cut it.</>,
          <><strong>Watch the clock — and the calendar.</strong> Most windows are <strong>24 hours</strong> from booking, but Club Med&rsquo;s is <strong>same-day (by 11:59pm EST)</strong>. Wyndham only processes claims <strong>7am–10pm CST</strong>, and weekend claims at Barceló may wait until Monday. Don&rsquo;t file at the last minute on a Friday night.</>,
        ]} />

        <h2 className={H2}>Your 30-second pre-claim checklist</h2>
        <ul className="mt-3 flex flex-col gap-2 font-body text-[var(--color-text-primary)]">
          {[
            'Booked direct, more than 2–3 days before check-in',
            'Same hotel, room type, bed, view, dates, guests, and cancellation policy',
            'Competing rate is public, bookable, same currency, all-in (fees included)',
            'Screenshot of the final pre-booking screen with date/time visible',
            'Submitting within the window (usually 24h), under your own name',
            'Loyalty number on the reservation (for points rewards)',
            'Picked the reward that’s actually worth more for this stay',
          ].map((c) => (
            <li key={c} className="flex items-start gap-2">
              <span aria-hidden style={{ color: 'var(--color-primary)', fontWeight: 700 }}>☐</span>
              <span>{c}</span>
            </li>
          ))}
        </ul>

        <Callout>
          <strong>Reminder:</strong> every tip here reflects the official terms as of <strong>July 2026</strong>, and
          programs change often. Always confirm the current rules on the chain&rsquo;s or portal&rsquo;s own terms page —
          all of them are linked in our{' '}
          <Link href="/guides/hotel-best-rate-guarantees" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>Best Rate Guarantee guide</Link>. This article is general information, not a guarantee of approval, and we&rsquo;re not affiliated with any hotel or travel company.
        </Callout>
      </div>
    </main>
  )
}
