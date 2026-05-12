// Comprehensive frontend smoke tests via puppeteer-core.
// Drives every mode + key interactions and asserts expected DOM state.
// Also captures all console errors throughout the run.

import puppeteer from 'puppeteer-core';

const URL = process.env.APP_URL || 'http://localhost:5183/';

let passes = 0, fails = 0;
const failures = [];
const consoleErrors = [];

const ok    = (...a) => console.log('  \x1b[32m✓\x1b[0m', ...a);
const fail  = (msg)  => { console.log('  \x1b[31m✗\x1b[0m', msg); failures.push(msg); };
const test  = (name, cond, detail = '') => {
  if (cond) { ok(name); passes++; }
  else      { fail(`${name}${detail ? ' — ' + detail : ''}`); fails++; }
};
const section = (s) => console.log(`\n\x1b[1m── ${s} ──\x1b[0m`);
const wait = (ms) => new Promise(r => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
  defaultViewport: { width: 1600, height: 1000 },
});
const page = await browser.newPage();

page.on('console', msg => {
  const text = msg.text();
  // Filter generic browser-injected 404 logs — the response listener below has the URL.
  if (msg.type() === 'error' && /Failed to load resource/.test(text)) return;
  if (msg.type() === 'error') consoleErrors.push('console.error: ' + text);
  if (msg.type() === 'warning' && /react|warning|deprecated/i.test(text)) {
    consoleErrors.push('console.warn: ' + text);
  }
});
page.on('pageerror',  err => consoleErrors.push('PAGE ERROR: ' + err.message));
page.on('response', async resp => {
  if (resp.status() >= 400 && !resp.url().includes('favicon')) {
    consoleErrors.push(`HTTP ${resp.status()} ${resp.url()}`);
  }
});

const click = async (selector, opts = {}) => {
  const ok = await page.evaluate((sel, opts) => {
    const els = [...document.querySelectorAll(sel)];
    const el  = opts.text ? els.find(e => e.textContent.trim() === opts.text)
              : opts.contains ? els.find(e => e.textContent.includes(opts.contains))
              : els[opts.nth ?? 0];
    if (!el) return false;
    (el.tagName === 'BUTTON' ? el : el.closest('button') || el).click();
    return true;
  }, selector, opts);
  await wait(opts.wait ?? 250);
  return ok;
};
const $$ = (sel) => page.$$eval(sel, els => els.length);
const $text = async (sel) => (await page.$eval(sel, e => e.textContent)).trim();
const exists = async (sel) => !!(await page.$(sel));
const fillInput = async (sel, value) => {
  await page.evaluate((sel, value) => {
    const input = document.querySelector(sel);
    if (!input) return;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }, sel, value);
  await wait(200);
};

await page.goto(URL, { waitUntil: 'networkidle0' });
await wait(1500);

// =========================================================
section('Boot / page-level');
test('HTTP 200 + content',      (await page.title()).length > 0);
test('Body has #root rendered', await page.$eval('#root', el => el.children.length > 0));
test('CSS loaded (panel bg)',   await page.evaluate(() => getComputedStyle(document.body).backgroundColor !== 'rgba(0, 0, 0, 0)'));

// =========================================================
section('Activity bar');
test('4 mode icons present',     await $$('.activity-icon') === 4);
test('Editor icon active by default', await page.$eval('.activity-icon.is-on', el => el.textContent.trim()) === 'Éditeur');

// =========================================================
section('Editor mode — sidebar');
test('Sidebar visible',          await exists('.sidebar'));
test('Source tabs (2)',          await $$('.src-tab') === 2);
test('Group-by toggle (2 opts)', await $$('.seg-mini button') === 2);
test('Search input present',     await exists('.sidebar-search input'));
test('Query items rendered',     await $$('.qitem') > 5);

// Source tab counts (PS=21, CU=6 from mock)
const psCount = await page.$eval('.src-tab', el => el.querySelector('.src-tab-count').textContent);
test('PS source count = 21',     psCount === '21', `got ${psCount}`);

// =========================================================
section('Editor mode — editor');
test('CodeMirror mounted',       await exists('.cm-editor'));
test('Editor head shows source', await exists('.editor-source-production_screen'));
test('Editor tags row present',  await exists('.editor-tags'));
test('Request chip visible',     await exists('.chip-req'));
test('AttributeModel chip visible', await exists('.chip-am'));
test('WorkCenter chip clickable',   await exists('.editor-tags .chip-wc'));

// =========================================================
section('Editor mode — interactions');

// Switch to CU tab
await click('.src-tab', { contains: 'Requêtes CU' });
test('CU tab activates',          (await page.$eval('.src-tab.is-on', el => el.textContent)).includes('Requêtes CU'));
test('Group-by row hidden in CU (only 1 option)', await $$('.sidebar-groupby') === 0);

// Click first CU entry
await click('.qitem');
await wait(400);
test('CU entry opens in editor', await exists('.editor-source-cu_parameter'));
test('No Request chip in CU mode', !(await exists('.chip-req')));
test('No AttributeModel chip in CU mode', !(await exists('.chip-am')));

