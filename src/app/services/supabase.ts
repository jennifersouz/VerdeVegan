import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {

  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      'https://ygsglyrocjnzhoffeqwp.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlnc2dseXJvY2puemhvZmZlcXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMzE1ODQsImV4cCI6MjA5NTcwNzU4NH0.iqlJ9dtPy3IhSPb9y4Do8vJPg2fmddyVLvCf4z50v-U'
    );
  }

  public async criarPedido(pedido: any) {
    return await this.supabase
      .from('orders')
      .insert([pedido]);
  }

  public async listarPedidos() {
    return await this.supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
  }
}