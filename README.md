# Euro School Election 2026 — Live Dashboard

Real-time election dashboard for Euro School with:
- Student council leadership results
- Sports captain / vice-captain results
- House election results with per-house dropdown
- Admin center for vote control, visibility control, and byte-based logo upload

## Requirements
- Node.js 20+
- npm

## Run locally
1. Install dependencies
   ```bash
   npm install
   ```
2. Create database and seed election data
   ```bash
   npm run setup
   ```
3. Start development server
   ```bash
   npm run dev
   ```
4. Open:
   - `http://localhost:3000` (public dashboard)
   - `http://localhost:3000/admin/login` (admin login)

## Admin login
- Username: `admin`
- Password: `admin123`

## What the dashboard shows
- Tab 1: Head Boy, Deputy Head Boy, Head Girl, Deputy Head Girl
- Tab 2: Sports Captain, Sports Vice-Captain
- Tab 3: House Elections (house selector dropdown)

Charts:
- Bar chart shows correctly ordered vote counts
- Pie chart shows vote share percentages (safe handling for zero-vote states)

## Candidate logos (byte upload)
In Admin Center → Candidates:
- Use **Upload Logo** button beside each candidate, or
- Attach a logo while creating/editing a candidate

Images are stored in database as Prisma `Bytes` and served from:
- `/api/candidates/[id]/image`

## Useful scripts
```bash
npm run dev
npm run build
npm run lint
npm run db:generate
npm run db:migrate
npm run db:seed
npm run db:studio
```

## Reset votes
Use Admin Center → Settings → **Reset All Votes to 0**.