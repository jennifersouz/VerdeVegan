import { Component } from '@angular/core';
import { map } from 'rxjs';
import { Order } from '../../core/models/order';
import { OrdersService } from '../../core/services/orders.service';

interface PointEntry {
  type: 'Acumulaste' | 'Redimidos' | 'Devolução';
  date: string;
  points: number;
}

@Component({
  selector: 'app-points-history',
  templateUrl: './points-history.page.html',
  styleUrls: ['./points-history.page.scss'],
  standalone: false,
})
export class PointsHistoryPage {
  entries$ = this.orders.orders$.pipe(
    map((orders) =>
      orders
        .reduce<PointEntry[]>((entries, order) => [...entries, ...this.toPointEntries(order)], [])
        .sort((a, b) => b.date.localeCompare(a.date)),
    ),
  );

  constructor(private orders: OrdersService) {}

  private toPointEntries(order: Order): PointEntry[] {
    const entries: PointEntry[] = [];
    // Pontos ganhos só aparecem depois da encomenda ser entregue.
    if (order.status === 'Entregue' && order.pointsEarned > 0) {
      entries.push({ type: 'Acumulaste', date: order.date, points: order.pointsEarned });
    }
    // Pontos usados aparecem logo como movimento negativo.
    if (order.pointsUsed > 0) {
      entries.push({ type: 'Redimidos', date: order.date, points: -order.pointsUsed });
    }
    // Se cancelar, devolve no histórico os pontos que tinham sido usados.
    if (order.status === 'Cancelado' && order.pointsUsed > 0) {
      entries.push({ type: 'Devolução', date: order.date, points: order.pointsUsed });
    }
    return entries;
  }
}
