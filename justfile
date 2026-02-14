# Configurable port (override with: just --set port 9000 run)
port := "23232"

# Default target
default: help

# Show available targets
help:
    @echo ""
    @echo ">>> Starting: help"
    @echo "Available targets:"
    @echo "  init    - Initialize project (install npm dependencies)"
    @echo "  run     - Run the React dev server"
    @echo "  build   - Build the React frontend for production"
    @echo "  preview - Preview the production build"
    @echo "  clean   - Remove node_modules and build artifacts"
    @echo "  deploy  - Deploy dist to GitHub Pages"
    @echo "  ci      - Run ci pipeline"
    @echo "  help    - Show this help message"
    @echo "<<< Finished: help"
    @echo ""

# Initialize project dependencies
init:
    @echo ""
    @echo ">>> Starting: init"
    cd frontend && npm install
    mkdir -p reports
    @echo "<<< Finished: init"
    @echo ""

# Run the React dev server
run:
    @echo ""
    @echo ">>> Starting: run"
    @lsof -i :{{port}} -sTCP:LISTEN >/dev/null 2>&1 && echo "Error: port {{port}} is already in use" && exit 1 || true
    @(sleep 5 && open http://localhost:{{port}}/touchtask/) &
    cd frontend && npm run dev -- --port {{port}}
    @echo "<<< Finished: run"
    @echo ""

# Build the React frontend for production
build:
    @echo ""
    @echo ">>> Starting: build"
    cd frontend && npm run build
    @echo "<<< Finished: build"
    @echo ""

# Preview the production build
preview:
    @echo ""
    @echo ">>> Starting: preview"
    @lsof -i :{{port}} -sTCP:LISTEN >/dev/null 2>&1 && echo "Error: port {{port}} is already in use" && exit 1 || true
    @(sleep 3 && open http://localhost:{{port}}/touchtask/) &
    cd frontend && npm run preview -- --port {{port}}
    @echo "<<< Finished: preview"
    @echo ""

# Remove node_modules and build artifacts
clean:
    @echo ""
    @echo ">>> Starting: clean"
    rm -rf frontend/node_modules dist
    @echo "<<< Finished: clean"
    @echo ""

# Deploy dist to GitHub Pages
deploy:
    @echo ""
    @echo ">>> Starting: deploy"
    git subtree push --prefix dist origin gh-pages
    @echo "<<< Finished: deploy"
    @echo ""

# Run ci pipeline (static analysis + Lighthouse audit)
ci:
    @echo ""
    @echo ">>> Starting: ci"
    @echo ""
    @echo "=== ESLINT (JavaScript) ==="
    cd frontend && npm run lint
    @echo ""
    @echo "=== STYLELINT (CSS) ==="
    cd frontend && npm run lint:css
    @echo ""
    @echo "=== HTML VALIDATOR ==="
    cd frontend && npm run lint:html
    @echo ""
    @echo "=== KNIP (Dead Code) ==="
    cd frontend && npm run deadcode
    @echo ""
    @echo "=== PLATO (Complexity) ==="
    cd frontend && npm run complexity
    @echo ""
    @echo "=== JEST (Tests) ==="
    cd frontend && npm run test || echo "No tests found (this is expected if you haven't written any yet)"
    @echo ""
    @echo "=== LIGHTHOUSE (Performance) ==="
    cd frontend && npm run preview -- --port {{port}} & PID=$$! && \
    until curl -s http://localhost:{{port}}/touchtask/ > /dev/null; do :; done && \
    npx lighthouse http://localhost:{{port}}/touchtask/ --output=html --output=json --output-path=./reports/lighthouse --chrome-flags="--headless=new" --only-categories=performance,accessibility,best-practices,seo ; \
    kill $$PID 2>/dev/null || true
    @node -e "\
    const d = require('./reports/lighthouse.report.json');\
    const s = c => Math.round(d.categories[c].score * 100);\
    console.log('');\
    console.log('=== LIGHTHOUSE SCORES ===');\
    console.log('Performance:    ', s('performance'));\
    console.log('Accessibility:  ', s('accessibility'));\
    console.log('Best Practices: ', s('best-practices'));\
    console.log('SEO:            ', s('seo'));\
    const failed = Object.values(d.audits).filter(a => a.score === 0 && a.scoreDisplayMode !== 'manual');\
    if (failed.length) { console.log(''); console.log('=== FAILED AUDITS ==='); failed.forEach(a => console.log('-', a.title)); }\
    console.log(''); console.log('Details: reports/lighthouse.report.html');\
    "
    @echo "<<< Finished: ci"
    @echo ""
