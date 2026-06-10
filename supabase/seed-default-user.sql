-- Seed for the default VerdeVegan user.
-- First create this user in Supabase > Authentication > Users:
--   email: inesmpmarinho@gmail.com
--   password: verdevegan
-- Then run this SQL.

do $$
begin
  if not exists (select 1 from auth.users where email = 'inesmpmarinho@gmail.com') then
    raise exception 'Create the auth user % first in Supabase Authentication > Users.', 'inesmpmarinho@gmail.com';
  end if;
end $$;

with target_user as (
  select id
  from auth.users
  where email = 'inesmpmarinho@gmail.com'
  limit 1
)
insert into public.profiles (id, name, email, phone, diet, allergies, photo_url, addresses, payments, points)
select
  target_user.id,
  'Inês Marinho',
  'inesmpmarinho@gmail.com',
  '912 345 678',
  'Vegan',
  '',
  'assets/profile-photo.jpg',
  '[{"id":1,"label":"Casa","street":"Rua de Santa Catarina","number":"852","postalCode":"4000-443","city":"Porto","locality":"Porto","principal":true},{"id":2,"label":"Trabalho","street":"R. Manuel Pinto de Azevedo","number":"626","postalCode":"4100-320","city":"Porto","locality":"Porto","principal":false}]'::jsonb,
  '[{"id":1,"holder":"Inês Marinho","number":"5123456789011234","expiry":"08/2028","cvv":"123","brand":"Mastercard","principal":true},{"id":2,"holder":"Inês Marinho","number":"4123456789011443","expiry":"12/2029","cvv":"456","brand":"Visa","principal":false}]'::jsonb,
  86
from target_user
on conflict (id) do update set
  name = excluded.name,
  email = excluded.email,
  phone = excluded.phone,
  diet = excluded.diet,
  allergies = excluded.allergies,
  photo_url = excluded.photo_url,
  addresses = excluded.addresses,
  payments = excluded.payments,
  points = excluded.points,
  updated_at = now();

