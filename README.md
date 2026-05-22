# TaskFlow 🚀

A complete, production-ready full-stack Team Task Management platform inspired by Trello and Asana. Features dynamic, interactive Kanban task boards with touch-friendly native HTML5 drag-and-drop status movements, role-based workflows, detailed real-time statistics, and collaborative workspace management.

---

## Key Highlights & Features

1. **Analytical Dashboard**: Compiles live progress statistics (total, completed, in progress, pending, overdue metrics) accompanied by dynamic SVG assignment distribution charts and a collaborative user activity log feed.
2. **Project Workspace Hub**:
   - Create projects where the creator becomes the Board Admin automatically.
   - Invite or remove members securely using official registered emails.
   - Complete CRUD operations on project boards.
3. **Interactive Kanban Board**:
   - Modern columnar task representation ('To Do', 'In Progress', 'Done').
   - Native HTML5 Drag & Drop visual state-updates (syncs immediately to active servers).
   - Dynamic searches, filterable priority levels, designated assignee lookups, and flexible listings sorted by due date or recency.
4. **Resilient Multimode Architecture**: Starts up out-of-the-box seamlessly in an embedded Local File Database mode (`data/*.json`) to avoid development-stage setup blocks, whilst automatically connecting to full-scale MongoDB Atlas instances when `MONGODB_URI` secrets are configured.
5. **Aesthetic Transitions**: Framed by elegant typography pairing, support for persisting Light/Dark theme toggles, detailed status markers, and responsive micro-animations powered by `motion`.
6. **Robust Authentications**: Authenticates sessions via secure password hashes (`bcryptjs`) and secure Authorization JSON Web Tokens (`jsonwebtoken`).

---

## Tech Stack

- **Frontend**: React (Vite, React Router, Tailwind CSS, Lucide Icons, Motion/React)
- **Backend**: Node.js, Express.js (TypeScript compiled to optimized CJS via esbuild)
- **Database**: MongoDB Atlas with Mongoose (with full local-file server persistence fallback)
- **Authentication**: JWT, bcryptjs

---

## Quick Start Configuration

### 16. Development Setup Instructions

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   Create a `.env` file in the root workspace directory based on `.env.example`:
   ```env
   MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/taskflow"
   JWT_SECRET="taskflow-super-secret-key-2026"
   ```

3. **Run local dev server**:
   ```bash
   npm run dev
   ```
   *The Express backend will start up on Port 3000, serving your APIs and hot-reloading your Vite React frontend.*

4. **Production compilation & standalone run**:
   ```bash
   npm run build
   npm start
   ```

---

## API Documentation Reference

All routes require a token prefixed as `Bearer <JWT_TOKEN>` in the request `Authorization` header.

### Authentications & User Profile
- `POST /api/auth/register` : Create a user. Body: `{ name, email, password, role }`
- `POST /api/auth/login` : Login credentials verify. Body: `{ email, password }`
- `GET /api/auth/profile` : Fetch active user profile settings.
- `PUT /api/auth/profile` : Update name or initials avatar details.

### Board Projects
- `GET /api/projects` : List all collaborative projects user belongs to.
- `POST /api/projects` : Create project. Body: `{ title, description }` (inserts active user as admin)
- `GET /api/projects/:id` : Fetch detailed project metadata.
- `PUT /api/projects/:id` : Edit title/description details (Admin only).
- `DELETE /api/projects/:id` : Erase project board and task items (Admin only).
- `POST /api/projects/:id/add-member` : Add teammate via registered email. Body: `{ email }` (Admin only)
- `DELETE /api/projects/:id/remove-member` : Remove teammate and unassign cards. Body: `{ memberId }` (Admin only)

### Task Management
- `GET /api/tasks/project/:id` : List task cards inside a project.
- `POST /api/tasks` : Add task card under a project. Body: `{ title, description, dueDate, priority, assignedTo, project }` (Admin only)
- `PUT /api/tasks/:id` : Modify task metadata (Admin can edit any field. Member can check/update *status only*)
- `DELETE /api/tasks/:id` : Erase task card from board (Admin only).

### Dashboard Analytics
- `GET /api/dashboard/stats` : Calculates overview statistics, tasks per user distribution, and retrieves recent collaborative activity logs.

---

## Railway Deployment Guide

This project is fully structured with optimized standalone scripts ready for deployment on Railway:

1. Connect your GitHub repository to **Railway** (https://railway.app).
2. Configure **Environment Variables** in the Railway Settings panel:
   - `MONGODB_URI`: Your MongoDB Atlas collection connection string.
   - `JWT_SECRET`: A secure key used for signing session auth tokens.
   - `NODE_ENV`: Set to `production`.
3. Railway automatically detects `package.json` scripts, runs `npm run build` (triggering frontend Vite compilation and esbuild backend packing), and runs `npm start` to execute the production server bundle at `dist/server.cjs` routed to your public URL.
