# Smart Attendance System (MERN)

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
	if [ -f .nvmrc ]; then
		nvm use || nvm install
	fi
}
autoload -U add-zsh-hook
add-zsh-hook chpwd autoload_nvmrc
autoload_nvmrc
```

After that, a new terminal or a `cd` into the repo will auto-switch to Node 20.19.6.
