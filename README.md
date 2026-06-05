# Lembrete App API

API backend para o aplicativo de lembretes, desenvolvida com NestJS. Permite criar, gerenciar e sincronizar lembretes com o Google Calendar, com suporte a autenticação via Google OAuth2 e extração de lembretes a partir de imagens usando IA.

## Tecnologias

- [NestJS](https://nestjs.com/) — framework Node.js
- [MongoDB](https://www.mongodb.com/) + [Mongoose](https://mongoosejs.com/) — banco de dados
- [Google OAuth2](https://developers.google.com/identity) — autenticação
- [Google Calendar API](https://developers.google.com/calendar) — sincronização de eventos
- [Google Gemini AI](https://ai.google.dev/) — extração de lembretes via imagem
- JWT — autorização de requisições

## Funcionalidades

- Autenticação com conta Google (OAuth2 e token direto para apps mobile)
- Gerenciamento completo de lembretes (CRUD)
- Sincronização automática com Google Calendar ao criar lembretes
- Extração de dados de lembretes a partir de imagens usando IA (Gemini)
- Refresh de tokens JWT

## Endpoints

### Auth — `/auth`

| Método | Rota                   | Descrição                                        |
|--------|------------------------|--------------------------------------------------|
| POST   | `/auth/google/token`   | Login com token Google (fluxo mobile)            |
| GET    | `/auth/me`             | Retorna perfil do usuário autenticado            |
| POST   | `/auth/refresh`        | Renova o access token via refresh token          |
| GET    | `/auth/google`         | Inicia fluxo OAuth2 pelo navegador               |
| GET    | `/auth/google/callback`| Callback do OAuth2 do Google                     |

### Reminders — `/reminders` _(requer JWT)_

| Método | Rota                          | Descrição                                              |
|--------|-------------------------------|--------------------------------------------------------|
| POST   | `/reminders`                  | Cria um lembrete e sincroniza com Google Calendar      |
| GET    | `/reminders`                  | Lista todos os lembretes do usuário                    |
| GET    | `/reminders/:id`              | Retorna um lembrete específico                         |
| PUT    | `/reminders/:id`              | Atualiza um lembrete                                   |
| DELETE | `/reminders/:id`              | Remove um lembrete (soft delete)                       |
| POST   | `/reminders/extract-from-image` | Extrai dados de lembrete de uma imagem via IA        |

### Calendar — `/calendar` _(requer JWT)_

| Método | Rota                 | Descrição                                        |
|--------|----------------------|--------------------------------------------------|
| POST   | `/calendar/reminders`| Cria um evento diretamente no Google Calendar    |

## Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# Banco de dados
MONGODB_URI=mongodb://localhost:27017/lembrete-app

# Google OAuth2
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# JWT
JWT_SECRET=
JWT_EXPIRATION=3600
JWT_REFRESH_SECRET=
JWT_REFRESH_EXPIRATION=604800

# Google Gemini AI
GEMINI_API_KEY=

# Servidor (opcional, padrão: 3000)
PORT=3000
```

## Instalação e Execução

```bash
# Instalar dependências
npm install

# Desenvolvimento (watch mode)
npm run start:dev

# Build para produção
npm run build
npm run start:prod
```

## Testes

```bash
# Testes unitários
npm run test

# Cobertura de testes
npm run test:cov

# Testes e2e
npm run test:e2e
```
