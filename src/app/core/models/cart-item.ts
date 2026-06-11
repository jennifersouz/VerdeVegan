import { Dish } from './dish';

export interface CartItem {
  dish: Dish;
  quantity: number;
  removedIngredients: string[];
  selectedExtras: string[];
  customPriceDelta?: number;
  notes: string;
}
