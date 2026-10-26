// All projects in the series. To add one: append an object here and run `node tools/capture.mjs <id>`.
// Every user-facing string is { en, zh }.

export const SITE = {
  title: { en: 'Rethinking Google', zh: 'Rethinking Google' },
  lead: {
    en: 'Product proposals for Google products, each built as a working demo with real APIs. Open one and click around — every demo also runs offline on sample data.',
    zh: '针对 Google 产品的一系列产品提案，每个都是接入真实 API、可以直接上手的演示。点开任意一个即可体验，没有网络时也能用示例数据完整运行。',
  },
  repo: 'https://github.com/Mingzhu666/rethinking-google',
};

export const GROUPS = [
  {
    id: 'proposals',
    title: { en: 'Product proposals', zh: '产品提案' },
    lead: {
      en: 'Each proposal names a problem in a Google product, reframes the metric it optimizes, and ships a prototype to prove it.',
      zh: '每个提案都会指出一个 Google 产品中的问题，重新定义它优化的指标，并做出原型来验证。',
    },
  },
];

export const PROJECTS = [
  {
    id: 'youtube-unhooked',
    group: 'proposals',
    product: 'YouTube',
    productColor: '#ff0033',
    kind: { en: 'Media', zh: '流媒体' },
    date: '2026-10',
    title: { en: 'Unhooked', zh: 'Unhooked' },
    tagline: {
      en: 'Optimize recommendations for regret, not watch time.',
      zh: '把推荐目标从"最大化观看"改为"最小化后悔"。',
    },
    idea: {
      en: 'Recommenders learn what you like. Unhooked also learns who you don\'t want to become — and lets the outside world and the past pick for you.',
      zh: '推荐系统只学习你喜欢什么。Unhooked 还学习"你不想成为谁"，并让外部世界和过去替你选择内容。',
    },
    demo: 'youtube-unhooked/',
    tags: ['Anti-interest profile', 'Blind box channel', 'Time capsule', 'Gemini API', 'YouTube Data API', 'Open-Meteo', 'Wikimedia'],
    problem: {
      en: 'More than 70% of watch time on YouTube comes from recommendations (Neal Mohan, CES 2018). The algorithm is excellent at predicting what you will click, and never asks whether you will regret it.',
      zh: '超过 70% 的 YouTube 观看时长来自推荐算法（Neal Mohan，CES 2018）。算法非常擅长预测你会点什么，却从不问你看完会不会后悔。',
    },
    shift: { from: 'maximize Σ watch_time(user, video)', to: 'minimize Σ regret(user, video)' },
    features: [
      {
        name: { en: 'Anti-interest profile', zh: '反兴趣画像' },
        text: {
          en: 'Name the person you don\'t want to become ("someone led around by outrage"). Gemini blocks matching videos in the feed, explains why, and offers a better alternative. Import Google Takeout to see your own trap map and late-night spirals.',
          zh: '写下你不想成为的人（比如"被愤怒牵着走的人"），Gemini 在推荐流里拦下相关视频、说明理由，并换成更好的内容。还可以导入 Google Takeout 观看记录，看到自己的多巴胺陷阱地图和深夜连播。',
        },
      },
      {
        name: { en: 'Blind box channel', zh: '盲盒频道' },
        text: {
          en: 'Once a day, the outside world programs your feed: today\'s date, the weather where you are, a stranger\'s birthday, a random Wikipedia article. Every video says why you are seeing it today.',
          zh: '每天一次，由外部世界决定你看什么：今天的日期、你所在城市的天气、一个陌生人的生日、一条维基百科随机条目。每个视频都会告诉你"为什么今天给你看这个"。',
        },
      },
      {
        name: { en: 'Time capsule', zh: '时间胶囊' },
        text: {
          en: 'A separate entrance that only shows videos uploaded on this date one, three, five, or ten years ago. The interface ages with the era.',
          zh: '一个独立入口，只展示一年、三年、五年、十年前同一天上传的视频，界面也会随年代变旧。',
        },
      },
    ],
    metric: { from: { en: 'Watch time', zh: '观看时长' }, to: { en: 'Worth-it rate', zh: '值得率' }, note: { en: 'Sessions rated "worth it" / all sessions', zh: '被评为"值得"的会话 / 全部会话' } },
    business: {
      en: ['Regret compounds into uninstalls, screen-time limits and lost trust; worth-it rate tracks long-term retention.', 'A natural YouTube Premium differentiator: advertisers buy attention, members pay for control over it.', 'The EU DSA requires a non-profiling feed option; blind box and time capsule make compliance something people want to use.'],
      zh: ['后悔会累积成卸载、限时和信任流失，值得率衡量的是长期留存。', '天然的 YouTube Premium 差异化卖点：广告主买的是注意力，会员买的是对注意力的掌控。', '欧盟 DSA 要求提供不基于画像的推荐选项，盲盒和时间胶囊让合规变成用户愿意用的功能。'],
    },
    tech: {
      en: ['Gemini blocks feed items against a free-text profile, classifies real Takeout history, and curates the blind box.', 'YouTube Data API v3 search with publishedAfter/Before powers the time capsule.', 'Open-Meteo, reverse geocoding and Wikimedia REST provide the outside-world clues — no keys needed.', 'Every call falls back live → cache → sample data, so the demo never breaks on stage.'],
      zh: ['Gemini 根据一句话画像拦截推荐、对真实 Takeout 记录分类、为盲盒策展。', 'YouTube Data API v3 用 publishedAfter/Before 搜索，支撑时间胶囊。', 'Open-Meteo、反向地理编码和 Wikimedia REST 提供外部世界线索，无需 key。', '所有调用都按"实时 → 缓存 → 示例数据"回退，现场演示不会翻车。'],
    },
    limits: {
      en: ['The YouTube API only exposes current view counts, so the time capsule sorts by all-time views, not popularity on that day.', 'Regret predictions in the feed are illustrative; a real system would learn them from post-watch surveys.'],
      zh: ['YouTube API 只提供当前播放量，时间胶囊只能按至今播放量排序，无法还原当天热度。', '推荐流里的后悔预测为示意数据，真实系统需要从看后问卷中学习。'],
    },
    shots: ['assets/youtube-unhooked/cover-1.jpg', 'assets/youtube-unhooked/cover-2.jpg'],
  },
  {
    id: 'meet-rehearsed',
    group: 'proposals',
    product: 'Google Meet',
    productColor: '#00ac47',
    kind: { en: 'Productivity', zh: '效率工具' },
    date: '2026-10',
    title: { en: 'Rehearsed', zh: 'Rehearsed' },
    tagline: {
      en: 'Move the post-mortem before the meeting.',
      zh: '把复盘前移到会前。',
    },
    idea: {
      en: 'Most meeting failures are visible in the invite. Simulate the meeting before it happens, fix the agenda, rehearse the hard questions, then review yourself afterwards.',
      zh: '大多数会议失败在邀请里就能看出来。会前先模拟一遍、修好议程、演练最难的问题，会后再私下复盘自己。',
    },
    demo: 'meet-rehearsed/',
    tags: ['Meeting simulator', 'Risk radar', 'Rehearsal room', 'Meeting mirror', 'Gemini API', 'Web Speech API'],
    problem: {
      en: 'Every AI meeting feature today — notes, summaries, action items, recaps — works after the call. By then the meeting has already failed: the decider left early, one person dominated, the decision slipped to "offline".',
      zh: '如今所有会议 AI 功能（记笔记、总结、待办、回顾）都在会后才起作用。到那时会议已经失败了：拍板的人提前离开、有人垄断发言、决策被推到"会后再说"。',
    },
    shift: { from: 'post-mortem: record what went wrong', to: 'pre-mortem: prevent it from going wrong' },
    features: [
      {
        name: { en: 'Meeting flight simulator', zh: '会议飞行模拟器' },
        text: {
          en: 'From the agenda and guest list alone, a simulator plays the meeting forward: who dominates, which item overruns, whether the decision survives the decider\'s hard stop. One click applies fixes, drafts pre-meeting messages with Gemini, and replays it — risk drops from 76 to 10.',
          zh: '只看议程和参会名单，模拟器就能快进播放这场会：谁会垄断发言、哪项会超时、决策能不能赶在拍板人离开之前做出。一键修复议程、由 Gemini 草拟会前私信并重新模拟，风险从 76 降到 10。',
        },
      },
      {
        name: { en: 'Rehearsal room', zh: '提问演练室' },
        text: {
          en: 'Gemini plays the toughest people in the room and asks the questions you are dreading. Answer out loud; get a score, the one fix that matters, and a stronger version of your answer.',
          zh: 'Gemini 扮演会上最难缠的人，提出你最怕被问到的问题。你直接开口回答，马上得到评分、最关键的一处改进和一个更好的回答版本。',
        },
      },
      {
        name: { en: 'Meeting mirror', zh: '会议镜子' },
        text: {
          en: 'A private game-film review of how you showed up: talk share, interruptions, filler words, key moments on a timeline, and exactly one thing to try next time — which feeds the next rehearsal.',
          zh: '像回看比赛录像一样私下复盘自己：发言占比、打断次数、口头禅、时间轴上的关键时刻，最后只给一个下次可以尝试的改进点，并自动带入下一次演练。',
        },
      },
    ],
    metric: { from: { en: 'Minutes in meetings', zh: '会议时长' }, to: { en: 'Decision rate', zh: '决策率' }, note: { en: 'Meetings that end with a recorded decision / all meetings', zh: '带着明确决策结束的会议 / 全部会议' } },
    business: {
      en: ['Zoom and Teams are racing to the best recap; Meet can own the moment before the call.', 'A Gemini for Workspace feature admins can measure in hours saved.', 'Privacy by design: risks describe the agenda, not people; only you see your mirror.'],
      zh: ['Zoom 和 Teams 都在比谁的会后总结更好，Meet 可以抢占"会前"这个时刻。', '作为 Gemini for Workspace 功能，管理员能直接量化节省的时间。', '隐私优先：风险只评估议程结构而非个人，复盘只有你自己能看到。'],
    },
    tech: {
      en: ['A deterministic simulation engine predicts durations, airtime and failure events, and generates rule-based agenda fixes.', 'Gemini parses free-text agendas, predicts hard questions, coaches answers, drafts messages and scores transcripts.', 'Web Speech API transcribes spoken answers in the browser.', 'Local metrics render instantly; Gemini results fill in when they arrive, with live → cache → sample fallback.'],
      zh: ['确定性模拟引擎预测时长、发言占比和失败事件，并按规则生成议程修复方案。', 'Gemini 负责解析自由文本议程、预测尖锐问题、点评回答、草拟私信、给转写稿打分。', '浏览器语音识别（Web Speech API）在本地转写口头回答。', '本地指标即时显示，Gemini 结果随后填入，并支持"实时 → 缓存 → 示例数据"回退。'],
    },
    limits: {
      en: ['The simulator does not model dependencies between agenda items, so a fix can move a decision ahead of a sign-off it depends on.', 'Meet\'s speaking-time data is only available to Workspace accounts, so the demo uses sample meetings and pasted transcripts.'],
      zh: ['模拟器不理解议程项之间的依赖，修复时可能把决策挪到它依赖的审批之前。', 'Meet 的发言数据只对 Workspace 账号开放，演示使用示例会议和粘贴的转写稿。'],
    },
    shots: ['assets/meet-rehearsed/cover-1.jpg', 'assets/meet-rehearsed/cover-2.jpg'],
  },
];
