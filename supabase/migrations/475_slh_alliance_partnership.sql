-- SLH alliance: 'none' ("Independent") is misleading.
-- SLH has an EXCLUSIVE Hilton Honors partnership - properties appear in Hilton's
-- award inventory, Hilton elite benefits apply on-property, points earn via Hilton channels.
-- 'other' renders as "Partnership" badge, which is accurate.

update programs set
  alliance = 'other',
  updated_at = now()
where slug = 'slh';