with target_user as (
  select id
  from auth.users
  where email = 'inesmpmarinho@gmail.com'
  limit 1
),
seeded_orders (
  id,
  date,
  created_at_app,
  estimated_delivery_minutes,
  restaurant,
  status,
  items,
  points_used,
  points_earned,
  delivery_fee,
  total,
  rated,
  rating,
  review_comment
) as (
  values
  (
    'VV-3078',
    '2026-05-28'::date,
    null::timestamptz,
    null::integer,
    'Green Bowl Porto',
    'A caminho',
    '[{"dishId":"bowl-tofu","name":"Bowl de Tofu Grelhado","quantity":1,"price":9.9,"extras":["Abacate"]},{"dishId":"smoothie-verde","name":"Smoothie Verde","quantity":1,"price":3.8,"extras":[]}]'::jsonb,
    0,
    16,
    null::numeric,
    16.20,
    false,
    null::integer,
    null::text
  ),
  (
    'VV-2048',
    '2026-05-22'::date,
    null::timestamptz,
    null::integer,
    'VerdeVegan',
    'Entregue',
    '[{"dishId":"bowl-tofu","name":"Bowl de Tofu Grelhado","quantity":1,"price":9.9,"extras":["Abacate"]},{"dishId":"smoothie-verde","name":"Smoothie Verde","quantity":1,"price":3.8,"extras":[]}]'::jsonb,
    0,
    14,
    null::numeric,
    15.10,
    true,
    null::integer,
    null::text
  ),
  (
    'VV-2036',
    '2026-05-18'::date,
    null::timestamptz,
    null::integer,
    'Jardim Vegan',
    'Entregue',
    '[{"dishId":"hamburguer-verde","name":"Hambúrguer Verde","quantity":1,"price":12.9,"extras":["Batata doce"]}]'::jsonb,
    20,
    9,
    null::numeric,
    9.80,
    false,
    null::integer,
    null::text
  ),
  (
    'VV-1984',
    '2026-04-09'::date,
    null::timestamptz,
    null::integer,
    'Casa do Seitan',
    'Entregue',
    '[{"dishId":"wrap-seitan","name":"Wrap de legumes","quantity":2,"price":8.45,"extras":[]},{"dishId":"mini-muffins-cenoura","name":"Bolo de cenoura","quantity":1,"price":5,"extras":[]}]'::jsonb,
    0,
    22,
    null::numeric,
    22.40,
    true,
    null::integer,
    null::text
  ),
  (
    'VV-1862',
    '2026-03-25'::date,
    null::timestamptz,
    null::integer,
    'Horta Urbana',
    'Entregue',
    '[{"dishId":"lasanha-beringela","name":"Lasanha de beringela","quantity":1,"price":14.5,"extras":[]},{"dishId":"sumo-laranja-gengibre","name":"Sumo natural de morango e laranja","quantity":1,"price":5,"extras":[]}]'::jsonb,
    0,
    20,
    null::numeric,
    22.00,
    true,
    null::integer,
    null::text
  ),
  (
    'VV-1710',
    '2026-01-12'::date,
    null::timestamptz,
    null::integer,
    'VerdeVegan',
    'Entregue',
    '[{"dishId":"salada-mediterranica","name":"Salada Caesar","quantity":2,"price":8.9,"extras":[]}]'::jsonb,
    10,
    18,
    null::numeric,
    18.30,
    false,
    null::integer,
    null::text
  ),
  (
    'VV-1542',
    '2025-12-17'::date,
    null::timestamptz,
    null::integer,
    'Green Bowl Porto',
    'Entregue',
    '[{"dishId":"bowl-seitan-teriyaki","name":"Refeição familiar","quantity":1,"price":63.5,"extras":[]}]'::jsonb,
    0,
    64,
    null::numeric,
    66.00,
    true,
    null::integer,
    null::text
  ),
  (
    'VV-1396',
    '2025-10-04'::date,
    null::timestamptz,
    null::integer,
    'Jardim Vegan',
    'Entregue',
    '[{"dishId":"ragu-salsicha-vegan","name":"Carne estufada vegan","quantity":1,"price":13.4,"extras":[]},{"dishId":"smoothie-verde","name":"Smoothie Verde","quantity":1,"price":3.8,"extras":[]}]'::jsonb,
    0,
    18,
    null::numeric,
    19.70,
    false,
    null::integer,
    null::text
  ),
  (
    'VV-1218',
    '2025-07-20'::date,
    null::timestamptz,
    null::integer,
    'Casa do Seitan',
    'Entregue',
    '[{"dishId":"pizza-seitan-fumado","name":"Pizza vegan de cogumelos","quantity":1,"price":15.6,"extras":[]},{"dishId":"mini-muffins-cenoura","name":"Bolo de cenoura","quantity":2,"price":5,"extras":[]}]'::jsonb,
    30,
    25,
    null::numeric,
    25.10,
    true,
    null::integer,
    null::text
  ),
  (
    'VV-1105',
    '2025-02-11'::date,
    null::timestamptz,
    null::integer,
    'Horta Urbana',
    'Entregue',
    '[{"dishId":"bowl-tofu","name":"Bowl de Tofu Grelhado","quantity":2,"price":9.9,"extras":[]}]'::jsonb,
    0,
    20,
    null::numeric,
    22.30,
    true,
    null::integer,
    null::text
  ),
  (
    'VV-0932',
    '2024-11-06'::date,
    null::timestamptz,
    null::integer,
    'VerdeVegan',
    'Entregue',
    '[{"dishId":"wrap-seitan","name":"Wrap de legumes","quantity":5,"price":8.45,"extras":[]}]'::jsonb,
    0,
    42,
    null::numeric,
    44.75,
    true,
    null::integer,
    null::text
  ),
  (
    'VV-0744',
    '2024-03-25'::date,
    null::timestamptz,
    null::integer,
    'Green Bowl Porto',
    'Entregue',
    '[{"dishId":"bowl-seitan-teriyaki","name":"Refeição familiar","quantity":1,"price":63.5,"extras":[]}]'::jsonb,
    0,
    64,
    null::numeric,
    63.50,
    false,
    null::integer,
    null::text
  )
)
insert into public.orders (
  id,
  user_id,
  date,
  created_at_app,
  estimated_delivery_minutes,
  restaurant,
  status,
  items,
  points_used,
  points_earned,
  delivery_fee,
  total,
  rated,
  rating,
  review_comment
)
select
  seeded_orders.id,
  target_user.id,
  seeded_orders.date,
  seeded_orders.created_at_app,
  seeded_orders.estimated_delivery_minutes,
  seeded_orders.restaurant,
  seeded_orders.status,
  seeded_orders.items,
  seeded_orders.points_used,
  seeded_orders.points_earned,
  seeded_orders.delivery_fee,
  seeded_orders.total,
  seeded_orders.rated,
  seeded_orders.rating,
  seeded_orders.review_comment
from target_user
cross join seeded_orders
on conflict (id) do update set
  user_id = excluded.user_id,
  date = excluded.date,
  created_at_app = excluded.created_at_app,
  estimated_delivery_minutes = excluded.estimated_delivery_minutes,
  restaurant = excluded.restaurant,
  status = excluded.status,
  items = excluded.items,
  points_used = excluded.points_used,
  points_earned = excluded.points_earned,
  delivery_fee = excluded.delivery_fee,
  total = excluded.total,
  rated = excluded.rated,
  rating = excluded.rating,
  review_comment = excluded.review_comment,
  updated_at = now();
