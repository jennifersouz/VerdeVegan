const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dishes = JSON.parse(fs.readFileSync(path.join(root, 'src/assets/data/menu.json'), 'utf8'));

const restaurantCovers = {
  'Pizzaria Luzzo': 'assets/imagens/pizzaria luzo.jpg',
  'Green Burger Lab': 'assets/imagens/green burguer lab.jpg',
  'Taco Verde': 'assets/imagens/taco verde.jpg',
  'Sushi Raiz': 'assets/imagens/sushi raiz.jpg',
  'Massas Caseiras': 'assets/imagens/massas caseiras .jpg',
  'Brunch Verde': 'assets/imagens/brunch verde.jpg',
  'Bowl Garden': 'assets/imagens/bowl garden.jpg',
  'Doce Planta': 'assets/imagens/doce planta.jpg',
  'Folha Fresca': 'assets/imagens/folha fresca.jpg',
};

function deliveryFee(name) {
  return name === 'Pizzaria Luzzo' ? 2.4 : name === 'Massas Caseiras' ? 1.9 : 1.5;
}

function sql(value) {
  if (value === null || value === undefined) {
    return 'null';
  }
  return `'${String(value).replaceAll("'", "''")}'`;
}

function jsonb(value) {
  return `${sql(JSON.stringify(value))}::jsonb`;
}

const restaurants = Array.from(new Set(dishes.map((dish) => dish.restaurant))).sort((a, b) => a.localeCompare(b));

const output = [
  '-- Seed generated from src/assets/data/menu.json.',
  '-- Run this after schema.sql.',
  '',
  'insert into public.restaurants (name, image, delivery_fee)',
  'values',
  restaurants
    .map((name) => `  (${sql(name)}, ${sql(restaurantCovers[name] ?? '')}, ${deliveryFee(name).toFixed(2)})`)
    .join(',\n') +
    '\non conflict (name) do update set image = excluded.image, delivery_fee = excluded.delivery_fee;',
  '',
  'insert into public.dishes (id, name, category, price, rating, time, image, description, ingredients, allergens, nutrition, available, extras, restaurant, portions, customizations)',
  'values',
  dishes
    .map(
      (dish) =>
        `  (${[
          sql(dish.id),
          sql(dish.name),
          sql(dish.category),
          Number(dish.price).toFixed(2),
          Number(dish.rating).toFixed(1),
          sql(dish.time),
          sql(dish.image),
          sql(dish.description),
          jsonb(dish.ingredients),
          jsonb(dish.allergens),
          jsonb(dish.nutrition),
          dish.available ? 'true' : 'false',
          jsonb(dish.extras),
          sql(dish.restaurant),
          sql(dish.portions),
          jsonb(dish.customizations),
        ].join(', ')})`,
    )
    .join(',\n') +
    '\non conflict (id) do update set name = excluded.name, category = excluded.category, price = excluded.price, rating = excluded.rating, time = excluded.time, image = excluded.image, description = excluded.description, ingredients = excluded.ingredients, allergens = excluded.allergens, nutrition = excluded.nutrition, available = excluded.available, extras = excluded.extras, restaurant = excluded.restaurant, portions = excluded.portions, customizations = excluded.customizations;',
  '',
].join('\n');

fs.writeFileSync(path.join(__dirname, 'seed-data.sql'), output);
console.log(`Generated supabase/seed-data.sql with ${restaurants.length} restaurants and ${dishes.length} dishes.`);
