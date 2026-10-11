# Shenzhen City Explorer

离线优先的六年级 Unit 6 “What is a city?” React + TypeScript 交互课件。包含 P01–P12、一体机教师控制、深圳探索示意地图、教材翻页、分类与推荐任务、纸质卡打印、浏览器课堂状态恢复。

本版本课堂流程可运行。真实行政区边界、深圳实拍、城市线索照片、游客原帖截图仍待补；界面有明确占位，未生成假地图、经纬度、游客引语或学生反馈。教材图片来自用户提供的 12 页扫描件，其中 P62 / P66 / P68 / P72 已逐页核对。详见 [ASSET_MANIFEST.md](ASSET_MANIFEST.md)、[KNOWN_LIMITATIONS.md](KNOWN_LIMITATIONS.md)。

## Windows 本地启动

安装 Node.js 22 LTS 或 24 LTS、Git。在 PowerShell 执行：

```powershell
git clone https://github.com/2018wuxiuqian-cmd/shenzhen-city-explorer.git
cd shenzhen-city-explorer
npm ci
npm run dev
```

在浏览器打开终端给出的本机地址。一体机建议 1920×1080、Chrome / Edge，点击 Fullscreen 或 F11。无学生个人设备需求。手机遥控不是本版本功能。

## 构建与离线授课

```powershell
npm run build
npm run preview -- --port 4173
```

`dist/` 是完整静态产物，包含本地教材资源及自动生成的 Service Worker。第一次在 localhost 或 HTTPS 打开并等待资源缓存后，可断网刷新、导航完整课堂。开发模式不缓存。即使浏览器缓存被禁用，保持本机静态服务运行也可在没有互联网时授课。不要双击 `index.html` 使用 file://，浏览器模块和 Service Worker 在该协议下不可用。

无 Node.js 的目标电脑可拷贝 `dist` 并使用已安装的 Python：

```powershell
cd dist
python -m http.server 4173 --bind 127.0.0.1
```

访问 `http://127.0.0.1:4173`。`npm ci` 是联网准备操作，上课前完成；课堂不下载依赖、CDN、地图瓦片或视频流。

## 静态部署

将 `dist/` 全部文件部署到 HTTPS 静态站点，保留相对路径。支持子目录部署，无服务器业务端，无外部字体。重新构建时缓存版本由文件哈希改变。localhost / HTTPS 支持浏览器离线缓存；普通 LAN HTTP 不支持 Service Worker，但本地网络静态服务不依赖互联网。`--host 0.0.0.0` 用于可信网络开发，不提供认证，也不提供手机控制同步。

## 运行测试

```powershell
npm test
npx playwright install chromium
npm run build
npm run test:e2e
```

已有 Chromium 的 Linux 环境可使用：

```bash
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e
```

端到端测试运行生产构建，覆盖 12 页导航、重复提及、分类和推荐联动、真实教材、缺图降级、默认隐藏支架、纸质任务、JSON 恢复/重置，以及浏览器完全离线后刷新并完成教学。测试结果以实际运行输出为准。

## 结构与素材替换

- `src/App.tsx`：12 个课堂页面、教师操作、示意地图、对话框与打印卡。
- `src/state.ts`：统一动态课堂状态、持久化与恢复校验。
- `src/data.ts`：15 个预置地点候选、另一个地点、教材问题、城市线索；静态数据与课堂状态分离。
- `public/assets/textbook/`：真实教材本地图片。
- `scripts/generate-sw.mjs`：构建后预缓存所有本地资源。
- `src/state.test.ts`、`tests/classroom.spec.ts`：状态单元测试与浏览器验收。
- `TEACHER_GUIDE.md`、`TEACHING_DESIGN.md`：操作说明与按空白模板整理的课时设计。

地点的 image 字段填本地相对路径（例如 `assets/places/window.jpg`），文件放 `public/assets/places/`。填写可追溯来源、授权、核验状态后重新构建；不要使用在线 URL 作为核心资源。panorama / video 字段预留，本版本未实现全景或视频播放器。照片加载失败显示占位。

当前云环境使用已有独立 checkout，不创建 Git worktree。课堂状态保存在当前浏览器 `localStorage`，不发往服务器；跨浏览器、换电脑使用设置中的导出/恢复 JSON。只导入本课工具生成的文件。
