# =============================================================================
# Justfile Rules (follow these when editing justfile):
#
# 1. Use printf (not echo) to print colors — some terminals won't render
#    colors with echo.
#
# 2. Always add an empty `@echo ""` line before and after each target's
#    command block.
#
# 3. Always add new targets to the help section and update it when targets
#    are added, modified or removed.
#
# 4. Target ordering in help (and in this file) matters:
#    - Setup & lifecycle targets first (init, clean, help)
#    - Start/stop targets next
#    - Build & deploy targets next
#    - Checks, linting, and tests last (ordered fastest to slowest)
#    Group related targets together and separate groups with an empty
#    `@echo ""` line in the help output.
#
# 5. Composite targets (e.g. ci) that call multiple sub-targets must fail
#    fast: exit 1 on the first error.
#
# 6. Every target must end with a clear short status message:
#    - On success: green (\033[32m) message confirming completion.
#    - On failure: red (\033[31m) message indicating what failed, then exit 1.
# =============================================================================

# Configurable port (override with: just --set port 9000 run)
port := "23232"

# Default recipe: show available commands
_default:
    @just help

# Show help information
help:
    @clear
    @echo ""
    @printf "\033[0;34m=== touchtask ===\033[0m\n"
    @echo ""
    @printf "\033[0;33mSetup & Lifecycle:\033[0m\n"
    @printf "  %-18s %s\n" "init" "Install npm dependencies"
    @printf "  %-18s %s\n" "clean" "Remove node_modules and build artifacts"
    @printf "  %-18s %s\n" "help" "Show this help information"
    @echo ""
    @printf "\033[0;33mRun & Preview:\033[0m\n"
    @printf "  %-18s %s\n" "run" "Start the React dev server"
    @printf "  %-18s %s\n" "stop" "Stop the dev/preview server"
    @printf "  %-18s %s\n" "status" "Check if the app is running"
    @printf "  %-18s %s\n" "preview" "Preview the production build"
    @echo ""
    @printf "\033[0;33mBuild & Deploy:\033[0m\n"
    @printf "  %-18s %s\n" "build" "Build the React frontend for production"
    @printf "  %-18s %s\n" "deploy" "Deploy dist to GitHub Pages"
    @echo ""
    @printf "\033[0;33mCI & Stats:\033[0m\n"
    @printf "  %-18s %s\n" "ci" "Run CI pipeline (lint + tests + Lighthouse)"
    @printf "  %-18s %s\n" "ci-quiet" "Run CI pipeline (silent, output on error)"
    @printf "  %-18s %s\n" "stats" "Show lines of code per file type"
    @echo ""

# Install npm dependencies
init:
    @echo ""
    @printf "\033[0;34m=== Initializing Project ===\033[0m\n"
    cd frontend && npm install
    mkdir -p reports
    @printf "\033[0;32m✓ init completed successfully\033[0m\n"
    @echo ""

# Remove node_modules and build artifacts
clean:
    @echo ""
    @printf "\033[0;34m=== Cleaning Build Artifacts ===\033[0m\n"
    rm -rf frontend/node_modules dist
    @printf "\033[0;32m✓ clean completed successfully\033[0m\n"
    @echo ""

