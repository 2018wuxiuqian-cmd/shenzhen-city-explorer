# 实际验收记录

验证日期：2026-10-11。环境：Node.js 24.19.0、npm 11.9.0、Linux、系统 Chromium。验证对象：当前仓库生产构建，不是静态效果图。

## 已执行命令

```bash
npm ci --cache /workspace/.npm-cache --no-audit --no-fund
npm run build
npm test
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e
git diff --check
```

冻结安装成功；TypeScript 检查和 Vite 生产构建成功；离线预缓存生成 16 个本地资源（JS/CSS/HTML、12 张真实教材图、空白课堂 JSON）。

## 最终结果

- Vitest：1 个测试文件，11 项通过，0 失败，0 跳过。
- Playwright：6 项通过，0 失败，0 跳过。启动本地生产静态服务并使用真实浏览器执行。
- 没有声称做过未运行的人工课堂、Windows 实机、真实游客阅读、精确地图或 360 验收。

### 浏览器验收内容

1. P01–P12 全页导航、左右键、问题支架默认隐藏与手动关闭；无手机、无电子卡仍能完成 P11 → P12。
2. P06 世界之窗连续三次提及只出现一个点，mentions=3；缺照片预览不崩溃；P07 添加类别，P10 选择，P11 保存一张可选示范卡，P12 显示同一地点/类别/理由；刷新保留状态、导出 JSON、确认重置为空。
3. 从附件转出的 P62/P66/P68/P72 图片实际加载成功，问题区域可放大并提取；P62 B 三道答案正确展示；游客截图缺失明确警示。
4. 等待 Service Worker 完成安装后，通过浏览器网络离线模拟完全断网，重新加载首页、导航全部 12 页、加载教材图片、点亮大梅沙、在 P12 显示；不是只断开一个无关网络请求。
5. 缺图占位、JSON 文件恢复、Another Place! 无假坐标、多标签反思。
6. Beijing/London/New York/Shenzhen 顺序、下一线索、揭晓英国/美国国旗；1600×900 视口中 Another Place! 按钮高度至少 44px 且未被底部控制条遮挡。

## 修复记录

首轮发现并修复：Vitest 误收集 Playwright 测试；隐式 select 标签影响准确定位；图片切页时测试未等待实际加载；Service Worker 受 Vary: Origin 影响缓存匹配失败。最后构建已重跑全部上述测试通过。首轮失败未计为通过。

## 仍待素材 / 可选功能

地图为明确标注的非地理分区示意，未验证真实行政边界。深圳/城市照片、游客截图、官方 APEC 和政策资料、公开部署授权仍待补。可选 LAN 手机同步和 360 播放未实现。详见 ASSET_MANIFEST.md 与 KNOWN_LIMITATIONS.md。测试通过说明当前流程和降级可运行，不说明这些真实素材已经取得。
