# Configurable port (override with: just --set port 9000 run)
port := "23232"

# Default target
default: help

# Show available targets
help:
    @echo ""
    @echo "  Available targets:"
    @echo ""
    @echo "    init      Initialize project (install npm dependencies)"
    @echo "    run       Run the React dev server"
    @echo "    build     Build the React frontend for production"
    @echo "    preview   Preview the production build"
    @echo "    ci        Run ci pipeline"
    @echo "    stats     Show lines of code per file type"
    @echo "    deploy    Deploy dist to GitHub Pages"
    @echo "    clean     Remove node_modules and build artifacts"
    @echo "    help      Show this help message"
    @echo ""

# Initialize project dependencies
init:
    @echo ""
    cd frontend && npm install
    mkdir -p reports
    @echo ""

# Run the React dev server
run:
    @echo ""
    @lsof -i :{{port}} -sTCP:LISTEN >/dev/null 2>&1 && echo "Error: port {{port}} is already in use" && exit 1 || true
    @(sleep 5 && open http://localhost:{{port}}/touchtask/) &
    cd frontend && npm run dev -- --port {{port}}
    @echo ""

# Build the React frontend for production
build:
    @echo ""
    cd frontend && npm run build
    @echo ""

# Preview the production build
preview:
    @echo ""
    @lsof -i :{{port}} -sTCP:LISTEN >/dev/null 2>&1 && echo "Error: port {{port}} is already in use" && exit 1 || true
    @(sleep 3 && open http://localhost:{{port}}/touchtask/) &
    cd frontend && npm run preview -- --port {{port}}
    @echo ""

# Run ci pipeline (static analysis + Lighthouse audit)
ci:
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
    @echo ""

# Show lines of code per file type (code, tests, docs)
stats:
    @echo ""
    @echo "=== CODE ==="
    @printf "  %-12s %s\n" "JSX" "$(find frontend/src -name '*.jsx' ! -name '*.test.*' ! -path '*/node_modules/*' | xargs cat 2>/dev/null | wc -l | tr -d ' ')"
    @printf "  %-12s %s\n" "CSS" "$(find frontend/src -name '*.css' ! -path '*/node_modules/*' | xargs cat 2>/dev/null | wc -l | tr -d ' ')"
    @printf "  %-12s %s\n" "JS" "$(find frontend/src -name '*.js' ! -name '*.test.*' ! -path '*/node_modules/*' | xargs cat 2>/dev/null | wc -l | tr -d ' ')"
    @printf "  %-12s %s\n" "HTML" "$(find frontend -maxdepth 1 -name '*.html' | xargs cat 2>/dev/null | wc -l | tr -d ' ')"
    @printf "  %-12s %s\n" "JSON config" "$(cat frontend/package.json frontend/vite.config.js 2>/dev/null | wc -l | tr -d ' ')"
    @echo ""
    @echo "=== TESTS ==="
    @printf "  %-12s %s\n" "*.test.jsx" "$(find frontend/src -name '*.test.jsx' ! -path '*/node_modules/*' 2>/dev/null | xargs cat 2>/dev/null | wc -l | tr -d ' ')"
    @printf "  %-12s %s\n" "*.test.js" "$(find frontend/src -name '*.test.js' ! -path '*/node_modules/*' 2>/dev/null | xargs cat 2>/dev/null | wc -l | tr -d ' ')"
    @echo ""
    @echo "=== DOCS ==="
    @printf "  %-12s %s\n" "Markdown" "$(find . -name '*.md' ! -path '*/node_modules/*' ! -path '*/.claude/*' | xargs cat 2>/dev/null | wc -l | tr -d ' ')"
    @echo ""
    @echo "=== TOTAL ==="
    @printf "  %-12s %s lines\n" "Source" "$(find frontend/src \( -name '*.jsx' -o -name '*.css' -o -name '*.js' \) ! -path '*/node_modules/*' | xargs cat 2>/dev/null | wc -l | tr -d ' ')"
    @echo ""

# Deploy dist to GitHub Pages
deploy:
    @echo ""
    git subtree push --prefix dist origin gh-pages
    @echo ""

# Remove node_modules and build artifacts
clean:
    @echo ""
    rm -rf frontend/node_modules dist
    @echo ""
