<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Shared appearance

All new web screens must support light, dark and system appearance. Use the semantic CSS variables in `src/app/theme.css` for surfaces, text, borders and states; do not introduce fixed light backgrounds or dark text colors. Use the shared AppShell or AuthLayout where applicable. See `../../docs/themes.md` for the token contract and verification guidance.
