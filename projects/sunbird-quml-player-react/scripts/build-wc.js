// Post-build packaging for the web component (Phase 8, spec §6.3.5 / §6.4).
//
// Written as ESM (package.json has "type": "module"); the spec's CommonJS
// `require(...)` form would fail under ESM. After `vite build` emits the IIFE
// bundle + single CSS file, this script:
//   1. Embeds the compiled player CSS into the bundle as a top-level
//      `BUNDLED_CSS` constant (so the web component injects it into shadow DOM
//      with no runtime fetch).
//   2. Copies the self-contained bundle + stylesheet into the package output.
//   3. Writes an example index.html.
//
// Output path: 'web-component/assets/quml-player' relative to this project (the
// literal spec path). This does NOT touch the repo-root Angular web-component
// package — see the deviation note in the Phase 8 report.

import fs from 'fs-extra';
import path from 'path';

const DIST = 'dist';
const DEST = 'web-component/assets/quml-player';
const BUNDLE = 'sunbird-quml-player.js';

const build = async () => {
  try {
    const bundlePath = path.join(DIST, BUNDLE);
    if (!fs.existsSync(bundlePath)) {
      throw new Error(`Missing ${bundlePath} — did 'vite build' run first?`);
    }

    // 1. Locate the single compiled stylesheet (cssCodeSplit:false → one .css).
    const cssFile = fs.readdirSync(DIST).find((f) => f.endsWith('.css'));
    let bundleJs = fs.readFileSync(bundlePath, 'utf-8');

    if (cssFile) {
      console.log(`[Build] Embedding ${cssFile} into the bundle...`);
      const css = fs.readFileSync(path.join(DIST, cssFile), 'utf-8');
      // Escape backticks and ${ so the CSS is a safe template-literal value.
      const safeCss = css.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
      const embedded = `var BUNDLED_CSS = \`${safeCss}\`;\n`;
      bundleJs = embedded + bundleJs;
      fs.writeFileSync(bundlePath, bundleJs);
    } else {
      console.warn('[Build] No CSS emitted; the bundle will ship without embedded styles.');
    }

    // 2. Copy the self-contained bundle (+ raw stylesheet for the ./styles export).
    console.log('[Build] Copying built files...');
    await fs.ensureDir(DEST);
    await fs.copy(bundlePath, path.join(DEST, BUNDLE));
    if (cssFile) {
      await fs.copy(path.join(DIST, cssFile), path.join(DEST, 'styles.css'));
    }

    // 3. Example HTML.
    console.log('[Build] Creating example HTML...');
    const exampleHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QuML Player Example</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <script src="sunbird-quml-player.js"></script>
  <sunbird-quml-player player-config='{"context":{"uid":"test"},"config":{"language":"en"},"data":{"sections":[]}}'></sunbird-quml-player>
</body>
</html>`;
    await fs.writeFile(path.join(DEST, 'index.html'), exampleHtml);

    console.log('[Build] ✅ Web component built successfully!');
    console.log(`[Build] Output: ${DEST}/`);
  } catch (error) {
    console.error('[Build] ❌ Error:', error);
    process.exit(1);
  }
};

build();
