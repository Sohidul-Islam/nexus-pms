---
title: Run Nexus Full-Stack Environment
description: Workflow to seed the SQLite database and launch backend & frontend services concurrently
---

# Workflow: Run Full-Stack Nexus PMS

1. **Seed Database**:
   ```bash
   npm run seed --prefix backend
   ```

2. **Run Backend API**:
   ```bash
   npm run dev --prefix backend
   ```
   Backend listens at `http://localhost:3000` with SSE endpoint at `/api/realtime/stream`.

3. **Run Frontend Application**:
   ```bash
   npm run start --prefix frontend
   ```
   Frontend accessible at `http://localhost:4200`.

4. **Run Concurrently**:
   ```bash
   npm run dev:all
   ```
