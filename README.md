# VerdeVegan

Protótipo funcional Ionic/Angular para a unidade curricular de IHM.

## Funcionalidades

- Login e registo com Reactive Forms.
- Menu vegan com pesquisa, categorias e detalhes.
- Personalização de refeições com remoção de ingredientes, extras e notas.
- Carrinho persistente com Ionic Storage.
- Checkout com morada, pagamento e utilização de pontos.
- Histórico de pedidos, repetição de pedido e avaliação.
- Dados locais em JSON e strings isoladas.
- Consumo demonstrativo da API OpenFoodFacts.
- Capacitor Screen Orientation para bloquear portrait em dispositivo físico.

## Comandos

```bash
npm install
npm run build
npm start
```

## Android/APK

```bash
npm run build
npx cap add android
npx cap sync android
```

Depois abrir a pasta Android no Android Studio para gerar o APK.
