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
- Build only the scope I ask for, and say what you skipped
- After building, run the build and tell me what you built
- Flag anything uncertain or any shortcut you took
- For any new UI, invoke the frontend-design skill before building