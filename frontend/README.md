# ProjectHub - MERN Mini Project

## Requirements
- Node.js LTS
- MongoDB local server or MongoDB Atlas account

## 1. Backend setup
Open a terminal:
```bash
cd backend
npm install
```
Copy `.env.example` to `.env` and set `MONGO_URI` and a long random `JWT_SECRET`.
Then:
```bash
npm run dev
```
Backend runs at http://localhost:5000

## 2. Frontend setup
Open a second terminal:
```bash
cd frontend
npm install
npm run dev
```
Open the Vite URL, usually http://localhost:5173

## Demo flow
1. Register a new account.
2. Log in.
3. Create a project.
4. Add tasks to that project.
5. Move tasks between To Do, In Progress and Completed.
6. Edit or delete projects/tasks.

## Important
- This is an educational mini-project starter. Before real deployment, add stronger validation, rate limiting, secure cookie-based auth, tests, backups and production security settings.
- Never upload `.env` to GitHub.
