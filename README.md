# MakeIT — Team Task Manager

A full-stack collaborative task management web application. **All data (auth, projects, tasks, activity) is stored in MongoDB Atlas.**

![MakeIT](https://img.shields.io/badge/Stack-MERN-purple)
![License](https://img.shields.io/badge/License-MIT-blue)

## MongoDB Database Structure

| Database | Collection | Stores |
|----------|------------|--------|
| `makeit` | `users` | User accounts (name, email, hashed password) |
| `makeit` | `projects` | Projects and team members |
| `makeit` | `tasks` | Tasks with assignments and status |
| `makeit` | `activities` | Activity log for all project events |

## Features

- JWT Authentication (signup, login, profile, password change)
- Project management with Admin/Member roles
- Task management with Kanban drag-and-drop
- Dashboard analytics and activity feed
- Task search and filters

## Quick Start

### 1. Install
```bash
npm run install:all
```

### 2. Configure `backend/.env`
```env
MONGODB_DB_NAME=makeit
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/makeit
MONGODB_URI_DIRECT=mongodb://<user>:<password>@shard-00-00.xxx.mongodb.net:27017,.../makeit?ssl=true&replicaSet=...
JWT_SECRET=your-secret-key
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

**Important:** In MongoDB Atlas → **Network Access** → add your IP (or `0.0.0.0/0` for Railway).

Use `MONGODB_URI_DIRECT` if SRV DNS fails on Windows.

### 3. Run
```bash
npm run dev
```

Open **http://localhost:5173**

## Deploy to Railway

Set these environment variables:

| Variable | Value |
|----------|-------|
| `MONGODB_DB_NAME` | `makeit` |
| `MONGODB_URI` | Atlas connection string with `/makeit` |
| `MONGODB_URI_DIRECT` | Direct connection string (recommended) |
| `JWT_SECRET` | Strong random secret |
| `NODE_ENV` | `production` |
| `CLIENT_URL` | Your Railway app URL |

## License

MIT
