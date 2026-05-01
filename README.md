# Event Management

Production-ready Phase 1 foundation for an Event Management system with a separate React frontend and Node/Express backend.

## Project Overview

This repository is organized as a scalable monorepo-style structure:

- `client/` contains the React + Vite + TypeScript frontend.
- `server/` contains the Express + TypeScript + Prisma backend.
- PostgreSQL is used as the database through Prisma ORM.
- The backend is structured to be JWT-ready for future authentication modules.

## Tech Stack

- Frontend: React, Vite, TypeScript, React Router DOM, Axios, Tailwind CSS
- Backend: Node.js, Express.js, TypeScript, Prisma ORM, PostgreSQL
- Auth-ready architecture: `bcrypt`, `jsonwebtoken`

## Folder Structure

```text
event-management/
├── client/
├── server/
├── .gitignore
└── README.md
```

## Setup Steps

### Frontend

```bash
cd client
npm install
npm run dev
```

### Backend

```bash
cd server
npm install
copy .env.example .env
```

Update `.env` with your real PostgreSQL connection string and JWT secret, then run:

```bash
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run dev
```

## PostgreSQL Setup Instructions

1. Install PostgreSQL locally.
2. Create a database named `event_management`.
3. Copy `server/.env.example` to `server/.env`.
4. Set `DATABASE_URL` using:

```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/event_management?schema=public"
```

## Prisma Commands

```bash
cd server
npm run prisma:generate
npm run prisma:migrate -- --name init
```

## Run Commands

```bash
# frontend
cd client
npm run dev

# backend
cd server
npm run dev
```

## Health Check

- Backend endpoint: `GET http://localhost:5000/api/health`
- Frontend home page calls the backend health endpoint and displays connection status.

## Notes For Future AI-Assisted Work

- The codebase uses clear module boundaries (`config`, `controllers`, `routes`, `services`, `types`, `utils`).
- Frontend and backend stay separated for easier work with tools like Codex, Claude, Antigravity, and Graphify.
- Strict TypeScript is enabled on both sides to keep future edits safer.
