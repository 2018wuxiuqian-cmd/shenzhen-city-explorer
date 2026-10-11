import { test, expect } from "@playwright/test";
test("verified-format panorama rotates and unsupported media fall back without auto playback", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:5175");
  // The color pattern is a synthetic renderer test fixture, never a teaching asset.
  const pattern = await page.evaluate(() => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 256;
    const ctx = c.getContext("2d")!;
    for (let x = 0; x < 512; x++) {
      ctx.fillStyle = `hsl(${(x / 512) * 360},80%,50%)`;
      ctx.fillRect(x, 0, 1, 256);
    }
    return c.toDataURL("image/png").split(",")[1];
  });
  await page.route("**/assets/test-panorama.png", (r) =>
    r.fulfill({
      contentType: "image/png",
      body: Buffer.from(pattern, "base64"),
    }),
  );
  await page.evaluate(async () => {
    const reactModule = "/node_modules/.vite/deps/react.js",
      domModule = "/node_modules/.vite/deps/react-dom_client.js",
      viewerModule = "/src/MediaViewer.tsx";
    const React = await import(reactModule),
      dom = await import(domModule),
      { default: Viewer } = await import(viewerModule);
    const container = document.createElement("div");
    container.id = "media-test";
    container.style.cssText =
      "position:fixed;inset:0;background:white;z-index:1000;padding:20px";
    document.body.append(container);
    const root = (dom.createRoot || dom.default.createRoot)(container);
    const render = (path: string) =>
      root.render(
        (React.createElement || React.default.createElement)(Viewer, {
          place: {
            id: "test",
            nameZh: "合成测试样例",
            nameEn: "Synthetic test fixture",
            district: "未定位",
            districts: [],
            coordinates: null,
            tags: [],
            textbookCategory: null,
            image: null,
            panorama: path,
            panoramaVerified: true,
            video: "assets/missing-test.webm",
            source: "Automated renderer fixture; not classroom evidence",
            license: "test only",
            verificationStatus: "test",
          },
        }),
      );
    Object.assign(window, { renderPanoramaTest: render });
    render("assets/test-panorama.png");
  });
  const viewer = page.locator("#media-test");
  await viewer.getByRole("button", { name: "查看已核验 360 全景" }).click();
  await expect(viewer.getByText("全景加载中…")).toHaveCount(0);
  await expect(viewer.locator("canvas")).toBeVisible();
  const before = await viewer
    .locator("canvas")
    .evaluate((c: HTMLCanvasElement) => c.toDataURL());
  await viewer.getByRole("button", { name: "向右转" }).click();
  const after = await viewer
    .locator("canvas")
    .evaluate((c: HTMLCanvasElement) => c.toDataURL());
  expect(after).not.toBe(before);
  await viewer.getByRole("button", { name: "静态素材", exact: true }).click();
  await viewer.getByRole("button", { name: "播放本地短视频" }).click();
  await expect(viewer.getByRole("status")).toContainText("视频加载失败");
  await expect(viewer.locator("video")).toHaveCount(0);
  await page.route("**/assets/test-panorama-unavailable.png", (r) => r.abort());
  await page.evaluate(() => {
    (
      window as unknown as { renderPanoramaTest: (s: string) => void }
    ).renderPanoramaTest("assets/test-panorama-unavailable.png");
  });
  await viewer.getByRole("button", { name: "查看已核验 360 全景" }).click();
  await expect(viewer.getByRole("status")).toContainText("已回退静态素材");
  await expect(viewer.locator("canvas")).toHaveCount(0);
  expect(errors).toEqual([]);
});
