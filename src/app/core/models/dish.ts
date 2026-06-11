export interface DishExtra {
  name: string;
  price: number;
}

export interface DishCustomizationOption {
  name: string;
  price: number;
  included?: boolean;
}

export interface DishCustomizationGroup {
  title: string;
  type: 'single' | 'multi' | 'remove';
  options: DishCustomizationOption[];
}

export interface DishNutrition {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Dish {
  id: string;
  name: string;
  category: string;
  price: number;
  rating: number;
  time: string;
  image: string;
  description: string;
  ingredients: string[];
  allergens: string[];
  nutrition: DishNutrition;
  available: boolean;
  extras: DishExtra[];
  restaurant: string;
  portions: string;
  customizations: DishCustomizationGroup[];
}
