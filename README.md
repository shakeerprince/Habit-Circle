<p align="center">
  <img src="assets/banner.png" alt="HabitCircle Banner" width="100%" />
</p>

<h1 align="center">🔄 HabitCircle</h1>

<p align="center">
  <strong>Build habits together. Track streaks. Join communities. Level up.</strong>
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-project-structure">Structure</a> •
  <a href="#-api-reference">API</a> •
  <a href="#-contributing">Contributing</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/Hono-4-orange?logo=hono" alt="Hono" />
  <img src="https://img.shields.io/badge/Bun-runtime-f472b6?logo=bun" alt="Bun" />
  <img src="https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Flutter-3.x-02569B?logo=flutter" alt="Flutter" />
  <img src="https://img.shields.io/badge/Expo-React%20Native-000020?logo=expo" alt="Expo" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript" alt="TypeScript" />
</p>

---

## ✨ Features

### 🎯 Habit Tracking
- Create custom habits with categories, schedules, and color coding
- Start/complete habits with timer tracking and duration logging
- Daily, weekly, and custom frequency support
- Visual heatmap calendar showing completion patterns
- Streak tracking with milestone badges (7, 14, 30, 60, 100, 365 days)

### 👥 Social & Communities
- **8 built-in communities** — Morning Risers, Desi Fitness Club, UPSC Warriors, Code & Chill, and more
- Create your own communities with invite codes
- Community posts, discussions, and member management
- Join/leave communities with shareable invite links

### 💬 Real-Time Messaging
- **WebSocket-powered** instant direct messages
- Conversation list with unread indicators
- Real-time message delivery without page refresh

### 🏆 Gamification
- **XP & Leveling system** — earn XP for every habit completed, streak hit, and community joined
- **Leaderboard** — compete with friends and the global community
- **Badge system** — 7-Day Warrior → 365-Day Immortal
- **Daily login streaks** with bonus XP rewards

### 🤝 Friends System
- Search and add friends
- Friend requests (send, accept, reject)
- View friend profiles with their habits and stats
- Friend suggestions based on community membership

### 📊 Dashboard & Analytics
- Today's habits overview with completion status
- Advanced stats: completion rate, total duration, best streaks
- Weekly and monthly progress trends
- Heatmap visualization of habit history

### 🔔 Notifications
- Streak milestone alerts
- Badge earned notifications
- Comment and upvote notifications
- Unread count badge in navigation

### 🏅 Challenges
- Time-limited group challenges (30-Day Running, Meditation Marathon, etc.)
- Join challenges and compete on leaderboards
- Challenge chat for participants
- Score tracking per participant

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Web Frontend** | Next.js 16, React 19, TypeScript, CSS |
| **Web Backend** | Hono 4, Bun runtime, TypeScript |
| **Database** | PostgreSQL (Neon serverless) |
| **ORM** | Drizzle ORM |
| **Auth** | JWT + Argon2id password hashing |
| **Real-Time** | WebSockets (Hono/Bun native) |
| **Mobile (Expo)** | React Native, Expo Router, TypeScript |
| **Mobile (Flutter)** | Flutter 3.x, Dart, Riverpod, GoRouter |

