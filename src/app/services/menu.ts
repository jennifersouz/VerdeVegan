import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface OpcaoPersonalizacao {
  id: string;
  nome: string;
  preco: number;
}

export interface GrupoPersonalizacao {
  id: string;
  titulo: string;
  obrigatorio: boolean;
  escolhaMultipla: boolean;
  opcoes: OpcaoPersonalizacao[];
}

export interface Prato {
  id: number;
  nome: string;
  tipo: 'Refeições' | 'Bebidas' | 'Sobremesas';
  categoria: string;
  restaurante: string;
  descricao: string;
  preco: number;
  avaliacao: number;
  tempo: string;
  imagem: string;
  destaque: boolean;
  calorias?: string;
  porcao?: string;
  personalizavel?: boolean;
  personalizacoes?: GrupoPersonalizacao[];
}

@Injectable({
  providedIn: 'root'
})
export class MenuService {

  constructor(private http: HttpClient) {}

  public carregarPratos(): Observable<Prato[]> { //Observable = dados que chegam depois
    return this.http.get<Prato[]>('assets/data/pratos.json');
  }
}