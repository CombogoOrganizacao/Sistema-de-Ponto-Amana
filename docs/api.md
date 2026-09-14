# Contrato de Dados & API

## Coleções Firestore

### 1. `usuarios`
- **ID**: `uid` (Firebase Auth UID)
- **Campos**:
  - `uid` (string)
  - `nome` (string)
  - `email` (string)
  - `cargo` ("admin" | "aluno")
  - `curso` ("Jogos Digitais" | "Ciência da Computação" | "Sistemas para Internet")
  - `criadoEm` (Timestamp)

### 2. `pontos`
- **ID**: `{uid}_{YYYY-MM-DD}_{tipo}` (Ex: `abc123_2026-09-14_entrada`)
- **Campos**:
  - `usuarioId` (string)
  - `usuarioNome` (string)
  - `usuarioEmail` (string)
  - `usuarioCurso` (string)
  - `tipo` ("entrada" | "saida")
  - `dataChave` (string: "YYYY-MM-DD")
  - `localizacao` (string)
  - `coordenadas` ({ latitude, longitude, precisao })
  - `registro` (Timestamp)
  - `criadoEm` (Timestamp)

## Rotas Back-end (NestJS)

- `POST /auth/register`: Registro de novos usuários.
- `POST /auth/login`: Autenticação e geração de JWT.
- `POST /auth/refresh`: Renovação de sessão via refresh token.
- `GET /usuario`: Listagem de usuários (Admin).
- `GET /ponto`: Listagem de registros de ponto com filtros.
- `POST /ponto`: Registro de entrada/saída.
