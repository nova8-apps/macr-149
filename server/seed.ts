// Seed the foods table with 30 common items (accurate macros per 100g)
import { db } from './db';
import crypto from 'crypto';

const SEED_FOODS = [
  { name: 'Chicken Breast', brand: null, caloriesPer100g: 165, proteinG: 31.0, carbsG: 0.0, fatG: 3.6, servingSize: '100', servingUnit: 'g' },
  { name: 'Salmon', brand: null, caloriesPer100g: 208, proteinG: 20.4, carbsG: 0.0, fatG: 13.4, servingSize: '100', servingUnit: 'g' },
  { name: 'White Rice (cooked)', brand: null, caloriesPer100g: 130, proteinG: 2.7, carbsG: 28.2, fatG: 0.3, servingSize: '100', servingUnit: 'g' },
  { name: 'Oats', brand: null, caloriesPer100g: 389, proteinG: 16.9, carbsG: 66.3, fatG: 6.9, servingSize: '40', servingUnit: 'g' },
  { name: 'Egg (whole)', brand: null, caloriesPer100g: 155, proteinG: 13.0, carbsG: 1.1, fatG: 11.0, servingSize: '50', servingUnit: 'g' },
  { name: 'Avocado', brand: null, caloriesPer100g: 160, proteinG: 2.0, carbsG: 8.5, fatG: 14.7, servingSize: '100', servingUnit: 'g' },
  { name: 'Banana', brand: null, caloriesPer100g: 89, proteinG: 1.1, carbsG: 22.8, fatG: 0.3, servingSize: '118', servingUnit: 'g' },
  { name: 'Apple', brand: null, caloriesPer100g: 52, proteinG: 0.3, carbsG: 13.8, fatG: 0.2, servingSize: '182', servingUnit: 'g' },
  { name: 'Broccoli', brand: null, caloriesPer100g: 34, proteinG: 2.8, carbsG: 6.6, fatG: 0.4, servingSize: '100', servingUnit: 'g' },
  { name: 'Sweet Potato', brand: null, caloriesPer100g: 86, proteinG: 1.6, carbsG: 20.1, fatG: 0.1, servingSize: '130', servingUnit: 'g' },
  { name: 'Greek Yogurt', brand: null, caloriesPer100g: 59, proteinG: 10.0, carbsG: 3.6, fatG: 0.4, servingSize: '170', servingUnit: 'g' },
  { name: 'Almonds', brand: null, caloriesPer100g: 579, proteinG: 21.2, carbsG: 21.6, fatG: 49.9, servingSize: '28', servingUnit: 'g' },
  { name: 'Peanut Butter', brand: null, caloriesPer100g: 588, proteinG: 25.1, carbsG: 20.0, fatG: 50.4, servingSize: '32', servingUnit: 'g' },
  { name: 'Olive Oil', brand: null, caloriesPer100g: 884, proteinG: 0.0, carbsG: 0.0, fatG: 100.0, servingSize: '15', servingUnit: 'ml' },
  { name: 'Quinoa (cooked)', brand: null, caloriesPer100g: 120, proteinG: 4.4, carbsG: 21.3, fatG: 1.9, servingSize: '100', servingUnit: 'g' },
  { name: 'Lentils (cooked)', brand: null, caloriesPer100g: 116, proteinG: 9.0, carbsG: 20.1, fatG: 0.4, servingSize: '100', servingUnit: 'g' },
  { name: 'Black Beans (cooked)', brand: null, caloriesPer100g: 132, proteinG: 8.9, carbsG: 23.7, fatG: 0.5, servingSize: '100', servingUnit: 'g' },
  { name: 'Whole Wheat Bread', brand: null, caloriesPer100g: 247, proteinG: 13.0, carbsG: 41.0, fatG: 3.4, servingSize: '28', servingUnit: 'g' },
  { name: 'Milk (whole)', brand: null, caloriesPer100g: 61, proteinG: 3.2, carbsG: 4.8, fatG: 3.3, servingSize: '244', servingUnit: 'ml' },
  { name: 'Cheddar Cheese', brand: null, caloriesPer100g: 403, proteinG: 24.9, carbsG: 1.3, fatG: 33.1, servingSize: '28', servingUnit: 'g' },
  { name: 'Butter', brand: null, caloriesPer100g: 717, proteinG: 0.9, carbsG: 0.1, fatG: 81.1, servingSize: '14', servingUnit: 'g' },
  { name: 'Honey', brand: null, caloriesPer100g: 304, proteinG: 0.3, carbsG: 82.4, fatG: 0.0, servingSize: '21', servingUnit: 'g' },
  { name: 'Pasta (cooked)', brand: null, caloriesPer100g: 131, proteinG: 5.0, carbsG: 25.0, fatG: 1.1, servingSize: '100', servingUnit: 'g' },
  { name: 'Ground Beef (85% lean)', brand: null, caloriesPer100g: 250, proteinG: 26.0, carbsG: 0.0, fatG: 15.0, servingSize: '100', servingUnit: 'g' },
  { name: 'Shrimp', brand: null, caloriesPer100g: 99, proteinG: 24.0, carbsG: 0.2, fatG: 0.3, servingSize: '100', servingUnit: 'g' },
  { name: 'Tuna (canned)', brand: null, caloriesPer100g: 116, proteinG: 25.5, carbsG: 0.0, fatG: 0.8, servingSize: '100', servingUnit: 'g' },
  { name: 'Spinach', brand: null, caloriesPer100g: 23, proteinG: 2.9, carbsG: 3.6, fatG: 0.4, servingSize: '100', servingUnit: 'g' },
  { name: 'Carrot', brand: null, caloriesPer100g: 41, proteinG: 0.9, carbsG: 9.6, fatG: 0.2, servingSize: '61', servingUnit: 'g' },
  { name: 'Blueberries', brand: null, caloriesPer100g: 57, proteinG: 0.7, carbsG: 14.5, fatG: 0.3, servingSize: '100', servingUnit: 'g' },
  { name: 'Dark Chocolate (70%)', brand: null, caloriesPer100g: 598, proteinG: 7.8, carbsG: 45.9, fatG: 42.6, servingSize: '28', servingUnit: 'g' },
];

async function seed() {
  console.log('Seeding foods table...');

  const insert = db.prepare(`
    INSERT OR IGNORE INTO foods (id, name, brand, calories_per_100g, protein_g, carbs_g, fat_g, serving_size, serving_unit)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const food of SEED_FOODS) {
    const id = crypto.randomUUID();
    insert.run(id, food.name, food.brand, food.caloriesPer100g, food.proteinG, food.carbsG, food.fatG, food.servingSize, food.servingUnit);
  }

  console.log(`Seeded ${SEED_FOODS.length} foods.`);
}

seed().catch(console.error);
