# Project notes

## Stack
- Vite + React + TypeScript
- Tailwind CSS v4 via @tailwindcss/vite
- shadcn/ui (Nova style, Radix base), components in src/components/ui
- Import alias: @ maps to src (set in vite.config.ts and tsconfig paths)

## Conventions
- Use existing shadcn components before writing custom ones
- Use Tailwind utilities and the theme tokens in src/index.css, no inline styles
- Keep components small and in src/components
- Mock data only, no backend or auth unless asked

## Working agreement
- Write the simplest implementation that works. Plain, readable code over clever abstractions, and no extra helpers, layers or patterns I didn't ask for
- If the brief is ambiguous, ask me up to 3 clarifying questions before writing any code
- No new dependencies without asking. Name the package and why you want it
- Keep changes small, so I can read every diff
- Build only the scope I ask for, and say what you skipped
- After building, run the build and tell me what you built
- Flag anything uncertain or any shortcut you took
- For any new UI, invoke the frontend-design skill, but simplicity wins any conflict: get the look from shadcn components and Tailwind tokens, with no custom CSS files and no extra wrapper components
- If a shadcn component I need isn't installed, add it with npx shadcn@latest add <name> instead of hand-rolling it