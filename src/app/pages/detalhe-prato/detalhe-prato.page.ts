import { Component, OnInit } from '@angular/core';
import { MenuService, Prato } from 'src/app/services/menu';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-detalhe-prato',
  templateUrl: './detalhe-prato.page.html',
  styleUrls: ['./detalhe-prato.page.scss'],
  standalone: false
})
export class DetalhePratoPage implements OnInit {

  public prato?: Prato;
  public quantidade = 1;

  constructor(
    private activatedRoute: ActivatedRoute,
    private menuService: MenuService,
    private router: Router
  ) { }

  ngOnInit() {
    this.carregarDetalhesPrato();
  }

  private carregarDetalhesPrato() {
    const id = Number(this.activatedRoute.snapshot.paramMap.get('id'));

    this.menuService.carregarPratos().subscribe({
      next: (pratos: Prato[]) => {
        this.prato = pratos.find((p: Prato) => p.id === id);

        if (!this.prato) {
          console.error('Prato não encontrado.');
          this.router.navigateByUrl('/menu');
        }
      },
      error: (erro: unknown) => {
        console.error('Erro ao carregar prato:', erro);
        this.router.navigateByUrl('/menu');
      }
    });

  }

  public voltar() {
    this.router.navigateByUrl('/menu');
  }

  public diminuirQuantidade() {
    if (this.quantidade > 1) {
      this.quantidade--;
    }
  }

  public aumentarQuantidade() {
    this.quantidade++;
  }

  public calcularTotal(): number {
    if (!this.prato) {
      return 0;
    }
    return this.prato.preco * this.quantidade;
  }

  public personalizar() {
    if (!this.prato) {
      return;
    } 
    this.router.navigateByUrl(`/personalizar/${this.prato.id}?qtd=${this.quantidade}`);
  }

}
