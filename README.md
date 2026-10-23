# REA Harness Hub

Static Netlify-ready control plane for sharing artifacts and configuring REA/Ghidra analysis harnesses.

## What works now

- Add an artifact by upload or URL.
- Choose analysis target: REA, Ghidra, Android/JADX, browser, or custom.
- Configure a harness and analysis steps.
- Generate a shareable link containing the harness configuration.
- Run a local demo execution that produces an auditable log.
- Export/import harness JSON.

## Production connection

The browser UI intentionally does not execute native REA, Ghidra, JADX, ADB, or APK tooling. Connect the `POST /api/runs` adapter in `dist/app.js` to a server-side worker, Netlify Function, or queue service that runs those tools in an isolated environment. Keep uploads in object storage and never execute untrusted binaries in the Netlify runtime.

## Local preview

Open `dist/index.html` directly, or run any static server from this directory.
