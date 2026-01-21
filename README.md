# Smart Attendance System (MERN)

Name:Scan2Attend

This repository will host the Smart Attendance System using QR codes (MERN stack).

Initial scaffold: backend Express server + instructions to create frontend (Vite React).

Quick start (backend only):

1. Open a terminal and change to the backend folder:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Create `.env` from `.env.example` and set `MONGO_URI` and `JWT_SECRET`.

4. Run dev server:

```bash
npm run dev
```

To scaffold the React frontend (recommended: Vite) see the section "Frontend setup" below or ask me to create it.

Pin Node version for this project
---------------------------------
Create a `.nvmrc` file is provided in the project root to pin Node to `20.19.6`.

Use it once per shell session with:

```bash
nvm use
```

To automatically switch Node when you `cd` into the project, add this to your `~/.zshrc` (one-time):

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \ . "$NVM_DIR/nvm.sh"
autoload_nvmrc() {
	# Smart Attendance System (MERN)

	This repository contains the Smart Attendance System: an Express backend and a Vite + React frontend.

	**Prerequisites**
	- Node.js (recommended via `nvm`, project pins Node in `.nvmrc`)
	- npm
	- MongoDB (local or Atlas) — the backend reads `MONGO_URI` from the environment
	- Git

	**Clone the project**

	```bash
	git clone https://github.com/22ce093/Smart-Attendance.git
	cd Smart-Attendance
	```

	If you prefer SSH, use:

	```bash
	git clone git@github.com:22ce093/Smart-Attendance.git
	cd Smart-Attendance
	```

	Backend (server)
	- Copy or create a `.env` file in `backend/` with at least:

	```
	MONGO_URI=your_mongo_connection_string
	JWT_SECRET=some_secret
	PORT=5000
	```

	```bash
	cd backend
	npm install
	# start in dev mode (uses nodemon if available)
	npm run dev
	```

	The backend connects to MongoDB using the `MONGO_URI` environment variable (see `backend/config/db.js`).

	Frontend (client)

	```bash
	cd frontend
	npm install
	npm run dev
	```

	Vite will print the local dev URL (usually `http://localhost:5173`). Open that in your browser.

	Notes
	- Use `nvm use` to switch to the pinned Node version from `.nvmrc`.
	- If you run into permission/credential issues pushing to the original GitHub repo, confirm your Git identity and remote configuration (SSH key or Personal Access Token).
	- For production deployment you should set stronger secrets and use a managed MongoDB or proper database backups.

	If you want, I can add a sample `.env.example` to the `backend/` folder or help wire up Docker/Procfile for deployment.
