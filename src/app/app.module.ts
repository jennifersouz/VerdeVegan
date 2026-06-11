import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { IonicStorageModule } from '@ionic/storage-angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
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

@NgModule({
  declarations: [
    AppComponent,
    LoginPage,
    RegisterPage,
    HomePage,
    MenuPage,
    DishDetailPage,
    CartPage,
    CheckoutPage,
    OrderStatusPage,
    OrdersPage,
    PointsHistoryPage,
    ProfilePage,
    RateOrderPage,
    AboutPage,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    IonicModule.forRoot(),
    IonicStorageModule.forRoot(),
    AppRoutingModule,
  ],
  providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }],
  bootstrap: [AppComponent],
})
export class AppModule {}
