# ⚡ TaskFlow — Task Management Dashboard

A full-stack MERN (MongoDB, Express, React, Node.js) task management application with JWT authentication.

## Features

- **JWT Authentication** — Register and login with secure token-based auth
- **Task CRUD** — Create, read, update, and delete tasks
- **Task Fields** — Title, Description, Priority (low/medium/high), Status (pending/in-progress/completed), Due Date
- **Dashboard** — Statistics: Total, Pending, In Progress, Completed, High Priority, Overdue tasks
- **Search & Filter** — Real-time search, filter by status/priority, sort by date/title/priority
- **Pagination** — Paginated task list
- **Responsive UI** — Works on mobile, tablet, and desktop
- **Quick Actions** — Toggle task complete/pending with one click

---

## Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Frontend   | React 18, React Router 6          |
| Backend    | Node.js, Express.js               |
| Database   | MongoDB + Mongoose                |
| Auth       | JWT + bcryptjs                    |
| HTTP       | Axios                             |
| Toasts     | React Toastify                    |

---

## Project Structure

```
tast_manager/
├── backend/
│   ├── middleware/
│   │   └── auth.js          # JWT protect middleware
│   ├── models/
│   │   ├── User.js          # User schema (bcrypt hashing)
│   │   └── Task.js          # Task schema
│   ├── routes/
│   │   ├── auth.js          # /api/auth (register, login, me)
│   │   └── tasks.js         # /api/tasks (CRUD + stats)
│   ├── .env                 # Environment variables
│   ├── .env.example         # Example env file
│   └── server.js            # Express entry point
│
└── frontend/
    └── src/
        ├── api/
        │   └── axios.js         # Axios instance with interceptors
        ├── components/
        │   ├── Layout.js/css    # Sidebar + topbar shell
        │   ├── TaskModal.js     # Create/Edit task modal
        │   ├── DeleteModal.js   # Confirmation dialog
        │   └── Modal.css        # Modal shared styles
        ├── context/
        │   └── AuthContext.js   # Auth state + login/logout/register
        ├── pages/
        │   ├── LoginPage.js
        │   ├── RegisterPage.js
        │   ├── DashboardPage.js
        │   └── TasksPage.js
        └── App.js               # Routes + providers
```

---

## Setup Instructions

### Prerequisites

- Node.js 18+
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/atlas))

---

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd tast_manager
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Create your `.env` file (copy from `.env.example`):

```bash
cp .env.example .env
```

Edit `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/taskmanager
JWT_SECRET=your_strong_random_secret_here
JWT_EXPIRE=7d
NODE_ENV=development
```

> For MongoDB Atlas, replace `MONGODB_URI` with your Atlas connection string.

Start the backend:

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

The API will be available at `http://localhost:5000`

---

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Start the React app:

```bash
npm start
```

The app will open at `http://localhost:3000`

> The frontend uses the `"proxy": "http://localhost:5000"` setting in `package.json` to forward API calls during development.

---

## API Endpoints

### Auth
| Method | Endpoint             | Description              | Auth |
|--------|----------------------|--------------------------|------|
| POST   | `/api/auth/register` | Register new user        | No   |
| POST   | `/api/auth/login`    | Login user, receive JWT  | No   |
| GET    | `/api/auth/me`       | Get current user info    | Yes  |

### Tasks
| Method | Endpoint            | Description                          | Auth |
|--------|---------------------|--------------------------------------|------|
| GET    | `/api/tasks`        | Get all tasks (search/filter/sort)   | Yes  |
| GET    | `/api/tasks/stats`  | Get dashboard statistics             | Yes  |
| GET    | `/api/tasks/:id`    | Get single task                      | Yes  |
| POST   | `/api/tasks`        | Create new task                      | Yes  |
| PUT    | `/api/tasks/:id`    | Update task                          | Yes  |
| DELETE | `/api/tasks/:id`    | Delete task                          | Yes  |

#### Task Query Parameters

| Param    | Type   | Description                                         |
|----------|--------|-----------------------------------------------------|
| search   | string | Search in title and description                     |
| status   | string | Filter: `pending`, `in-progress`, `completed`       |
| priority | string | Filter: `low`, `medium`, `high`                     |
| sortBy   | string | Sort field: `createdAt`, `dueDate`, `priority`, `title` |
| order    | string | `asc` or `desc` (default: `desc`)                   |
| page     | number | Page number (default: 1)                            |
| limit    | number | Items per page (default: 20, max: 50)               |

---

## Deployment

### Backend — Render

1. Create a new **Web Service** on [Render](https://render.com)
2. Connect your GitHub repo, select the `backend` folder
3. Build command: `npm install`
4. Start command: `npm start`
5. Add environment variables in the Render dashboard:
   - `MONGODB_URI` — your Atlas connection string
   - `JWT_SECRET` — a strong random string
   - `NODE_ENV=production`
   - `CLIENT_URL` — your frontend URL

### Frontend — Vercel

1. Import your GitHub repo on [Vercel](https://vercel.com)
2. Set the root directory to `frontend`
3. Add an environment variable:
   - `REACT_APP_API_URL` — your Render backend URL + `/api` (e.g. `https://your-app.onrender.com/api`)
4. Deploy

---

## Environment Variables Reference

### Backend (`backend/.env`)

| Variable      | Required | Description                          |
|---------------|----------|--------------------------------------|
| PORT          | No       | Server port (default: 5000)          |
| MONGODB_URI   | Yes      | MongoDB connection string            |
| JWT_SECRET    | Yes      | Secret key for signing JWTs          |
| JWT_EXPIRE    | No       | Token expiry (default: 7d)           |
| NODE_ENV      | No       | `development` or `production`        |
| CLIENT_URL    | No       | Frontend URL for CORS (production)   |

### Frontend (`frontend/.env`)

| Variable             | Required | Description                        |
|----------------------|----------|------------------------------------|
| REACT_APP_API_URL    | No       | Backend API base URL (production)  |
