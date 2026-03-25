# Justfile Rules

Follow these when editing the justfile:

1. Use `printf` (not `echo`) to print colors — some terminals won't render colors with `echo`.
2. Always add an empty `@echo ""` line before and after each target's command block.
3. Always add new targets to the help section and update it when targets are added, modified or removed.
4. Target ordering in help (and in the file) matters:
   - Setup & lifecycle targets first (init, clean, help)
   - Start/stop targets next
   - Build & deploy targets next
   - Checks, linting, and tests last (ordered fastest to slowest)
   - Group related targets together and separate groups with an empty `@echo ""` line in the help output.
5. Composite targets (e.g. ci) that call multiple sub-targets must fail fast: exit 1 on the first error.
6. Every target must end with a clear short status message:
   - On success: green (`\033[32m`) message confirming completion.
   - On failure: red (`\033[31m`) message indicating what failed, then exit 1.
