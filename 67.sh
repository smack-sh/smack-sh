sudo bash <<'EOF'
set -e

echo "==> Cleaning lockfiles and modules"
rm -rf node_modules
rm -f package-lock.json
rm -f bun.lockb
rm -f pnpm-lock.yaml

echo "==> Installing dependencies with pnpm"
pnpm install

echo "==> Ensuring file-saver is installed exactly once"
pnpm add file-saver
pnpm add -D @types/file-saver

echo "==> Blocking browser-only deps from SSR"
cat > vite.ssr-guard.js <<'JS'
export const ssrNoExternal = [
  "file-saver",
  "path-browserify",
  "crypto-browserify",
  "stream-browserify"
]
JS

echo "==> Patching vite.config.ts"
if ! grep -q "ssr:" vite.config.ts; then
  sed -i '' '/defineConfig/a\
  ssr: {\
    noExternal: require("./vite.ssr-guard").ssrNoExternal\
  },' vite.config.ts
fi

echo "==> Scanning server files for browser-only imports"
FOUND=$(grep -R "path-browserify\\|file-saver" app | grep -E "\\.server\\.ts|\\.server\\.tsx" || true)

if [ -n "$FOUND" ]; then
  echo ""
  echo "❌ INVALID IMPORTS DETECTED IN SERVER FILES"
  echo "$FOUND"
  echo ""
  echo "Move these imports into .client.ts files immediately."
  exit 1
fi

echo "==> Done. Restart dev server."
EOF
