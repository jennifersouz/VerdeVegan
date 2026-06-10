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
  public tipoCartaoAberto = false;

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
      numeroCartao: '',
      ultimosDigitos: '',
      validade: '',
      cvv: '',
      principal: false
    };
  }

  // ── Validadores auxiliares ──────────────────────────────────────────────────

  public telefoneValido(telefone: string): boolean {
    const limpo = telefone.replace(/\D/g, '');
    return /^(9[1236]\d{7}|2\d{8})$/.test(limpo);
  }

  public normalizarNumeroMbWay() {
    if (this.novoPagamento.tipo !== 'MB Way') {
      return;
    }

    this.novoPagamento.ultimosDigitos = this.novoPagamento.ultimosDigitos.replace(/\D/g, '').slice(0, 9);
  }

  public normalizarNumeroCartao() {
    this.novoPagamento.numeroCartao = (this.novoPagamento.numeroCartao || '').replace(/\D/g, '').slice(0, 19);
  }

  public normalizarCvv() {
    this.novoPagamento.cvv = (this.novoPagamento.cvv || '').replace(/\D/g, '').slice(0, 4);
  }

  public bloquearNaoNumerico(event: KeyboardEvent) {
    const teclasPermitidas = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];

    if (
      teclasPermitidas.includes(event.key) ||
      ((event.ctrlKey || event.metaKey) && ['a', 'c', 'v', 'x'].includes(event.key.toLowerCase()))
    ) {
      return;
    }

    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
    }
  }

  public colarApenasNumeros(event: ClipboardEvent, campo: 'numeroCartao' | 'cvv' | 'ultimosDigitos', limite: number) {
    event.preventDefault();
    const valor = event.clipboardData?.getData('text') || '';
    this.novoPagamento[campo] = valor.replace(/\D/g, '').slice(0, limite);
  }

  public ultimosDigitosValidos(valor: string): boolean {
    return /^\d{4}$/.test(valor.trim());
  }

  public numeroCartaoValido(valor: string): boolean {
    return /^\d{13,19}$/.test(valor.replace(/\s/g, ''));
  }

  public cvvValido(valor: string): boolean {
    return /^\d{3,4}$/.test(valor.trim());
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

  // ── Navegação ───────────────────────────────────────────────────────────────

  public voltar() {
    this.router.navigateByUrl('/tabs/perfil');
  }

  public abrirFormulario() {
    this.editandoId = null;
    this.novoPagamento = this.criarPagamentoVazio();
    this.formSubmetido = false;
    this.mensagemErro = '';
    this.tipoCartaoAberto = false;
    this.formularioAberto = true;
  }

  public editarPagamento(pagamento: MetodoPagamento) {
    this.editandoId = pagamento.id;
    this.novoPagamento = { ...pagamento };

    if (!this.novoPagamento.numeroCartao) {
      this.novoPagamento.numeroCartao = this.novoPagamento.ultimosDigitos === '1443'
        ? '4123456789011443'
        : `555544443333${this.novoPagamento.ultimosDigitos || '1234'}`;
    }

    if (!this.novoPagamento.cvv) {
      this.novoPagamento.cvv = this.novoPagamento.ultimosDigitos === '1443' ? '456' : '123';
    }

    this.formSubmetido = false;
    this.mensagemErro = '';
    this.tipoCartaoAberto = false;
    this.formularioAberto = true;
  }

  public fecharFormulario() {
    this.formularioAberto = false;
    this.editandoId = null;
    this.novoPagamento = this.criarPagamentoVazio();
    this.formSubmetido = false;
    this.mensagemErro = '';
    this.tipoCartaoAberto = false;
  }

  public alternarTipoCartao() {
    this.tipoCartaoAberto = !this.tipoCartaoAberto;
  }

  public selecionarTipoCartao(tipo: MetodoPagamento['tipo']) {
    this.novoPagamento.tipo = tipo;
    this.tipoCartaoAberto = false;
  }

  // ── Guardar ─────────────────────────────────────────────────────────────────

  public async guardarPagamento() {
    this.formSubmetido = true;
    this.mensagemErro = '';

    // Trim antes de validar
    this.novoPagamento.titular       = this.novoPagamento.titular.trim();
    this.novoPagamento.numeroCartao  = this.novoPagamento.numeroCartao?.replace(/\s/g, '') || '';
    this.novoPagamento.ultimosDigitos = this.novoPagamento.ultimosDigitos.trim();
    this.novoPagamento.validade      = this.novoPagamento.validade.trim();
    this.novoPagamento.cvv           = this.novoPagamento.cvv?.trim() || '';

    if (!this.novoPagamento.tipo) {
      this.mensagemErro = 'Seleciona um tipo de pagamento.';
      return;
    }

    if (this.novoPagamento.tipo === 'MB Way') {
      this.novoPagamento.ultimosDigitos = this.novoPagamento.ultimosDigitos.replace(/\D/g, '').slice(0, 9);

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

      if (!this.numeroCartaoValido(this.novoPagamento.numeroCartao || '')) {
        this.mensagemErro = 'Introduz um número de cartão válido.';
        return;
      }

      if (!this.validadeValida(this.novoPagamento.validade)) {
        this.mensagemErro = 'Introduz uma validade válida no formato MM/AAAA (ex: 08/2028).';
        return;
      }

      if (!this.cvvValido(this.novoPagamento.cvv || '')) {
        this.mensagemErro = 'Introduz um CVV válido.';
        return;
      }

      this.novoPagamento.ultimosDigitos = (this.novoPagamento.numeroCartao || '').slice(-4);
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

  public obterBandeira(pagamento: MetodoPagamento): 'visa' | 'mastercard' {
    return pagamento.tipo === 'Mastercard' ? 'mastercard' : 'visa';
  }
}
