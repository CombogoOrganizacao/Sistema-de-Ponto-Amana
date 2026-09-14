# Arquitetura do Sistema - Combogó Ponto

## Visão Geral

O **Combogó Ponto** é uma solução completa de controle de jornada e gestão de presença desenvolvida para alunos e colaboradores da Amana Lab / UNICAP. O ecossistema é composto por:

1. **Front-end Web (PWA)**: Aplicação Web modularizada em Vanilla JS ES6 com Tailwind CSS e Firebase SDK client-side.
2. **Front-end Mobile Native**: Aplicativo React Native (Expo) com suporte a iOS, Android e Web.
3. **Back-end NestJS**: API estruturada para auditoria, relatórios e integração centralizada.
4. **Banco de Dados & Autenticação**: Google Firebase (Firestore + Authentication).

```
                      +-----------------------------+
                      |       Google Firebase       |
                      | (Auth, Firestore, Hosting)  |
                      +--------------+--------------+
                                     |
             +-----------------------+-----------------------+
             |                                               |
+------------v------------+                     +------------v------------+
|     Front-end Web       |                     |   Mobile App (Expo)     |
|   (Vanilla JS / PWA)    |                     |   (React Native Native) |
|  - js/config.js         |                     |  - src/app/index.tsx    |
|  - js/time-service.js   |                     |  - src/app/explore.tsx  |
|  - js/geo-service.js    |                     |  - src/contexts/auth... |
|  - js/ponto-service.js  |                     +-------------------------+
|  - js/table-ui.js       |
|  - js/pwa-ui.js         |
|  - js/admin-service.js  |
+-------------------------+
```

## Estrutura Modular do Front-end Web

- [`js/config.js`](file:///Users/rennan/Documents/Websites_Work/Sistema-de-Ponto-Amana/front-end/js/config.js): Inicialização do Firebase e constantes institucionais.
- [`js/time-service.js`](file:///Users/rennan/Documents/Websites_Work/Sistema-de-Ponto-Amana/front-end/js/time-service.js): Sincronização externa com horário oficial de Brasília/Recife e cálculo de tolerâncias.
- [`js/geo-service.js`](file:///Users/rennan/Documents/Websites_Work/Sistema-de-Ponto-Amana/front-end/js/geo-service.js): Validação do raio de Geofence por fórmula de Haversine.
- [`js/ponto-service.js`](file:///Users/rennan/Documents/Websites_Work/Sistema-de-Ponto-Amana/front-end/js/ponto-service.js): Gravação com chave idempotente diária e controle de 1 entrada e 1 saída.
- [`js/table-ui.js`](file:///Users/rennan/Documents/Websites_Work/Sistema-de-Ponto-Amana/front-end/js/table-ui.js): Renderização e cálculo reativo de horas totais.
- [`js/pwa-ui.js`](file:///Users/rennan/Documents/Websites_Work/Sistema-de-Ponto-Amana/front-end/js/pwa-ui.js): Modal e tutorial de instalação do PWA para iOS e Android.
- [`js/admin-service.js`](file:///Users/rennan/Documents/Websites_Work/Sistema-de-Ponto-Amana/front-end/js/admin-service.js): Ações restritas de administradores (como reset em lote).
- [`app.js`](file:///Users/rennan/Documents/Websites_Work/Sistema-de-Ponto-Amana/front-end/app.js): Orquestrador limpo de listeners e autenticação.
