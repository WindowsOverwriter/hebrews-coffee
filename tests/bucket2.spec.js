import { test, expect } from '@playwright/test';

const OUT = process.env.SHOT_DIR || 'screenshots/bucket2';

const MOBILE = { width: 390, height: 844 };
const DESKTOP = { width: 1440, height: 900 };

async function goto(page, hash, { waitForSelector, wait = 500 } = {}) {
  await page.goto('/' + hash);
  await page.waitForLoadState('networkidle');
  if (waitForSelector) await page.locator(waitForSelector).first().waitFor();
  await page.waitForTimeout(wait);
}

test.describe.configure({ mode: 'serial' });

test('S4 mobile — orders open (baseline)', async ({ page }) => {
  await page.setViewportSize(MOBILE);
  await goto(page, '#/order', { waitForSelector: '.drink-grid' });
  await page.screenshot({ path: `${OUT}/S4-mobile-open.png`, fullPage: true });
});

test('S4 mobile — orders paused banner', async ({ page }) => {
  await page.setViewportSize(MOBILE);
  await page.route('**/api/menu', async (route) => {
    const res = await route.fetch();
    const body = await res.json();
    body.orders_accepting = false;
    await route.fulfill({ response: res, json: body });
  });
  await goto(page, '#/order', { waitForSelector: '.orders-closed-banner' });
  await page.screenshot({ path: `${OUT}/S4-mobile-paused.png`, fullPage: true });
});

test('S4 mobile — cart panel with paused submit', async ({ page }) => {
  await page.setViewportSize(MOBILE);
  await page.route('**/api/menu', async (route) => {
    const res = await route.fetch();
    const body = await res.json();
    body.orders_accepting = false;
    await route.fulfill({ response: res, json: body });
  });
  await goto(page, '#/order');
  await page.locator('.drink-grid button').first().click();
  await page.waitForTimeout(300);
  await page.locator('.add-to-cart-btn').click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/S4-mobile-cart-paused.png`, fullPage: true });
});

test('24 — ratio_summary shows under drink name', async ({ page }) => {
  await page.setViewportSize(MOBILE);
  await goto(page, '#/order', { waitForSelector: '.drink-grid' });
  // Click Cappuccino — longest ratio_summary to prove it renders in header.
  await page.getByText('Cappuccino', { exact: true }).click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/24-ratio-summary.png`, fullPage: true });
});

test('21 — CylinderPicker long syrup label ellipsizes', async ({ page }) => {
  await page.setViewportSize(MOBILE);
  await goto(page, '#/order', { waitForSelector: '.drink-grid' });
  await page.getByText('Cold Brew', { exact: true }).click();
  await page.waitForTimeout(400);
  // Cold Brew shows syrup only. Focus the syrup picker and press ArrowRight
  // until we land on the long label "Sugar-Free Vanilla".
  const picker = page.locator('.cylinder-picker').first();
  await picker.focus();
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(120);
    const centerText = (await page.locator('.pos-center').textContent()) || '';
    if (centerText.trim().startsWith('Sugar-Free')) break;
  }
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${OUT}/21-cylinder-long-label.png`, fullPage: true });
});

test('M23 — textarea focus ring (customize screen)', async ({ page }) => {
  await page.setViewportSize(MOBILE);
  await goto(page, '#/order', { waitForSelector: '.drink-grid' });
  await page.getByText('Latte', { exact: true }).click();
  await page.waitForTimeout(300);
  await page.locator('#special-instructions').focus();
  await page.waitForTimeout(150);
  await page.screenshot({ path: `${OUT}/M23-textarea-focus.png`, fullPage: true });
});

test('M23 — summary panel input focus ring', async ({ page }) => {
  await page.setViewportSize(MOBILE);
  await goto(page, '#/order', { waitForSelector: '.drink-grid' });
  await page.getByText('Latte', { exact: true }).click();
  await page.waitForTimeout(300);
  await page.locator('.add-to-cart-btn').click();
  await page.waitForTimeout(400);
  await page.locator('#customer-name').focus();
  await page.waitForTimeout(150);
  await page.screenshot({ path: `${OUT}/M23-summary-input-focus.png`, fullPage: true });
});

test('S8 — global focus ring on nav link (Tab from top)', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await goto(page, '#/', { waitForSelector: '.hero' });
  await page.keyboard.press('Tab'); // skip link
  await page.keyboard.press('Tab'); // brand
  await page.keyboard.press('Tab'); // first nav link
  await page.waitForTimeout(150);
  await page.screenshot({ path: `${OUT}/S8-focus-nav.png`, fullPage: false });
});

test('S8 — global focus ring on primary CTA', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await goto(page, '#/', { waitForSelector: '.cta-primary' });
  await page.locator('.cta-primary').first().focus();
  await page.waitForTimeout(150);
  await page.screenshot({ path: `${OUT}/S8-focus-cta.png`, fullPage: false });
});

test('M12 — locations loading skeleton', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await page.route('**/api/locations', async (route) => {
    await new Promise((r) => setTimeout(r, 4000));
    await route.fulfill({ status: 200, json: { locations: [] } });
  });
  await page.goto('/#/');
  // Capture during the pending fetch — don't wait for networkidle.
  await page.locator('.locations-loading').waitFor();
  await page.waitForTimeout(400);
  await page.locator('section.locations').scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${OUT}/M12-skeleton.png`, fullPage: false });
});

test('M30 + S7 — admin queue view (Received button, status badges)', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await page.goto('/#/admin');
  await page.locator('#admin-password').fill('admin');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL('**/#/admin/dashboard');
  await page.waitForTimeout(600);
  // Queue tab is default. Screenshot shows the "Received" primary button (M30).
  await page.screenshot({ path: `${OUT}/M30-queue-received-btn.png`, fullPage: true });
  // Switch to All Orders — captures status badges (S7).
  await page.getByRole('button', { name: 'All Orders' }).click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/S7-status-badges.png`, fullPage: true });
});
