# TaskFlow — Task Management Dashboard

A full-stack MERN task management application with JWT authentication.

## Features

- User registration and login with JWT authentication
- Create, read, update, and delete tasks
- Task fields: Title, Description, Priority, Status, Due Date
- Dashboard statistics: Total, Pending, In Progress, Completed, High Priority, Overdue
- Search and filter tasks by status and priority
- Sorting and pagination
- Responsive design for mobile and desktop

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router 6 |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Authentication | JWT, bcryptjs |
| HTTP Client | Axios |

## Project Structure

```
tast_manager/
├── backend/
│   ├── middleware/auth.js
│   ├── models/User.js
│   ├── models/Task.js
│   ├── routes/auth.js
│   ├── routes/tasks.js
│   ├── .env.example
│   └── server.js
└── frontend/
    └── src/
        ├── api/axios.js
        ├── components/
        ├── context/AuthContext.js
        └── pages/
```

## Setup

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

### Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` with your values:

```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

```bash
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm start
```

App runs at `http://localhost:3000`

## API Endpoints

### Auth

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and receive JWT |
| GET | `/api/auth/me` | Get current user |

### Tasks

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/tasks` | Get all tasks |
| GET | `/api/tasks/stats` | Get dashboard statistics |
| GET | `/api/tasks/:id` | Get a single task |
| POST | `/api/tasks` | Create a task |
| PUT | `/api/tasks/:id` | Update a task |
| DELETE | `/api/tasks/:id` | Delete a task |

#### Query Parameters for GET /api/tasks

| Param | Description |
|---|---|
| search | Search in title and description |
| status | Filter by: pending, in-progress, completed |
| priority | Filter by: low, medium, high |
| sortBy | Sort by: createdAt, dueDate, priority, title |
| order | asc or desc |
| page | Page number |
| limit | Items per page (max 50) |

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| MONGODB_URI | Yes | MongoDB connection string |
| JWT_SECRET | Yes | Secret key for JWT signing |
| PORT | No | Server port (default 5000) |
| JWT_EXPIRE | No | Token expiry (default 7d) |
| NODE_ENV | No | development or production |
| CLIENT_URL | No | Frontend URL for CORS |
