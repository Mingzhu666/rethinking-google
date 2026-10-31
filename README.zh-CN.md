# Rethinking Google

[English](README.md) | **中文**

一系列针对 Google 产品的交互式产品提案，每个都是可以现场点击演示的网页。

| # | 产品 | 提案 | 演示 |
|---|---|---|---|
| 01 | YouTube | **Unhooked**：把推荐目标从"最大化观看"改为"最小化后悔" | [`youtube-unhooked/`](youtube-unhooked/) |
| 02 | Google Meet | **Rehearsed**：把复盘前移到会前 | [`meet-rehearsed/`](meet-rehearsed/) |
| 03 | Google Calendar | **Priced**：让每场会议显示它真实的成本 | [`calendar-priced/`](calendar-priced/) |
| 04 | Google Slides | **Flipped**：AI 先讲，你来挑错 | [`slides-flipped/`](slides-flipped/) |

## 本地运行

```bash
npx -y http-server . -p 5173 -c-1
```

打开 http://localhost:5173 。没有 key 也能完整演示（缓存和示例数据）；在每个演示的 **Data sources** 里填入 Gemini 或 YouTube Data API key 即可使用实时数据。key 只保存在你的浏览器里。

## 项目汇总页

根目录的 `index.html` 是项目汇总页（英文），`project.html?id=…` 是每个项目的详情页，两者都从 [`projects.js`](projects.js) 读取数据。

添加新项目：

1. 在独立文件夹里做好演示，例如 `maps-xyz/`。
2. 在 `projects.js` 的 `PROJECTS` 里加一条英文数据。
3. 在 [`tools/capture.mjs`](tools/capture.mjs) 的 `SHOTS` 里配置两张封面，在 5173 端口启动本地服务后运行：

```bash
cd tools && npm install && cd .. && node tools/capture.mjs maps-xyz
```
