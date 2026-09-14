# Regras de Negócio e Validações de Ponto

## 1. Perímetro Geográfico (Geofence)

O registro de ponto só é autorizado quando o usuário está dentro de um dos seguintes raios de geolocalização:

- **Campus UNICAP (Rua do Príncipe)**: Lat `-8.0548955`, Lng `-34.8877622`, Raio: `450m`.
- **Museu de Arqueologia da UNICAP**: Lat `-8.056223`, Lng `-34.888640`, Raio: `250m`.

A distância é calculada em tempo real via fórmula de Haversine (`js/geo-service.js`).

## 2. Horários Oficiais e Tolerâncias de 20 Minutos

Para evitar burlas por alteração manual do relógio do dispositivo, o sistema sincroniza a hora via `timeapi.io` / `worldtimeapi.org` no fuso de Recife (`America/Recife`, GMT-3).

- **Entrada Geral (Todos os Cursos)**:
  - Horário Base: `14:00`
  - Janela Permitida (±20 min): `13:40` às `14:20`

- **Saída - Jogos Digitais**:
  - Horário Base: `16:00`
  - Janela Permitida (±20 min): `15:40` às `16:20`

- **Saída - Ciência da Computação / Sistemas para Internet**:
  - Horário Base: `17:00`
  - Janela Permitida (±20 min): `16:40` às `17:20`

> Administradores possuem liberação de horário para testes e auditorias emergenciais.

## 3. Idempotência Diária

- Cada usuário só pode bater **1 entrada** e **1 saída** por dia.
- Os documentos no Firestore utilizam IDs determinísticos no formato `{uid}_{YYYY-MM-DD}_{tipo}`, impossibilitando duplicidade por cliques rápidos ou múltiplas abas.
