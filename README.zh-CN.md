# Rethinking Google

[English](README.md) | **中文**

一系列针对 Google 产品的交互式产品提案，每个都是可以现场点击演示的网页。

| # | 产品 | 提案 | 演示 |
|---|---|---|---|
| 01 | YouTube | **Unhooked**：把推荐目标从"最大化观看"改为"最小化后悔" | [`youtube-unhooked/`](youtube-unhooked/) |
| 02 | Google Meet | **Rehearsed**：把复盘前移到会前 | [`meet-rehearsed/`](meet-rehearsed/) |

## 本地运行

```bash
npx -y http-server . -p 5173 -c-1
```

打开 http://localhost:5173 。没有 key 也能完整演示（缓存和示例数据）；在每个演示的 **Data sources** 里填入 Gemini 或 YouTube Data API key 即可使用实时数据。key 只保存在你的浏览器里。
