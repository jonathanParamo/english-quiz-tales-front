# English Quiz Tales — Frontend (React)

Frontend de la aplicación **English Quiz Tales**, una plataforma para practicar inglés mediante historias interactivas, audio y quizzes.
Migrado de **Vue** a **React** y conectado a una API en **NestJS**.

---

## Tech Stack

- **React 18** + TypeScript
- **Vite** (bundler)
- **Tailwind CSS v3**
- **React Router v6**
- **Zustand** (global state management)
- **Axios** (API requests)
- **Three.js** + **@react-three/fiber** + **@react-three/drei** (3D UI effects)

---

## Installation

```bash
npm install
```

---

## Environment Variables

Create a `.env` file in the root:

```env
VITE_API_URL=http://localhost:3000/api/v1/
```

---

## Run in Development

```bash
npm run dev
```

---

## Production Build

```bash
npm run build
npm run preview
```

---

## Project Structure

```
src/
├── api/
│   └── api.ts              # Axios instance with baseURL
├── store/
│   └── userStore.ts        # Zustand store (auth state)
├── hooks/
│   └── useAuth.ts          # Route protection hook
├── router/
│   └── AppRouter.tsx       # Routes + PrivateRoute
├── pages/
│   ├── LoginPage.tsx
│   ├── SignupPage.tsx
│   ├── HomePage.tsx
│   ├── StoryPage.tsx
│   └── ProfilePage.tsx
├── components/
│   ├── ui/
│   │   ├── QuestionItem.tsx
│   │   ├── ResultModal.tsx
│   │   └── AudioPlayer.tsx
│   └── three/
│       ├── ParticlesBg.tsx
│       ├── FloatingBook.tsx
│       └── CelebrationEffect.tsx
└── index.css
```

---

## Vue → React Migration

| Vue         | React                 |
| ----------- | --------------------- |
| Pinia       | Zustand               |
| composables | hooks                 |
| Vue Router  | React Router          |
| v-model     | useState              |
| v-if        | conditional rendering |
| v-for       | array.map()           |
| @click      | onClick               |

---

## Features

- Authentication (Login / Signup / JWT)
- Interactive stories with audio
- Multiple question types
- Score system and results modal
- 3D UI elements with Three.js
- Protected routes
- Global auth state
- API integration

---

## Backend Repository

This frontend connects to the backend API:
**NestJS + MongoDB + Docker**

---

## Author

**Jonathan Páramo**
Full Stack Developer (React / NestJS / MongoDB / Docker)
