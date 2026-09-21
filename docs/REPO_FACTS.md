PACKAGE_MANAGER: bun
FRAMEWORK_VERSION: next: ^16.3.5, react: 19.2.0, react-dom: 19.2.0
ROUTER_MODE: next-app-router
APP_DIR: src/app
TEST_RUNNER: none (npm run test:core -> npm run build:core && node --env-file-if-exists=.env.local --test tests/*.test.cjs)
TYPECHECK_CMD: npm run typecheck
LINT_CMD: npm run lint
BUILD_CMD: npm run build
DEV_CMD: npm run dev
PUBLIC_ASSET_DIR: public
EXISTING_ASSETS: none
FONT_LOADING: next/font/local (src/app/layout.tsx)
TAILWIND_VERSION: 4.1.17 (v4 CSS-first @import "tailwindcss"; in src/app/globals.css via @tailwindcss/postcss)
GLOBAL_CSS_PATH: src/app/globals.css
EXTERNAL_BACKUP_PATH: /root/redteam-backups/redteam-20260921-1337
