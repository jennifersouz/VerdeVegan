import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Order } from '../../core/models/order';
import { OrdersService } from '../../core/services/orders.service';

@Component({
  selector: 'app-rate-order',
  templateUrl: './rate-order.page.html',
  styleUrls: ['./rate-order.page.scss'],
  standalone: false,
})
export class RateOrderPage implements OnInit {
  order?: Order;
  stars = [1, 2, 3, 4, 5];
  form = this.fb.group({
    rating: [5, [Validators.required, Validators.min(1)]],
    comment: ['Entrega rápida e refeição bem preparada.', Validators.required],
  });

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private orders: OrdersService,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.orders.load();
    this.order = this.orders.getOrder(this.route.snapshot.paramMap.get('id') ?? '');
  }

  setRating(value: number): void {
    this.form.patchValue({ rating: value });
  }

  async submit(): Promise<void> {
    if (!this.order || this.form.invalid) {
      return;
    }
    await this.orders.markRated(this.order.id);
    void this.router.navigate(['/historico']);
  }
}
