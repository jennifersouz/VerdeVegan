const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const orders = JSON.parse(fs.readFileSync(path.join(root, 'src/assets/data/orders.json'), 'utf8'));

const defaultAccount = {
  name: 'Inês Marinho',
  email: 'inesmpmarinho@gmail.com',
  phone: '912 345 678',
  diet: 'Vegan',
  allergies: '',
  photoUrl: 'assets/profile-photo.jpg',
  points: 86,
  addresses: [
    {
      id: 1,
      label: 'Casa',
      street: 'Rua de Santa Catarina',
      number: '852',
      postalCode: '4000-443',
      city: 'Porto',
      locality: 'Porto',
      principal: true,
    },
    {
      id: 2,
      label: 'Trabalho',
      street: 'R. Manuel Pinto de Azevedo',
      number: '626',
      postalCode: '4100-320',
      city: 'Porto',
      locality: 'Porto',
      principal: false,
    },
  ],
  payments: [
    { id: 1, holder: 'Inês Marinho', number: '5123456789011234', expiry: '08/2028', cvv: '123', brand: 'Mastercard', principal: true },
    { id: 2, holder: 'Inês Marinho', number: '4123456789011443', expiry: '12/2029', cvv: '456', brand: 'Visa', principal: false },
  ],
};

function sql(value) {
  if (value === null || value === undefined) {
    return 'null';
  }
  return `'${String(value).replaceAll("'", "''")}'`;
}

function jsonb(value) {
  return `${sql(JSON.stringify(value))}::jsonb`;
}

function orderValue(order) {
  return `(
    ${sql(order.id)},
    ${sql(order.date)}::date,
    ${order.createdAt ? `${sql(order.createdAt)}::timestamptz` : 'null::timestamptz'},
    ${Number.isFinite(order.estimatedDeliveryMinutes) ? `${order.estimatedDeliveryMinutes}::integer` : 'null::integer'},
    ${sql(order.restaurant ?? 'VerdeVegan')},
    ${sql(order.status)},
    ${jsonb(order.items ?? [])},
    ${order.pointsUsed ?? 0},
    ${order.pointsEarned ?? 0},
    ${Number.isFinite(order.deliveryFee) ? `${Number(order.deliveryFee).toFixed(2)}::numeric` : 'null::numeric'},
    ${Number(order.total ?? 0).toFixed(2)},
    ${order.rated ? 'true' : 'false'},
    ${Number.isFinite(order.rating) ? `${order.rating}::integer` : 'null::integer'},
    ${order.reviewComment ? sql(order.reviewComment) : 'null::text'}
  )`;
}

const output = `-- Seed for the default VerdeVegan user.
-- First create this user in Supabase > Authentication > Users:
--   email: ${defaultAccount.email}
--   password: verdevegan
-- Then run this SQL.

do $$
begin
  if not exists (select 1 from auth.users where email = ${sql(defaultAccount.email)}) then
    raise exception 'Create the auth user % first in Supabase Authentication > Users.', ${sql(defaultAccount.email)};
  end if;
end $$;

with target_user as (
  select id
  from auth.users
  where email = ${sql(defaultAccount.email)}
  limit 1
)
insert into public.profiles (id, name, email, phone, diet, allergies, photo_url, addresses, payments, points)
select
  target_user.id,
  ${sql(defaultAccount.name)},
  ${sql(defaultAccount.email)},
  ${sql(defaultAccount.phone)},
  ${sql(defaultAccount.diet)},
  ${sql(defaultAccount.allergies)},
  ${sql(defaultAccount.photoUrl)},
  ${jsonb(defaultAccount.addresses)},
  ${jsonb(defaultAccount.payments)},
  ${defaultAccount.points}
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
  where email = ${sql(defaultAccount.email)}
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
${orders.map((order) => `  ${orderValue(order)}`).join(',\n')}
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
`;

fs.writeFileSync(path.join(__dirname, 'seed-default-user.sql'), output);
console.log(`Generated supabase/seed-default-user.sql with ${orders.length} orders for ${defaultAccount.email}.`);
