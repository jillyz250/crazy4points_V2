-- Enrich the JSX Flight Credit description on all United cards so users
-- understand what JSX actually is (most don't). The Chase product pages
-- don't explain it either — they assume you know.
--
-- JSX is a real airline: 30-seat semi-private jets, no TSA, 20-min check-in,
-- mostly West Coast + Texas + Florida routes. Cool benefit if you live on
-- one of their routes; useless if you don't fly through their hubs.

update credit_card_benefits
   set description = case
     when name ilike '%$100%' then
       'Up to $100 in credits annually on flights purchased directly through JSX with your United Explorer Card. JSX is a semi-private hop-on jet service flying 30-seat regional jets from private terminals (no TSA, 20-minute check-in). Routes are mostly West Coast hubs (LAX, Burbank, Vegas), Texas (Dallas Love Field, Houston, Austin), and Florida shuttles. Useful if you fly those routes; the credit goes unused otherwise.'
     when name ilike '%$150%' then
       'Up to $150 in credits annually on flights purchased directly through JSX with your United Quest Card. JSX is a semi-private hop-on jet service flying 30-seat regional jets from private terminals (no TSA, 20-minute check-in). Routes are mostly West Coast hubs (LAX, Burbank, Vegas), Texas (Dallas Love Field, Houston, Austin), and Florida shuttles. Useful if you fly those routes; the credit goes unused otherwise.'
     when name ilike '%$200%' then
       'Up to $200 in credits annually on flights purchased directly through JSX with your United Club Card. JSX is a semi-private hop-on jet service flying 30-seat regional jets from private terminals (no TSA, 20-minute check-in). Routes are mostly West Coast hubs (LAX, Burbank, Vegas), Texas (Dallas Love Field, Houston, Austin), and Florida shuttles. Useful if you fly those routes; the credit goes unused otherwise.'
     else description
   end
 where name ilike '%JSX%';
