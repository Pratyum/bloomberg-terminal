# Agent Instructions

## Workflow

All agent work in this repository MUST follow this workflow:

### 1. Starting a Task

Before any work begins, agents MUST:
- **Always create a new branch or worktree** for each task
- Use a descriptive branch name (e.g., `feat/add-new-component`, `fix/bug-description`)
- Never work directly on `main` or `master` branch

Example:
```bash
git checkout -b feat/your-feature-name
# OR
git worktree add ../bloomberg-terminal-feature your-feature-name
```

### 2. During Development

- Make incremental commits with descriptive messages
- Keep changes focused and atomic
- Update documentation (README.md, etc.) as you make changes

### 3. Finishing a Task

When work is complete, agents MUST:

1. **Push the branch** to remote:
   ```bash
   git push -u origin your-branch-name
   ```

2. **Create a Pull Request** using `gh` CLI:
   ```bash
   gh pr create --title "Your PR Title" --body "Description of changes"
   ```

3. **Post a comment to the Paperclip ticket** with the PR link:
   - Update the issue status to `done`
   - Include the PR URL in the comment

## Documentation Requirements

Before raising a PR, ensure:
- README.md is updated if there are changes to features, setup, or structure
- Any new environment variables are documented
- Breaking changes are clearly noted

## Important Notes

- Never commit secrets, keys, or credentials to the repository
- Always use environment variables for sensitive data
- Follow the existing code style and conventions in the project
