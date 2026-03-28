# CLAUDE.md - Project Context for AI Assistants

## Project Overview

Bloomberg Terminal Clone - A Next.js 15 application for real-time financial data visualization with a professional terminal-like interface.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI**: React 19 with shadcn/ui
- **Styling**: Tailwind CSS
- **State**: Jotai (local), React Query (server)
- **Database**: Upstash Redis
- **Linting**: Biome.js

## Key Conventions

### Git Workflow (STRICT)

1. **ALWAYS** create a new branch before starting work:
   ```bash
   git checkout -b feat/feature-name
   # OR
   git worktree add ../bloomberg-terminal-feature feature-name
   ```

2. **NEVER** work on `main` or `master` branch directly

3. When完成任务:
   - Push branch: `git push -u origin branch-name`
   - Create PR: `gh pr create --title "..." --body "..."`
   - Comment PR link on Paperclip ticket

### Code Style

- Use Biome.js for linting and formatting
- Follow existing component organization in `/components/bloomberg`
- Use TypeScript for all new code

### Documentation

- Update README.md for any feature changes
- Document new environment variables in README.md
- Keep documentation in sync with code changes

## Important Notes

- No secrets in code - use `.env.local`
- This is an SPA (Single Page Application) for terminal-style data visualization
- Focus on real-time data updates and keyboard-driven interactions
