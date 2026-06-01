/*
 * Author: Jeroen Jonckheer
 * Demo choreography for the README recording.
 *
 * All interactions go via explicit page.mouse.move(..., {steps}) so the
 * synthetic cursor injected by the harness (DemoCursor in demo.tsx) glides
 * smoothly across the screen, and via separate down/up so the click pulse
 * is captured on screen. Targets are resolved through their boundingBox so
 * the move ends at the centre of the element about to be clicked.
 */
import { test, expect, Page, Locator } from "@playwright/test";

const STEPS = 22; // intermediate mousemove events per traversal

async function moveTo(page: Page, loc: Locator, settle = 140): Promise<void> {
    const box = await loc.boundingBox();
    if (!box) throw new Error("no boundingBox for locator");
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, {
        steps: STEPS,
    });
    if (settle) await page.waitForTimeout(settle);
}

async function moveAndClick(page: Page, loc: Locator): Promise<void> {
    await moveTo(page, loc, 180);
    await page.mouse.down();
    await page.waitForTimeout(90);
    await page.mouse.up();
    await page.waitForTimeout(220);
}

async function openHeaderMenu(page: Page, columnName: string): Promise<void> {
    const cell = page
        .locator(".jj-readonly-subgrid-header-area .ms-DetailsHeader-cell", {
            hasText: columnName,
        })
        .first();
    await moveAndClick(page, cell);
    await page.waitForSelector(".ms-ContextualMenu-list");
    await page.waitForTimeout(450);
}

async function pickMenuItem(page: Page, label: string): Promise<void> {
    const item = page.getByRole("menuitem", { name: label });
    // Hover the item briefly so Fluent's row highlight is visible before
    // the click, then click in place.
    await moveTo(page, item, 320);
    await page.mouse.down();
    await page.waitForTimeout(90);
    await page.mouse.up();
    await page.waitForTimeout(900); // let the action visibly take effect
}

test("read-only subgrid demo", async ({ page }) => {
    page.on("console", (m) => console.log("BROWSER:", m.type(), m.text()));
    page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));
    page.on("response", (r) => {
        if (r.status() >= 400) console.log("HTTP", r.status(), r.url());
    });

    await page.goto("/index.html", { waitUntil: "networkidle" });
    await page.waitForSelector(".jj-readonly-subgrid-row", { timeout: 8000 });
    await page.evaluate(() => {
        const d = document as unknown as { fonts?: { ready?: Promise<unknown> } };
        return d.fonts && d.fonts.ready ? d.fonts.ready : Promise.resolve();
    });
    await page.waitForTimeout(500);

    // Park the cursor somewhere visible above the grid so the first move
    // glides in from a natural starting point (not from off-screen).
    await page.mouse.move(120, 80, { steps: 1 });
    await page.waitForTimeout(800);

    // ---- Scroll through the rows -------------------------------------------
    await moveTo(page, page.locator(".jj-readonly-subgrid-body"), 220);
    await page.mouse.wheel(0, 220);
    await page.waitForTimeout(700);
    await page.mouse.wheel(0, 220);
    await page.waitForTimeout(700);
    await page.mouse.wheel(0, -440);
    await page.waitForTimeout(600);

    // ---- Sort: Account A->Z then Z->A --------------------------------------
    await openHeaderMenu(page, "Account");
    await pickMenuItem(page, "A to Z");
    await openHeaderMenu(page, "Account");
    await pickMenuItem(page, "Z to A");

    // ---- Group by City, then ungroup ---------------------------------------
    await openHeaderMenu(page, "City");
    await pickMenuItem(page, "Group by");
    await page.waitForTimeout(700);
    await openHeaderMenu(page, "City");
    await pickMenuItem(page, "Ungroup");

    // ---- Filter Account contains "cor" -------------------------------------
    await openHeaderMenu(page, "Account");
    await pickMenuItem(page, "Filter by");
    const filterBox = page.getByPlaceholder("typ om te filteren");
    await moveAndClick(page, filterBox);
    await page.keyboard.type("cor", { delay: 160 });
    await page.waitForTimeout(1400);
    await moveAndClick(page, page.getByRole("button", { name: "Wissen" }));
    await page.waitForTimeout(800);

    // ---- Open a record via the Account link --------------------------------
    const link = page.locator(".jj-readonly-subgrid-link").first();
    await link.scrollIntoViewIfNeeded();
    await moveTo(page, link, 350); // hover so the link underline shows
    await page.mouse.down();
    await page.waitForTimeout(90);
    await page.mouse.up();
    await page.waitForTimeout(900);

    // Smoke assertion so the test is also a sanity check, not just a recorder.
    await expect(page.locator(".jj-readonly-subgrid-row").first()).toBeVisible();
});