---

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh/) (v1.0+)
- [Node.js](https://nodejs.org/) (v18+)
- PostgreSQL database (or free [Neon](https://neon.tech/) account)

### 1. Clone the repo

```bash
git clone https://github.com/shakeerprince/Habit-Circle.git
cd Habit-Circle
```

### 2. Setup Backend

```bash
cd web/backend
cp .env.example .env   # Add your DATABASE_URL and JWT_SECRET
bun install
bun run db:push         # Push schema to database
bun run seed            # Seed demo data (20 users, 8 communities, etc.)
bun run dev             # Starts on http://localhost:3001
```

**`.env` file:**
```env
DATABASE_URL="postgresql://user:pass@host/dbname?sslmode=require"
JWT_SECRET="your-secret-key"
PORT=3001
```

### 3. Setup Frontend

```bash
cd web/frontend
npm install
npm run dev             # Starts on http://localhost:3000
```

### 4. Login

Use any demo account:
| Email | Password |
|-------|----------|
| `shaker@habitcircle.app` | `demo` |
| `arjun@example.com` | `demo` |
| `priya@example.com` | `demo` |

Or **Sign Up** with a new account!

---

## 📁 Project Structure

```
Habit-Circle/
├── web/
│   ├── backend/                # Hono API server (Bun)
│   │   ├── src/
│   │   │   ├── routes/         # API route handlers
│   │   │   │   ├── auth.ts     # Login, Register, /me
│   │   │   │   ├── habits.ts   # CRUD + start/complete/heatmap
│   │   │   │   ├── posts.ts    # Feed, voting, comments
│   │   │   │   ├── communities.ts  # Communities + invite system
│   │   │   │   ├── friends.ts  # Friend requests & management
│   │   │   │   ├── messages.ts # Direct messages
│   │   │   │   ├── challenges.ts   # Challenges + chat
│   │   │   │   ├── dashboard.ts    # Stats & analytics
│   │   │   │   ├── leaderboard.ts  # XP rankings
│   │   │   │   ├── notifications.ts
│   │   │   │   ├── users.ts    # User profiles
│   │   │   │   └── uploads.ts  # File uploads
│   │   │   ├── db/
│   │   │   │   ├── schema.ts   # Drizzle schema (15 tables)
│   │   │   │   └── index.ts    # DB connection
│   │   │   ├── middleware/
│   │   │   │   └── auth.ts     # JWT middleware
│   │   │   ├── lib/
│   │   │   │   ├── xp.ts       # XP & leveling system
│   │   │   │   └── notifications.ts
│   │   │   ├── websocket.ts    # WebSocket manager
│   │   │   ├── app.ts          # Hono app setup
│   │   │   ├── index.ts        # Server entry point
│   │   │   └── seed.ts         # Database seeder
│   │   └── package.json
│   │
│   ├── frontend/               # Next.js 16 app
│   │   ├── app/
│   │   │   ├── login/          # Auth page (login + register)
│   │   │   ├── (app)/          # Protected routes
│   │   │   │   ├── tasks/      # Habit list + create
│   │   │   │   ├── dashboard/  # Overview + stats
│   │   │   │   ├── communities/# Browse & join communities
│   │   │   │   ├── friends/    # Friend management
│   │   │   │   ├── profile/    # User profile
│   │   │   │   ├── achievements/ # Badges & XP
│   │   │   │   ├── stats/      # Advanced analytics
│   │   │   │   ├── focus/      # Habit focus timer
│   │   │   │   └── invite/     # Community invite handler
│   │   │   └── messages/       # DM conversations
│   │   ├── components/         # Reusable UI components
│   │   ├── hooks/              # Custom React hooks
│   │   ├── lib/
│   │   │   └── api.ts          # API client
│   │   └── package.json
│   │
│   └── shared/
│       └── types.ts            # Shared TypeScript types
│
├── mobile/                     # Expo React Native app
│   ├── app/                    # Expo Router screens
│   ├── lib/                    # API, auth, theme
│   └── package.json
│
├── lib/                        # Flutter app
│   ├── features/               # Feature modules
│   ├── core/                   # Theme, router, providers
│   └── main.dart
│
└── README.md
```

---

## 📡 API Reference

All endpoints are prefixed with `/api`. Protected routes require `Authorization: Bearer <token>`.

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Create account |
| `POST` | `/api/auth/login` | Login + daily streak |
| `GET` | `/api/auth/me` | Get current user |

### Habits
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/habits` | List user's habits |
| `POST` | `/api/habits` | Create habit |
| `DELETE` | `/api/habits/:id` | Delete habit |
| `POST` | `/api/habits/:id/start` | Start tracking |
| `POST` | `/api/habits/:id/complete` | Complete + earn XP |
| `GET` | `/api/habits/entries?date=` | Get entries by date |
| `GET` | `/api/habits/heatmap` | Completion heatmap |

### Posts & Feed
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/posts?sort=hot` | Get feed (hot/new/top) |
| `GET` | `/api/posts/:id` | Get single post |
| `POST` | `/api/posts` | Create post |
| `POST` | `/api/posts/:id/vote` | Upvote/downvote |
| `GET` | `/api/posts/:id/comments` | Get comments |
| `POST` | `/api/posts/:id/comments` | Add comment |

### Communities
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/communities` | Browse all |
| `GET` | `/api/communities/my` | My communities |
| `GET` | `/api/communities/:id` | Community detail |
| `POST` | `/api/communities` | Create community |
| `POST` | `/api/communities/:id/join` | Join |
| `POST` | `/api/communities/:id/leave` | Leave |
| `GET` | `/api/communities/invite/:code` | Get by invite code |
| `POST` | `/api/communities/invite/:code/join` | Join via invite |

### Friends
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/friends` | List friends |
| `GET` | `/api/friends/search?q=` | Search users |
| `GET` | `/api/friends/suggestions` | Friend suggestions |
| `POST` | `/api/friends/request/:id` | Send request |
| `POST` | `/api/friends/accept/:id` | Accept request |
| `DELETE` | `/api/friends/remove/:id` | Remove friend |

### Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/messages` | Conversation list |
| `GET` | `/api/messages/:userId` | Chat history |
| `POST` | `/api/messages/:userId` | Send message |

### Other
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/dashboard` | Dashboard data |
| `GET` | `/api/dashboard/stats` | Advanced stats |
| `GET` | `/api/leaderboard` | XP leaderboard |
| `GET` | `/api/notifications` | All notifications |
| `GET` | `/api/challenges` | Active challenges |
| `POST` | `/api/upload` | File upload |

---

## 🎮 Gamification System

### XP Rewards
| Action | XP |
|--------|----|
| Complete a habit | +10 |
| Daily login | +5 |
| 7-day login streak | +25 |
| 30-day login streak | +100 |
| Create a post | +15 |
| Join a challenge | +10 |
| Streak bonus | +2 × streak days |
| Earn a badge | +50 |

### Level Formula
```
Level = floor(sqrt(XP / 100)) + 1
```

### Badges
| Streak | Badge |
|--------|-------|
| 7 days | 🥉 7-Day Warrior |
| 14 days | 🥈 14-Day Fighter |
| 30 days | 🥇 30-Day Legend |
| 60 days | 💎 60-Day Master |
| 100 days | 👑 100-Day Champion |
| 365 days | 🏆 365-Day Immortal |

---

## 🗃️ Database Schema

15 tables powered by Drizzle ORM + PostgreSQL:

```
users ─┬─ habits ── habit_entries
       ├─ posts ─┬─ comments
       │         └─ post_votes
       ├─ challenges ─┬─ challenge_participants
       │              └─ chat_messages
       ├─ notifications
       ├─ user_badges
       ├─ direct_messages
       ├─ friendships
       └─ communities ── community_members
```

---

## 🔒 Security

- **Password hashing** — Argon2id via `Bun.password.hash()`
- **JWT authentication** — Signed tokens with configurable secret
- **CORS** configured for frontend origin
- **SQL injection safe** — Drizzle ORM parameterized queries
- **`.env` excluded** from version control

---

## 🤝 Contributing

1. Fork the repo
2. Create your branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/shakeerprince">Shakeer Prince</a>
</p>
