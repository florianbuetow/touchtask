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
    @echo "  help    - Show this help message"
    @echo "<<< Finished: help"
    @echo ""

# Initialize project dependencies
init:
    @echo ""
    @echo ">>> Starting: init"
    cd frontend && npm install
    @echo "<<< Finished: init"
    @echo ""

# Run the React dev server
run:
    @echo ""
    @echo ">>> Starting: run"
    @(sleep 5 && open http://localhost:8000) &
    cd frontend && npm run dev
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
    @(sleep 3 && open http://localhost:8000) &
    cd frontend && npm run preview -- --outDir ../dist
    @echo "<<< Finished: preview"
    @echo ""

# Remove node_modules and build artifacts
clean:
    @echo ""
    @echo ">>> Starting: clean"
    rm -rf frontend/node_modules dist
    @echo "<<< Finished: clean"
    @echo ""
