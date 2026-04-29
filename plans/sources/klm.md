# KLM Royal Dutch Airlines (carrier) — Source List

Reference list of every URL used to author the public page at `/programs/klm`. Per-program audit trail — not the intel sources DB table.

KLM is a **carrier** row (the airline). The loyalty program **Flying Blue** has its own row + source doc at `plans/sources/flying_blue.md` and holds program-level content (transfer partners, tier benefits, mile expiry, etc.).

---

## Last reviewed
**April 2026** by Jill + Claude

## Official KLM sources

- **Corporate site:** https://www.airfranceklm.com/en/group/airline/klm
- **Crown Lounges at Schiphol:** https://www.klm.com/information/airport/crown-lounges
- **Worldwide lounges:** https://www.klm.com/information/airport/worldwide-lounges
- **Paid lounge access conditions (US):** https://www.klm.com/information/legal/extra-options/paid-lounge-access
- **KLM Lounge Guide:** https://lounge.klm.com/
- **AF/KLM joint lounge guide PDF:** https://afkldocs.info/assets/228_AFK_lounge_guide.pdf
- **Newsroom:** https://news.klm.com/
- **AF-KLM Group corporate site:** https://www.airfranceklm.com/en
- **AF-KLM newsroom:** https://www.airfranceklm.com/en/newsroom

## Social channels (for ongoing signal monitoring)

- **Newsroom (corporate):** https://news.klm.com/

## Research articles cited (by section)

### Intro
- AF-KLM Group structure (image with subsidiaries — Air France, KLM, Transavia, Air France Industries / KLM E&M, Martinair Cargo, Flying Blue): pasted directly 2026-04-29
- AF official corporate page (founded 2004 + Transavia + intercontinental leadership framing): https://corporate.airfrance.com/en (paste-in 2026-04-29; reused from air_france research)

### Lounge access
- Crown Lounges Schiphol page (eligibility + paid pricing + Silver discount): https://www.klm.com/information/airport/crown-lounges (paste-in 2026-04-29)

### Tips & quirks
- Royal predicate granted 12 September 1919 by Queen Wilhelmina: Copilot fact-check 2026-04-29 (secondary source confirmation; flagged MEDIUM in audit)
- Schiphol-only long-haul confirmed: Copilot fact-check 2026-04-29 (matches AF/KLM corporate description; KLM Cityhopper handles regional short-haul, not long-haul)

## Fact-check disagreements / resolutions

| Date | Claim | Disagreement | Resolution + source |
|---|---|---|---|
| 2026-04-29 | "World's oldest airline still operating under its original name" (early intro draft) | Self-flagged as MEDIUM — widely cited but no official paste-in | Removed; replaced with "founded in 1919 — among the oldest continuously operating airlines in the world" framing; specific date later restored to "12 September 1919" per Copilot fact-check on Royal predicate |
| 2026-04-29 | Flying Blue Silver 25% paid lounge discount | ChatGPT flagged it as not-alliance-wide; technically correct that it's not alliance-wide | Kept on KLM carrier page only (KLM's official page documents it as a KLM-specific benefit). Not present on Flying Blue program page. The architectural split is doing its job. |
| 2026-04-29 | "Largest in Europe by intercontinental traffic" | Copilot: directionally true, not explicitly stated in 2026 sources | Softened wording to match AF official paste: "leader in intercontinental traffic departing from Europe" |
| 2026-04-29 | Schiphol-only long-haul | Copilot: accurate with KLM Cityhopper short-haul nuance | Kept as drafted (intentionally about long-haul; Cityhopper short-haul not relevant to the page's POV) |

## Cross-link notes (per Step 8)

- **Loyalty program:** Flying Blue (`/programs/flying_blue`).
- **Sister carrier:** Air France (`/programs/air_france`) — both feed into Flying Blue.
- **Co-brand credit cards** — same situation as AF: no US-issued KLM co-brand card. The Bilt/Amex/Chase/Citi/Cap One/WF transfer-partner relationships all live on the Flying Blue program row.

## Notes / followups

- KLM Cityhopper is a separate sub-brand handling short-haul/regional. If the Cityhopper experience meaningfully diverges from mainline KLM (different cabin product, different brand), consider a separate row when authoring depth grows.
- KLM Crown Lounge Silver-discount and Plat/Gold extra-guest discount language is from the KLM official page — verify on next review (KLM occasionally updates discount %s).
- Watch for AF-KLM Group structural changes (Delta + Virgin Atlantic JV reshuffles) that might require updates to both AF and KLM intros.
- Flag for **Step 7.5 (Scout)**: test [news.klm.com](https://news.klm.com/) for RSS feed; expect Cloudflare 403 like AF (use Firecrawl ON if so).
- Flag for **deferred follow-up**: when the auto cross-link callout for joint-carrier pages ships (see todos), revisit KLM page to remove redundant manual cross-link prose.
