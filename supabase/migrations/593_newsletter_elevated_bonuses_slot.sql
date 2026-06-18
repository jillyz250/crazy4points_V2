-- Newsletter "Elevated Welcome Bonuses" slot. Auto-filled (like active_offers) from
-- credit_card_welcome_bonuses where is_elevated and the current total beats the baseline.
-- jsonb array of { card_name, baseline_amount, current_amount, currency, spend_required_usd,
-- spend_window_label, link_url, deadline }. Null = not pulled yet.
alter table newsletters add column if not exists elevated_bonuses jsonb;
