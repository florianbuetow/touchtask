# Default target
default: help

# Show available targets
help:
    @echo ">>> Starting: help"
    @echo "Available targets:"
    @echo "  init    - Initialize project (install npm dependencies)"
    @echo "  run     - Run the React dev server"
    @echo "  build   - Build the React frontend for production"
    @echo "  preview - Preview the production build"
    @echo "  clean   - Remove node_modules and build artifacts"
    @echo "  help    - Show this help message"
    @echo "<<< Finished: help"

# Initialize project dependencies
init:
    @echo ">>> Starting: init"
    cd frontend && npm install
    @echo "<<< Finished: init"

# Run the React dev server
run:
    @echo ">>> Starting: run"
    @(sleep 5 && open http://localhost:8000) &
    cd frontend && npm run dev
    @echo "<<< Finished: run"

# Build the React frontend for production
build:
    @echo ">>> Starting: build"
    cd frontend && npm run build
    @echo "<<< Finished: build"

# Preview the production build
preview:
    @echo ">>> Starting: preview"
    @(sleep 3 && open http://localhost:8000) &
    cd frontend && npm run preview
    @echo "<<< Finished: preview"

# Remove node_modules and build artifacts
clean:
    @echo ">>> Starting: clean"
    rm -rf frontend/node_modules dist
    @echo "<<< Finished: clean"
