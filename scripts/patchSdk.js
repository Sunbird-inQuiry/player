/**
 * Patches @project-sunbird/sunbird-player-sdk-v9 for Angular 19 compatibility.
 * Angular 19 defaults standalone to true for components without an explicit flag,
 * but the SDK's CoreModule still uses declarations[]. This adds standalone: false
 * to each affected component so the NgModule declaration works correctly.
 */
const fs = require('fs');
const path = require('path');

const SDK_BASE = path.join(__dirname, '../node_modules/@project-sunbird/sunbird-player-sdk-v9');
const COMPONENTS = [
  'DownloadPopupComponent',
  'StartPageComponent',
  'EndPageComponent',
  'SidebarComponent',
  'SideMenuIconComponent',
  'OfflineAlertComponent',
  'HeaderComponent',
  'NextNavigationComponent',
  'PreviousNavigationComponent',
  'ContenterrorComponent',
];

const ESM_FILES = {
  DownloadPopupComponent:    'esm2022/lib/core/components/download-popup/download-popup.component.mjs',
  StartPageComponent:        'esm2022/lib/core/components/start-page/start-page.component.mjs',
  EndPageComponent:          'esm2022/lib/core/components/end-page/end-page.component.mjs',
  SidebarComponent:          'esm2022/lib/core/components/sidebar/sidebar.component.mjs',
  SideMenuIconComponent:     'esm2022/lib/core/components/side-menu-icon/side-menu-icon.component.mjs',
  OfflineAlertComponent:     'esm2022/lib/core/offline-alert/offline-alert.component.mjs',
  HeaderComponent:           'esm2022/lib/player-utils/components/header/header.component.mjs',
  NextNavigationComponent:   'esm2022/lib/player-utils/components/next-navigation/next-navigation.component.mjs',
  PreviousNavigationComponent: 'esm2022/lib/player-utils/components/previous-navigation/previous-navigation.component.mjs',
  ContenterrorComponent:     'esm2022/lib/player-utils/components/contenterror/contenterror.component.mjs',
};

function patch(filePath, component) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  const before = `ɵɵdefineComponent({ type: ${component},`;
  const after   = `ɵɵdefineComponent({ type: ${component}, standalone: false,`;
  if (!content.includes(before)) return;
  fs.writeFileSync(filePath, content.replaceAll(before, after));
  console.log('  patched', component);
}

console.log('Patching sunbird-player-sdk-v9 for Angular 19...');

// Patch fesm2022 bundle
const fesmPath = path.join(SDK_BASE, 'fesm2022/project-sunbird-sunbird-player-sdk-v9.mjs');
if (fs.existsSync(fesmPath)) {
  let content = fs.readFileSync(fesmPath, 'utf8');
  let changed = false;
  for (const c of COMPONENTS) {
    const before = `ɵɵdefineComponent({ type: ${c},`;
    const after   = `ɵɵdefineComponent({ type: ${c}, standalone: false,`;
    if (content.includes(before)) { content = content.replaceAll(before, after); changed = true; }
  }
  if (changed) fs.writeFileSync(fesmPath, content);
  console.log('  patched fesm2022 bundle');
}

// Patch individual esm2022 files
for (const [component, relPath] of Object.entries(ESM_FILES)) {
  patch(path.join(SDK_BASE, relPath), component);
}

console.log('Done.');
