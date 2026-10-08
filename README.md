# AgroTrends web

Frontend for AgroTrends — farming knowledge from people who grow it. Stories, questions and answers, and an AI
advisor that cites the stories it used.

## Run

Needs Node 20.19+ and the backend running on `http://localhost:8080` (see `../AgroTrends- Backend`).

```bash
npm install
npm run dev       # http://localhost:5173
npm test
npm run lint
npm run build
npm run gen:api   # regenerate src/api/schema.d.ts from the running backend
```

Plan: `docs/ROADMAP.md` · Design: `docs/DESIGN.md` · Log: `docs/DEV_LOG.md`
