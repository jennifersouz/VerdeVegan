import { Component, OnDestroy } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, firstValueFrom, map, Subscription } from 'rxjs';
import { CartItem } from '../../core/models/cart-item';
import { AuthService, UserAccount, UserAddress, UserPayment } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { OrdersService } from '../../core/services/orders.service';

type PaymentCard = UserPayment;

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.page.html',
  styleUrls: ['./checkout.page.scss'],
  standalone: false,
})
export class CheckoutPage implements OnDestroy {
  step = Math.min(5, Math.max(2, Number(this.route.snapshot.queryParamMap.get('step') ?? 2)));
  pointsUsed = Number(this.route.snapshot.queryParamMap.get('pontos') ?? 0);
  readonly checkoutSteps = ['Carrinho', 'Descontos', 'Morada', 'Pagamento', 'Confirmação'];
  addresses: UserAddress[] = [
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
  ];
  showAddressModal = false;
  showPaymentModal = false;
  showNewCardForm = false;
  confirmedOrderId = '';
  orderConfirmed = false;
  secondsToHome = 5;
  selectedPaymentCardId = 1;
  paymentCards: PaymentCard[] = [
    { id: 1, holder: 'Inês Marinho', number: '5123456789011234', expiry: '08/2028', cvv: '123', brand: 'Mastercard', principal: true },
    { id: 2, holder: 'Inês Marinho', number: '4123456789011443', expiry: '12/2029', cvv: '456', brand: 'Visa', principal: false },
  ];
  private homeRedirectTimer?: ReturnType<typeof setInterval>;
  private userSubscription: Subscription;
  private pointsSubscription: Subscription;
  items$ = this.cart.items$;
  vm$ = combineLatest([this.cart.items$, this.orders.points$]).pipe(
    map(([items, points]) => ({
      items,
      points,
      subtotal: this.cart.subtotal(items),
      delivery: this.cart.deliveryFee(items),
      total: this.cart.total(this.pointsUsed, items),
    })),
  );
  form = this.fb.group({
    address: ['Casa', Validators.required],
    payment: ['MB WAY', Validators.required],
    phone: ['', [Validators.required, Validators.pattern(/^9[1236]\d{7}$/)]],
    cashType: [''],
    discountCode: [''],
  });
  addressForm = this.fb.group({
    label: ['', Validators.required],
    street: ['', Validators.required],
    number: ['', Validators.required],
    postalCode: ['', Validators.required],
    city: ['', Validators.required],
    locality: ['', Validators.required],
  });
  cardForm = this.fb.group({
    holder: ['', Validators.required],
    number: ['', [Validators.required, Validators.minLength(12)]],
    expiry: ['', Validators.required],
    cvv: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(3)]],
    brand: ['Mastercard' as 'Mastercard' | 'Visa', Validators.required],
  });

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    public cart: CartService,
    private orders: OrdersService,
    private auth: AuthService,
  ) {
    this.userSubscription = this.auth.currentUser$.subscribe((user) => this.syncProfileData(user));
    this.pointsSubscription = combineLatest([this.cart.items$, this.orders.points$]).subscribe(([items, points]) => {
      this.pointsUsed = this.normalizePoints(this.pointsUsed, points, items);
    });
  }

  ngOnDestroy(): void {
    this.clearHomeCountdown();
    this.userSubscription.unsubscribe();
    this.pointsSubscription.unsubscribe();
  }

  async confirm(): Promise<void> {
    if (!this.auth.isLoggedIn) {
      void this.router.navigate(['/login']);
      return;
    }

    const [items, availablePoints] = await firstValueFrom(combineLatest([this.items$, this.orders.points$]));
    this.pointsUsed = this.normalizePoints(this.pointsUsed, availablePoints, items);
    if (!items.length || !this.canConfirm(items)) {
      return;
    }
    const order = await this.orders.createOrder(items, this.pointsUsed, this.cart.total(this.pointsUsed, items));
    await this.cart.clear();
    this.confirmedOrderId = order.id;
    this.orderConfirmed = true;
    this.startHomeCountdown();
  }

  goToStep(step: number): void {
    this.step = Math.min(5, Math.max(2, step));
  }

  useAllPoints(points: number, items: CartItem[]): void {
    this.pointsUsed = this.maxUsablePoints(points, items);
  }

  setPointsUsed(event: CustomEvent, availablePoints: number, items: CartItem[]): void {
    const value = Number((event.detail as { value?: string | number }).value ?? 0);
    this.pointsUsed = this.normalizePoints(value, availablePoints, items);
  }

  maxUsablePoints(availablePoints: number, items: CartItem[]): number {
    return Math.min(Math.max(0, availablePoints), Math.floor(this.orderTotalCents(items) / 10));
  }

  private normalizePoints(value: number, availablePoints: number, items: CartItem[]): number {
    if (!Number.isFinite(value)) {
      return 0;
    }

    return Math.min(this.maxUsablePoints(availablePoints, items), Math.max(0, Math.floor(value)));
  }

  selectAddress(address: string): void {
    this.form.patchValue({ address });
  }

  openAddressModal(): void {
    this.addressForm.reset();
    this.showAddressModal = true;
  }

  closeAddressModal(): void {
    this.showAddressModal = false;
  }

  saveAddress(): void {
    if (this.addressForm.invalid) {
      this.addressForm.markAllAsTouched();
      return;
    }

    const value = this.addressForm.getRawValue();
    const address = {
      id: Date.now(),
      label: value.label ?? '',
      street: value.street ?? '',
      number: value.number ?? '',
      postalCode: value.postalCode ?? '',
      city: value.city ?? '',
      locality: value.locality ?? '',
      principal: !this.addresses.length,
    };

    this.addresses = [...this.addresses, address];
    this.selectAddress(address.label);
    this.closeAddressModal();
  }

  selectPayment(payment: string): void {
    this.form.patchValue({ payment });
    if (payment === 'MB WAY') {
      this.form.controls.phone.setValidators([Validators.required, Validators.pattern(/^9[1236]\d{7}$/)]);
    } else {
      this.form.controls.phone.clearValidators();
    }
    this.form.controls.phone.updateValueAndValidity();
    if (payment !== 'Dinheiro') {
      this.form.patchValue({ cashType: '' });
    }
    if (payment === 'Cartao') {
      this.openPaymentModal();
    }
  }

  normalizeMbWayPhone(): void {
    const value = this.form.controls.phone.value ?? '';
    const normalized = value.replace(/\D/g, '').slice(0, 9);
    if (value !== normalized) {
      this.form.controls.phone.setValue(normalized, { emitEvent: false });
    }
  }

  blockNonNumeric(event: KeyboardEvent): void {
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (
      allowedKeys.includes(event.key) ||
      ((event.ctrlKey || event.metaKey) && ['a', 'c', 'v', 'x'].includes(event.key.toLowerCase()))
    ) {
      return;
    }

    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
    }
  }

  pasteOnlyNumbers(event: ClipboardEvent): void {
    event.preventDefault();
    const value = event.clipboardData?.getData('text') ?? '';
    this.form.controls.phone.setValue(value.replace(/\D/g, '').slice(0, 9));
  }

  selectCashType(cashType: string): void {
    this.form.patchValue({ cashType });
  }

  selectedPaymentCard(): PaymentCard | undefined {
    return this.paymentCards.find((card) => card.id === this.selectedPaymentCardId);
  }

  cardLastDigits(card: PaymentCard): string {
    return card.number.replace(/\s/g, '').slice(-4).padStart(4, '0');
  }

  openPaymentModal(): void {
    this.showNewCardForm = false;
    this.showPaymentModal = true;
  }

  closePaymentModal(): void {
    this.showPaymentModal = false;
    this.showNewCardForm = false;
  }

  selectPaymentCard(cardId: number): void {
    this.selectedPaymentCardId = cardId;
    this.form.patchValue({ payment: 'Cartao' });
    this.closePaymentModal();
  }

  openNewCardForm(): void {
    this.cardForm.reset({ brand: 'Mastercard' });
    this.showNewCardForm = true;
  }

  savePaymentCard(): void {
    if (this.cardForm.invalid) {
      this.cardForm.markAllAsTouched();
      return;
    }

    const value = this.cardForm.getRawValue();
    const card: PaymentCard = {
      id: Date.now(),
      holder: value.holder ?? '',
      number: value.number ?? '',
      expiry: value.expiry ?? '',
      cvv: value.cvv ?? '',
      brand: value.brand ?? 'Mastercard',
      principal: !this.paymentCards.length,
    };

    this.paymentCards = [...this.paymentCards, card];
    this.selectPaymentCard(card.id);
  }

  canContinuePayment(items: CartItem[]): boolean {
    if (this.isPaidWithPoints(items)) {
      return true;
    }

    if (this.form.value.payment === 'MB WAY') {
      return Boolean(this.form.controls.phone.valid);
    }

    if (this.form.value.payment === 'Cartao') {
      return Boolean(this.selectedPaymentCard());
    }

    if (this.form.value.payment === 'Dinheiro') {
      return Boolean(this.form.value.cashType);
    }

    return Boolean(this.form.value.payment);
  }

  continueToConfirmation(items: CartItem[]): void {
    if (this.isPaidWithPoints(items)) {
      this.goToStep(5);
      return;
    }

    if (this.form.value.payment === 'MB WAY') {
      this.form.controls.phone.markAsTouched();
    }

    if (!this.canContinuePayment(items)) {
      return;
    }

    this.goToStep(5);
  }

  isStepDone(index: number): boolean {
    return index + 1 < this.step;
  }

  isStepActive(index: number): boolean {
    return index + 1 === this.step;
  }

  itemSubtotal(item: CartItem): number {
    return this.cart.itemSubtotal(item);
  }

  formatMoney(value: number): string {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
  }

  isPaidWithPoints(items: CartItem[]): boolean {
    return items.length > 0 && this.remainingCents(items) === 0;
  }

  canConfirm(items: CartItem[]): boolean {
    if (!items.length) {
      return false;
    }

    return this.isPaidWithPoints(items) || this.form.valid;
  }

  paymentSummary(items: CartItem[]): string {
    if (this.isPaidWithPoints(items)) {
      return 'Pago com pontos';
    }

    if (this.form.value.payment === 'MB WAY') {
      return `MB WAY · ${this.form.value.phone}`;
    }

    if (this.form.value.payment === 'Cartao') {
      const card = this.selectedPaymentCard();
      return card ? `${card.brand} · **** ${this.cardLastDigits(card)}` : 'Cartão';
    }

    if (this.form.value.payment === 'Dinheiro') {
      return `Pagamento: ${this.form.value.cashType}`;
    }

    return this.form.value.payment ?? '';
  }

  private orderTotalCents(items: CartItem[]): number {
    return Math.round((this.cart.subtotal(items) + this.cart.deliveryFee(items)) * 100);
  }

  private remainingCents(items: CartItem[]): number {
    return Math.max(0, this.orderTotalCents(items) - this.pointsUsed * 10);
  }

  private startHomeCountdown(): void {
    this.secondsToHome = 5;
    this.clearHomeCountdown();

    this.homeRedirectTimer = setInterval(() => {
      this.secondsToHome -= 1;

      if (this.secondsToHome <= 0) {
        this.clearHomeCountdown();

        if (this.router.url.startsWith('/checkout') && this.orderConfirmed) {
          void this.router.navigate(['/inicio']);
        }
      }
    }, 1000);
  }

  private clearHomeCountdown(): void {
    if (this.homeRedirectTimer) {
      clearInterval(this.homeRedirectTimer);
      this.homeRedirectTimer = undefined;
    }
  }

  private syncProfileData(user: UserAccount | null): void {
    if (!user) {
      return;
    }

    if (user.addresses.length) {
      this.addresses = user.addresses;
      const primaryAddress = this.addresses.find((address) => address.principal) ?? this.addresses[0];
      this.selectAddress(primaryAddress.label);
    }

    if (user.payments.length) {
      this.paymentCards = user.payments;
      const primaryPayment = this.paymentCards.find((payment) => payment.principal) ?? this.paymentCards[0];
      this.selectedPaymentCardId = primaryPayment.id;
    }
  }
}
