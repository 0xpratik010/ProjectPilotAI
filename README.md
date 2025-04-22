# ProjectPilotAI

A fullstack project tracker and task management tool with natural language task creation powered by OpenAI, built with Vite (React), Express, Drizzle ORM, and NeonDB. Deployable to Netlify or Vercel.

---

## Features
- **Natural Language Task Creation:** Create issues and subtasks using OpenAI-powered prompts.
- **Project & Issue Tracking:** Manage projects, milestones, issues, and subtasks.
- **Modern UI:** Built with Vite + React + TailwindCSS.
- **API & Backend:** Express server, Drizzle ORM for database, NeonDB for Postgres hosting.
- **Deployable:** Ready for Netlify or Vercel deployment.

---

## Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/0xpratik010/ProjectPilotAI.git
cd ProjectPilotAI
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env` and fill in your secrets:
- `DATABASE_URL` (NeonDB Postgres connection string)
- `OPENAI_API_KEY` (from OpenAI)

### 4. Development
- **Frontend:** Vite (React) in `/client`
- **Backend/API:** Express in `/server`

Run locally with Netlify Dev:
```bash
npm install -g netlify-cli
netlify dev
```

---

## Deployment

### Deploy to Netlify
1. Connect your repo to Netlify.
2. Ensure `netlify.toml` exists with:
    ```toml
    [build]
      command = "npm run build"
      publish = "client/dist"

    [[redirects]]
      from = "/api/*"
      to = "/.netlify/functions/server"
      status = 200
    ```
3. Set required environment variables in the Netlify dashboard.
4. Deploy!

### Deploy to Vercel
1. Add `vercel.json` (see repo for example).
2. Connect your repo to Vercel.
3. Set environment variables.
4. Deploy!

---

## API Endpoints
- All API endpoints are available under `/api/*`.
- Example: `POST /api/ai/parse-task` for OpenAI-powered task creation.

---

## License
MIT

---

## Credits
- [OpenAI](https://openai.com/)
- [NeonDB](https://neon.tech/)
- [Vite](https://vitejs.dev/)
- [Netlify](https://netlify.com/)
- [Vercel](https://vercel.com/)
