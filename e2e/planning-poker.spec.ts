import { test, expect, type Page } from '@playwright/test';

async function createRoom(page: Page, facilitatorName: string, roomName: string) {
  await page.goto('/');
  await page.fill('#name', facilitatorName);
  await page.fill('#roomName', roomName);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/room\//);
  return page.url().match(/\/room\/([^/]+)/)?.[1] ?? '';
}

async function joinRoom(page: Page, roomId: string, participantName: string) {
  await page.goto(`/room/${roomId}/join`);
  await page.waitForSelector('#name');
  await page.fill('#name', participantName);
  await page.click('button[type="submit"]');
  await page.waitForURL(`**/room/${roomId}`);
}

test.describe('Mighty Poker E2E', () => {
  test('page title is set correctly', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Mighty Poker/);
  });

  test('create room flow', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Mighty Poker');

    await page.fill('#name', 'Alice');
    await page.fill('#roomName', 'Sprint 42');
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/room\//);
    await expect(page.locator('h1')).toContainText('Sprint 42');
  });

  test('join flow — shows room name and error on invalid room', async ({ page }) => {
    await page.goto('/room/nonexistent-room-id/join');
    await page.waitForSelector('text=Room not found');
    await expect(page.locator('text=Room not found')).toBeVisible();
  });

  test('join flow — participant can join existing room', async ({ page, context }) => {
    const facilitatorPage = await context.newPage();
    const roomId = await createRoom(facilitatorPage, 'Alice', 'Sprint 1');

    const joinerPage = await context.newPage();
    await joinRoom(joinerPage, roomId, 'Bob');

    // Bob should see the room page
    await expect(joinerPage.locator('h1')).toContainText('Sprint 1');

    await facilitatorPage.close();
    await joinerPage.close();
  });

  test('full voting cycle', async ({ page, context }) => {
    // Create room as facilitator
    const facilitatorPage = page;
    const roomId = await createRoom(facilitatorPage, 'Alice', 'Sprint Vote');

    // Join as second participant
    const bobPage = await context.newPage();
    await joinRoom(bobPage, roomId, 'Bob');

    // Start voting
    await facilitatorPage.getByRole('button', { name: 'Start Voting' }).click();
    await expect(facilitatorPage.locator('text=Choose your estimate')).toBeVisible();

    // Both vote (cards are now BpkCheckboxCard — click the visible card text)
    await facilitatorPage.locator('.card-deck-item', { hasText: '5' }).first().click();
    await bobPage.locator('.card-deck-item', { hasText: '8' }).first().click();

    // Wait for both voted indicators
    await expect(facilitatorPage.locator('li', { hasText: 'Alice' }).locator('text=✓')).toBeVisible();

    // Reveal votes
    await facilitatorPage.getByRole('button', { name: 'Reveal Votes' }).click();
    await expect(facilitatorPage.locator('h2', { hasText: 'Results' })).toBeVisible();
    // Alice voted 5, Bob voted 8 — both names appear in results
    await expect(facilitatorPage.locator('p', { hasText: 'Alice' })).toBeVisible();
    await expect(facilitatorPage.locator('p', { hasText: 'Bob' })).toBeVisible();

    // New round
    await facilitatorPage.getByRole('button', { name: 'New Round' }).click();
    await expect(facilitatorPage.getByRole('button', { name: 'Start Voting' })).toBeVisible();

    await bobPage.close();
  });

  test('auto-reveal fires after all participants vote', async ({ page, context }) => {
    const facilitatorPage = page;
    const roomId = await createRoom(facilitatorPage, 'Alice', 'Auto Reveal Test');

    const bobPage = await context.newPage();
    await joinRoom(bobPage, roomId, 'Bob');

    await facilitatorPage.getByRole('button', { name: 'Start Voting' }).click();

    // Both vote — triggers auto-reveal timer (5s) (cards are now BpkCheckboxCard)
    await facilitatorPage.locator('.card-deck-item', { hasText: '3' }).first().click();
    await bobPage.locator('.card-deck-item', { hasText: '3' }).first().click();

    // Wait up to 8s for auto-reveal
    await expect(facilitatorPage.locator('text=Results')).toBeVisible({ timeout: 8000 });
    await expect(facilitatorPage.locator('text=Consensus')).toBeVisible();

    await bobPage.close();
  });

  test('copy invite link button exists', async ({ page }) => {
    await createRoom(page, 'Alice', 'Link Test');
    await expect(page.locator('text=Invite')).toBeVisible();
  });

  test('unknown route redirects to home', async ({ page }) => {
    await page.goto('/some/unknown/path');
    await expect(page).toHaveURL('/');
  });
});
