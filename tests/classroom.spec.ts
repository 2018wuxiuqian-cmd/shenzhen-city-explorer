import { test, expect, type Page } from "@playwright/test";
const go = async (page: Page, n: number) =>
  page
    .getByRole("button", {
      name: new RegExp(`^P${String(n).padStart(2, "0")} `),
    })
    .click();
const state = async (page: Page) =>
  page.evaluate(() =>
    JSON.parse(localStorage.getItem("shenzhen-explorer-v1")!),
  );
test("all 12 pages, keyboard, hidden support, no phones or electronic cards required", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  for (let i = 1; i <= 12; i++) {
    await go(page, i);
    await expect(page.locator("main h1")).toBeVisible();
    expect((await state(page)).currentPage).toBe(i);
  }
  await go(page, 2);
  await expect(
    page.getByRole("heading", {
      name: "Shenzhen is welcoming the world.",
      exact: true,
    }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Step 1", exact: true }).click();
  await page.getByRole("button", { name: "Step 2", exact: true }).click();
  await expect(
    page
      .getByRole("heading", {
        name: "Shenzhen is welcoming the world.",
        exact: true,
      })
      .first(),
  ).toBeVisible();
  await expect(page.getByTestId("support")).toHaveCount(0);
  await page.getByRole("button", { name: "Hint", exact: true }).click();
  await expect(page.getByTestId("support")).toContainText("Places");
  await page.getByRole("button", { name: "隐藏支架 / 图片提示" }).click();
  await expect(page.getByTestId("support")).toHaveCount(0);
  await go(page, 11);
  await expect(page.getByText("每组至少一张纸质推荐卡。")).toBeVisible();
  await page.getByRole("button", { name: "Next →", exact: true }).click();
  await expect(page.locator("main h1")).toHaveText("Our City, Our Discoveries");
  expect((await state(page)).recommendations).toEqual([]);
  await go(page, 5);
  await page.locator("main h1").click();
  await page.keyboard.press("ArrowRight");
  expect((await state(page)).currentPage).toBe(6);
  await page.keyboard.press("ArrowLeft");
  expect((await state(page)).currentPage).toBe(5);
  expect(errors).toEqual([]);
});
test("P06 discovery, repeat mentions, downstream classification, recommendations, persistence and reset", async ({
  page,
}) => {
  await page.goto("/");
  await go(page, 6);
  const window = page
    .locator(".quick-list")
    .getByRole("button", { name: /世界之窗/ });
  await window.click();
  await window.click();
  await window.click();
  let s = await state(page);
  expect(s.discoveredPlaceIds).toEqual(["window"]);
  expect(s.mentions.window).toBe(3);
  await expect(page.locator(".map-marker.active")).toHaveCount(1);
  await page.getByRole("button", { name: "世界之窗详情" }).click();
  await expect(page.getByRole("dialog")).toContainText("真实素材待补");
  await page.keyboard.press("Escape");
  await go(page, 7);
  await expect(page.locator(".sort-grid")).toContainText("世界之窗");
  await page.getByRole("button", { name: "桥接教材五类 / Reveal" }).click();
  await page
    .getByRole("button", { name: "amusement park", exact: true })
    .click();
  expect((await state(page)).placeCategories.window).toEqual([
    "amusement park",
  ]);
  await go(page, 10);
  await page
    .locator(".choice-grid")
    .getByRole("button", { name: /世界之窗/ })
    .click();
  expect((await state(page)).selectedRecommendationPlaceIds).toEqual([
    "window",
  ]);
  await go(page, 11);
  await page.getByLabel("Place", { exact: true }).selectOption("window");
  await page.getByLabel("Type", { exact: true }).fill("amusement park");
  await page.getByLabel("What visitors can do").fill("see famous buildings");
  await page.getByLabel("Why we recommend it").fill("visitors like buildings");
  await page.getByRole("button", { name: "保存一张示范卡（可跳过）" }).click();
  await go(page, 12);
  await expect(page.locator(".summary-tags")).toContainText("世界之窗");
  await expect(page.locator(".summary-tags")).toContainText("amusement park");
  await expect(page.locator(".reflection article")).toContainText(
    "visitors like buildings",
  );
  await page.reload();
  expect((await state(page)).mentions.window).toBe(3);
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "导出本课发现 JSON" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("shenzhen-classroom.json");
  await page.getByRole("button", { name: "课堂设置" }).click();
  await page.getByRole("button", { name: "重置课堂", exact: true }).click();
  await page.getByRole("button", { name: "确认重置" }).click();
  expect((await state(page)).discoveredPlaceIds).toEqual([]);
  expect((await state(page)).recommendations).toEqual([]);
  await expect(page.locator("main h1")).toHaveText("Guess the City");
});
test("real textbook pages, question extraction and missing visitor warning", async ({
  page,
}) => {
  await page.goto("/");
  await go(page, 3);
  for (let i = 0; i < 4; i++) {
    await expect(page.locator(".book img")).toBeVisible();
    await expect
      .poll(() =>
        page
          .locator(".book img")
          .evaluate(
            (el: HTMLImageElement) => el.complete && el.naturalWidth > 0,
          ),
      )
      .toBe(true);
    await page.getByRole("button", { name: /放大 P/ }).click();
    await expect(page.getByRole("dialog")).toContainText(
      [
        "What interesting places",
        "What historic or modern buildings",
        "Is there a river or lake",
        "What was your city like",
      ][i],
    );
    await page.getByRole("button", { name: "提取问题卡并返回" }).click();
    if (i < 3) await page.getByRole("button", { name: "后一教材页 →" }).click();
  }
  await go(page, 8);
  await page.getByRole("button", { name: "显示 / 隐藏教材答案" }).click();
  await expect(page.locator(".vocab-layout ol")).toContainText(
    "historic building",
  );
  await expect(page.locator(".vocab-layout ol")).toContainText(
    "modern building",
  );
  await expect(page.locator(".vocab-layout ol")).toContainText("art gallery");
  await go(page, 9);
  await expect(page.locator(".warning")).toContainText("原帖截图缺失");
  await expect(page.locator(".placeholder")).toContainText("真实素材待补");
});
test("fully offline reload and complete lesson using cached local resources", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    await new Promise<void>((resolve) => {
      if (navigator.serviceWorker.controller) resolve();
      else
        navigator.serviceWorker.addEventListener(
          "controllerchange",
          () => resolve(),
          { once: true },
        );
    });
  });
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator("main h1")).toHaveText("Guess the City");
  for (let i = 1; i <= 12; i++) {
    await go(page, i);
    await expect(page.locator("main h1")).toBeVisible();
  }
  await go(page, 3);
  await expect(page.locator(".book img")).toBeVisible();
  await expect
    .poll(() =>
      page
        .locator(".book img")
        .evaluate((e: HTMLImageElement) => e.complete && e.naturalWidth > 0),
    )
    .toBe(true);
  await go(page, 6);
  await page
    .locator(".quick-list")
    .getByRole("button", { name: /大梅沙/ })
    .click();
  await go(page, 12);
  await expect(page.locator(".summary-tags")).toContainText("大梅沙");
});
test("missing photo gracefully degrades and JSON restores classroom", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".clue .placeholder")).toContainText(
    "真实素材待补",
  );
  await page.getByRole("button", { name: "课堂设置" }).click();
  const data = {
    version: 1,
    currentPage: 6,
    currentStep: 0,
    steps: {},
    discoveredPlaceIds: ["another"],
    mentions: { another: 1 },
    placeCategories: { another: ["park"] },
    selectedRecommendationPlaceIds: ["another"],
    recommendations: [],
    teacherSettings: { reducedMotion: true, largeFont: false, quickMode: true },
  };
  await page.getByLabel("恢复 JSON", { exact: true }).setInputFiles({
    name: "class.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(data)),
  });
  await page.getByRole("button", { name: "关闭 ×", exact: true }).click();
  await expect(page.locator("main h1")).toHaveText("Shenzhen Discovery Map");
  await expect(page.locator(".another")).toContainText("未定位");
  await go(page, 12);
  await expect(page.locator(".summary-tags")).toContainText("park");
});
test("city sequence, clues, reveal flags and touch-sized map controls", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto("/");
  for (const [i, name, flag] of [
    [0, "Beijing", "🇨🇳"],
    [1, "London", "🇬🇧"],
    [2, "New York", "🇺🇸"],
    [3, "Shenzhen", "🇨🇳"],
  ] as const) {
    await page.getByRole("button", { name: "Next Clue", exact: true }).click();
    await page.getByRole("button", { name: "Reveal city" }).click();
    await expect(page.locator(".hero h2")).toHaveText(`${flag} ${name}`);
    if (i < 3)
      await page.getByRole("button", { name: "Skip / Next City" }).click();
  }
  await go(page, 6);
  const another = await page
    .getByRole("button", { name: "＋ Another Place!（无须输入）" })
    .boundingBox();
  const footer = await page.locator("footer").boundingBox();
  expect(another!.height).toBeGreaterThanOrEqual(44);
  expect(another!.y + another!.height).toBeLessThanOrEqual(footer!.y + 1);
  await page
    .getByRole("button", { name: "＋ Another Place!（无须输入）" })
    .click();
  await expect(page.locator(".another")).toContainText("未定位");
});
