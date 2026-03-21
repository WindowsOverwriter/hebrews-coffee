import { test } from '@playwright/test';

const routes = [
  { name: 'landing', hash: '#/' },
  { name: 'order', hash: '#/order' },
  { name: 'check', hash: '#/check' },
  { name: 'admin', hash: '#/admin' },
];

const viewports = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1920, height: 1080 },
];

for (const route of routes) {
  for (const vp of viewports) {
    test(`${route.name} — ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(`/${route.hash}`);
      await page.waitForLoadState('networkidle');
      await page.screenshot({
        path: `screenshots/${route.name}-${vp.name}.png`,
        fullPage: true,
      });
    });
  }
}
