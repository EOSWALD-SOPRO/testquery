// Capture key states of the app after redesign.
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';

const URL = process.env.APP_URL || 'http://localhost:5181/';
const OUT = 'd:/Git Hub/testquery/.claude-shots';
mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
  defaultViewport: { width: 1600, height: 1000, deviceScaleFactor: 1 },
});
const page = await browser.newPage();
const wait = ms => new Promise(r => setTimeout(r, ms));

const shot = async (name) => {
  await wait(300);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });
  console.log('captured', name);
};

await page.goto(URL, { waitUntil: 'networkidle0' });
await wait(800);

// --- 1. Pick MDDBCO02 entry then open WC modal (the redesign target)
await page.evaluate(() => {
  const items = [...document.querySelectorAll('.qitem-name')];
  items.find(i => i.textContent.trim() === '7-MDDBCO02-COULISSE')?.closest('button')?.click();
});
await wait(400);
await page.evaluate(() => document.querySelector('.editor-tags .chip-wc')?.click());
await shot('10-wc-modal-simplified');

// Close modal
await page.evaluate(() => document.querySelector('.modal-backdrop')?.click());
await wait(200);

// --- 2. Pick simpler WC (L6IUCO01) and open modal
await page.evaluate(() => {
  const items = [...document.querySelectorAll('.qitem-name')];
  items.find(i => i.textContent.trim() === '23-L6IUCO01-JOINTFINI')?.closest('button')?.click();
});
await wait(400);
await page.evaluate(() => document.querySelector('.editor-tags .chip-wc')?.click());
await shot('11-wc-modal-l6iuco01');

// Close modal
await page.evaluate(() => document.querySelector('.modal-backdrop')?.click());
await wait(200);

// --- 3. Open Admin panel — default tab WorkCenters
await page.evaluate(() => document.querySelector('.sidebar-admin-link')?.click());
await wait(300);
await shot('12-admin-workcenters');

// --- 4. Switch to ProductionScreen tab
await page.evaluate(() => {
  const tabs = [...document.querySelectorAll('.admin-tab')];
  tabs.find(t => t.textContent.trim() === 'ProductionScreen')?.click();
});
await shot('13-admin-productionscreen');

// --- 5. Click a bit toggle to trigger the toast
await page.evaluate(() => {
  document.querySelectorAll('.bit-toggle')[2]?.click();
});
await shot('14-admin-toast');

// --- 6. AttributeModels tab
await page.evaluate(() => {
  const tabs = [...document.querySelectorAll('.admin-tab')];
  tabs.find(t => t.textContent.trim() === 'AttributeModels')?.click();
});
await shot('15-admin-attrmodels');

await browser.close();
console.log('done');
