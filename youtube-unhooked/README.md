# YouTube Unhooked

一份可现场演示的交互式产品提案：把 YouTube 推荐的目标从「最大化观看」改为「最小化后悔」。

| 章节 | 功能 | 数据 |
|---|---|---|
| 01 | 反兴趣画像 + 陷阱地图 + 每周报告 | Gemini API（自定义画像、分类真实 Takeout）、本地分析 |
| 02 | 盲盒频道 | Open-Meteo、Wikipedia 随机条目 / 历史上的今天、Gemini 策展、YouTube 搜索 |
| 03 | 时间胶囊 | YouTube Data API（`publishedAfter/Before`）、Wikipedia 历史上的今天 |

## 运行

```bash
npx -y http-server youtube-unhooked -p 5173 -c-1
```

打开 http://localhost:5173 。演示时用 `→` / 空格翻到下一屏，`←` 返回。

## API key（可选）

右上角「数据源」里填写，只保存在本机浏览器：

- **YouTube Data API v3**：Google Cloud Console → 启用 YouTube Data API v3 → 凭据 → 创建 API key
- **Gemini API**：https://aistudio.google.com/apikey

没有 key 时所有模块自动回退：实时 → 缓存 → 示例数据，每个模块右上角的徽章会标明当前来源。
现场演示前先完整走一遍，结果会被缓存；再勾选「演示保险模式」，断网也能完整播放。
