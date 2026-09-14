# Deploy e Integração com a Vercel

Este projeto está pré-configurado para implantação contínua na **Vercel**.

## Arquivo de Configuração (`vercel.json`)

O arquivo [`vercel.json`](file:///Users/rennan/Documents/Websites_Work/Sistema-de-Ponto-Amana/vercel.json) define os cabeçalhos de segurança, suporte PWA e o roteamento automático para o diretório `front-end/`:

```json
{
  "version": 2,
  "cleanUrls": true,
  "trailingSlash": false,
  "rewrites": [
    { "source": "/(.*)", "destination": "/front-end/$1" }
  ]
}
```

## Como Conectar e Publicar

### Opção 1: Via Vercel CLI (Terminal)
No terminal, execute o comando interativo:
```bash
npx vercel
```
- Selecione sua conta da Vercel.
- Confirme a criação do projeto `sistema-de-ponto-amana`.
- Para publicar em produção após o preview:
```bash
npx vercel --prod
```

### Opção 2: Via Dashboard da Vercel (GitHub/GitLab)
1. Acesse [vercel.com/new](https://vercel.com/new).
2. Importe o repositório `Sistema-de-Ponto-Amana`.
3. Em **Root Directory**, pode manter `./` (graças ao `vercel.json`) ou selecionar `front-end`.
4. Clique em **Deploy**.
