export interface OrderItem {
  dishId: string;
  name: string;
  quantity: number;
  price: number;
  extras: string[];
}

export interface Order {
  id: string;
  date: string;
  createdAt?: string;
  estimatedDeliveryMinutes?: number;
  restaurant?: string;
  status: 'Recebido' | 'Em preparação' | 'A caminho' | 'Entregue' | 'Cancelado';
  items: OrderItem[];
  pointsUsed: number;
  pointsEarned: number;
  deliveryFee?: number;
  total: number;
  rated: boolean;
  rating?: number;
  reviewComment?: string;
}