# Start the React dev server
run:
    @echo ""
    @lsof -i :{{port}} -sTCP:LISTEN >/dev/null 2>&1 && printf "\033[31m✗ port {{port}} is already in use\033[0m\n" && exit 1 || true
    @(sleep 5 && open http://localhost:{{port}}/touchtask/) &
    cd frontend && npm run dev -- --port {{port}}
    @echo ""

# Stop the dev/preview server running on the configured port
stop:
    #!/bin/bash
    echo ""
    if lsof -ti :{{port}} -sTCP:LISTEN >/dev/null 2>&1; then
        lsof -ti :{{port}} -sTCP:LISTEN | xargs kill
        printf "\033[0;32m✓ server stopped\033[0m\n"
    else
        printf "\033[0;33m⚠ no server running on port {{port}}\033[0m\n"
    fi
    echo ""

# Check if the app is running on the configured port
status:
    #!/bin/bash
    echo ""
    if lsof -i :{{port}} -sTCP:LISTEN >/dev/null 2>&1; then
        printf "\033[0;32m✓ running on port {{port}}\033[0m\n"
    else
        printf "\033[0;33m⚠ no server running on port {{port}}\033[0m\n"
    fi
    echo ""

# Preview the production build
preview:
    @echo ""
    @lsof -i :{{port}} -sTCP:LISTEN >/dev/null 2>&1 && printf "\033[31m✗ port {{port}} is already in use\033[0m\n" && exit 1 || true
    @(sleep 3 && open http://localhost:{{port}}/touchtask/) &
    cd frontend && npm run preview -- --port {{port}}
    @echo ""

# Build the React frontend for production
build: ci
    @echo ""
    @printf "\033[0;34m=== Building Frontend ===\033[0m\n"
    cd frontend && npm run build
    @printf "\033[0;32m✓ build completed successfully\033[0m\n"
    @echo ""

# Deploy dist to GitHub Pages
deploy: build
    @echo ""
    @printf "\033[0;34m=== Deploying to GitHub Pages ===\033[0m\n"
    cd frontend && npx gh-pages -d ../dist || (printf "\033[31m✗ deploy failed\033[0m\n" && exit 1)
    @printf "\033[0;32m✓ deploy completed successfully\033[0m\n"
    @echo ""

# Run CI pipeline (lint + tests + Lighthouse)
ci:
    @echo ""
    @printf "\033[0;34m=== ESLINT (JavaScript) ===\033[0m\n"
    cd frontend && npm run lint
    @echo ""
    @printf "\033[0;34m=== STYLELINT (CSS) ===\033[0m\n"
    cd frontend && npm run lint:css
    @echo ""
    @printf "\033[0;34m=== HTML VALIDATOR ===\033[0m\n"
    cd frontend && npm run lint:html
    @echo ""
    @printf "\033[0;34m=== KNIP (Dead Code) ===\033[0m\n"
    cd frontend && npm run deadcode
    @echo ""
    @printf "\033[0;34m=== PLATO (Complexity) ===\033[0m\n"
    cd frontend && npm run complexity
    @echo ""
    @printf "\033[0;34m=== JEST (Tests) ===\033[0m\n"
    cd frontend && npm run test
    @echo ""
    @printf "\033[0;34m=== LIGHTHOUSE (Performance) ===\033[0m\n"
    lsof -ti :{{port}} | xargs kill 2>/dev/null || true
    cd frontend && npm run preview -- --port {{port}} & PID=$! && \
    until curl -s http://localhost:{{port}}/touchtask/ > /dev/null; do :; done && \
    npx lighthouse http://localhost:{{port}}/touchtask/ --output=html --output=json --output-path=./reports/lighthouse --chrome-flags="--headless=new" --only-categories=performance,accessibility,best-practices,seo ; \
    LHRESULT=$? ; \
    kill $PID 2>/dev/null || true ; \
    [ $LHRESULT -eq 0 ] || (printf "\033[31m✗ lighthouse failed\033[0m\n" && exit 1)
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
    @printf "\033[0;32m✓ ci completed successfully\033[0m\n"
    @echo ""

# Run CI pipeline silently (output on error)
ci-quiet:
    #!/bin/bash
    echo ""
    steps=(
        "ESLint:cd frontend && npm run lint"
        "Stylelint:cd frontend && npm run lint:css"
        "HTML Validator:cd frontend && npm run lint:html"
        "Knip:cd frontend && npm run deadcode"
        "Plato:cd frontend && npm run complexity"
        "Jest:cd frontend && npm run test"
    )
    for step in "${steps[@]}"; do
        name="${step%%:*}"
        cmd="${step#*:}"
        output=$(eval "$cmd" 2>&1)
        if [ $? -ne 0 ]; then
            printf "\033[0;31m✗ %s failed\033[0m\n" "$name"
            echo "$output"
            echo ""
            exit 1
        fi
        printf "\033[0;32m✓ %s\033[0m\n" "$name"
    done
    # Lighthouse
    cd frontend && npm run preview -- --port {{port}} &
    PID=$!
    until curl -s http://localhost:{{port}}/touchtask/ > /dev/null; do :; done
    output=$(npx lighthouse http://localhost:{{port}}/touchtask/ --output=html --output=json --output-path=./reports/lighthouse --chrome-flags="--headless=new" --only-categories=performance,accessibility,best-practices,seo 2>&1)
    lh_status=$?
    kill $PID 2>/dev/null || true
    if [ $lh_status -ne 0 ]; then
        printf "\033[0;31m✗ Lighthouse failed\033[0m\n"
        echo "$output"
        echo ""
        exit 1
    fi
    printf "\033[0;32m✓ Lighthouse\033[0m\n"
    echo ""
    printf "\033[0;32m✓ ci completed successfully\033[0m\n"
    echo ""

# Show lines of code per file type
stats:
    @echo ""
    @printf "\033[0;34m=== CODE ===\033[0m\n"
    @printf "  %-12s %s\n" "JSX" "$(find frontend/src -name '*.jsx' ! -name '*.test.*' ! -path '*/node_modules/*' | xargs cat 2>/dev/null | wc -l | tr -d ' ')"
    @printf "  %-12s %s\n" "CSS" "$(find frontend/src -name '*.css' ! -path '*/node_modules/*' | xargs cat 2>/dev/null | wc -l | tr -d ' ')"
    @printf "  %-12s %s\n" "JS" "$(find frontend/src -name '*.js' ! -name '*.test.*' ! -path '*/node_modules/*' | xargs cat 2>/dev/null | wc -l | tr -d ' ')"
    @printf "  %-12s %s\n" "HTML" "$(find frontend -maxdepth 1 -name '*.html' | xargs cat 2>/dev/null | wc -l | tr -d ' ')"
    @printf "  %-12s %s\n" "JSON config" "$(cat frontend/package.json frontend/vite.config.js 2>/dev/null | wc -l | tr -d ' ')"
    @echo ""
    @printf "\033[0;34m=== TESTS ===\033[0m\n"
    @printf "  %-12s %s\n" "*.test.jsx" "$(find frontend/src -name '*.test.jsx' ! -path '*/node_modules/*' 2>/dev/null | xargs cat 2>/dev/null | wc -l | tr -d ' ')"
    @printf "  %-12s %s\n" "*.test.js" "$(find frontend/src -name '*.test.js' ! -path '*/node_modules/*' 2>/dev/null | xargs cat 2>/dev/null | wc -l | tr -d ' ')"
    @echo ""
    @printf "\033[0;34m=== DOCS ===\033[0m\n"
    @printf "  %-12s %s\n" "Markdown" "$(find . -name '*.md' ! -path '*/node_modules/*' ! -path '*/.claude/*' | xargs cat 2>/dev/null | wc -l | tr -d ' ')"
    @echo ""
    @printf "\033[0;34m=== TOTAL ===\033[0m\n"
    @printf "  %-12s %s lines\n" "Source" "$(find frontend/src \( -name '*.jsx' -o -name '*.css' -o -name '*.js' \) ! -path '*/node_modules/*' | xargs cat 2>/dev/null | wc -l | tr -d ' ')"
    @echo ""
