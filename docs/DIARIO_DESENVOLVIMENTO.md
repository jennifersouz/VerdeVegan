# Diário de desenvolvimento

## Sessão 1 - 29 de maio de 2026

**Objetivo:** Criar o projeto Ionic/Angular e implementar o protótipo funcional VerdeVegan.

**Atividades realizadas:**
- Criação do projeto Ionic com Angular e Capacitor.
- Leitura do relatório anterior e identificação das três tarefas: efetuar pedido, personalizar refeição e repetir pedido com pontos e avaliação.
- Criação dos modelos `Dish`, `CartItem` e `Order`.
- Criação de dados locais em JSON para menu, encomendas e strings da aplicação.
- Implementação dos services de menu, carrinho, encomendas, storage, strings, dispositivo e API externa.
- Implementação das páginas de login, registo, menu, detalhes, carrinho, checkout, estado do pedido, histórico, perfil, avaliação e requisitos.
- Implementação de Reactive Forms no login, registo, checkout e avaliação.
- Implementação do Ionic Storage para persistência de carrinho, pontos e histórico.
- Implementação do plugin Capacitor Screen Orientation para bloquear orientação portrait em dispositivo físico.

**Problemas:**
- A extração dos ecrãs exportados teve problemas em alguns nomes de ficheiros com caracteres corrompidos.
- A primeira build encontrou um erro de tipagem no método que repetia pedidos antigos.

**Soluções:**
- A implementação visual foi baseada no relatório, nos nomes dos ecrãs e nos fluxos definidos.
- O método de repetição foi corrigido com tipagem explícita de `CartItem | undefined`.

**Decisões:**
- Manter a app como protótipo funcional completo, com dados locais e integração externa demonstrativa.
- Priorizar fluxos avaliáveis e rápidos para a avaliação heurística.

## Sessão 2 - preencher pela equipa

**Objetivo:**

**Atividades realizadas:**

**Problemas:**

**Solução:**

**Decisões:**
