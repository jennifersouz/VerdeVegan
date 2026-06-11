import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AboutPage } from './pages/about/about.page';
import { CartPage } from './pages/cart/cart.page';
import { CheckoutPage } from './pages/checkout/checkout.page';
import { DishDetailPage } from './pages/dish-detail/dish-detail.page';
import { HomePage } from './pages/home/home.page';
import { LoginPage } from './pages/login/login.page';
import { MenuPage } from './pages/menu/menu.page';
import { OrderStatusPage } from './pages/order-status/order-status.page';
import { OrdersPage } from './pages/orders/orders.page';
import { PointsHistoryPage } from './pages/points-history/points-history.page';
import { ProfilePage } from './pages/profile/profile.page';
import { RateOrderPage } from './pages/rate-order/rate-order.page';
import { RegisterPage } from './pages/register/register.page';

const routes: Routes = [
  { path: 'login', component: LoginPage },
  { path: 'registo', component: RegisterPage },
  { path: 'inicio', component: HomePage },
  { path: 'menu', component: MenuPage },
  { path: 'detalhes/:id', component: DishDetailPage },
  { path: 'carrinho', component: CartPage },
  { path: 'checkout', component: CheckoutPage },
  { path: 'pedido/:id', component: OrderStatusPage },
  { path: 'historico', component: OrdersPage },
  { path: 'pontos', component: PointsHistoryPage },
  { path: 'perfil', component: ProfilePage },
  { path: 'avaliar/:id', component: RateOrderPage },
  { path: 'sobre', component: AboutPage },
  { path: '', redirectTo: 'inicio', pathMatch: 'full' },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
