// 1. All active approved alerts
export const getActiveAlerts = `*[_type == "alert" && isApproved == true && (endDate == null || endDate > now())] | order(publishedAt desc) {
  _id, title, slug, summary, type, programs, actionType,
  startDate, endDate, publishedAt, confidenceLevel,
  impactScore, impactJustification, valueScore, rarityScore,
  isApproved, approvedAt, source
}`

// 2. Top 4 time-sensitive alerts for homepage
export const getTopAlerts = `*[_type == "alert" && isApproved == true && (endDate == null || endDate > now()) && type in ["transfer_bonus","limited_time_offer","award_availability","status_promo","glitch"]] | order(publishedAt desc) [0...4] {
  _id, title, slug, summary, type, programs, actionType,
  startDate, endDate, publishedAt, confidenceLevel,
  impactScore, impactJustification, valueScore, rarityScore,
  isApproved, approvedAt, source
}`

// 3. Alerts by publish date — pass dateStart and dateEnd as UTC ISO strings (e.g. "2026-04-03T00:00:00Z" / "2026-04-04T00:00:00Z")
export const getAlertsByDate = `*[_type == "alert" && isApproved == true && publishedAt >= $dateStart && publishedAt < $dateEnd] | order(publishedAt desc) {
  _id, title, slug, summary, type, programs, actionType,
  startDate, endDate, publishedAt, confidenceLevel,
  impactScore, impactJustification, valueScore, rarityScore,
  isApproved, approvedAt, source
}`

// 4. Alerts by program
export const getAlertsByProgram = `*[_type == "alert" && isApproved == true && $program in programs] | order(publishedAt desc) {
  _id, title, slug, summary, type, programs, actionType,
  startDate, endDate, publishedAt, confidenceLevel,
  impactScore, impactJustification, valueScore, rarityScore,
  isApproved, approvedAt, source
}`

// 5. Alerts by filter (all params optional)
export const getAlertsByFilter = `*[_type == "alert" && isApproved == true && ($program == null || $program in programs) && ($type == null || type == $type)] | order(endDate asc, publishedAt desc) {
  _id, title, slug, summary, type, programs, actionType,
  startDate, endDate, publishedAt, confidenceLevel,
  impactScore, impactJustification, valueScore, rarityScore,
  isApproved, approvedAt, source
}`

// 6. Homepage slots with resolved alert references
export const getHomepageSlots = `*[_type == "homepageSlot"] | order(slotNumber asc) {
  slotNumber, isPinned, pinnedAt,
  alert-> {
    _id, title, slug, summary, type, programs, actionType,
    startDate, endDate, publishedAt, confidenceLevel,
    impactScore, impactJustification, valueScore, rarityScore,
    isApproved, approvedAt, source
  }
}`

// 7. Single alert by slug
export const getAlertBySlug = `*[_type == "alert" && slug.current == $slug][0] {
  _id, title, slug, summary, type, programs, actionType,
  startDate, endDate, publishedAt, confidenceLevel,
  impactScore, impactJustification, valueScore, rarityScore,
  isApproved, approvedAt, source,
  relatedAlerts[]-> {
    _id, title, slug, summary, type
  }
}`
