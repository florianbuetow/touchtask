# Tauri Setup Guide

This guide covers setting up Tauri for TouchTask desktop app development and building.

## Prerequisites

Before setting up Tauri, ensure you have the following installed:

### Required for All Platforms

1. **Node.js 18+ and npm**
   - Download from [nodejs.org](https://nodejs.org/)
   - Verify: `node --version` and `npm --version`

2. **Rust Toolchain**
   - Install via [rustup](https://rustup.rs/):

     ```bash
     curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
     ```

   - Restart your terminal after installation
   - Verify: `rustc --version`

### Platform-Specific Requirements

#### Windows

1. **Microsoft C++ Build Tools**
   - Download from [Visual Studio Downloads](https://visualstudio.microsoft.com/downloads/)
   - Select "Desktop development with C++" workload
   - Or install the standalone [Build Tools](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022)

#### macOS

1. **Xcode Command Line Tools**

   ```bash
   xcode-select --install
   ```

   - If prompted, click "Install" in the dialog

#### Linux

Install required system dependencies:

**Debian/Ubuntu:**

For Ubuntu 22.04 and earlier:

```bash
sudo apt update
sudo apt install libwebkit2gtk-4.0-dev \
    build-essential \
    curl \
    wget \
    libssl-dev \
    libgtk-3-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev
```

For Ubuntu 24.04 (Noble) and later:

```bash
sudo apt update
sudo apt install libwebkit2gtk-4.1-dev \
    build-essential \
    curl \
    wget \
    libssl-dev \
    libgtk-3-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev
```

**Note:** Ubuntu 24.04 uses WebKitGTK 4.1 instead of 4.0. Tauri 2.0 supports both versions.

**Fedora:**

```bash
sudo dnf install webkit2gtk4.0-devel.x86_64 \
    openssl-devel \
    curl \
    wget \
    libappindicator \
    librsvg2-devel
```

**Arch Linux:**

```bash
sudo pacman -S webkit2gtk \
    base-devel \
    curl \
    wget \
    openssl \
    appmenu-gtk-module \
    gtk3 \
    libappindicator-gtk3 \
    librsvg \
    libvips
```

## Initial Setup

### 0. Install Just (Optional)

The project includes a `justfile` for convenient command shortcuts. `just` is completely optional - all commands work directly with npm. To install `just`:

**Via snap (Linux):**
```bash
sudo snap install just --classic
```

**Via cargo (if Rust is installed):**
```bash
cargo install just
```

**Note:** If you don't install `just`, you can use all commands directly with npm from the `frontend` directory (see commands below).

### 1. Install Dependencies

```bash
cd frontend
npm install
```

This installs:

- `@tauri-apps/cli` - Tauri command-line interface
- `@tauri-apps/api` - Tauri JavaScript API

### 2. Initialize Tauri

Run the Tauri initialization command:

```bash
# Using just (if installed):
just tauri-init

# Or directly (handles CI environment variable automatically):
cd frontend && unset CI && npx tauri init --app-name TouchTask --window-title TouchTask --frontend-dist ../../dist --dev-url http://localhost:8000 --before-dev-command "npm run dev" --before-build-command "npm run build"
```

**Note:**

- The `just` command is optional - all commands work directly with npm/npx
- If Tauri is already initialized (you see a `frontend/src-tauri/` directory), you can skip this step

**Note:** If you encounter an error about `--ci` flag (e.g., `error: invalid value '1' for '--ci'`), it's because the `CI` environment variable is set. The `just tauri-init` command handles this automatically. If running manually and encountering this issue, use:

```bash
cd frontend && unset CI && npx tauri init --app-name TouchTask --window-title TouchTask --frontend-dist ../../dist --dev-url http://localhost:8000 --before-dev-command "npm run dev" --before-build-command "npm run build"
```

If running interactively, you'll be prompted with several questions:

1. **App name:** `TouchTask`
2. **Window title:** `TouchTask`
3. **Web assets location:** `../../dist`
   - This is relative to `frontend/src-tauri/tauri.conf.json`
   - Since `dist/` is at the project root, we go up two levels (`../../`)
4. **Dev server URL:** `http://localhost:8000`
5. **Frontend dev command:** `npm run dev`
6. **Frontend build command:** `npm run build`

This creates the `frontend/src-tauri/` directory with:

- `Cargo.toml` - Rust dependencies configuration
- `tauri.conf.json` - Tauri application configuration
- `src/main.rs` - Rust entry point

## Configuration Files

### tauri.conf.json

The main Tauri configuration file is located at `frontend/src-tauri/tauri.conf.json`. Key sections:

- **`app`**: Application metadata (name, version, identifier)
- **`build`**: Build configuration (frontend dist path, dev server URL)
- **`bundle`**: Packaging settings (targets, icons, resources)
- **`windows`**: Window configuration (size, title, decorations)

**Important:** The `identifier` field must be changed from the default `com.tauri.dev` to a unique bundle identifier before building. Use reverse domain notation (e.g., `com.touchtask.app` or `io.yourname.touchtask`). This identifier must be unique across all applications.

### Customizing the Window

Edit `frontend/src-tauri/tauri.conf.json` to customize:

```json
{
  "windows": [
    {
      "title": "TouchTask",
      "width": 1200,
      "height": 800,
      "resizable": true,
      "fullscreen": false,
      "decorations": true
    }
  ]
}
```

## Development Workflow

### Running in Development Mode

Start Tauri with hot-reload:

```bash
# Using just (run from project root):
cd ~/touchtask
just tauri-dev

# Or directly with npm:
cd frontend && npm run tauri:dev
```

**Note:** The `just` command is optional. All commands can be run directly with npm from the `frontend` directory. **Important:** Always run `just` commands from the project root directory (`~/touchtask`), not from the `frontend` subdirectory.

This will:

1. Start the Vite dev server on `http://localhost:8000`
2. Launch the Tauri window
3. Enable hot-reload for both frontend and Rust code

### Building for Production

Build the desktop application:

```bash
# Using just (run from project root):
cd ~/touchtask
just tauri-build

# Or directly with npm:
cd frontend && npm run tauri:build
```

**Note:** The build script is configured with `--bundles deb,rpm` to exclude AppImage (which has known issues with linuxdeploy). This ensures platform-independent builds that complete successfully. On Windows and macOS, the appropriate formats (`.msi`, `.dmg`, `.app`) are built automatically.

**Note:** Always run `just` commands from the project root. If you're in the `frontend` directory, either `cd ..` first or use the npm commands directly.

**First build note:** The first build can take 10-20 minutes as it compiles all Rust dependencies. Subsequent builds are much faster.

### Build Outputs

After building, find your application in:

- **Debug build:** `frontend/src-tauri/target/debug/`
- **Release build:** `frontend/src-tauri/target/release/`

Platform-specific outputs:

- **Windows:** `.exe` file and `.msi` installer
- **macOS:** `.app` bundle and `.dmg` disk image
- **Linux:** Binary executable, `.deb` package, and `.rpm` package (AppImage excluded by default)

## Platform-Specific Notes

### Windows

- The first build may take longer due to Windows Defender scanning
- You may need to allow the app through Windows Firewall
- Code signing is optional but recommended for distribution

### macOS

- First build may require accepting Xcode license: `sudo xcodebuild -license accept`
- For distribution, you'll need an Apple Developer account for code signing
- Notarization is required for distribution outside the App Store

### Linux

- Ensure all system dependencies are installed (see Prerequisites)
- The build creates `.deb` and `.rpm` packages (AppImage is excluded by default)
- `.deb` packages are for Debian/Ubuntu systems
- `.rpm` packages are for Red Hat/Fedora systems
- The binary can also be run directly without installation

## Troubleshooting

### Rust Installation Issues

**"rustc: command not found" or "cargo: command not found"**

- Ensure rustup is installed and in your PATH
- Restart your terminal after installation
- Source the Rust environment: `source ~/.cargo/env`
- Or add to your shell profile (`.bashrc` or `.zshrc`): `export PATH="$HOME/.cargo/bin:$PATH"`
- Verify: `cargo --version` and `rustc --version`
- The `just tauri-build` and `just tauri-dev` commands automatically set the PATH

**"linker 'cc' not found"**

- Install build tools for your platform (see Prerequisites)

### Tauri Initialization Issues

**"tauri init" fails with CI environment variable error:**

If you see an error like:

```
error: invalid value '1' for '--ci'
  [possible values: true, false]
```

This happens when the `CI` environment variable is set (common in CI/CD environments or some development setups). Solutions:

1. **Use the justfile command (recommended):**

   ```bash
   just tauri-init
   ```

   This automatically handles the CI variable.

2. **Unset CI manually:**

   ```bash
   cd frontend && unset CI && npx tauri init
   ```

3. **Use non-interactive mode with explicit flags:**

   ```bash
   cd frontend && unset CI && npx tauri init \
     --app-name TouchTask \
     --window-title TouchTask \
     --frontend-dist ../../dist \
     --dev-url http://localhost:8000 \
     --before-dev-command "npm run dev" \
     --before-build-command "npm run build"
   ```

### Build Errors

**"Failed to compile"**

- Check that all prerequisites are installed
- Try cleaning the build: `cd frontend/src-tauri && cargo clean`
- Rebuild: `npm run tauri:build`

**"Web assets not found"**

- Ensure you've run `npm run build` first
- Check that `frontend/src-tauri/tauri.conf.json` has the correct `frontendDist` path (`../../dist`)

**Build Configuration:**

The build is configured to exclude AppImage (which has known issues with linuxdeploy) to ensure platform-independent builds that complete successfully. The build creates:

- **Linux:** `.deb` and `.rpm` packages (AppImage excluded)
- **Windows:** `.msi` installer (built automatically on Windows)
- **macOS:** `.dmg` and `.app` bundle (built automatically on macOS)

The binary executable is always created: `frontend/src-tauri/target/release/app`

You can:
- Run the binary directly: `./frontend/src-tauri/target/release/app`
- Install the `.deb` package: `sudo dpkg -i frontend/src-tauri/target/release/bundle/deb/TouchTask_*.deb`
- Install the `.rpm` package: `sudo rpm -i frontend/src-tauri/target/release/bundle/rpm/TouchTask-*.rpm`

**"You must change the bundle identifier"**

If you see an error like:
```
You must change the bundle identifier in `{bundle_identifier_source} identifier`. 
The default value `com.tauri.dev` is not allowed as it must be unique across applications.
```

This means the bundle identifier in `tauri.conf.json` is still set to the default value. Fix it by:

1. Open `frontend/src-tauri/tauri.conf.json`
2. Change the `identifier` field from `com.tauri.dev` to a unique identifier
3. Use reverse domain notation, for example:
   - `com.touchtask` (recommended - avoid `.app` suffix on macOS)
   - `io.yourname.touchtask`
   - `com.yourcompany.touchtask`

**Important:** Avoid ending the identifier with `.app` on macOS as it conflicts with the application bundle extension. The identifier must be unique across all applications on the system.

### Runtime Issues

**Window shows white screen**

- Check browser console in Tauri dev tools (right-click → Inspect)
- Verify Vite dev server is running on port 8000
- Check `tauri.conf.json` dev server URL matches

**App crashes on startup**

- Check Rust console output for errors
- Verify all system dependencies are installed
- Try rebuilding: `npm run tauri:build`

## Distribution

### Creating Installers

Tauri can create platform-specific installers:

- **Windows:** `.msi` installer (built automatically on Windows)
- **macOS:** `.dmg` disk image (built automatically on macOS)
- **Linux:** `.deb` and `.rpm` packages (AppImage excluded by default via `--bundles deb,rpm` flag)

Configure in `frontend/src-tauri/tauri.conf.json` under the `bundle` section.

### Code Signing

For distribution, code signing is recommended:

- **Windows:** Use a code signing certificate
- **macOS:** Requires Apple Developer account ($99/year)
- **Linux:** Optional, but GPG signing is recommended

See [Tauri's distribution guide](https://v2.tauri.app/develop/distribution/) for detailed instructions.

## Additional Resources

- [Tauri Documentation](https://v2.tauri.app/)
- [Tauri API Reference](https://v2.tauri.app/reference/javascript/api)
- [Tauri Configuration](https://v2.tauri.app/reference/config/)
- [Tauri Community](https://discord.gg/tauri)

## Next Steps

After setup, you can:

1. Customize the window appearance in `tauri.conf.json`
2. Add Tauri APIs to your React code (e.g., file system access, notifications)
3. Configure app icons and metadata
4. Set up auto-updater for distribution
5. Add platform-specific features

For more information, refer to the [main README](../README.md).
