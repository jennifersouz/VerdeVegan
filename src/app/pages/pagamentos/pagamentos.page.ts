import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {
  PerfilService,
  MetodoPagamento
} from '../../services/perfil';

@Component({
  selector: 'app-pagamentos',
  templateUrl: './pagamentos.page.html',
  styleUrls: ['./pagamentos.page.scss'],
  standalone: false
})
export class PagamentosPage {

  public pagamentos: MetodoPagamento[] = [];
  public carregando = true;

  public formularioAberto = false;
  public editandoId: number | null = null;

  public novoPagamento: MetodoPagamento = this.criarPagamentoVazio();

  public formSubmetido = false;
  public mensagemErro = '';

  constructor(
    private perfilService: PerfilService,
    private router: Router
  ) {}

  ionViewWillEnter() {
    this.carregarPagamentos();
  }

  private async carregarPagamentos() {
    this.carregando = true;

    try {
      this.pagamentos = await this.perfilService.obterMetodosPagamento();
    } catch (erro) {
      console.error('Erro ao carregar métodos de pagamento:', erro);
    } finally {
      this.carregando = false;
    }
  }

  private criarPagamentoVazio(): MetodoPagamento {
    return {
      id: Date.now(),
      tipo: 'Visa' as MetodoPagamento['tipo'],
      titular: '',
      ultimosDigitos: '',
      validade: '',
      principal: false
    };
  }

  // ── Validadores auxiliares ──────────────────────────────────────────────────

  public telefoneValido(telefone: string): boolean {
    const limpo = telefone.replace(/\D/g, '');
    return /^9[1236]\d{7}$/.test(limpo);
  }

  public ultimosDigitosValidos(valor: string): boolean {
    return /^\d{4}$/.test(valor.trim());
  }

  public validadeValida(validade: string): boolean {
    if (!/^(0[1-9]|1[0-2])\/\d{4}$/.test(validade.trim())) {
      return false;
    }

    const [mesTexto, anoTexto] = validade.split('/');
    const mes = Number(mesTexto);
    const ano = Number(anoTexto);
    const hoje = new Date();
    const anoAtual = hoje.getFullYear();
    const mesAtual = hoje.getMonth() + 1;

    if (ano < anoAtual) return false;
    if (ano === anoAtual && mes < mesAtual) return false;

    return true;
  }

  public filtrarApenasNumerosPagamento() {
    this.novoPagamento.ultimosDigitos =
      this.novoPagamento.ultimosDigitos.replace(/\D/g, '');

    if (this.novoPagamento.tipo === 'MB Way') {
      this.novoPagamento.ultimosDigitos =
        this.novoPagamento.ultimosDigitos.slice(0, 9);
    } else {
      this.novoPagamento.ultimosDigitos =
        this.novoPagamento.ultimosDigitos.slice(0, 4);
    }
  }

  // ── Navegação ───────────────────────────────────────────────────────────────

  public voltar() {
    this.router.navigateByUrl('/tabs/perfil');
  }

  public abrirFormulario() {
    this.editandoId = null;
    this.novoPagamento = this.criarPagamentoVazio();
    this.formSubmetido = false;
    this.mensagemErro = '';
    this.formularioAberto = true;
  }

  public editarPagamento(pagamento: MetodoPagamento) {
    this.editandoId = pagamento.id;
    this.novoPagamento = { ...pagamento };
    this.formSubmetido = false;
    this.mensagemErro = '';
    this.formularioAberto = true;
  }

  public fecharFormulario() {
    this.formularioAberto = false;
    this.editandoId = null;
    this.novoPagamento = this.criarPagamentoVazio();
    this.formSubmetido = false;
    this.mensagemErro = '';
  }

  // ── Guardar ─────────────────────────────────────────────────────────────────

  public async guardarPagamento() {
    this.formSubmetido = true;
    this.mensagemErro = '';

    // Trim antes de validar
    this.novoPagamento.titular       = this.novoPagamento.titular.trim();
    this.novoPagamento.ultimosDigitos = this.novoPagamento.ultimosDigitos.trim();
    this.novoPagamento.validade      = this.novoPagamento.validade.trim();
    this.filtrarApenasNumerosPagamento();

    if (!this.novoPagamento.tipo) {
      this.mensagemErro = 'Seleciona um tipo de pagamento.';
      return;
    }

    if (this.novoPagamento.tipo === 'MB Way') {
      if (!this.telefoneValido(this.novoPagamento.ultimosDigitos)) {
        this.mensagemErro = 'Introduz um número MB Way português válido (ex: 912345678).';
        return;
      }
      // Validade não se aplica a MB Way
      this.novoPagamento.validade = 'N/A';
    } else {
      if (!this.novoPagamento.titular || this.novoPagamento.titular.length < 2) {
        this.mensagemErro = 'Introduz o nome do titular (mínimo 2 caracteres).';
        return;
      }

      if (!this.ultimosDigitosValidos(this.novoPagamento.ultimosDigitos)) {
        this.mensagemErro = 'Introduz os últimos 4 dígitos do cartão (apenas números).';
        return;
      }

      if (!this.validadeValida(this.novoPagamento.validade)) {
        this.mensagemErro = 'Introduz uma validade válida no formato MM/AAAA (ex: 08/2028).';
        return;
      }
    }

    if (this.editandoId) {
      this.pagamentos = this.pagamentos.map((pagamento: MetodoPagamento) =>
        pagamento.id === this.editandoId ? { ...this.novoPagamento } : pagamento
      );

      if (this.novoPagamento.principal) {
        this.pagamentos.forEach((pagamento: MetodoPagamento) => {
          pagamento.principal = pagamento.id === this.novoPagamento.id;
        });
      }

      await this.perfilService.guardarMetodosPagamento(this.pagamentos);
    } else {
      const pagamentoParaGuardar: MetodoPagamento = {
        ...this.novoPagamento,
        id: Date.now()
      };

      await this.perfilService.adicionarMetodoPagamento(pagamentoParaGuardar);
    }

    await this.carregarPagamentos();
    this.fecharFormulario();
  }

  public async removerPagamento(id: number) {
    await this.perfilService.removerMetodoPagamento(id);
    await this.carregarPagamentos();
  }

  public async definirPrincipal(id: number) {
    await this.perfilService.definirPagamentoPrincipal(id);
    await this.carregarPagamentos();
  }

  public obterMascaraCartao(pagamento: MetodoPagamento): string {
    if (pagamento.tipo === 'MB Way') {
      return pagamento.ultimosDigitos;
    }

    return `**** **** **** ${pagamento.ultimosDigitos}`;
  }
}
