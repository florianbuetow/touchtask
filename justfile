# Default target
default: help

# Show available targets
help:
    @echo ""
    @echo ">>> Starting: help"
    @echo "Available targets:"
    @echo "  init        - Initialize project (install npm dependencies)"
    @echo "  run         - Run the React dev server"
    @echo "  build       - Build the React frontend for production"
    @echo "  preview     - Preview the production build"
    @echo "  tauri-dev   - Run Tauri in development mode"
    @echo "  tauri-build - Build Tauri app for production"
    @echo "  tauri-init  - Initialize Tauri (one-time setup)"
    @echo "  clean       - Remove node_modules and build artifacts"
    @echo "  deploy      - Deploy dist to GitHub Pages"
    @echo "  help        - Show this help message"
    @echo "<<< Finished: help"
    @echo ""

# Initialize project dependencies
init:
    @echo ""
    @echo ">>> Starting: init"
    bash -c 'export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" && nvm use default >/dev/null 2>&1 || true; cd frontend && npm install'
    @echo "<<< Finished: init"
    @echo ""

# Run the React dev server
run:
    @echo ""
    @echo ">>> Starting: run"
    @(sleep 5 && open http://localhost:8000) &
    bash -c 'export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" && nvm use default >/dev/null 2>&1 || true; cd frontend && npm run dev'
    @echo "<<< Finished: run"
    @echo ""

# Build the React frontend for production
build:
    @echo ""
    @echo ">>> Starting: build"
    bash -c 'export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" && nvm use default >/dev/null 2>&1 || true; cd frontend && npm run build'
    @echo "<<< Finished: build"
    @echo ""

# Preview the production build
preview:
    @echo ""
    @echo ">>> Starting: preview"
    @(sleep 3 && open http://localhost:8000) &
    bash -c 'export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" && nvm use default >/dev/null 2>&1 || true; cd frontend && npm run preview -- --outDir ../dist'
    @echo "<<< Finished: preview"
    @echo ""

# Run Tauri in development mode
tauri-dev:
    @echo ""
    @echo ">>> Starting: tauri-dev"
    bash -c 'export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" && nvm use default >/dev/null 2>&1 || true; export PATH="$HOME/.cargo/bin:$PATH"; cd frontend && npm run tauri:dev'
    @echo "<<< Finished: tauri-dev"
    @echo ""

# Build Tauri app for production
tauri-build:
    @echo ""
    @echo ">>> Starting: tauri-build"
    bash -c 'export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" && nvm use default >/dev/null 2>&1 || true; export PATH="$HOME/.cargo/bin:$PATH"; cd frontend && npm run tauri:build'
    @echo "<<< Finished: tauri-build"
    @echo ""

# Initialize Tauri (one-time setup)
tauri-init:
    @echo ""
    @echo ">>> Starting: tauri-init"
    bash -c 'export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" && nvm use default >/dev/null 2>&1 || true; export PATH="$HOME/.cargo/bin:$PATH"; cd frontend && unset CI && npx tauri init --app-name TouchTask --window-title TouchTask --frontend-dist ../../dist --dev-url http://localhost:8000 --before-dev-command "npm run dev" --before-build-command "npm run build"'
    @echo "<<< Finished: tauri-init"
    @echo ""

# Remove node_modules and build artifacts
clean:
    @echo ""
    @echo ">>> Starting: clean"
    rm -rf frontend/node_modules dist frontend/src-tauri/target
    @echo "<<< Finished: clean"
    @echo ""

# Deploy dist to GitHub Pages
deploy:
    @echo ""
    @echo ">>> Starting: deploy"
    git subtree push --prefix dist origin gh-pages
    @echo "<<< Finished: deploy"
    @echo ""
