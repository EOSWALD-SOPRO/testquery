import puppeteer from 'puppeteer-core';
const URL = process.env.APP_URL || 'http://localhost:5183/';
const OUT = 'd:/Git Hub/testquery/.claude-shots';

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
  defaultViewport: { width: 1920, height: 1200, deviceScaleFactor: 2 },
});
const page = await browser.newPage();
const wait = ms => new Promise(r => setTimeout(r, ms));

await page.goto(URL, { waitUntil: 'networkidle0' });
await wait(1000);

await page.screenshot({ path: `${OUT}/hd-10-editor.png` });

await page.evaluate(() => {
  const icons = [...document.querySelectorAll('.activity-icon')];
  icons.find(i => i.textContent.trim() === 'Postes')?.click();
});
await wait(500);
await page.screenshot({ path: `${OUT}/hd-11-postes.png` });

// Click on MDDBCO02 in the WC list
await page.evaluate(() => {
  const items = [...document.querySelectorAll('.wc-browser-item-name')];
  items.find(i => i.textContent.trim() === 'MDDBCO02')?.closest('button')?.click();
});
await wait(400);
await page.screenshot({ path: `${OUT}/hd-12-postes-mddbco.png` });

// Switch to PRs
await page.evaluate(() => {
  const icons = [...document.querySelectorAll('.activity-icon')];
  icons.find(i => i.textContent.trim() === 'PRs')?.click();
});
await wait(500);
await page.screenshot({ path: `${OUT}/hd-13-prs.png` });

// Click PR 246 (checks running)
await page.evaluate(() => {
  const items = [...document.querySelectorAll('.pr-list-num')];
  items.find(i => i.textContent.trim() === '#246')?.closest('button')?.click();
});
await wait(400);
await page.screenshot({ path: `${OUT}/hd-14-pr-246.png` });

// Switch to Admin
await page.evaluate(() => {
  const icons = [...document.querySelectorAll('.activity-icon')];
  icons.find(i => i.textContent.trim() === 'Admin')?.click();
});
await wait(400);
await page.screenshot({ path: `${OUT}/hd-15-admin.png` });

await browser.close();
console.log('done');
