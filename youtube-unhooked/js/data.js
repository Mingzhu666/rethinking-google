// 示例数据：陷阱分类、首页推荐流、替代内容、虚构人设的观看记录。

export const TRAPS = {
  rage:    { label: '被愤怒牵着走的人',       short: '愤怒对立', color: '#ff2d3d',
             kw: ['怼', '吵', '蠢', '骂', '撕', '炸了', '对立', '反驳', '打脸', '愤怒', '翻车', 'destroy', 'owned', 'rant', 'reacts to', ' vs ', 'debate', 'slams', 'idiot'] },
  fastsci: { label: '以为 3 分钟就能懂一切的人', short: '速食科普', color: '#ff8a00',
             kw: ['分钟看懂', '分钟学会', '秒懂', '一口气', '快速', '看完就懂', '速通', 'explained in', 'in 60 seconds', 'in 5 minutes', 'in 1 minute', 'facts you'] },
  binge:   { label: '凌晨两点还在刷的人',     short: '深夜连播', color: '#8a6bff',
             kw: ['合集', '盘点', '名场面', '一次看完', '解说', '离谱瞬间', 'compilation', 'best of', 'shorts', 'moments', 'top 10', 'top 100', '#shorts'] },
  drama:   { label: '靠别人的八卦活着的人',   short: '八卦猎奇', color: '#ff4fa3',
             kw: ['曝光', '内幕', '震惊', '真相', '塌房', '瓜', '离婚', '分手', 'drama', 'exposed', 'tea', 'scandal'] },
  envy:    { label: '被别人的生活焦虑的人',   short: '焦虑比较', color: '#e8b400',
             kw: ['月入', '年薪', '财务自由', '一天是怎么过', '同龄人', '逆袭', '豪宅', 'day in the life', 'millionaire', 'luxury', 'how rich'] },
  bait:    { label: '被标题骗进来的人',       short: '标题党',   color: '#00a9bd',
             kw: ['绝对想不到', '最后发生', '最后居然', '居然', '竟然', '千万别', '必看', '！！', '?!', "you won't believe", 'shocking', 'insane', 'gone wrong'] },
};

const T = (title, channel, dur, views, trap, thumbText, hue, extra = {}) =>
  ({ id: Math.random().toString(36).slice(2), title, channel, duration: dur, views, trap, thumbText, hue, ...extra });

// 首页推荐流：算法眼里全是“你会点开的”
export const FEED = [
  T('3分钟看懂量子力学｜看完你就是半个物理学家', '知识快充站', '3:12', '412万', 'fastsci', '3分钟\n看懂量子', 24, { click: 91, regret: 68 }),
  T('他当众怼了评论员，评论区直接炸了', '热点前线', '8:47', '890万', 'rage', '当场\n炸了', 0, { click: 87, regret: 74, loud: true }),
  T('一座灯塔的最后一位看守人', '慢纪录 Slow Docs', '48:20', '63万', null, '最后的\n看守人', 205),
  T('震惊！这家人的真实收入终于曝光……', '吃瓜第一线', '11:05', '1203万', 'drama', '收入\n曝光', 330, { click: 84, regret: 71, loud: true }),
  T('月入5万的28岁，一天是怎么过的', 'Life of Leo', '14:32', '356万', 'envy', '月入\n5万', 45, { click: 79, regret: 63 }),
  T('MIT 公开课：线性代数 第1讲', 'MIT OpenCourseWare', '39:49', '1020万', null, '18.06\n第1讲', 190),
  T('【合集】凌晨必看的100个离谱瞬间', '离谱研究所', '1:02:14', '2310万', 'binge', '100个\n离谱', 280, { click: 93, regret: 82, loud: true }),
  T('从零开始的木工：做一把椅子要多久', '木与时间', '27:18', '88万', null, '一把\n椅子', 32),
  T('为什么另一边的人都这么蠢？', '真话频道', '12:40', '540万', 'rage', '为什么\n这么蠢', 355, { click: 82, regret: 77 }),
  T('1分钟学会经济学｜再也不怕被割韭菜', '知识快充站', '1:04', '670万', 'fastsci', '1分钟\n经济学', 140, { click: 76, regret: 59 }),
  T('坂本龙一 · 最后的演奏会（节选）', 'Ryuichi Sakamoto', '18:06', '410万', null, 'Opus', 220),
  T('你绝对猜不到最后发生了什么……', '每日惊奇', '9:59', '1580万', 'bait', '最后\n居然…', 60, { click: 88, regret: 80, loud: true }),
];

// 被拦截后的替代内容：同一种好奇心，更好的满足方式
export const ALTS = {
  fastsci: T('量子力学为什么难懂？一位物理学家的 40 分钟诚实回答', '物理不神秘', '41:30', '120万', null, '诚实的\n40分钟', 170, { altWhy: '同样的好奇心，换一个不骗你“已经懂了”的版本' }),
  rage:    T('双方都有道理时：一场不吵架的辩论', '慢对话', '52:12', '45万', null, '不吵架\n的辩论', 160, { altWhy: '同一个议题，听见另一边最好的论证' }),
  drama:   T('一个普通家庭的十年账本', '真实的生活', '33:40', '210万', null, '十年\n账本', 100, { altWhy: '关于别人的生活，但是真实而完整的版本' }),
  envy:    T('28 岁，我决定慢一点：一位木匠的日常', '木与时间', '22:05', '77万', null, '慢一点', 80, { altWhy: '看别人的生活，但不让你觉得自己落后' }),
  binge:   T('今晚就到这里：10 分钟睡前环境音', 'Sleep Room', '10:00', '930万', null, '晚安', 250, { altWhy: '已经 01:00 了，这个视频会自己结束' }),
  bait:    T('一个好故事需要什么？皮克斯的 22 条规则', '电影语言', '24:48', '330万', null, '22条\n规则', 15, { altWhy: '想要惊喜？这次惊喜是真的' }),
};

