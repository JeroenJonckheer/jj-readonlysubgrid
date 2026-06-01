/*
 * Author: Jeroen Jonckheer
 * Demo choreography: drives the real ReadOnlySubgrid control through its
 * headline features at a calm pace so the recorded video reads well as a
 * looping GIF. Playwright records the whole run to demo-output/.../video.webm.
 */
import { test, expect, Page } from "@playwright/test";

// Open a column's header dropdown by the column's display name.
async function openHeaderMenu(page: Page, columnName: string): Promise<void> {
    await page
        .locator(".jj-readonly-subgrid-header-area .ms-DetailsHeader-cell", {
            hasText: columnName,
        })
        .first()
        .click();
    await page.waitForSelector(".ms-ContextualMenu-list");
    await page.waitForTimeout(500);
}

async function clickMenuItem(page: Page, label: string): Promise<void> {
    await page.getByRole("menuitem", { name: label }).click();
    await page.waitForTimeout(1200);
}

test("read-only subgrid demo", async ({ page }) => {
    page.on("console", (m) => console.log("BROWSER:", m.type(), m.text()));
    page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));
    page.on("response", (r) => {
        if (r.status() >= 400) console.log("HTTP", r.status(), r.url());
    });
    await page.goto("/index.html", { waitUntil: "networkidle" });
    await page.waitForSelector(".jj-readonly-subgrid-row", { timeout: 8000 });
    // Wait for Fluent UI's icon font(s) to finish downloading - otherwise
    // the header chevrons render as placeholder squares for the first few
    // hundred ms while the woff2 is still in flight.
    await page.evaluate(() => {
        const d = document as unknown as { fonts?: { ready?: Promise<unknown> } };
        return d.fonts && d.fonts.ready ? d.fonts.ready : Promise.resolve();
    });
    // Small settle so the first paint after the font lands isn't captured
    // mid-swap.
    await page.waitForTimeout(400);
    // Hold on the populated grid.
    await page.waitForTimeout(1500);

    // 1) Scroll through the rows (shows the sticky header + native scroll).
    const body = page.locator(".jj-readonly-subgrid-body");
    await body.hover();
    await page.mouse.wheel(0, 260);
    await page.waitForTimeout(800);
    await page.mouse.wheel(0, 260);
    await page.waitForTimeout(800);
    await page.mouse.wheel(0, -520);
    await page.waitForTimeout(700);

    // 2) Sort A->Z then Z->A on Account (server-side style re-sort).
    await openHeaderMenu(page, "Account");
    await clickMenuItem(page, "A to Z");
    await openHeaderMenu(page, "Account");
    await clickMenuItem(page, "Z to A");

    // 3) Group by City, then ungroup.
    await openHeaderMenu(page, "City");
    await clickMenuItem(page, "Group by");
    await page.waitForTimeout(800);
    await openHeaderMenu(page, "City");
    await clickMenuItem(page, "Ungroup");

    // 4) Filter Account contains "cor" (narrows to the Corporations).
    await openHeaderMenu(page, "Account");
    await clickMenuItem(page, "Filter by");
    const filterBox = page.getByPlaceholder("typ om te filteren");
    await filterBox.click();
    for (const ch of "cor") {
        await filterBox.type(ch, { delay: 140 });
    }
    await page.waitForTimeout(1500);
    await page.getByRole("button", { name: "Wissen" }).click();
    await page.waitForTimeout(900);

    // 5) Click a lookup link -> opens the related record (toast in the demo).
    const link = page.locator(".jj-readonly-subgrid-link").first();
    await link.scrollIntoViewIfNeeded();
    await link.hover();
    await page.waitForTimeout(500);
    await link.click();
    await page.waitForTimeout(800);

    // Sanity assertion so the test is also a smoke test, not just a recorder.
    await expect(page.locator(".jj-readonly-subgrid-row").first()).toBeVisible();
});