// Back to PS tab
await click('.src-tab', { contains: 'Écran de prod' });
await wait(200);

// Group-by AttributeModel
await click('.seg-mini button', { text: 'AttributeModel' });
const groupHeads = await page.$$eval('.grp-head span:nth-child(3)', els => els.map(e => e.textContent.trim()));
test('Group-by AttributeModel: groups exist', groupHeads.length > 5, `groups: ${groupHeads.length}`);
test('Group-by AttributeModel: contains COULISSE', groupHeads.includes('COULISSE'));
await click('.seg-mini button', { text: 'Établissement' });

// Search
await fillInput('.sidebar-search input', 'POC');
test('Search "POC" filters list', await $$('.qitem') < 5);
await fillInput('.sidebar-search input', '');

// =========================================================
section('Editor mode — WC modal');
await click('.qitem');  // open first PS query
await wait(300);
await click('.editor-tags .chip-wc');
test('WC modal opens',            await exists('.modal-wc'));
test('WC modal: summary line',    await exists('.wc-summary'));
test('WC modal: PS table rendered', await exists('.wc-table tbody tr'));
test('WC modal: legend visible if shared SQL', await exists('.wc-legend') || (await $$('.wc-trow')) <= 1);
// Close modal
await click('.modal-backdrop', { nth: 0 });
await wait(200);
test('WC modal closes',           !(await exists('.modal-wc')));

// =========================================================
section('Postes mode');
await click('.activity-icon', { text: 'Postes' });
test('Activity icon active = Postes', (await page.$eval('.activity-icon.is-on', el => el.textContent.trim())) === 'Postes');
test('WC browser visible',         await exists('.wc-browser'));
test('Queries sidebar hidden',     !(await exists('.sidebar')));
test('WC list items rendered',     await $$('.wc-browser-item') >= 15);
test('WC detail card rendered',    await exists('.wc-summary'));

// Click MDDBCO02 (case with shared SQL)
await click('.wc-browser-item-name', { text: 'MDDBCO02' });
test('MDDBCO02 detail opens',      (await $text('.modal-title')) === 'MDDBCO02');
test('Shared SQL detected',        await exists('.wc-summary-shared'));

// Search WC
await fillInput('.wc-browser .sidebar-search input', 'L6IBAD');
test('WC search filters',          await $$('.wc-browser-item') >= 1 && await $$('.wc-browser-item') < 5);
await fillInput('.wc-browser .sidebar-search input', '');

// =========================================================
section('PRs mode');
await click('.activity-icon', { text: 'PRs' });
test('PR view visible',            await exists('.pr-view'));
test('3 filter tabs',              await $$('.pr-view .src-tab') === 3);
test('PR list items rendered',     await $$('.pr-list-item') >= 1);
test('PR detail rendered',         await exists('.pr-state-badge'));
test('Checks list visible',        await $$('.pr-check') >= 1);

// Click PR with checks-running state
await click('.pr-list-num', { text: '#246' });
test('PR #246 selected',           (await $text('.modal-title')).includes('jointfini') || (await $text('.modal-title')).includes('JOINTFINI'));
test('Pulsing check (running)',    await exists('.pr-check-running'));

// Filter to "Mergées"
await click('.pr-view .src-tab', { contains: 'Mergées' });
test('Merged filter shows ≥1 PR',  await $$('.pr-list-item') >= 1);

// =========================================================
section('Admin mode');
await click('.activity-icon', { text: 'Admin' });
test('Admin view visible',         await exists('.admin-view'));
test('3 admin tabs',               await $$('.admin-tab') === 3);
test('WorkCenters table rendered', await $$('.admin-table tbody tr') >= 15);

// Switch to ProductionScreen tab
await click('.admin-tab', { text: 'ProductionScreen' });
test('PS table loaded',            await $$('.admin-table tbody tr') >= 15);
test('3 bool columns per row',     await $$('.admin-table tbody tr:first-child .bit-toggle') === 3);

// Trigger toast on toggle
await click('.bit-toggle');
test('Toast appears on toggle',    await exists('.admin-toast'));
const toastText = await $text('.admin-toast');
test('Toast mentions backend',     toastText.includes('backend'));

// Switch to AttributeModels
await click('.admin-tab', { text: 'AttributeModels' });
test('AttrModels table rendered',  await $$('.admin-table tbody tr') >= 10);

// =========================================================
section('Cross-mode persistence');
await click('.activity-icon', { text: 'Éditeur' });
test('Back to editor mode',        await exists('.cm-editor'));
test('Active query preserved (tabs)', await $$('.tab') >= 1 || await $$('.editor-source') >= 1);

// =========================================================
section('Console / network');
test('No console errors',          consoleErrors.length === 0,
  consoleErrors.length ? `\n      ${consoleErrors.slice(0, 5).join('\n      ')}` : '');

await browser.close();

console.log(`\n\x1b[1m===  ${passes} passed · ${fails} failed  ===\x1b[0m`);
if (failures.length) {
  console.log('\nFailed checks:');
  failures.forEach(f => console.log('  - ' + f));
}
process.exit(fails > 0 ? 1 : 0);
