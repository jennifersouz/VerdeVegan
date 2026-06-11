import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Dish, DishCustomizationGroup, DishCustomizationOption } from '../../core/models/dish';
import { CartService } from '../../core/services/cart.service';
import { MenuService, RestaurantSummary } from '../../core/services/menu.service';

@Component({
  selector: 'app-dish-detail',
  templateUrl: './dish-detail.page.html',
  styleUrls: ['./dish-detail.page.scss'],
  standalone: false,
})
export class DishDetailPage implements OnInit {
  dish?: Dish;
  backRestaurant?: string;
  restaurantInfo?: RestaurantSummary;
  showCustomize = false;
  error = '';
  selectedSingle: Record<string, string> = {};
  selectedMulti: string[] = [];
  removedIngredients: string[] = [];

  form = this.fb.group({
    quantity: [1, [Validators.required, Validators.min(1)]],
    notes: [''],
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private menu: MenuService,
    private cart: CartService,
  ) {}

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.backRestaurant = this.route.snapshot.queryParamMap.get('restaurante') ?? undefined;
    this.dish = await firstValueFrom(this.menu.getDish(id));
    if (this.dish) {
      const restaurants = await firstValueFrom(this.menu.getRestaurants());
      this.restaurantInfo = restaurants.find((restaurant) => restaurant.name === this.dish?.restaurant);
    }
    this.resetCustomization();
  }

  openRestaurant(): void {
    if (!this.dish) {
      return;
    }

    void this.router.navigate(['/menu'], {
      queryParams: { restaurante: this.dish.restaurant, fromDishDetail: '1' },
      state: { fromDishDetail: true },
    });
  }

  decreaseQuantity(): void {
    const quantity = this.quantity();
    if (quantity > 1) {
      this.form.patchValue({ quantity: quantity - 1 });
    }
  }

  increaseQuantity(): void {
    this.form.patchValue({ quantity: this.quantity() + 1 });
  }

  openCustomize(): void {
    this.showCustomize = true;
  }

  closeCustomize(): void {
    this.showCustomize = false;
  }

  isSingleSelected(group: DishCustomizationGroup, option: DishCustomizationOption): boolean {
    return this.selectedSingle[group.title] === option.name;
  }

  selectSingle(group: DishCustomizationGroup, option: DishCustomizationOption): void {
    this.selectedSingle[group.title] = option.name;
  }

  isMultiSelected(option: DishCustomizationOption): boolean {
    return this.selectedMulti.includes(option.name);
  }

  toggleMulti(option: DishCustomizationOption): void {
    this.selectedMulti = this.toggle(this.selectedMulti, option.name);
  }

  isRemoved(option: DishCustomizationOption): boolean {
    return this.removedIngredients.includes(option.name);
  }

  toggleRemoved(option: DishCustomizationOption): void {
    this.removedIngredients = this.toggle(this.removedIngredients, option.name);
  }

  quantity(): number {
    return Math.max(1, this.form.value.quantity ?? 1);
  }

  customizationDelta(): number {
    if (!this.dish) {
      return 0;
    }

    const singleDelta = this.dish.customizations
      .filter((group) => group.type === 'single')
      .reduce((sum, group) => {
        const selected = group.options.find((option) => option.name === this.selectedSingle[group.title]);
        return sum + (selected?.price ?? 0);
      }, 0);

    const multiOptions = this.dish.customizations
      .filter((group) => group.type === 'multi')
      .reduce<DishCustomizationOption[]>((options, group) => options.concat(group.options), []);

    const multiDelta = multiOptions
      .filter((option) => this.selectedMulti.includes(option.name))
      .reduce((sum, option) => sum + option.price, 0);

    return singleDelta + multiDelta;
  }

  unitTotal(): number {
    return (this.dish?.price ?? 0) + this.customizationDelta();
  }

  total(): number {
    return this.unitTotal() * this.quantity();
  }

  async addToCart(): Promise<void> {
    if (!this.dish || this.form.invalid) {
      return;
    }

    const selectedOptions = [
      ...Object.values(this.selectedSingle).filter((name) => this.optionPrice(name) > 0),
      ...this.selectedMulti,
    ];

    try {
      await this.cart.addItem(this.dish, {
        quantity: this.quantity(),
        removedIngredients: this.removedIngredients,
        selectedExtras: selectedOptions,
        customPriceDelta: this.customizationDelta(),
        notes: this.form.value.notes ?? '',
      });
      this.closeCustomize();
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Não foi possível adicionar ao carrinho.';
    }
  }

  private resetCustomization(): void {
    if (!this.dish) {
      return;
    }

    this.selectedSingle = {};
    this.selectedMulti = [];
    this.removedIngredients = [];

    this.dish.customizations
      .filter((group) => group.type === 'single')
      .forEach((group) => {
        const included = group.options.find((option) => option.included) ?? group.options[0];
        if (included) {
          this.selectedSingle[group.title] = included.name;
        }
      });
  }

  private optionPrice(name: string): number {
    return (
      this.dish?.customizations
        .reduce<DishCustomizationOption[]>((options, group) => options.concat(group.options), [])
        .find((option) => option.name === name)?.price ?? 0
    );
  }

  private toggle(list: string[], value: string): string[] {
    return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
  }
}