// 盲盒 / 时间胶囊的示例视频
export function mockVideos(seedText, n = 4, opts = {}) {
  const pool = opts.pool || [
    ['城市漫步', '一个人的散步'], ['老唱片', '黑胶时光'], ['手作', '匠人日记'], ['旅行', '远方'],
    ['纪录片', '慢纪录 Slow Docs'], ['音乐现场', 'Live Session'], ['公开课', 'Open Lecture'], ['美食', '街角小馆'],
  ];
  const r = rng(seedText);
  return Array.from({ length: n }, (_, i) => {
    const [kind, ch] = pool[Math.floor(r() * pool.length)];
    return {
      id: 'mock' + i + seedText.length,
      title: opts.titles?.[i] || `${kind}｜${seedText}`,
      channel: ch,
      duration: `${3 + Math.floor(r() * 40)}:${String(Math.floor(r() * 60)).padStart(2, '0')}`,
      views: Math.floor(r() * 3e6),
      thumbText: opts.titles?.[i]?.slice(0, 6) || kind,
      hue: Math.floor(r() * 360),
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(opts.queries?.[i] || seedText)}`,
      mock: true,
    };
  });
}

// 确定性伪随机，保证示例数据每次一样
export function rng(seed) {
  let h = 1779033703 ^ String(seed).length;
  for (const c of String(seed)) h = Math.imul(h ^ c.charCodeAt(0), 3432918353), h = (h << 13) | (h >>> 19);
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

// ---------- 虚构人设：林一，28 岁产品经理，8 周观看记录（Takeout 格式） ----------
const PERSONA_TITLES = {
  rage:    ['他当场怼了主持人，全网炸了', '为什么另一边的人这么蠢', '评论区吵翻了：这到底谁的错', '打脸现场！专家被当面反驳', '这波操作让所有人愤怒'],
  fastsci: ['3分钟看懂相对论', '1分钟学会经济学', '5分钟看懂人工智能', '秒懂量子纠缠', '一口气看懂中国历史'],
  binge:   ['【合集】100个离谱瞬间', '名场面盘点 TOP50', '一次看完一整季', '#shorts 猫咪迷惑行为', '凌晨必看的沙雕合集'],
  drama:   ['震惊！顶流塌房内幕曝光', '这对夫妻离婚真相', '吃瓜：前员工曝光公司内幕', '网红翻车全过程'],
  envy:    ['月入5万的28岁一天怎么过', '30岁财务自由的我', '同龄人已经在买豪宅了', '年薪百万的日常 vlog'],
  bait:    ['你绝对想不到最后发生了什么', '千万别在晚上看这个', '他居然这样做了！！', '竟然有这种操作？!'],
  deep:    ['一座灯塔的最后一位看守人', 'MIT 线性代数 第3讲', '坂本龙一 最后的演奏会', '从零开始做一把椅子', '一本书读懂认知科学（讲座）', '城市是如何长大的（纪录片）'],
};
const PERSONA_MIX = [['deep', 55], ['fastsci', 18], ['binge', 22], ['rage', 14], ['drama', 9], ['envy', 8], ['bait', 7]];

export function personaHistory() {
  const r = rng('linyi-28-pm');
  const pick = list => list[Math.floor(r() * list.length)];
  const weighted = () => {
    let x = r() * 100;
    for (const [k, w] of PERSONA_MIX) { if ((x -= w) < 0) return k; }
    return 'deep';
  };
  const out = [];
  const now = new Date();
  for (let d = 0; d < 56; d++) {
    const day = new Date(now); day.setDate(now.getDate() - d);
    const sessions = 1 + Math.floor(r() * 3);
    for (let s = 0; s < sessions; s++) {
      const late = r() < 0.38; // 深夜会话
      const hour = late ? [23, 0, 1, 2][Math.floor(r() * 4)] : [8, 12, 13, 19, 20, 21, 22][Math.floor(r() * 7)];
      const len = late ? 4 + Math.floor(r() * 10) : 1 + Math.floor(r() * 6);
      let t = new Date(day); t.setHours(hour, Math.floor(r() * 60), 0, 0);
      for (let i = 0; i < len; i++) {
        let cat = late && r() < 0.4 ? pick(['binge', 'binge', 'rage', 'drama']) : weighted();
        out.push({ header: 'YouTube', title: 'Watched ' + pick(PERSONA_TITLES[cat]), time: t.toISOString(), _cat: cat });
        t = new Date(t.getTime() + (4 + r() * 14) * 60000);
      }
    }
  }
  return out;
}
