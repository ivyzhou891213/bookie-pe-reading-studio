'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart3,
  BookOpen,
  Brain,
  Calculator,
  CalendarRange,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  History,
  KeyRound,
  LibraryBig,
  Newspaper,
  MessageSquareText,
  Play,
  Search,
  Settings,
  Sparkles,
  Target,
  GraduationCap,
  Bookmark,
  Mic,
  Square,
  Upload,
  Trash2,
  X,
} from 'lucide-react';
import { FORMULAS, type FormulaCard } from '@/lib/formulas';

type Book = {
  id: string;
  title: string;
  short: string;
  file: string;
  cover: string;
  pages: number;
  color: string;
  chapters?: Chapter[];
  ocrRequired?: boolean;
  ocrReady?: boolean;
  ocrTextReady?: boolean;
  textLayerReady?: boolean;
};
type QA = {
  id: string;
  createdAt: string;
  bookId: string;
  page: number;
  quote: string;
  question: string;
  answer: string;
  mode: string;
};
type DayLog = {
  date: string;
  minutes: number;
  pages: number;
  completed: boolean;
  bookId?: string;
  startPage?: number;
  endPage?: number;
};
type ReadingSession = {
  bookId: string;
  startedAt: number;
  endedAt?: number;
  startPage: number;
  endPage: number;
  pages: number[];
  minutes?: number;
};
type Knowledge = {
  id: string;
  query: string;
  answer: string;
  createdAt: string;
  relatedIds: string[];
};
type Summary = {
  date: string;
  content: string;
  createdAt: string;
  bookId?: string;
  startPage?: number;
  endPage?: number;
  pages?: number[];
};
type TokenUsage = { date: string; input: number; output: number; requests: number };
type ApiUsage = { prompt_tokens?: number; completion_tokens?: number; input_tokens?: number; output_tokens?: number };
type StudyPlan = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  bookIds: string[];
  weeks: number;
  weekdayTime: string;
  weekendTime: string;
  background: string;
  goal: string;
  createdAt: string;
  schedule?: PlannedWeek[];
  // AI makes the day-by-day allocation. The weekly schedule remains the
  // authoritative complete chapter list used for coverage and progress.
  dailySchedule?: PlannedDay[];
  dailyGuidance?: Array<{ week: number; day: number; focus?: string; outcome?: string }>;
  aiPlanApplied?: boolean;
  adjustedWeeks?: Record<number, boolean>;
  conversation?: { text: string; createdAt: string }[];
  collapsed?: boolean;
  readerState?: {
    bookId: string;
    page: number;
    chapterNo: number;
    week: number;
  };
  completedChapters?: Record<string, boolean>;
  colorIndex?: number;
};
type PlannedWeek = {
  week: number;
  focus: string;
  units: { bookId: string; chapterNos: number[]; summary: string }[];
  outcome: string;
  aiOutcome?: string;
};
type PlannedDay = {
  week: number;
  day: number;
  date: string;
  label: string;
  time: string;
  tasks: { bookId: string; start: number; end: number; part?: string }[];
  outcome?: string;
};
type ArchiveMeta = {
  folder: string;
  companies: string[];
  industries: string[];
  topic: string;
  tags: string[];
};
type ImportedItem = {
  id: string;
  kind: 'interview' | 'deal';
  title: string;
  sourceUrl: string;
  content: string;
  analysis: string;
  createdAt: string;
  archive?: ArchiveMeta;
};
type Clip = {
  id: string;
  createdAt: string;
  bookId: string;
  page: number;
  quote: string;
  comment?: string;
  audioData?: string;
};
type Store = {
  questions: QA[];
  knowledge: Knowledge[];
  summaries: Summary[];
  logs: DayLog[];
  progress: Record<string, number>;
  chapterProgress: Record<string, number>;
  streak: number;
  formulaStats: Record<
    string,
    { searches: number; lastSearched: string; mastered: boolean }
  >;
  customFormulas: FormulaCard[];
  studyPlan?: StudyPlan; // Legacy: migrated to studyPlans on first load.
  studyPlans: StudyPlan[];
  activePlanId?: string;
  completedChapters: Record<string, boolean>;
  imports: ImportedItem[];
  clips: Clip[];
  uploadedBooks: Book[];
  archivedBooks: Record<string, boolean>;
};
type Chapter = { n: number; title: string; page: number };
type DetectedChapter = Chapter & { tocLike: boolean };
type WeekPlan = {
  week: number;
  theme: string;
  book: string;
  chapters: number[];
  outcome: string;
};

const BOOKS: Book[] = [
  {
    id: 'valuation',
    short: 'MV',
    title: 'McKinsey Valuation',
    file: '/books/valuation.pdf',
    cover: '/valuation-cover.png',
    pages: 1342,
    color: '#1f5b4f',
  },
  {
    id: 'investment-banking',
    short: 'IB',
    title: 'Investment Banking',
    file: '/books/investment-banking.pdf',
    cover: '/investment-banking-cover.png',
    pages: 514,
    color: '#ad6a2e',
  },
];
const CHAPTERS: Record<string, Chapter[]> = {
  valuation: [
    [1, 'Why Value Value?', 53],
    [2, 'Finance in a Nutshell', 67],
    [3, 'Fundamental Principles of Value Creation', 80],
    [4, 'Risk and the Opportunity Cost of Capital', 116],
    [5, 'The Alchemy of Stock Market Performance', 135],
    [6, 'The Stock Market and Economic Fundamentals', 154],
    [7, 'The Stock Market Is Smarter Than You Think', 180],
    [8, 'Return on Invested Capital', 206],
    [9, 'Growth', 249],
    [10, 'Frameworks for Valuation', 279],
    [11, 'Reorganizing the Financial Statements', 321],
    [12, 'Analyzing Performance', 371],
    [13, 'Forecasting Performance', 397],
    [14, 'Estimating Continuing Value', 435],
    [15, 'Estimating the Cost of Capital', 462],
    [16, 'Moving from Enterprise Value to Value per Share', 504],
    [17, 'Analyzing the Results', 533],
    [18, 'Using Multiples', 545],
    [19, 'Valuation by Parts', 571],
    [20, 'Taxes', 596],
    [21, 'Nonoperating Items, Provisions, and Reserves', 618],
    [22, 'Leases', 638],
    [23, 'Retirement Obligations', 658],
    [24, 'Capital-Light Businesses', 672],
    [25, 'CFROI', 693],
    [26, 'Inflation', 707],
    [27, 'Cross-Border Valuation', 735],
    [28, 'Corporate Portfolio Strategy', 760],
    [29, 'Strategic Management: Analytics', 787],
    [30, 'Governance and Decision Making', 814],
    [31, 'Mergers and Acquisitions', 835],
    [32, 'Divestitures', 875],
    [33, 'Digital Initiatives and Companies', 898],
    [34, 'Sustainability', 923],
    [35, 'Capital Structure and Payouts', 947],
    [36, 'Investor Communications', 990],
    [37, 'Leveraged Buyouts', 1024],
    [38, 'Venture Capital', 1052],
    [39, 'High-Growth Companies', 1071],
    [40, 'Flexibility and Options', 1092],
    [41, 'Emerging Markets', 1141],
    [42, 'Cyclical Companies', 1164],
    [43, 'Banks', 1175],
  ].map(([n, title, page]) => ({
    n: n as number,
    title: title as string,
    page: page as number,
  })),
  'investment-banking': [
    [1, 'Comparable Companies Analysis', 47],
    [2, 'Precedent Transactions Analysis', 109],
    [3, 'Discounted Cash Flow Analysis', 149],
    [4, 'Leveraged Buyouts', 203],
    [5, 'LBO Analysis', 251],
    [6, 'Sell-Side M&A', 309],
    [7, 'Buy-Side M&A', 343],
    [8, 'Initial Public Offerings', 409],
    [9, 'IPO Process and Execution', 443],
  ].map(([n, title, page]) => ({
    n: n as number,
    title: title as string,
    page: page as number,
  })),
};
const WEEK_DETAILS = [
  {
    theme: '价值创造与可比公司基础',
    mc: 'Ch.1–3：长期价值、ROIC、增长与现金流',
    ib: 'Ch.1 前半：可比公司选择与资料整理',
    learn: '判断增长是否创造价值，并建立 trading comps 的基本口径。',
  },
  {
    theme: '风险、市场预期与交易倍数',
    mc: 'Ch.4–7：资本成本、TSR、市场预期与常见误区',
    ib: 'Ch.1 后半：倍数计算、benchmarking 与估值区间',
    learn: '理解好公司为何不一定是好投资，以及市场倍数背后的预期。',
  },
  {
    theme: '企业质量与先例交易',
    mc: 'Ch.8–10：ROIC 持续性、增长质量与估值框架',
    ib: 'Ch.2：Precedent Transactions Analysis',
    learn: '识别竞争优势的持续性，并区分交易控制权价值与公开市场价值。',
  },
  {
    theme: '财务重构与经营预测',
    mc: 'Ch.11–13：重组报表、历史分析与价值驱动预测',
    ib: 'Ch.3 前半：FCF projection',
    learn: '把三张表转换为投资者模型，并用经营驱动因素构建预测。',
  },
  {
    theme: '终值、WACC 与 DCF',
    mc: 'Ch.14–16：Continuing Value、WACC、EV 到 Equity Value',
    ib: 'Ch.3 后半：WACC、Terminal Value 与敏感性',
    learn: '完成一套可辩护的 DCF，并能解释资本成本和终值假设。',
  },
  {
    theme: '估值验证与 LBO 经济性',
    mc: 'Ch.17–19：情景、Multiples 与 SOTP',
    ib: 'Ch.4：LBO 候选特征、回报来源与融资工具',
    learn: '用多方法验证估值，并理解杠杆如何改变股权回报。',
  },
  {
    theme: '复杂调整与 LBO 模型',
    mc: 'Ch.20–24：税务、准备金、租赁、养老金与轻资产',
    ib: 'Ch.5 前半：Sources & Uses、交易结构与债务计划',
    learn: '正确处理类债务项目，并搭建 LBO 模型骨架。',
  },
  {
    theme: '跨境、通胀与 LBO 回报',
    mc: 'Ch.25–30：CFROI、通胀、跨境、组合策略与治理',
    ib: 'Ch.5 后半：三表、现金扫款、IRR 与 MOIC',
    learn: '连接跨境风险、所有者优势和 sponsor return bridge。',
  },
  {
    theme: 'M&A 与卖方流程',
    mc: 'Ch.31–32：并购价值创造与剥离',
    ib: 'Ch.6：Sell-Side M&A',
    learn: '理解拍卖流程、协同价值、卖方目标和 PE 买方的投标节点。',
  },
  {
    theme: '特殊商业模式与买方分析',
    mc: 'Ch.33–36：数字业务、可持续、资本结构与投资者沟通',
    ib: 'Ch.7：Buy-Side M&A',
    learn: '把叙事转成现金流，并掌握出价、交易结构和增厚摊薄分析。',
  },
  {
    theme: 'LBO、高增长与 IPO 退出',
    mc: 'Ch.37–40：LBO、VC、高增长与实物期权',
    ib: 'Ch.8：IPO 基础与退出选择',
    learn: '评估高增长和灵活性价值，并从 sponsor 视角比较 IPO 与出售。',
  },
  {
    theme: '特殊情景、IPO 执行与总复盘',
    mc: 'Ch.41–43：新兴市场、周期企业与银行',
    ib: 'Ch.9：IPO 准备、路演、定价与交割',
    learn: '处理特殊估值情景，并把两本书转化为完整面试知识系统。',
  },
];
const WEEKS: WeekPlan[] = WEEK_DETAILS.map((w, i) => ({
  week: i + 1,
  theme: w.theme,
  book: 'both',
  chapters: [],
  outcome: w.learn,
}));
function chaptersFor(bookId: string): Chapter[] {
  return CHAPTERS[bookId] || [{ n: 1, title: '完整阅读', page: 1 }];
}
function isUsableChapter(title: string) {
  const clean = title.replace(/\s+/g, ' ').trim();
  return clean.length >= 3 && !/(印刷|出版|版次|版权|isbn|前言|目录|contents|copyright)/i.test(clean);
}
function chapterNumber(value: string) {
  if (/^\d+$/.test(value)) return Number(value);
  const digits: Record<string, number> = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
  if (value === '十') return 10;
  if (value.length === 2 && value[0] === '十' && digits[value[1]]) return 10 + digits[value[1]];
  if (value.length === 2 && digits[value[0]] && value[1] === '十') return digits[value[0]] * 10;
  if (value.length === 3 && digits[value[0]] && value[1] === '十' && digits[value[2]]) return digits[value[0]] * 10 + digits[value[2]];
  return digits[value];
}
function chapterFromLine(line: string, sourcePage: number, totalPages: number): DetectedChapter | null {
  const match = line.match(/(?:chapter|chap\.?|ch\.?|第)\s*(\d{1,3}|[一二三四五六七八九十]{1,3})\s*(?:章)?\s*[:：.\-–]?\s*(.{3,90})/i);
  if (!match) return null;
  const n = chapterNumber(match[1]);
  const rawTitle = match[2].replace(/\s+/g, ' ').trim();
  const pageMatch = rawTitle.match(/(?:\.{2,}|\s)(\d{1,4})\s*$/);
  const title = rawTitle.replace(/(?:\.{2,}|\s)\d{1,4}\s*$/, '').trim();
  if (!n || !isUsableChapter(title)) return null;
  const listedPage = pageMatch ? Number(pageMatch[1]) : 0;
  // A number printed at the end of a contents row is a book page number, not a
  // PDF index. Persist the page on which the heading was actually found. Full
  // scans prefer a real heading over an earlier contents-row candidate.
  return { n, title, page: sourcePage, tocLike: listedPage > 0 && listedPage <= totalPages };
}
function rememberChapter(found: Map<number, DetectedChapter>, candidate: DetectedChapter) {
  const previous = found.get(candidate.n);
  if (!previous || (previous.tocLike && !candidate.tocLike)) found.set(candidate.n, candidate);
}
function storedChapters(found: Map<number, DetectedChapter>): Chapter[] {
  return [...found.values()]
    .sort((a, b) => a.n - b.n)
    .map(({ n, title, page }) => ({ n, title, page }));
}
function textContentLines(items: readonly unknown[]) {
  const lines: string[] = [];
  let line = '';
  for (const raw of items) {
    if (!raw || typeof raw !== 'object' || !('str' in raw) || typeof raw.str !== 'string' || !raw.str) continue;
    line += `${line ? ' ' : ''}${raw.str}`;
    if ('hasEOL' in raw && raw.hasEOL) { lines.push(line); line = ''; }
  }
  if (line) lines.push(line);
  return lines;
}
function scheduleCoversBooks(schedule: PlannedWeek[] | undefined, bookIds: string[]) {
  if (!schedule?.length) return false;
  const expected = new Set(bookIds.flatMap((bookId) => chaptersFor(bookId).map((chapter) => `${bookId}:${chapter.n}`)));
  const actual = schedule.flatMap((week) => week.units.flatMap((unit) => unit.chapterNos.map((chapter) => `${unit.bookId}:${chapter}`)));
  return actual.length === expected.size && new Set(actual).size === expected.size && actual.every((key) => expected.has(key));
}
function dailyScheduleCoversBooks(days: PlannedDay[] | undefined, bookIds: string[]) {
  if (!days?.length) return false;
  const expected = new Set(bookIds.flatMap((bookId) => chaptersFor(bookId).map((chapter) => `${bookId}:${chapter.n}`)));
  const seen = new Set<string>();
  for (const day of days) for (const task of day.tasks) for (let chapter = task.start; chapter <= task.end; chapter += 1) {
    const key = `${task.bookId}:${chapter}`;
    if (!expected.has(key)) return false;
    seen.add(key);
  }
  return seen.size === expected.size;
}
function formatStudyTime(value: string) {
  const match = value.match(/(\d{1,2})(?::(\d{2}))?\s*(?:点)?\s*(?:到|[-–—])\s*(\d{1,2})(?::(\d{2}))?\s*(?:点)?/);
  if (!match) return value.replace(/（每天\s*[^）]+）/g, '').trim();
  const clock = (hour: string, minute?: string) => `${hour.padStart(2, '0')}:${minute || '00'}`;
  return `${clock(match[1], match[2])}–${clock(match[3], match[4])}`;
}
function formatOcrDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 1) return '正在估算';
  const rounded = Math.ceil(seconds);
  if (rounded < 60) return `约 ${rounded} 秒`;
  const minutes = Math.ceil(rounded / 60);
  return minutes < 60 ? `约 ${minutes} 分钟` : `约 ${Math.ceil(minutes / 60)} 小时`;
}
function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
function scheduleBookLabel(book?: Book) {
  const title = book?.title || '书籍';
  if (/investment banking/i.test(title)) return 'Investment Banking';
  if (/mckinsey valuation|measuring and managing the value/i.test(title)) return 'McKinsey Valuation';
  return title.length > 32 ? `${title.slice(0, 32)}…` : title;
}
function scheduleHours(value: string, fallback: number) {
  const numeric = value.match(/(\d+(?:\.\d+)?)\s*(?:小时|h\b)/i);
  if (numeric) return Number(numeric[1]);
  if (/半个?小时/.test(value)) return 0.5;
  const clock = value.match(/(\d{1,2})\s*(?::\d{2}|点)?\s*(?:到|[-–—])\s*(\d{1,2})/);
  if (clock) {
    const hours = Number(clock[2]) - Number(clock[1]);
    if (hours > 0 && hours <= 12) return hours;
  }
  return fallback;
}
function dailyRowsForSchedule(schedule: PlannedWeek[], startDate: string, weekdayTime: string, weekendTime: string): PlannedDay[] {
  const weekdayHours = scheduleHours(weekdayTime, 2);
  const weekendHours = scheduleHours(weekendTime, 2);
  const weekdayLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  return schedule.flatMap((week, weekIndex) => {
    const rawReading = week.units.flatMap((unit) => unit.chapterNos.map((chapter) => ({ bookId: unit.bookId, chapter })));
    // A daily plan must cover every available day. When a short chapter allocation
    // has fewer than seven entries, divide those chapters into consecutive study blocks.
    const segmentCount = rawReading.length ? Math.max(7, rawReading.length) : 0;
    const chapterOccurrences = new Map<string, number>();
    const reading = Array.from({ length: segmentCount }, (_, index) => {
      const source = rawReading[Math.min(rawReading.length - 1, Math.floor((index * rawReading.length) / segmentCount))];
      const key = `${source.bookId}:${source.chapter}`;
      chapterOccurrences.set(key, (chapterOccurrences.get(key) || 0) + 1);
      return { ...source, key };
    });
    const chapterPositions = new Map<string, number>();
    const weekStart = new Date(`${startDate}T00:00:00`);
    weekStart.setDate(weekStart.getDate() + weekIndex * 7);
    const weights = Array.from({ length: 7 }, (_, day) => {
      const calendarDay = (weekStart.getDay() + day) % 7;
      return calendarDay === 0 || calendarDay === 6 ? weekendHours : weekdayHours;
    });
    const allocation = Array(7).fill(0) as number[];
    if (reading.length >= 7) {
      const pageWeight = (item: { bookId: string; chapter: number }) => {
        const chapters = chaptersFor(item.bookId);
        const index = chapters.findIndex((chapter) => chapter.n === item.chapter);
        const bookPages = BOOKS.find((book) => book.id === item.bookId)?.pages || chapters.at(-1)?.page || 1;
        return Math.max(1, (chapters[index + 1]?.page || bookPages + 1) - (chapters[index]?.page || 1));
      };
      const work = reading.map(pageWeight);
      const totalWork = work.reduce((sum, value) => sum + value, 0);
      const totalCapacity = weights.reduce((sum, value) => sum + Math.max(0.25, value), 0);
      let cursor = 0;
      let assignedWork = 0;
      let capacityUsed = 0;
      for (let day = 0; day < 7; day += 1) {
        capacityUsed += Math.max(0.25, weights[day]);
        const targetWork = totalWork * (capacityUsed / totalCapacity);
        const remainingDays = 6 - day;
        while (cursor < reading.length - remainingDays && (allocation[day] === 0 || assignedWork < targetWork)) {
          assignedWork += work[cursor];
          allocation[day] += 1;
          cursor += 1;
        }
      }
    } else {
      [...reading.keys()].forEach((index) => {
        const day = [...weights.keys()].sort((a, b) => weights[b] - weights[a])[index];
        allocation[day] += 1;
      });
    }
    let cursor = 0;
    return allocation.map((count, day) => {
      const items = reading.slice(cursor, cursor + count);
      cursor += count;
      const tasks = items.reduce<PlannedDay['tasks']>((groups, item) => {
        const position = (chapterPositions.get(item.key) || 0) + 1;
        chapterPositions.set(item.key, position);
        const totalParts = chapterOccurrences.get(item.key) || 1;
        const part = totalParts > 1 ? `${position}/${totalParts}` : undefined;
        const last = groups.at(-1);
        if (last && !part && last.bookId === item.bookId && last.end + 1 === item.chapter) last.end = item.chapter;
        else groups.push({ bookId: item.bookId, start: item.chapter, end: item.chapter, part });
        return groups;
      }, []);
      const date = new Date(weekStart);
      date.setDate(date.getDate() + day);
      const calendarDay = date.getDay();
      return {
        week: week.week,
        day: day + 1,
        date: localDateKey(date),
        label: weekdayLabels[(calendarDay + 6) % 7],
        time: calendarDay === 0 || calendarDay === 6 ? weekendTime : formatStudyTime(weekdayTime),
        tasks,
      };
    });
  });
}
const initialStore: Store = {
  questions: [],
  knowledge: [],
  summaries: [],
  logs: [],
  progress: { valuation: 53, 'investment-banking': 47 },
  chapterProgress: {},
  streak: 0,
  formulaStats: {},
  customFormulas: [],
  completedChapters: {},
  imports: [],
  clips: [],
  uploadedBooks: [],
  archivedBooks: {},
  studyPlans: [],
};
const today = new Date().toISOString().slice(0, 10);

const LOCAL_BOOK_DB = 'bookie-private-library';
function bookDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(LOCAL_BOOK_DB, 2);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('pdfs')) db.createObjectStore('pdfs');
      if (!db.objectStoreNames.contains('ocrPages')) db.createObjectStore('ocrPages');
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function saveLocalPdf(id: string, file: File) {
  const db = await bookDatabase();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction('pdfs', 'readwrite');
    tx.objectStore('pdfs').put(file, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}
async function loadLocalPdf(id: string): Promise<File | undefined> {
  const db = await bookDatabase();
  const file = await new Promise<File | undefined>((resolve, reject) => {
    const request = db.transaction('pdfs', 'readonly').objectStore('pdfs').get(id);
    request.onsuccess = () => resolve(request.result as File | undefined);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return file;
}
async function saveOcrPage(bookId: string, page: number, text: string) {
  const db = await bookDatabase();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction('ocrPages', 'readwrite');
    tx.objectStore('ocrPages').put(text, `${bookId}:${page}`);
    tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error);
  });
  db.close();
}
async function loadOcrPage(bookId: string, page: number): Promise<string | undefined> {
  const db = await bookDatabase();
  const text = await new Promise<string | undefined>((resolve, reject) => {
    const request = db.transaction('ocrPages', 'readonly').objectStore('ocrPages').get(`${bookId}:${page}`);
    request.onsuccess = () => resolve(request.result as string | undefined); request.onerror = () => reject(request.error);
  });
  db.close(); return text;
}
async function ocrPageCount(bookId: string): Promise<number> {
  const db = await bookDatabase();
  const keys = await new Promise<IDBValidKey[]>((resolve, reject) => {
    const request = db.transaction('ocrPages', 'readonly').objectStore('ocrPages').getAllKeys();
    request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
  });
  db.close();
  return keys.filter((key) => String(key).startsWith(`${bookId}:`)).length;
}

function cleanUploadedBookTitle(filename: string) {
  const raw = filename
    .replace(/\.pdf$/i, '')
    .replace(/[_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  // Download sites often append hashes, source labels and author metadata. Keep
  // the reader-facing title short without altering the original local filename.
  const cutAt = raw.search(/\b(?:anna'?s|archive|isbn|wiley|springer|pdfdrive|[a-f0-9]{12,}|tim koller|marc goedhart|david wessels)\b/i);
  const title = (cutAt > 8 ? raw.slice(0, cutAt) : raw)
    .replace(/[,:;\-–—\s]+$/g, '')
    .replace(/\b\d+(?:st|nd|rd|th)\s*(?:ed(?:ition)?)?$/i, '')
    .trim();
  return title || '未命名书籍';
}

async function firstPageCover(pdf: { getPage: (page: number) => Promise<any> }) {
  try {
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 0.28 });
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(viewport.width));
    canvas.height = Math.max(1, Math.round(viewport.height));
    const context = canvas.getContext('2d');
    if (!context) return '/book-placeholder.svg';
    await page.render({ canvasContext: context, viewport }).promise;
    return canvas.toDataURL('image/jpeg', 0.76);
  } catch {
    return '/book-placeholder.svg';
  }
}

function loadStore(): Store {
  if (typeof window === 'undefined') return initialStore;
  try {
    const parsed = JSON.parse(
      localStorage.getItem('pe-classroom-store') || '{}',
    ) as Store;
    const legacy = parsed.studyPlan;
    const migratedPlans = parsed.studyPlans?.length
      ? parsed.studyPlans
      : legacy
        ? [
            {
              ...legacy,
              id: `legacy-${legacy.createdAt || Date.now()}`,
              name: 'PE 核心能力计划',
              startDate: legacy.createdAt?.slice(0, 10) || today,
              endDate: new Date(
                Date.now() + (legacy.weeks || 12) * 7 * 86400000,
              )
                .toISOString()
                .slice(0, 10),
              conversation: legacy.goal
                ? [
                    {
                      text: legacy.goal,
                      createdAt: legacy.createdAt || new Date().toISOString(),
                    },
                  ]
                : [],
            },
          ]
        : [];
    return {
      ...initialStore,
      ...parsed,
      studyPlans: migratedPlans,
      activePlanId: parsed.activePlanId || migratedPlans[0]?.id,
    };
  } catch {
    return initialStore;
  }
}

export default function Home() {
  const [view, setView] = useState('home');
  const [store, setStore] = useState<Store>(initialStore);
  const [ready, setReady] = useState(false);
  // A hosted demo must never ship the personal PDFs used during local development.
  // Visitors begin with their own, lawfully obtained PDF files instead.
  const [hostedMode, setHostedMode] = useState(false);
  const [book, setBook] = useState(BOOKS[0]);
  const [readerPlanId, setReaderPlanId] = useState<string | null>(null);
  const [page, setPage] = useState(53);
  const [selection, setSelection] = useState('');
  const [selectionSuggestion, setSelectionSuggestion] = useState('');
  const [question, setQuestion] = useState('');
  const [clipComment, setClipComment] = useState('');
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const [answer, setAnswer] = useState('');
  const [asking, setAsking] = useState(false);
  const [sessionStart, setSessionStart] = useState<number | null>(null);
  const [sessionStartPage, setSessionStartPage] = useState(53);
  const sessionPages = useRef<Set<number>>(new Set());
  const [lastSession, setLastSession] = useState<ReadingSession | null>(null);
  const [provider, setProvider] = useState('deepseek');
  const [model, setModel] = useState('deepseek-v4-flash');
  const [apiKey, setApiKey] = useState('');
  const [openAiKey, setOpenAiKey] = useState('');
  const [flashThinking, setFlashThinking] = useState<'enabled' | 'disabled'>('disabled');
  const [flashEffort, setFlashEffort] = useState<'low' | 'medium' | 'high'>('low');
  const [proEffort, setProEffort] = useState<'low' | 'medium' | 'high'>('high');
  const [historyQuery, setHistoryQuery] = useState('');
  const [historyBook, setHistoryBook] = useState('all');
  const [mockOpen, setMockOpen] = useState(false);
  const [mockQuestion, setMockQuestion] = useState('');
  const [mockAnswer, setMockAnswer] = useState('');
  const [mockFeedback, setMockFeedback] = useState('');
  const [mockBusy, setMockBusy] = useState(false);
  const [questionListening, setQuestionListening] = useState(false);
  const [summaryStatus, setSummaryStatus] = useState<'idle' | 'working' | 'done' | 'error'>('idle');
  const [summaryPreview, setSummaryPreview] = useState('');
  const [tokenUsage, setTokenUsage] = useState<TokenUsage>({ date: today, input: 0, output: 0, requests: 0 });
  const [saved, setSaved] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [knowledgeAnswer, setKnowledgeAnswer] = useState('');
  const [searching, setSearching] = useState(false);
  const [related, setRelated] = useState<QA[]>([]);
  const sessionTexts = useRef<Record<number, string>>({});
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [selectedBookId, setSelectedBookId] = useState('valuation');
  const [selectedChapterNo, setSelectedChapterNo] = useState(1);
  const [knowledgeTab, setKnowledgeTab] = useState<'formulas' | 'mine'>(
    'formulas',
  );
  const [formulaBook, setFormulaBook] = useState('all');
  const [formulaChapter, setFormulaChapter] = useState('all');
  const [extractingFormulas, setExtractingFormulas] = useState(false);
  const [formulaError, setFormulaError] = useState('');
  const [showPlanner, setShowPlanner] = useState(false);
  const [showPlanManager, setShowPlanManager] = useState(false);
  const [managedPlanId, setManagedPlanId] = useState<string | null>(null);
  const [planName, setPlanName] = useState('PE 核心能力计划');
  const [planStartDate, setPlanStartDate] = useState(today);
  const [planError, setPlanError] = useState('');
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [language, setLanguage] = useState<'zh' | 'en'>('zh');
  const [planBooks, setPlanBooks] = useState<string[]>([]);
  const [planWeeks, setPlanWeeks] = useState(12);
  const [planWeekdayTime, setPlanWeekdayTime] = useState('22:00–24:00');
  const [planWeekendTime, setPlanWeekendTime] = useState('周六/周日 2–3 小时');
  const [planBackground, setPlanBackground] = useState(
    '小型 PE 基金，基础设施和跨境投资经验',
  );
  const [planGoal, setPlanGoal] = useState(
    '深入掌握估值、M&A 和 LBO，并形成大型 PE 面试表达',
  );
  const [planBrief, setPlanBrief] = useState(
    '我有小型 PE 基金的基础设施和跨境投资经验。希望在 12 周内系统掌握 McKinsey Valuation 和 Investment Banking，用于跳槽大型 PE 平台。工作日晚上 10 点到 12 点，周末每天可投入 2 到 3 小时。',
  );
  const [planPreview, setPlanPreview] = useState<StudyPlan | null>(null);
  const [planGenerating, setPlanGenerating] = useState(false);
  const [plannerListening, setPlannerListening] = useState(false);
  const [importKind, setImportKind] = useState<'interview' | 'deal'>(
    'interview',
  );
  const [importUrl, setImportUrl] = useState('');
  const [importTitle, setImportTitle] = useState('');
  const [importContent, setImportContent] = useState('');
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [uploadingBook, setUploadingBook] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [ocrIndexingBookId, setOcrIndexingBookId] = useState<string | null>(null);
  const [indexingMode, setIndexingMode] = useState<'contents' | 'ocr' | null>(null);
  const [ocrProgress, setOcrProgress] = useState<{ current: number; total: number; startedAt: number } | null>(null);
  const handlePdfSelection = useCallback((text: string, fullSentence: string) => {
    setSelection(text);
    setSelectionSuggestion(fullSentence);
  }, []);
  const handlePageText = useCallback((text: string) => {
    sessionTexts.current[page] = text;
  }, [page]);
  const [localBookUrls, setLocalBookUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    const loaded = loadStore();
    setStore({
      ...loaded,
      uploadedBooks: loaded.uploadedBooks.map((item) =>
        item.file.startsWith('local:')
          ? {
              ...item,
              title: cleanUploadedBookTitle(item.title),
              // Two headings are not a reliable table of contents for a full book.
              ...(item.chapters && item.chapters.length < 4 && !item.ocrTextReady
                ? { ocrRequired: true, ocrReady: false }
                : {}),
            }
          : item,
      ),
    });
    setProvider(localStorage.getItem('pe-provider') || 'deepseek');
    setModel(localStorage.getItem('pe-model') || 'deepseek-v4-flash');
    setApiKey(localStorage.getItem('pe-api-key') || '');
    setOpenAiKey(localStorage.getItem('pe-openai-api-key') || '');
    setFlashThinking((localStorage.getItem('pe-flash-thinking') as 'enabled' | 'disabled') || 'disabled');
    setFlashEffort((localStorage.getItem('pe-flash-effort') as 'low' | 'medium' | 'high') || 'low');
    setProEffort((localStorage.getItem('pe-pro-effort') as 'low' | 'medium' | 'high') || 'high');
    const storedUsage = JSON.parse(localStorage.getItem('pe-token-usage') || 'null') as TokenUsage | null;
    if (storedUsage?.date === today) setTokenUsage(storedUsage);
    setSelectedWeek(Number(localStorage.getItem('pe-selected-week') || 1));
    setSelectedBookId(localStorage.getItem('pe-selected-book') || 'valuation');
    setSelectedChapterNo(
      Number(localStorage.getItem('pe-selected-chapter') || 1),
    );
    setLanguage((localStorage.getItem('pe-language') as 'zh' | 'en') || 'zh');
    setHostedMode(!['localhost', '127.0.0.1'].includes(window.location.hostname));
    setReady(true);
  }, []);
  useEffect(() => {
    if (!book.file.startsWith('local:') || localBookUrls[book.id]) return;
    let active = true;
    loadLocalPdf(book.id)
      .then(async (file) => {
        if (!file || !active) return;
        setLocalBookUrls((urls) => ({ ...urls, [book.id]: URL.createObjectURL(file) }));
        if (book.cover !== '/book-placeholder.svg') return;
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
        const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
        const cover = await firstPageCover(pdf);
        if (!active || cover === '/book-placeholder.svg') return;
        setStore((current) => ({
          ...current,
          uploadedBooks: current.uploadedBooks.map((item) =>
            item.id === book.id ? { ...item, cover } : item,
          ),
        }));
        setBook((current) => current.id === book.id ? { ...current, cover } : current);
      })
      .catch(() => setUploadError('这本本地书籍文件暂时无法读取，请重新上传。'));
    return () => { active = false; };
  }, [book, localBookUrls]);
  // Older uploads predate automatic cover generation. Refresh their shelf cards
  // in the background instead of requiring the reader to open every book.
  useEffect(() => {
    if (!ready) return;
    const missingCovers = store.uploadedBooks.filter(
      (item) => item.file.startsWith('local:') && item.cover === '/book-placeholder.svg',
    );
    if (!missingCovers.length) return;
    let active = true;
    Promise.all(
      missingCovers.map(async (item) => {
        try {
          const file = await loadLocalPdf(item.id);
          if (!file) return { id: item.id, cover: '' };
          const pdfjs = await import('pdfjs-dist');
          pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
          const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
          return { id: item.id, cover: await firstPageCover(pdf) };
        } catch {
          return { id: item.id, cover: '' };
        }
      }),
    ).then((covers) => {
      if (!active || !covers.some((item) => item.cover && item.cover !== '/book-placeholder.svg')) return;
      setStore((current) => ({
        ...current,
        uploadedBooks: current.uploadedBooks.map((item) => {
          const replacement = covers.find((cover) => cover.id === item.id)?.cover;
          return replacement && replacement !== '/book-placeholder.svg' ? { ...item, cover: replacement } : item;
        }),
      }));
    });
    return () => { active = false; };
  }, [ready, store.uploadedBooks]);
  useEffect(() => {
    if (ready)
      localStorage.setItem('pe-classroom-store', JSON.stringify(store));
  }, [store, ready]);
  useEffect(() => {
    store.uploadedBooks.forEach((item) => {
      if (item.chapters?.length) CHAPTERS[item.id] = item.chapters;
    });
  }, [store.uploadedBooks]);
  // Older plans may contain the former partial-coverage schedule, or a daily
  // schedule based on chapter pages that were later rebuilt. Keep the plan and
  // completion history, but regenerate only the derived schedule fields.
  useEffect(() => {
    if (!ready) return;
    setStore((current) => {
      let changed = false;
      const studyPlans = current.studyPlans.map((plan) => {
        const weeklyValid = scheduleCoversBooks(plan.schedule, plan.bookIds);
        const dailyValid = dailyScheduleCoversBooks(plan.dailySchedule, plan.bookIds);
        if (weeklyValid && (!plan.dailySchedule || dailyValid)) return plan;
        changed = true;
        return {
          ...plan,
          schedule: weeklyValid
            ? plan.schedule
            : buildSchedule(plan.bookIds, plan.weeks, plan.weekdayTime, plan.weekendTime),
          dailySchedule: undefined,
          dailyGuidance: [],
          aiPlanApplied: false,
        };
      });
      return changed ? { ...current, studyPlans } : current;
    });
  }, [ready, store.uploadedBooks]);
  useEffect(() => {
    if (!ready) return;
    let active = true;
    Promise.all(store.uploadedBooks.filter((item) => item.file.startsWith('local:') && item.ocrRequired && !item.ocrTextReady).map(async (item) => ({ id: item.id, complete: (await ocrPageCount(item.id)) >= item.pages })))
      .then((results) => {
        if (!active || !results.some((result) => result.complete)) return;
        setStore((current) => ({ ...current, uploadedBooks: current.uploadedBooks.map((item) => results.find((result) => result.id === item.id)?.complete ? { ...item, ocrRequired: false, ocrTextReady: true } : item) }));
      }).catch(() => undefined);
    return () => { active = false; };
  }, [ready, store.uploadedBooks]);
  useEffect(() => {
    if (view === 'reader' && sessionStart) sessionPages.current.add(page);
  }, [view, page, sessionStart]);

  const books = useMemo(
    () =>
      [...(hostedMode ? [] : BOOKS), ...store.uploadedBooks].filter(
        (b) => !store.archivedBooks[b.id],
      ),
    [hostedMode, store.uploadedBooks, store.archivedBooks],
  );
  useEffect(() => {
    const available = new Set(books.map((item) => item.id));
    setPlanBooks((current) => {
      const valid = current.filter((id) => available.has(id));
      // New plans start from the visible shelf. This also removes stale IDs
      // left by the local demo books when the hosted library changes.
      return valid.length ? valid : books.slice(0, 2).map((item) => item.id);
    });
  }, [books]);
  const activePlan =
    store.studyPlans.find((plan) => plan.id === store.activePlanId) ||
      store.studyPlans[0];
  const allFormulas = useMemo(
    () => [...FORMULAS, ...store.customFormulas],
    [store.customFormulas],
  );
  const weekPlan = WEEKS[Math.min(selectedWeek - 1, WEEKS.length - 1)];
  const planWeeksCount = activePlan?.weeks || 12;
  const planBookIds = activePlan?.bookIds || BOOKS.map((b) => b.id);
  const activeSchedule =
    activePlan?.schedule || buildSchedule(planBookIds, planWeeksCount);
  const activeWeek =
    activeSchedule[Math.min(selectedWeek - 1, activeSchedule.length - 1)];
  const planFocus =
    activeWeek?.units
      .map(
        (unit) =>
          `${books.find((b) => b.id === unit.bookId)?.short || 'MY'} · ${unit.summary}`,
      )
      .join('；') || '';
  const selectedBook =
    books.find((b) => b.id === selectedBookId) || books[0] || BOOKS[0];
  const selectedChapter =
    chaptersFor(selectedBookId).find((c) => c.n === selectedChapterNo) ||
    chaptersFor(selectedBookId)[0];
  const chapterIndex = chaptersFor(selectedBookId).findIndex(
    (c) => c.n === selectedChapter.n,
  );
  const chapterEnd =
    (chaptersFor(selectedBookId)[chapterIndex + 1]?.page ||
      selectedBook.pages + 1) - 1;
  const savedPage =
    store.chapterProgress[`${selectedBookId}:${selectedChapterNo}`] ||
    selectedChapter.page;
  const chapterProgress = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        ((savedPage - selectedChapter.page + 1) /
          (chapterEnd - selectedChapter.page + 1)) *
          100,
      ),
    ),
  );
  const filteredQuestions = useMemo(() => {
    const needle = historyQuery.trim().toLowerCase();
    return store.questions
      .filter((item) => historyBook === 'all' || item.bookId === historyBook)
      .filter((item) => !needle || [item.question, item.quote, item.answer].join(' ').toLowerCase().includes(needle))
      .slice().reverse();
  }, [store.questions, historyBook, historyQuery]);
  // 路由是按任务而非按页面设置：低延迟陪读用 Flash，需要综合多份材料的任务用 Pro。
  // OpenAI 仅为未来的高级模拟预留；未配置时绝不会影响日常使用。
  function aiFor(task: 'mentor' | 'summary' | 'planner' | 'knowledge' | 'formulas' | 'import' | 'mock') {
    const advanced = task === 'mock';
    return {
      provider: 'deepseek',
      model: advanced ? 'deepseek-v4-pro' : 'deepseek-v4-flash',
      apiKey: localStorage.getItem('pe-api-key') || apiKey,
      thinking: advanced ? 'enabled' : flashThinking,
      reasoningEffort: advanced ? proEffort : flashEffort,
    };
  }
  function recordUsage(usage: ApiUsage | undefined, input: string, output: string) {
    const inputTokens = usage?.prompt_tokens ?? usage?.input_tokens ?? Math.ceil(input.length / 2);
    const outputTokens = usage?.completion_tokens ?? usage?.output_tokens ?? Math.ceil(output.length / 2);
    const next: TokenUsage = { date: today, input: tokenUsage.input + inputTokens, output: tokenUsage.output + outputTokens, requests: tokenUsage.requests + 1 };
    setTokenUsage(next);
    localStorage.setItem('pe-token-usage', JSON.stringify(next));
  }
  const todayQuestions = store.questions.filter(
    (q) => q.createdAt.slice(0, 10) === today,
  );
  const plannedChapterKeys = useMemo(
    () =>
      (activePlan?.bookIds || ['valuation', 'investment-banking']).flatMap(
        (id) => chaptersFor(id).map((c) => `${id}:${c.n}`),
      ),
    [activePlan],
  );
  const completedPlanChapters = plannedChapterKeys.filter(
    (key) => store.completedChapters[key],
  ).length;
  const planProgress = plannedChapterKeys.length
    ? Math.round((completedPlanChapters / plannedChapterKeys.length) * 100)
    : 0;

  function planStats(plan: StudyPlan) {
    const schedule =
      plan.schedule ||
      buildSchedule(
        plan.bookIds,
        plan.weeks,
        plan.weekdayTime,
        plan.weekendTime,
      );
    const keys = schedule.flatMap((week) =>
      week.units.flatMap((unit) =>
        unit.chapterNos.map((chapter) => `${unit.bookId}:${chapter}`),
      ),
    );
    const uniqueKeys = [...new Set(keys)];
    const done = uniqueKeys.filter(
      (key) => (plan.completedChapters || store.completedChapters)[key],
    ).length;
    return {
      schedule,
      done,
      total: uniqueKeys.length,
      progress: uniqueKeys.length
        ? Math.round((done / uniqueKeys.length) * 100)
        : 0,
    };
  }

  function weekDates(plan: StudyPlan, week: number) {
    const start = new Date(`${plan.startDate}T00:00:00`);
    start.setDate(start.getDate() + (week - 1) * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const format = (date: Date) => localDateKey(date).replace(/-/g, '.');
    return `${format(start)} – ${format(end)}`;
  }
  function compactPlanGoal(plan: StudyPlan) {
    const titles = plan.bookIds.map((id) => books.find((item) => item.id === id)?.title).filter(Boolean).join(' · ');
    return language === 'zh'
      ? `目标：完成 ${titles}；形成可复用的投资判断与表达。`
      : `Goal: complete ${titles} and build reusable investment judgment.`;
  }
  function togglePlanBook(id: string) {
    setPlanBooks((selected) => {
      if (selected.includes(id)) return selected.filter((item) => item !== id);
      if (selected.length >= 3) {
        setPlanError(language === 'zh' ? '一个学习计划最多选择 3 本书。' : 'A study plan can include up to 3 books.');
        return selected;
      }
      setPlanError('');
      return [...selected, id];
    });
  }

  function planBookStats(plan: StudyPlan, bookId: string) {
    const schedule = planStats(plan).schedule;
    const chapters = [...new Set(schedule.flatMap((week) =>
      week.units.filter((unit) => unit.bookId === bookId).flatMap((unit) => unit.chapterNos),
    ))];
    const completed = plan.completedChapters || store.completedChapters;
    const done = chapters.filter((chapter) => completed[`${bookId}:${chapter}`]).length;
    return {
      chapters,
      done,
      total: chapters.length,
      progress: chapters.length ? Math.round((done / chapters.length) * 100) : 0,
      nextChapter: chapters.find((chapter) => !completed[`${bookId}:${chapter}`]) || chapters.at(-1) || 1,
    };
  }

  function hoursFromText(text: string, fallback: number) {
    const numeric = text.match(/(\d+(?:\.\d+)?)\s*(?:小时|h\b)/i);
    if (numeric) return Number(numeric[1]);
    if (/半个?小时/.test(text)) return 0.5;
    if (/一个?小时/.test(text)) return 1;
    const chineseHours: Record<string, number> = {
      一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5,
    };
    const chinese = text.match(/([一二两三四五])\s*(?:个)?小时/);
    if (chinese) return chineseHours[chinese[1]] || fallback;
    const clock = text.match(/([0-9一二三四五六七八九十]+)\s*(?:点|:00)?\s*(?:到|[-–—])\s*([0-9一二三四五六七八九十]+)\s*(?:点|:00)?/);
    if (clock) {
      const numbers: Record<string, number> = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 };
      const readClock = (value: string) => /^\d+$/.test(value) ? Number(value) : numbers[value] || fallback;
      const diff = readClock(clock[2]) - readClock(clock[1]);
      if (diff > 0 && diff <= 12) return diff;
    }
    return fallback;
  }

  function buildSchedule(
    bookIds: string[],
    weeks: number,
    weekdayTime = '22:00–24:00',
    weekendTime = '周末 2–3 小时',
  ): PlannedWeek[] {
    const weekdayHours = hoursFromText(weekdayTime, 2);
    const weekendHours = hoursFromText(weekendTime, 2);
    const intensity =
      weekdayHours <= 1 ? '慢读' : weekdayHours < 2 ? '稳步' : '深读';
    return Array.from({ length: weeks }, (_, index) => {
      const units = bookIds.map((bookId) => {
        const chapters = chaptersFor(bookId);
        // This is a complete-coverage baseline, not the final daily decision.
        // The AI receives every chapter, every date and the hours available on
        // that date, then may distribute these chapters between weekdays and
        // weekends. It may never discard a chapter from this list.
        const start = Math.floor((index * chapters.length) / weeks);
        const endExclusive = Math.floor(((index + 1) * chapters.length) / weeks);
        const chosen = chapters.slice(start, Math.max(start, endExclusive));
        return {
          bookId,
          chapterNos: chosen.map((x) => x.n),
          summary: chosen.length
            ? chosen.map((x) => `Ch.${x.n} ${x.title}`).join(' · ')
            : '复盘与巩固',
        };
      });
      return {
        week: index + 1,
        focus: `${intensity}阅读 · ${units
          .map(
            (unit) =>
              chaptersFor(unit.bookId).find((c) => c.n === unit.chapterNos[0])
                ?.title || '复盘',
          )
          .join(' / ')}`,
        units,
        outcome:
          index === weeks - 1
            ? '把本计划的关键框架压缩成一段可用于面试或投资判断的表达。'
            : `围绕「${units.flatMap((u) => u.chapterNos.map((n) => chaptersFor(u.bookId).find((c) => c.n === n)?.title)).filter(Boolean).join('、')}」建立判断：它影响什么估值假设、交易决策或面试答案？`,
      };
    });
  }
  function validateAiDailySchedule(
    candidate: unknown,
    baseline: PlannedDay[],
    bookIds: string[],
  ): PlannedDay[] | null {
    if (!Array.isArray(candidate)) return null;
    const expected = new Set(bookIds.flatMap((bookId) => chaptersFor(bookId).map((chapter) => `${bookId}:${chapter.n}`)));
    const seen = new Set<string>();
    const lastChapter = new Map<string, number>();
    const normalized = baseline.map((base) => {
      const row = candidate.find((item) => {
        const value = item as { week?: unknown; day?: unknown };
        return Number(value.week) === base.week && Number(value.day) === base.day;
      }) as { tasks?: unknown; outcome?: unknown } | undefined;
      if (!row || !Array.isArray(row.tasks)) return null;
      const tasks: PlannedDay['tasks'] = [];
      for (const raw of row.tasks) {
        const task = raw as { bookId?: unknown; start?: unknown; end?: unknown; chapter?: unknown; chapters?: unknown };
        const bookId = String(task.bookId || '');
        const range = String(task.chapters || task.chapter || '');
        const numbers = range.match(/\d+/g)?.map(Number) || [];
        const start = Number(task.start ?? numbers[0]);
        const end = Number(task.end ?? numbers.at(-1) ?? task.start ?? numbers[0]);
        if (!bookIds.includes(bookId) || !Number.isInteger(start) || !Number.isInteger(end) || end < start) return null;
        tasks.push({ bookId, start, end });
      }
      for (const task of tasks) {
        for (let chapter = task.start; chapter <= task.end; chapter += 1) {
          const key = `${task.bookId}:${chapter}`;
          if (!expected.has(key) || seen.has(key)) return null;
          const previous = lastChapter.get(task.bookId);
          if (previous !== undefined && chapter !== previous + 1) return null;
          seen.add(key);
          lastChapter.set(task.bookId, chapter);
        }
      }
      return { ...base, tasks, outcome: typeof row.outcome === 'string' ? row.outcome.slice(0, 52) : undefined };
    });
    if (normalized.some((row) => row === null) || seen.size !== expected.size) return null;
    return normalized as PlannedDay[];
  }
  async function extractPlanChapterContexts(schedule: PlannedWeek[]) {
    const requested = [...new Map(schedule.flatMap((week) => week.units.flatMap((unit) => unit.chapterNos.map((chapterNo) => [`${unit.bookId}:${chapterNo}`, { bookId: unit.bookId, chapterNo }] as const)))).values()];
    const contexts: Array<{ book: string; chapter: string; text: string }> = [];
    const pdfCache = new Map<string, { target: Book; pdf: any }>();
    for (const reference of requested.slice(0, 36)) {
      try {
        let cached = pdfCache.get(reference.bookId);
        if (!cached) {
          const target = books.find((item) => item.id === reference.bookId);
          if (!target?.file.startsWith('local:')) continue;
          const file = await loadLocalPdf(target.id);
          if (!file) continue;
          const pdfjs = await import('pdfjs-dist');
          pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
          cached = { target, pdf: await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise };
          pdfCache.set(reference.bookId, cached);
        }
        const { target, pdf } = cached;
        const chapters = chaptersFor(target.id);
        const index = chapters.findIndex((chapter) => chapter.n === reference.chapterNo);
        const startPage = Math.max(1, chapters[index]?.page || 1);
        const endPage = Math.min(pdf.numPages, (chapters[index + 1]?.page || startPage + 2) - 1, startPage + 1);
        const pages: string[] = [];
        for (let pageNo = startPage; pageNo <= endPage; pageNo += 1) {
          const page = await pdf.getPage(pageNo);
          const content = await page.getTextContent();
          const text = textContentLines(content.items).join(' ').replace(/\s+/g, ' ').trim() || await loadOcrPage(target.id, pageNo);
          if (text) pages.push(text);
        }
        const text = pages.join(' ').slice(0, 700);
        if (text) contexts.push({ book: scheduleBookLabel(target), chapter: `Ch.${reference.chapterNo}`, text });
      } catch {
        // A missing local PDF must not stop deterministic planning.
      }
    }
    return contexts;
  }
  async function extractPlanFromBrief() {
    const incompleteBook = planBooks.map((id) => books.find((book) => book.id === id)).find((book) => book?.file.startsWith('local:') && chaptersFor(book.id).length < 4);
    if (incompleteBook) {
      setPlanError(language === 'zh' ? `「${incompleteBook.title}」目前只识别到 ${chaptersFor(incompleteBook.id).length} 个章节，无法生成可靠计划。请先在书架点击“重建目录”；若文字层不足，页面会提示你再做整书 OCR。` : `“${incompleteBook.title}” has only ${chaptersFor(incompleteBook.id).length} detected chapters, which is not enough for a reliable plan. Rebuild its contents from the shelf first; use full-book OCR only if its text layer is insufficient.`);
      return;
    }
    setPlanGenerating(true);
    setPlanError('');
    try {
    const weekMatch = planBrief.match(/(\d{1,2})\s*(?:周|weeks?)/i);
    const monthMatch = planBrief.match(/([一二两三四五六]|\d+)\s*个?月/);
    const chineseMonths: Record<string, number> = { 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6 };
    const months = monthMatch ? (/^\d+$/.test(monthMatch[1]) ? Number(monthMatch[1]) : chineseMonths[monthMatch[1]]) : 0;
    let weeks = Math.max(2, Math.min(52, Number(weekMatch?.[1] || (months ? months * 4 : planWeeks))));
    const weekdaySegment = planBrief.match(/(?:工作日|平时|周一至周五)([^。；;]*)/)?.[1] || '';
    const anyClock = weekdaySegment.match(/([0-9一二三四五六七八九十]+\s*(?:点|:00)?\s*(?:到|[-–—])\s*[0-9一二三四五六七八九十]+\s*(?:点|:00)?)/);
    let weekdayTime = anyClock?.[1] || planWeekdayTime;
    if (anyClock && /晚上|夜间/.test(weekdaySegment)) {
      const clockParts = anyClock[1].match(/(\d{1,2})\D+(\d{1,2})/);
      if (clockParts) {
        const startHour = Number(clockParts[1]) < 12 ? Number(clockParts[1]) + 12 : Number(clockParts[1]);
        const rawEnd = Number(clockParts[2]);
        const endHour = rawEnd === 12 ? 24 : rawEnd < 12 ? rawEnd + 12 : rawEnd;
        weekdayTime = `${String(startHour).padStart(2, '0')}:00–${String(endHour).padStart(2, '0')}:00`;
      }
    }
    const durationMatch = weekdaySegment.match(
      /(?:每天|一天)?.*?(一个|半个|[一二两三四五]|\d+(?:\.\d+)?)\s*(?:小时|h\b)/i,
    );
    const explicitDailyHours = durationMatch
      ? durationMatch[1] === '一个'
        ? 1
        : durationMatch[1] === '半个'
          ? 0.5
          : ({ 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5 }[durationMatch[1]] || Number(durationMatch[1]))
      : null;
    if (explicitDailyHours !== null && !anyClock) weekdayTime = `每天 ${explicitDailyHours} 小时`;
    const weekendSegment = planBrief.match(/(?:周末|周六|周日)([^。；;]*)/)?.[1] || '';
    const weekendDuration = weekendSegment.match(/(\d+(?:\.\d+)?)\s*(?:小时|h\b)/i);
    let weekendTime = weekendDuration
      ? `每天 ${weekendDuration[1]} 小时`
      : /周末/.test(planBrief)
        ? '周末 2–3 小时'
        : planWeekendTime;
    let background = planBrief;
    let goal = planBrief;
    let schedule = buildSchedule(planBooks, weeks, weekdayTime, weekendTime);
    const baselineDays = dailyRowsForSchedule(schedule, planStartDate, weekdayTime, weekendTime);
    let dailySchedule: PlannedDay[] | undefined;
    let dailyGuidance: StudyPlan['dailyGuidance'] = [];
    let aiPlanApplied = false;
    const ai = aiFor('planner');
    const key = ai.apiKey;
    if (key) {
      try {
        const plannerPayload = {
            provider: ai.provider,
            model: ai.model,
            apiKey: key,
            thinking: ai.thinking,
            reasoningEffort: ai.reasoningEffort,
            brief: planBrief,
            books: planBooks.map((id) => ({
              id,
              title: books.find((book) => book.id === id)?.title || id,
              chapters: chaptersFor(id).map((chapter, index, all) => ({
                n: chapter.n,
                title: chapter.title.slice(0, 80),
                pages: Math.max(1, (all[index + 1]?.page || (books.find((book) => book.id === id)?.pages || chapter.page + 1) + 1) - chapter.page),
              })),
            })),
            draftSchedule: schedule.map((week) => ({
              week: week.week,
              reading: week.units.map((unit) => ({
                book: books.find((book) => book.id === unit.bookId)?.title,
                chapters: unit.chapterNos.map((n) => `Ch.${n} ${chaptersFor(unit.bookId).find((c) => c.n === n)?.title}`),
              })),
            })),
            draftDailySchedule: baselineDays.map((day) => ({
              week: day.week,
              day: day.day,
              date: day.date,
              time: day.time,
              hours: scheduleHours(day.time, day.label === '周六' || day.label === '周日' ? hoursFromText(weekendTime, 2) : hoursFromText(weekdayTime, 2)),
              reading: day.tasks.map((task) => ({
                book: books.find((book) => book.id === task.bookId)?.title,
                chapters: task.start === task.end ? `Ch.${task.start}` : `Ch.${task.start}–Ch.${task.end}`,
              })),
            })),
          };
        const requestPlan = async (repair = false) => {
          const response = await fetch('/api/planner', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...plannerPayload, repair }),
          });
          return { response, data: (await response.json()) as {
          extracted?: {
            weeks?: number;
            weekdayTime?: string;
            weekendTime?: string;
            background?: string;
            goal?: string;
            weeklySummaries?: Array<{ week: number; focus?: string; outcome?: string }>;
            dailySummaries?: Array<{ week: number; day: number; focus?: string; outcome?: string }>;
            dailySchedule?: Array<{ week: number; day: number; tasks: Array<{ bookId: string; start: number; end: number }>; outcome?: string }>;
          };
          }};
        };
        let { response, data } = await requestPlan();
        let acceptedDailySchedule = response.ok
          ? validateAiDailySchedule(data.extracted?.dailySchedule, baselineDays, planBooks)
          : null;
        // Models occasionally return an otherwise good answer with one malformed
        // row. Repair it silently once, instead of asking the learner to retry.
        if (!acceptedDailySchedule && response.ok) {
          ({ response, data } = await requestPlan(true));
          acceptedDailySchedule = response.ok
            ? validateAiDailySchedule(data.extracted?.dailySchedule, baselineDays, planBooks)
            : null;
        }
        if (response.ok && data.extracted) {
          const extracted = data.extracted;
          weeks = Math.max(
            2,
            Math.min(52, Number(extracted.weeks || weeks)),
          );
          weekdayTime = extracted.weekdayTime || weekdayTime;
          weekendTime = extracted.weekendTime || weekendTime;
          background = extracted.background || background;
          goal = extracted.goal || goal;
          if (extracted.weeklySummaries?.length) {
            schedule = schedule.map((week) => {
              const ai = extracted.weeklySummaries?.find((item) => item.week === week.week);
              return ai ? { ...week, focus: ai.focus || week.focus, outcome: ai.outcome || week.outcome, aiOutcome: ai.outcome } : week;
            });
          }
          if (acceptedDailySchedule) {
            dailySchedule = acceptedDailySchedule;
            dailyGuidance = acceptedDailySchedule.map((day) => ({ week: day.week, day: day.day, outcome: day.outcome }));
            aiPlanApplied = true;
          } else {
            dailySchedule = baselineDays;
            setPlanError('AI 排程格式异常，系统已自动尝试修复；目前展示的是保证完整覆盖的保底安排。你仍可直接确认使用。');
          }
        } else if (!response.ok) {
          setPlanError((data as { error?: string }).error || 'AI 计划生成未完成，请检查 API Key 后重试。');
        }
      } catch {
        dailySchedule = baselineDays;
        setPlanError('暂时无法连接 AI；目前展示的是保证完整覆盖的保底安排。你仍可直接确认使用。');
      }
    }
    if (explicitDailyHours !== null && !anyClock) weekdayTime = `每天 ${explicitDailyHours} 小时`;
    const preview: StudyPlan = {
      id: editingPlanId || `plan-${Date.now()}`,
      name: planName.trim() || '未命名学习计划',
      startDate: planStartDate,
      endDate: localDateKey(new Date(new Date(`${planStartDate}T00:00:00`).getTime() + (weeks * 7 - 1) * 86400000)),
      bookIds: planBooks,
      weeks,
      weekdayTime,
      weekendTime,
      background,
      goal,
      createdAt: new Date().toISOString(),
      schedule: schedule.length
        ? schedule
        : buildSchedule(planBooks, weeks, weekdayTime, weekendTime),
      dailyGuidance,
      dailySchedule,
      aiPlanApplied,
      adjustedWeeks: {},
      conversation: [
        ...(planPreview?.conversation || []),
        { text: planBrief, createdAt: new Date().toISOString() },
      ],
      colorIndex: editingPlanId
        ? store.studyPlans.find((p) => p.id === editingPlanId)?.colorIndex
        : store.studyPlans.length % 5,
    };
    setPlanWeeks(weeks);
    setPlanPreview(preview);
    } finally {
      setPlanGenerating(false);
    }
  }
  function listenPlanBrief() {
    const Recognition =
      (
        window as unknown as {
          SpeechRecognition?: new () => {
            lang: string;
            start: () => void;
            onresult: (event: {
              results: {
                [key: number]: { [key: number]: { transcript: string } };
              };
            }) => void;
            onend: () => void;
          };
        }
      ).SpeechRecognition ||
      (
        window as unknown as {
          webkitSpeechRecognition?: new () => {
            lang: string;
            start: () => void;
            onresult: (event: {
              results: {
                [key: number]: { [key: number]: { transcript: string } };
              };
            }) => void;
            onend: () => void;
          };
        }
      ).webkitSpeechRecognition;
    if (!Recognition) {
      setAnswer('当前浏览器不支持语音转文字，请直接输入。');
      return;
    }
    const recognition = new Recognition();
    recognition.lang = 'zh-CN';
    recognition.onresult = (event) =>
      setPlanBrief(
        (text) => `${text}${text ? '\n' : ''}${event.results[0][0].transcript}`,
      );
    recognition.onend = () => setPlannerListening(false);
    setPlannerListening(true);
    recognition.start();
  }

  function saveStudyPlan() {
    if (!planBooks.length) return;
    if (planBooks.length > 3) {
      setPlanError(language === 'zh' ? '一个学习计划最多选择 3 本书。' : 'A study plan can include up to 3 books.');
      return;
    }
    const finalPlan = planPreview || {
      id: editingPlanId || `plan-${Date.now()}`,
      name: planName.trim() || '未命名学习计划',
      startDate: planStartDate,
      endDate: new Date(
        new Date(`${planStartDate}T00:00:00`).getTime() +
          (planWeeks * 7 - 1) * 86400000,
      )
        .toISOString()
        .slice(0, 10),
      bookIds: planBooks,
      weeks: planWeeks,
      weekdayTime: planWeekdayTime,
      weekendTime: planWeekendTime,
      background: planBackground,
      goal: planGoal,
      createdAt: new Date().toISOString(),
      schedule: buildSchedule(
        planBooks,
        planWeeks,
        planWeekdayTime,
        planWeekendTime,
      ),
      adjustedWeeks: {},
      conversation: [{ text: planBrief, createdAt: new Date().toISOString() }],
      colorIndex: editingPlanId
        ? store.studyPlans.find((p) => p.id === editingPlanId)?.colorIndex
        : store.studyPlans.length % 5,
    };
    const overlaps = store.studyPlans.filter(
      (plan) =>
        plan.id !== finalPlan.id &&
        plan.startDate <= finalPlan.endDate &&
        plan.endDate >= finalPlan.startDate,
    );
    if (overlaps.length >= 3) {
      setPlanError(
        language === 'zh' ? '同一时间段最多同时安排 3 个学习计划。请调整日期或先完成一个计划。' : 'You can run at most 3 study plans in the same time window. Please adjust the dates or finish one first.',
      );
      return;
    }
    setStore((s) => ({
      ...s,
      studyPlans: [
        ...s.studyPlans.filter((plan) => plan.id !== finalPlan.id),
        finalPlan,
      ],
      activePlanId: finalPlan.id,
    }));
    setSelectedWeek(1);
    setShowPlanner(false);
    setPlanPreview(null);
    setEditingPlanId(null);
  }
  function openPlanner(target?: StudyPlan) {
    setPlanError('');
    setEditingPlanId(target?.id || null);
    setPlanPreview(target || null);
    setPlanName(target?.name || 'PE 核心能力计划');
    setPlanStartDate(target?.startDate || today);
    if (target) {
      setPlanBooks(target.bookIds);
      setPlanWeeks(target.weeks);
      setPlanWeekdayTime(target.weekdayTime);
      setPlanWeekendTime(target.weekendTime);
      setPlanBrief(target.conversation?.at(-1)?.text || target.goal);
    } else {
      const available = new Set(books.map((item) => item.id));
      setPlanBooks((current) => {
        const valid = current.filter((id) => available.has(id));
        return valid.length ? valid : books.slice(0, 2).map((item) => item.id);
      });
    }
    setShowPlanner(true);
  }

  function toggleChapterComplete(bookId: string, chapter: number) {
    const key = `${bookId}:${chapter}`;
    setStore((s) => ({
      ...s,
      completedChapters: {
        ...s.completedChapters,
        [key]: !s.completedChapters[key],
      },
    }));
  }
  function adjustWeekChapter(
    weekNo: number,
    bookId: string,
    chapterIndex: number,
    replacement: number,
  ) {
    setStore((s) => {
      const plan = s.studyPlans.find((item) => item.id === s.activePlanId) || s.studyPlans[0];
      if (!plan?.schedule || plan.adjustedWeeks?.[weekNo]) return s;
      const original = plan.schedule.find((week) => week.week === weekNo)?.units.find((unit) => unit.bookId === bookId)?.chapterNos[chapterIndex];
      if (!original || original === replacement) return s;
      return {
        ...s,
        studyPlans: s.studyPlans.map((item) => item.id !== plan.id ? item : {
          ...item,
          adjustedWeeks: { ...item.adjustedWeeks, [weekNo]: true },
          schedule: item.schedule?.map((week) => ({
            ...week,
            units: week.units.map((unit) => unit.bookId !== bookId ? unit : {
              ...unit,
              chapterNos: unit.chapterNos.map((chapter, index) =>
                week.week === weekNo && index === chapterIndex ? replacement : chapter === replacement ? original : chapter,
              ),
              summary: unit.chapterNos.map((chapter, index) => {
                const number = week.week === weekNo && index === chapterIndex ? replacement : chapter === replacement ? original : chapter;
                return `Ch.${number} ${chaptersFor(bookId).find((candidate) => candidate.n === number)?.title || ''}`;
              }).join(' · '),
            }),
          })),
          // The former daily allocation no longer matches the edited weekly plan.
          dailySchedule: undefined,
          dailyGuidance: [],
          aiPlanApplied: false,
        }),
      };
    });
  }

  async function saveImportedItem() {
    if (!importTitle.trim() && !importUrl.trim()) return;
    const ai = aiFor('import');
    const key = ai.apiKey;
    if (!key) {
      setView('settings');
      return;
    }
    setImporting(true);
    setImportError('');
    try {
      const response = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: ai.provider,
          model: ai.model,
          apiKey: key,
          thinking: ai.thinking,
          reasoningEffort: ai.reasoningEffort,
          kind: importKind,
          title: importTitle,
          url: importUrl,
          content: importContent,
        }),
      });
      const data = (await response.json()) as {
        analysis?: string;
        archive?: ArchiveMeta;
        error?: string;
      };
      if (!response.ok) throw new Error(data.error || '分析失败');
      const item: ImportedItem = {
        id: crypto.randomUUID(),
        kind: importKind,
        title: importTitle.trim() || '未命名资料',
        sourceUrl: importUrl.trim(),
        content: importContent.trim(),
        analysis: data.analysis || '',
        createdAt: new Date().toISOString(),
        archive: data.archive,
      };
      setStore((s) => ({ ...s, imports: [...s.imports, item] }));
      setImportTitle('');
      setImportUrl('');
      setImportContent('');
    } catch (e) {
      setImportError(e instanceof Error ? e.message : '分析失败');
    } finally {
      setImporting(false);
    }
  }

  async function uploadBook(file: File) {
    if (file.type !== 'application/pdf') {
      setUploadError('请选择 PDF 文件。');
      return;
    }
    setUploadingBook(true);
    setUploadError('');
    try {
      if (file.size > 180 * 1024 * 1024) throw new Error('文件过大，当前单个 PDF 请控制在 180MB 内；建议先压缩或拆分后上传。');
      const id = `local-${crypto.randomUUID()}`;
      await saveLocalPdf(id, file);
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
      const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
      const cover = await firstPageCover(pdf);
      const samples: string[] = [];
      for (let pageNo = 1; pageNo <= Math.min(pdf.numPages, 24); pageNo += 1) {
        const page = await pdf.getPage(pageNo);
        const content = await page.getTextContent();
        samples.push(textContentLines(content.items).join('\n'));
      }
      const found = new Map<number, DetectedChapter>();
      samples.forEach((text, pageIndex) => {
        const matcher = /(?:chapter|chap\.?|ch\.?|第)\s*(\d{1,3}|[一二三四五六七八九十]{1,3})\s*(?:章)?\s*[:：.\-–]?\s*([^\n]{3,80})/gi;
        for (const match of text.matchAll(matcher)) {
          const chapter = chapterFromLine(match[0], pageIndex + 1, pdf.numPages);
          if (chapter) rememberChapter(found, chapter);
        }
      });
      const chapters = storedChapters(found);
      const textLayerReady = !!samples.join('').replace(/\s/g, '').length;
      const ocrRequired = !textLayerReady || chapters.length < 4;
      const data: { book: Book } = {
        book: {
          id,
          title: cleanUploadedBookTitle(file.name),
          short: 'MY',
          file: `local:${id}`,
          cover,
          pages: pdf.numPages,
          color: '#8ca8bd',
          chapters: chapters.length ? chapters : [{ n: 1, title: ocrRequired ? '等待 OCR 识别目录' : '完整阅读', page: 1 }],
          ocrRequired,
          ocrReady: !ocrRequired,
          textLayerReady,
        },
      };
      CHAPTERS[id] = data.book.chapters || [];
      setLocalBookUrls((urls) => ({ ...urls, [id]: URL.createObjectURL(file) }));
      setStore((s) => ({
        ...s,
        uploadedBooks: [...s.uploadedBooks, data.book],
      }));
      setSelectedBookId(data.book.id);
      setSelectedChapterNo(1);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : '上传失败');
    } finally {
      setUploadingBook(false);
    }
  }
  async function ocrBookContents(target: Book) {
    if (!target.file.startsWith('local:')) return;
    setOcrIndexingBookId(target.id);
    setIndexingMode('ocr');
    setUploadError('');
    try {
      const file = await loadLocalPdf(target.id);
      if (!file) throw new Error('找不到本机文件，请重新上传。');
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
      const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker(['eng', 'chi_sim']);
      const found = new Map<number, DetectedChapter>();
      const startedAt = Date.now();
      setOcrProgress({ current: 0, total: pdf.numPages, startedAt });
      for (let pageNo = 1; pageNo <= pdf.numPages; pageNo += 1) {
        let pageText = await loadOcrPage(target.id, pageNo);
        if (!pageText) {
          const pdfPage = await pdf.getPage(pageNo);
          const viewport = pdfPage.getViewport({ scale: 1.5 });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const context = canvas.getContext('2d');
          if (!context) continue;
          await pdfPage.render({ canvas, canvasContext: context, viewport }).promise;
          const result = await worker.recognize(canvas);
          pageText = result.data.text;
          await saveOcrPage(target.id, pageNo, pageText.replace(/\s+/g, ' ').trim());
        }
        setOcrProgress({ current: pageNo, total: pdf.numPages, startedAt });
        for (const line of pageText.split('\n')) {
          const chapter = chapterFromLine(line, pageNo, pdf.numPages);
          if (chapter) rememberChapter(found, chapter);
        }
      }
      await worker.terminate();
      setStore((s) => ({ ...s, uploadedBooks: s.uploadedBooks.map((book) => book.id === target.id ? { ...book, ocrRequired: false, ocrTextReady: true } : book) }));
      if (found.size < 4) {
        setStore((s) => ({ ...s, uploadedBooks: s.uploadedBooks.map((book) => book.id === target.id ? { ...book, ocrReady: false, ocrTextReady: true } : book) }));
        throw new Error('整书 OCR 已完成，但只识别到不足 4 个章节，不能据此生成可靠计划。建议换用带清晰目录页的 PDF。');
      }
      const chapters = storedChapters(found);
      CHAPTERS[target.id] = chapters;
      setStore((s) => ({
        ...s,
        uploadedBooks: s.uploadedBooks.map((book) => book.id === target.id ? { ...book, chapters, ocrRequired: false, ocrTextReady: true, ocrReady: true } : book),
        studyPlans: s.studyPlans.map((plan) => plan.bookIds.includes(target.id)
          ? { ...plan, schedule: buildSchedule(plan.bookIds, plan.weeks, plan.weekdayTime, plan.weekendTime), dailySchedule: undefined, dailyGuidance: [], aiPlanApplied: false }
          : plan),
      }));
    } catch (ocrError) {
      setUploadError(ocrError instanceof Error ? ocrError.message : '目录 OCR 失败。');
    } finally {
      setOcrIndexingBookId(null);
      setOcrProgress(null);
      setIndexingMode(null);
    }
  }
  async function rebuildBookContents(target: Book) {
    if (!target.file.startsWith('local:')) return;
    setOcrIndexingBookId(target.id);
    setIndexingMode('contents');
    setUploadError('');
    try {
      const file = await loadLocalPdf(target.id);
      if (!file) throw new Error('找不到本机文件，请重新上传。');
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
      const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
      const found = new Map<number, DetectedChapter>();
      const startedAt = Date.now();
      setOcrProgress({ current: 0, total: pdf.numPages, startedAt });
      for (let pageNo = 1; pageNo <= pdf.numPages; pageNo += 1) {
        const pdfPage = await pdf.getPage(pageNo);
        const content = await pdfPage.getTextContent();
        const text = textContentLines(content.items).join('\n');
        const matcher = /(?:chapter|chap\.?|ch\.?|第)\s*(\d{1,3}|[一二三四五六七八九十]{1,3})\s*(?:章)?\s*[:：.\-–]?\s*([^\n]{3,100})/gi;
        for (const match of text.matchAll(matcher)) {
          const chapter = chapterFromLine(match[0], pageNo, pdf.numPages);
          if (chapter) rememberChapter(found, chapter);
        }
        setOcrProgress({ current: pageNo, total: pdf.numPages, startedAt });
      }
      const chapters = storedChapters(found);
      if (chapters.length < 4) {
        setStore((s) => ({ ...s, uploadedBooks: s.uploadedBooks.map((book) => book.id === target.id ? { ...book, ocrRequired: true, ocrReady: false, textLayerReady: false } : book) }));
        throw new Error('这本书的文字层无法提供可靠目录。请使用“整书 OCR”识别后再生成学习计划。');
      }
      CHAPTERS[target.id] = chapters;
      setStore((s) => ({
        ...s,
        uploadedBooks: s.uploadedBooks.map((book) => book.id === target.id ? { ...book, chapters, ocrRequired: false, ocrReady: true, textLayerReady: true } : book),
        studyPlans: s.studyPlans.map((plan) => plan.bookIds.includes(target.id)
          ? { ...plan, schedule: buildSchedule(plan.bookIds, plan.weeks, plan.weekdayTime, plan.weekendTime), dailySchedule: undefined, dailyGuidance: [], aiPlanApplied: false }
          : plan),
      }));
    } catch (indexError) {
      setUploadError(indexError instanceof Error ? indexError.message : '目录重建失败。');
    } finally {
      setOcrIndexingBookId(null);
      setOcrProgress(null);
      setIndexingMode(null);
    }
  }
  async function extractFormulasFromBook() {
    const target = books.find((item) => item.id === formulaBook);
    const ai = aiFor('formulas');
    const key = ai.apiKey;
    if (!target || formulaBook === 'all') {
      setFormulaError('请先在右上角选择一本书。');
      return;
    }
    if (!key) {
      setFormulaError('请先在设置中连接 DeepSeek 或 OpenAI，公式索引需要 AI 整理。');
      return;
    }
    setExtractingFormulas(true);
    setFormulaError('');
    try {
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
      const localFile = target.file.startsWith('local:') ? await loadLocalPdf(target.id) : undefined;
      const pdf = await pdfjs.getDocument(localFile ? { data: await localFile.arrayBuffer() } : target.file).promise;
      const excerpts: Array<{ page: number; text: string }> = [];
      for (let pageNo = 1; pageNo <= pdf.numPages; pageNo += 1) {
        const pdfPage = await pdf.getPage(pageNo);
        const content = await pdfPage.getTextContent();
        const text = content.items.map((item) => ('str' in item ? item.str : '')).join(' ').replace(/\s+/g, ' ').trim();
        if (/[=≈≠≤≥]|\b(?:WACC|ROIC|IRR|MOIC|EBITDA|NOPAT|EPS|CAPM|FCF|TV)\b/i.test(text)) {
          excerpts.push({ page: pageNo, text: text.slice(0, 2800) });
        }
      }
      const response = await fetch('/api/formulas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: ai.provider, model: ai.model, apiKey: key, thinking: ai.thinking, reasoningEffort: ai.reasoningEffort, bookId: target.id, bookTitle: target.title, excerpts: excerpts.slice(0, 120) }),
      });
      const data = (await response.json()) as { formulas?: FormulaCard[]; error?: string };
      if (!response.ok) throw new Error(data.error || '公式索引生成失败');
      setStore((s) => ({
        ...s,
        customFormulas: [
          ...s.customFormulas.filter((formula) => formula.bookId !== target.id),
          ...(data.formulas || []),
        ],
      }));
      setFormulaError(data.formulas?.length ? `已从《${target.title}》整理 ${data.formulas.length} 张公式卡。` : '没有在文字层中识别到公式；这本书可能是扫描件，需要 OCR。');
    } catch (error) {
      setFormulaError(error instanceof Error ? error.message : '公式索引生成失败');
    } finally {
      setExtractingFormulas(false);
    }
  }
  function archiveBook(bookId: string) {
    setStore((s) => ({
      ...s,
      archivedBooks: { ...s.archivedBooks, [bookId]: true },
      studyPlans: s.studyPlans.map((plan) => ({
        ...plan,
        bookIds: plan.bookIds.filter((id) => id !== bookId),
      })),
    }));
    if (selectedBookId === bookId) {
      const fallback = books.find((b) => b.id !== bookId);
      if (fallback) chooseBook(fallback.id);
    }
  }
  function saveClip(audioData?: string) {
    if (!selection.trim()) return;
    const clip: Clip = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      bookId: book.id,
      page,
      quote: selection,
      comment: clipComment.trim(),
      audioData,
    };
    setStore((s) => ({ ...s, clips: [...s.clips, clip] }));
    setClipComment('');
    setSelection('');
    setSelectionSuggestion('');
  }
  async function toggleRecording() {
    if (recording) {
      recorderRef.current?.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const parts: Blob[] = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => parts.push(e.data);
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const reader = new FileReader();
        reader.onloadend = () => saveClip(String(reader.result || ''));
        reader.readAsDataURL(
          new Blob(parts, { type: recorder.mimeType || 'audio/webm' }),
        );
        setRecording(false);
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
    } catch {
      setAnswer('无法启用麦克风。请允许浏览器使用麦克风后重试。');
    }
  }
  function toggleQuestionVoice() {
    const SpeechRecognition = (window as unknown as { SpeechRecognition?: new () => { lang: string; interimResults: boolean; continuous: boolean; start: () => void; stop: () => void; onresult: (event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void; onend: () => void; onerror: () => void } }).SpeechRecognition
      || (window as unknown as { webkitSpeechRecognition?: new () => { lang: string; interimResults: boolean; continuous: boolean; start: () => void; stop: () => void; onresult: (event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void; onend: () => void; onerror: () => void } }).webkitSpeechRecognition;
    if (!SpeechRecognition) { setAnswer('当前浏览器不支持语音转文字。请使用 Chrome，并允许麦克风权限。'); return; }
    if (questionListening) { setQuestionListening(false); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = language === 'zh' ? 'zh-CN' : 'en-US'; recognition.interimResults = true; recognition.continuous = false;
    recognition.onresult = (event) => setQuestion(Array.from(event.results).map((result) => result[0]?.transcript || '').join(''));
    recognition.onend = () => setQuestionListening(false);
    recognition.onerror = () => { setQuestionListening(false); setAnswer('语音输入未能完成，请检查麦克风权限后重试。'); };
    recognition.start(); setQuestionListening(true);
  }

  function openReader(
    target = selectedBook,
    startAt?: number,
    planId: string | null = null,
  ) {
    const resume = startAt || store.progress[target.id] || 1;
    sessionTexts.current = {};
    setSummaryStatus('idle');
    setSummaryPreview('');
    setReaderPlanId(planId);
    setBook(target);
    setPage(resume);
    setSessionStartPage(resume);
    setSessionStart(Date.now());
    sessionPages.current = new Set([resume]);
    setLastSession(null);
    setView('reader');
  }
  async function resolveChapterStartPage(target: Book, chapterNo: number) {
    const saved = chaptersFor(target.id).find((chapter) => chapter.n === chapterNo);
    if (!target.file.startsWith('local:')) return saved?.page || 1;
    try {
      const file = await loadLocalPdf(target.id);
      if (!file) return saved?.page || 1;
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
      const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
      for (let pageNo = 1; pageNo <= pdf.numPages; pageNo += 1) {
        const pdfPage = await pdf.getPage(pageNo);
        const content = await pdfPage.getTextContent();
        let line = '';
        const lines: string[] = [];
        for (const item of content.items) {
          if (!('str' in item)) continue;
          line += `${line ? ' ' : ''}${item.str}`;
          if ('hasEOL' in item && item.hasEOL) { lines.push(line); line = ''; }
        }
        if (line) lines.push(line);
        if (!lines.some((value) => value.trim())) {
          const ocr = await loadOcrPage(target.id, pageNo);
          if (ocr) lines.push(ocr);
        }
        const pageText = lines.join('\n');
        const headingCount = pageText.match(/(?:chapter|chap\.?|ch\.?|第)\s*(?:\d{1,3}|[一二三四五六七八九十]{1,3})/gi)?.length || 0;
        if (headingCount > 2) continue; // contents/index page
        const isHeading = lines.some((value) => {
          const candidate = chapterFromLine(value, pageNo, pdf.numPages);
          return candidate?.n === chapterNo && !candidate.tocLike;
        });
        if (!isHeading) continue;
        if (saved?.page !== pageNo) {
          const chapters = chaptersFor(target.id).map((chapter) => chapter.n === chapterNo ? { ...chapter, page: pageNo } : chapter);
          CHAPTERS[target.id] = chapters;
          setStore((current) => ({
            ...current,
            uploadedBooks: current.uploadedBooks.map((book) => book.id === target.id ? { ...book, chapters } : book),
          }));
        }
        return pageNo;
      }
    } catch {
      // Retain the saved mapping if the local file cannot be scanned right now.
    }
    return saved?.page || 1;
  }
  function openPlanReader(plan: StudyPlan) {
    const scheduled =
      plan.schedule ||
      buildSchedule(
        plan.bookIds,
        plan.weeks,
        plan.weekdayTime,
        plan.weekendTime,
      );
    const saved = plan.readerState;
    const unit =
      scheduled[(saved?.week || 1) - 1]?.units[0] || scheduled[0]?.units[0];
    const bookId = saved?.bookId || unit?.bookId || plan.bookIds[0];
    const chapterNo = saved?.chapterNo || unit?.chapterNos[0] || 1;
    const target = books.find((item) => item.id === bookId) || books[0];
    if (!target) return;
    const resume =
      saved?.page ||
      chaptersFor(bookId).find((chapter) => chapter.n === chapterNo)?.page ||
      1;
    setStore((s) => ({ ...s, activePlanId: plan.id }));
    chooseWeek(saved?.week || 1);
    setSelectedBookId(bookId);
    setSelectedChapterNo(chapterNo);
    openReader(target, resume, plan.id);
  }
  async function openPlanUnit(plan: StudyPlan, weekNo: number, unit: PlannedWeek['units'][number]) {
    const target = books.find((item) => item.id === unit.bookId);
    if (!target) return;
    const chapterNo = unit.chapterNos[0] || 1;
    const start = await resolveChapterStartPage(target, chapterNo);
    setStore((s) => ({
      ...s,
      activePlanId: plan.id,
      studyPlans: s.studyPlans.map((item) => item.id === plan.id ? {
        ...item,
        readerState: { bookId: unit.bookId, chapterNo, page: start, week: weekNo },
      } : item),
    }));
    chooseWeek(weekNo);
    setSelectedBookId(unit.bookId);
    setSelectedChapterNo(chapterNo);
    openReader(target, start, plan.id);
  }
  function openPlanBook(plan: StudyPlan, bookId: string) {
    const stats = planBookStats(plan, bookId);
    const schedule = planStats(plan).schedule;
    const week = schedule.find((item) => item.units.some((unit) => unit.bookId === bookId && unit.chapterNos.includes(stats.nextChapter))) || schedule.find((item) => item.units.some((unit) => unit.bookId === bookId));
    const unit = week?.units.find((item) => item.bookId === bookId && item.chapterNos.includes(stats.nextChapter)) || week?.units.find((item) => item.bookId === bookId);
    if (week && unit) void openPlanUnit(plan, week.week, unit);
  }
  function chooseWeek(value: number) {
    setSelectedWeek(value);
    localStorage.setItem('pe-selected-week', String(value));
  }
  function chooseBook(id: string) {
    setSelectedBookId(id);
    setSelectedChapterNo(1);
    localStorage.setItem('pe-selected-book', id);
    localStorage.setItem('pe-selected-chapter', '1');
  }
  function chooseChapter(n: number) {
    setSelectedChapterNo(n);
    localStorage.setItem('pe-selected-chapter', String(n));
  }
  useEffect(() => {
    if (ready && view === 'reader') {
      const chapters = chaptersFor(book.id);
      const current =
        [...chapters].reverse().find((c) => page >= c.page) || chapters[0];
      setStore((s) => ({
        ...s,
        progress: { ...s.progress, [book.id]: page },
        chapterProgress: {
          ...s.chapterProgress,
          [`${book.id}:${current.n}`]: page,
        },
        studyPlans: readerPlanId
          ? s.studyPlans.map((plan) =>
              plan.id === readerPlanId
                ? {
                    ...plan,
                    readerState: {
                      bookId: book.id,
                      page,
                      chapterNo: current.n,
                      week: selectedWeek,
                    },
                  }
                : plan,
            )
          : s.studyPlans,
      }));
      setSelectedBookId(book.id);
      setSelectedChapterNo(current.n);
      localStorage.setItem('pe-selected-book', book.id);
      localStorage.setItem('pe-selected-chapter', String(current.n));
    }
  }, [page, book.id, ready, view, readerPlanId, selectedWeek]);
  function saveSettings() {
    localStorage.setItem('pe-provider', provider);
    localStorage.setItem('pe-model', model);
    localStorage.setItem('pe-api-key', apiKey.trim());
    localStorage.setItem('pe-openai-api-key', openAiKey.trim());
    localStorage.setItem('pe-flash-thinking', flashThinking);
    localStorage.setItem('pe-flash-effort', flashEffort);
    localStorage.setItem('pe-pro-effort', proEffort);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }
  async function runTechnicalMock(action: 'generate' | 'review') {
    const ai = aiFor('mock');
    if (!ai.apiKey) { setView('settings'); return; }
    if (action === 'review' && !mockAnswer.trim()) return;
    setMockBusy(true);
    try {
      const response = await fetch('/api/mock', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...ai, action, question: mockQuestion, answer: mockAnswer, materials: store.imports.filter((item) => item.kind === 'interview').slice(-5).map((item) => item.analysis).join('\n\n').slice(0, 24000) }),
      });
      const data = await response.json() as { question?: string; feedback?: string; error?: string };
      if (!response.ok) throw new Error(data.error || '模拟失败');
      if (action === 'generate') { setMockQuestion(data.question || '没有生成题目。'); setMockAnswer(''); setMockFeedback(''); }
      else {
        const feedback = data.feedback || '没有生成反馈。'; setMockFeedback(feedback);
        setStore((s) => ({ ...s, questions: [...s.questions, { id: crypto.randomUUID(), createdAt: new Date().toISOString(), bookId: 'mock', page: 0, quote: '技术模拟', question: mockQuestion, answer: feedback, mode: 'technical-mock' }] }));
      }
    } catch (error) { setMockFeedback(error instanceof Error ? error.message : '模拟失败'); }
    finally { setMockBusy(false); }
  }
  async function ask(mode: string, customQuestion?: string) {
    const q =
      customQuestion ||
      question ||
      (
        {
          explain: '请解释这段话。',
          pe: '为什么这对私募股权投资重要？',
          example: '请给我一个真实交易式的应用例子。',
          challenge: '请先向我提一个问题检验理解，不要立即给答案。',
        } as Record<string, string>
      )[mode];
    if (!selection.trim()) {
      setAnswer('请先在 PDF 中复制或在下方粘贴一段原文。');
      return;
    }
    const ai = aiFor('mentor');
    const key = ai.apiKey;
    if (!key) {
      setView('settings');
      return;
    }
    setAsking(true);
    setAnswer('');
    try {
      const response = await fetch('/api/mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: ai.provider,
          model: ai.model,
          apiKey: key,
          thinking: ai.thinking,
          reasoningEffort: ai.reasoningEffort,
          book: book.title,
          page,
          quote: selection.slice(0, 6000),
          question: q,
          mode,
        }),
      });
      const data = (await response.json()) as {
        answer?: string;
        error?: string; usage?: ApiUsage;
      };
      if (!response.ok) throw new Error(data.error || '请求失败');
      const responseAnswer = data.answer || '导师没有返回内容。';
      recordUsage(data.usage, `${selection}\n${q}`, responseAnswer);
      setAnswer(responseAnswer);
      const item: QA = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        bookId: book.id,
        page,
        quote: selection,
        question: q,
        answer: responseAnswer,
        mode,
      };
      setStore((s) => ({
        ...s,
        questions: [...s.questions, item],
        progress: { ...s.progress, [book.id]: page },
      }));
      setQuestion('');
      setSelection('');
    } catch (e) {
      setAnswer(
        `暂时无法连接导师：${e instanceof Error ? e.message : '未知错误'}`,
      );
    } finally {
      setAsking(false);
    }
  }
  function finishSession() {
    const endedAt = Date.now();
    const readPages = [...sessionPages.current].sort((a, b) => a - b);
    const start = sessionStart || endedAt;
    const minutes = Math.max(
      1,
      Math.round((endedAt - start) / 60000),
    );
    const existing = store.logs.find((l) => l.date === today);
    const log: DayLog = {
      date: today,
      minutes: (existing?.minutes || 0) + minutes,
      pages: readPages.length || Math.abs(page - sessionStartPage) + 1,
      completed: true,
      bookId: book.id,
      startPage: sessionStartPage,
      endPage: page,
    };
    setStore((s) => ({
      ...s,
      logs: [...s.logs.filter((l) => l.date !== today), log],
      progress: { ...s.progress, [book.id]: page },
      streak: s.streak + (existing?.completed ? 0 : 1),
      studyPlans: readerPlanId
        ? s.studyPlans.map((plan) =>
            plan.id === readerPlanId
              ? {
                  ...plan,
                  completedChapters: {
                    ...plan.completedChapters,
                    [`${book.id}:${selectedChapterNo}`]: true,
                  },
                }
              : plan,
          )
        : s.studyPlans,
    }));
    setLastSession({
      bookId: book.id,
      startedAt: start,
      endedAt,
      startPage: sessionStartPage,
      endPage: page,
      pages: readPages.length ? readPages : [sessionStartPage, page],
      minutes,
    });
    setSessionStart(null);
  }
  async function summarizeToday() {
    const ai = aiFor('summary');
    const key = ai.apiKey;
    if (!key) {
      setView('settings');
      return;
    }
    const reading = lastSession || {
      bookId: book.id,
      startedAt: sessionStart || Date.now(),
      startPage: sessionStartPage,
      endPage: page,
      pages: [...sessionPages.current].sort((a, b) => a - b),
    };
    const sessionQuestions = store.questions.filter((item) =>
      item.bookId === reading.bookId &&
      new Date(item.createdAt).getTime() >= reading.startedAt &&
      (!reading.endedAt || new Date(item.createdAt).getTime() <= reading.endedAt),
    );
    const pageTexts = Object.entries(sessionTexts.current)
      .filter(([pageNo]) => reading.pages.includes(Number(pageNo)))
      .map(([pageNo, text]) => `【第 ${pageNo} 页】\n${text}`)
      .join('\n\n')
      .slice(0, 12000);
    setAsking(true);
    setSummaryStatus('working');
    setSummaryPreview('');
    try {
      const response = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: ai.provider,
          model: ai.model,
          apiKey: key,
          thinking: ai.thinking,
          reasoningEffort: ai.reasoningEffort,
          mode: 'daily-summary',
          query: `你是这次阅读的记录员。只基于以下真实阅读行为生成“本次阅读回顾”，不要假设固定页数或章节。书籍：《${book.title}》；开始页：${reading.startPage}；结束页：${reading.endPage}；实际访问页：${reading.pages.join('、') || `${reading.startPage}–${reading.endPage}`}；阅读时长：${reading.minutes || '进行中'} 分钟；学生问题数：${sessionQuestions.length}。务必简洁，最多 5 个项目、总计不超过 260 个中文字符；每项先中文、后括号内简短英文关键词。固定格式：标题“本次阅读”；范围、核心结论、关键概念/公式、我的问题、明日复习各一条。不要 PE 或面试延展，除非学生问题明确要求。若原文不足，直接说明。`,
          history: [
            ...sessionQuestions.slice(-4),
            {
              question: '本次实际阅读的原文摘录',
              quote: pageTexts,
              answer: '',
              bookId: reading.bookId,
              page: reading.startPage,
            },
          ],
        }),
      });
      const data = (await response.json()) as {
        answer?: string;
        error?: string; usage?: ApiUsage;
      };
      if (!response.ok) throw new Error(data.error || '总结失败');
      const content = data.answer || '没有生成总结。';
      recordUsage(data.usage, `${pageTexts}\n${sessionQuestions.map((item) => item.question).join('\n')}`, content);
      setSummaryPreview(content);
      setSummaryStatus('done');
      setStore((s) => ({
        ...s,
        summaries: [
          ...s.summaries.filter((x) => x.date !== today),
          {
            date: today,
            content,
            createdAt: new Date().toISOString(),
            bookId: reading.bookId,
            startPage: reading.startPage,
            endPage: reading.endPage,
            pages: reading.pages,
          },
        ],
      }));
    } catch (e) {
      setAnswer(e instanceof Error ? e.message : '总结失败');
      setSummaryStatus('error');
    } finally {
      setAsking(false);
    }
  }
  function exportData() {
    const blob = new Blob([JSON.stringify(store, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PE阅读教室备份-${today}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  async function searchKnowledge() {
    const query = searchQuery.trim();
    if (!query) return;
    const needle = query.toLowerCase();
    const formulaMatch = allFormulas.find((formula) => {
      const terms = [formula.name, ...formula.aliases].map((x) =>
        x.toLowerCase(),
      );
      return terms.some(
        (term) => needle.includes(term) || term.includes(needle),
      );
    });
    const matches = store.questions
      .filter((item) =>
        [item.question, item.quote, item.answer]
          .join(' ')
          .toLowerCase()
          .includes(needle),
      )
      .slice(-8)
      .reverse();
    const cached = store.knowledge.find(
      (item) => item.query.toLowerCase() === needle,
    );
    setRelated(matches);
    setView('knowledge');
    if (formulaMatch) {
      setKnowledgeTab('formulas');
      setFormulaBook(formulaMatch.bookId);
      setFormulaChapter(String(formulaMatch.chapter));
      setKnowledgeAnswer('');
      setStore((s) => {
        const old = s.formulaStats[formulaMatch.id] || {
          searches: 0,
          lastSearched: '',
          mastered: false,
        };
        return {
          ...s,
          formulaStats: {
            ...s.formulaStats,
            [formulaMatch.id]: {
              ...old,
              searches: old.searches + 1,
              lastSearched: new Date().toISOString(),
            },
          },
        };
      });
      return;
    }
    if (cached) {
      setKnowledgeAnswer(cached.answer);
      return;
    }
    const ai = aiFor('knowledge');
    const key = ai.apiKey;
    if (!key) {
      setView('settings');
      return;
    }
    setSearching(true);
    setKnowledgeAnswer('');
    try {
      const response = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: ai.provider,
          model: ai.model,
          apiKey: key,
          thinking: ai.thinking,
          reasoningEffort: ai.reasoningEffort,
          query,
          history: matches,
        }),
      });
      const data = (await response.json()) as {
        answer?: string;
        error?: string;
      };
      if (!response.ok) throw new Error(data.error || '检索失败');
      const result = data.answer || '没有找到内容。';
      setKnowledgeAnswer(result);
      const card: Knowledge = {
        id: crypto.randomUUID(),
        query,
        answer: result,
        createdAt: new Date().toISOString(),
        relatedIds: matches.map((x) => x.id),
      };
      setStore((s) => ({ ...s, knowledge: [...s.knowledge, card] }));
    } catch (e) {
      setKnowledgeAnswer(
        `检索失败：${e instanceof Error ? e.message : '未知错误'}`,
      );
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)]">
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-[var(--line)] bg-[var(--paper)] px-5 lg:px-8">
        <button
          className="flex items-center gap-3"
          onClick={() => setView('home')}
        >
          <BrandMark />
          <span className="text-left">
            <b className="block text-[17px] font-semibold tracking-tight">
              bookie loves reading
            </b>
            <span className="block text-[11px] tracking-wide text-[var(--muted)]">
              {language === 'zh'
                ? '布可 · 向着下一本书出发'
                : 'BOOKIE · CLIMB ONE BOOK HIGHER'}
            </span>
          </span>
        </button>
        <nav className="hidden items-center gap-1 md:flex">
          <Nav
            active={view === 'home'}
            icon={<BarChart3 />}
            label={language === 'zh' ? '我的书桌' : 'My Desk'}
            onClick={() => setView('home')}
          />
          <Nav
            active={view === 'reader'}
            icon={<BookOpen />}
            label={language === 'zh' ? '阅读' : 'Read'}
            onClick={() => openReader(book)}
          />
          <Nav
            active={view === 'history'}
            icon={<History />}
            label={language === 'zh' ? '读书笔记' : 'Notes'}
            onClick={() => setView('history')}
          />
          <Nav
            active={view === 'knowledge'}
            icon={<LibraryBig />}
            label={language === 'zh' ? '知识库' : 'Knowledge'}
            onClick={() => {
              setKnowledgeAnswer('');
              setKnowledgeTab('formulas');
              setView('knowledge');
            }}
          />
          <Nav
            active={view === 'review'}
            icon={<GraduationCap />}
            label={language === 'zh' ? '面试训练' : 'Interview'}
            onClick={() => {
              setImportKind('interview');
              setView('review');
            }}
          />
          <Nav
            active={view === 'intel'}
            icon={<Newspaper />}
            label={language === 'zh' ? '投资雷达' : 'Deal Radar'}
            onClick={() => {
              setImportKind('deal');
              setView('intel');
            }}
          />
        </nav>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const next = language === 'zh' ? 'en' : 'zh';
              setLanguage(next);
              localStorage.setItem('pe-language', next);
            }}
            className="rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-xs font-semibold"
            aria-label="切换语言"
          >
            {language === 'zh' ? 'EN' : '中文'}
          </button>
          <button
            onClick={() => setView('settings')}
            className="grid size-10 place-items-center rounded-xl border border-[var(--line)] bg-white"
            aria-label="设置"
          >
            <Settings className="size-4.5" />
          </button>
        </div>
      </header>

      {view === 'home' && (
        <main className="mx-auto flex max-w-7xl flex-col p-5 lg:p-8">
          <section className="order-first relative mb-7 overflow-hidden rounded-[30px] border border-[var(--line)] bg-[var(--gold-soft)] px-7 py-9 sm:px-11">
            <img src="/mascot-happy-v2.png" alt="开心的 Bookie 布可" className="bookie-hero pointer-events-none absolute bottom-[-48px] right-6 hidden w-44 object-contain sm:block" />
            <p className="text-base font-semibold tracking-[.19em] text-[var(--brown)]">
              STAY HUNGRY. STAY FOOLISH.
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
              {language === 'zh' ? '在书页之间，长出自己的判断。' : 'Let your judgment take root between the pages.'}
            </h1>
            <p className="mt-4 max-w-none pr-0 text-[17px] leading-8 text-[var(--muted)] sm:pr-44">
              {language === 'zh' ? '以经典建立知识，以提问校准理解，以反刍沉淀洞见；当好奇成为一种长期练习，你终会拥有属于自己的投资语言。' : 'Build knowledge through the classics, test it through questions, and turn reflection into insight. Sustained curiosity becomes an investment language that is truly your own.'}
            </p>
          </section>
          {store.studyPlans.length > 0 && (
            <section className="mb-7 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {store.studyPlans.map((plan, planIndex) => {
                const stats = planStats(plan);
                return (
                  <article
                    key={plan.id}
                    onClick={() => {
                      setStore((s) => ({ ...s, activePlanId: plan.id }));
                      const next = managedPlanId === plan.id ? null : plan.id;
                      setManagedPlanId(next);
                      setShowPlanManager(!!next);
                      if (next) window.setTimeout(() => document.getElementById('plan-manager')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
                    }}
                    className={`group cursor-pointer rounded-[28px] p-6 text-[var(--ink)] shadow-xl plan-theme-${(plan.colorIndex ?? planIndex) % 5}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold tracking-wide text-[var(--muted)]">
                          {plan.startDate} — {plan.endDate}
                        </p>
                        <h2 className="mt-2 text-xl font-semibold">
                          {plan.name}
                        </h2>
                      </div>
                      <img src="/bookie-logo.png" className="size-12 object-contain" alt="Bookie 布可" />
                    </div>
                    <div className="mt-3 space-y-1 text-sm leading-6 text-[var(--ink)]">
                      <p>{compactPlanGoal(plan)}</p>
                      <p className="text-[var(--muted)]">{language === 'zh' ? `节奏：工作日 ${formatStudyTime(plan.weekdayTime)}；${plan.weekendTime}` : `Rhythm: weekdays ${formatStudyTime(plan.weekdayTime)}; ${plan.weekendTime}`}</p>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      {plan.bookIds.slice(0, 3).map((id) => {
                        const planBook = books.find((item) => item.id === id);
                        return planBook ? <img key={id} src={planBook.cover} alt={planBook.title} className="h-12 w-8 rounded-md object-cover shadow-sm" /> : null;
                      })}
                      <p className="line-clamp-2 text-sm font-medium leading-5 text-[var(--ink)]">{plan.bookIds.map((id) => books.find((item) => item.id === id)?.title).filter(Boolean).join(' · ')}</p>
                    </div>
                    <div className="mt-5 flex items-end justify-between">
                      <div>
                        <p className="text-3xl font-semibold">
                          {stats.progress}%
                        </p>
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          {stats.done} / {stats.total} {language === 'zh' ? '个章节' : 'chapters'} ·{' '}
                          {formatStudyTime(plan.weekdayTime)}
                        </p>
                      </div>
                      <span className="rounded-full bg-white/60 px-3 py-1.5 text-xs font-semibold">
                        {plan.weeks} {language === 'zh' ? '周' : 'weeks'}
                      </span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/65">
                      <div
                        className="h-full rounded-full bg-[var(--ink)]"
                        style={{ width: `${stats.progress}%` }}
                      />
                    </div>
                    <div className="mt-5 space-y-3">
                      {plan.bookIds.map((bookId) => {
                        const planBook = books.find((item) => item.id === bookId);
                        const bookStats = planBookStats(plan, bookId);
                        if (!planBook) return null;
                        return <div key={bookId} className="rounded-2xl bg-white/70 p-3">
                          <div className="flex items-center gap-3"><img src={planBook.cover} alt={planBook.title} className="h-10 w-7 rounded object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{planBook.title}</p><p className="text-xs text-[var(--muted)]">{bookStats.done} / {bookStats.total} {language === 'zh' ? '个章节' : 'chapters'} · {bookStats.progress}%</p></div></div>
                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-[var(--ink)]" style={{ width: `${bookStats.progress}%` }} /></div>
                          <button onClick={(event) => { event.stopPropagation(); openPlanBook(plan, bookId); }} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-3 py-2.5 text-sm font-semibold"><Play className="size-4 fill-current" />{language === 'zh' ? '继续' : 'Continue'} · {planBook.title} · Ch.{bookStats.nextChapter}</button>
                        </div>;
                      })}
                    </div>
                  </article>
                );
              })}
            </section>
          )}
          {store.studyPlans.length > 0 && showPlanManager && managedPlanId && activePlan && (
            <section id="plan-manager" className="mb-7 rounded-[28px] border border-[var(--line)] bg-white p-5 sm:p-7">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-[var(--green)]">{activePlan.name} · {language === 'zh' ? '学习进度' : 'Study progress'}</p>
                  <h2 className="mt-1 text-xl font-semibold">{language === 'zh' ? '完整路线与本周进度' : 'Full route & weekly progress'}</h2>
                </div>
                <button onClick={() => { setShowPlanManager(false); setManagedPlanId(null); }} className="rounded-xl border border-[var(--line)] px-3 py-2 text-sm">{language === 'zh' ? '收起' : 'Collapse'}</button>
              </div>
              <p className="mt-4 text-sm leading-6 text-[var(--muted)]">每天的章节量已按工作日与周末可用时长分开分配；周末会获得更完整的阅读单元。</p>
              <DailyStudyCalendar
                plan={{ ...activePlan, schedule: planStats(activePlan).schedule }}
                books={books}
                onOpenDay={(day) => {
                  const task = day.tasks[0];
                  if (!task) return;
                  void openPlanUnit(activePlan, day.week, { bookId: task.bookId, chapterNos: [task.start], summary: '' });
                }}
              />
              <div className="mt-5 flex flex-wrap gap-2">
                <button onClick={() => openPlanner(activePlan)} className="rounded-xl bg-[var(--ink)] px-3 py-2 text-sm font-semibold text-white">{language === 'zh' ? '继续规划对话' : 'Refine with AI'}</button>
                <button onClick={() => openPlanReader(activePlan)} className="rounded-xl border border-[var(--line)] px-3 py-2 text-sm font-semibold">{language === 'zh' ? '继续阅读' : 'Continue reading'}</button>
                <button onClick={() => {
                  if (!window.confirm(language === 'zh' ? `确认删除「${activePlan.name}」吗？此操作只删除学习计划；已保存的笔记、问答和知识卡会被保留。` : `Delete “${activePlan.name}”? This only deletes the plan; notes, Q&A, and knowledge cards stay.`)) return;
                  setStore((s) => { const remaining = s.studyPlans.filter((item) => item.id !== activePlan.id); return { ...s, studyPlans: remaining, activePlanId: remaining[0]?.id }; });
                  setShowPlanManager(false); setManagedPlanId(null);
                }} className="rounded-xl border border-[#b42318]/35 bg-[#fff5f4] px-3 py-2 text-sm font-semibold text-[#b42318] hover:bg-[#fee4e2]">{language === 'zh' ? '删除计划' : 'Delete plan'}</button>
              </div>
            </section>
          )}
          <section
            className={
              store.studyPlans.length
                ? 'hidden'
                : 'mb-7'
            }
          >
            <div className="rounded-[28px] bg-[var(--green)] p-7 text-white shadow-xl lg:p-9">
              <div className="mb-6 flex items-center justify-between gap-4">
                <select
                  value={selectedWeek}
                  onChange={(e) => chooseWeek(Number(e.target.value))}
                  className="rounded-xl bg-white/12 px-3 py-2 text-sm outline-none"
                >
                  {Array.from({ length: planWeeksCount }, (_, i) => i + 1).map(
                    (n) => (
                      <option className="text-black" key={n} value={n}>
                        第 {n} 周 ·{' '}
                        {planBookIds.length === 1 ? '专注阅读' : '组合学习'}
                      </option>
                    ),
                  )}
                </select>
                <span className="text-sm text-white/70">
                  第 {selectedWeek} / {planWeeksCount} 周
                </span>
              </div>
              <p className="mb-3 text-sm text-white/65">选择今天要读的内容</p>
              <div className="grid gap-3 md:grid-cols-[minmax(0,.9fr)_minmax(0,1.4fr)]">
                <select
                  value={selectedBookId}
                  onChange={(e) => chooseBook(e.target.value)}
                  className="min-w-0 max-w-full rounded-xl bg-white/12 px-3 py-3 outline-none"
                >
                  {books.map((b) => (
                    <option className="text-black" value={b.id} key={b.id}>
                      {b.title}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedChapterNo}
                  onChange={(e) => chooseChapter(Number(e.target.value))}
                  className="min-w-0 max-w-full rounded-xl bg-white/12 px-3 py-3 outline-none"
                >
                  {chaptersFor(selectedBookId).map((c) => (
                    <option className="text-black" key={c.n} value={c.n}>
                      Chapter {c.n} · {c.title}
                    </option>
                  ))}
                </select>
              </div>
              <p className="mt-4 max-w-2xl text-[15px] leading-7 text-white/75">
                {activePlan?.goal || weekPlan.outcome}
              </p>
              <div className="mt-5">
                <div className="mb-2 flex justify-between text-xs text-white/65">
                  <span>Chapter {selectedChapter.n} 进度</span>
                  <span>{chapterProgress}%</span>
                </div>
                <input
                  aria-label="调整本章阅读进度"
                  type="range"
                  min={selectedChapter.page}
                  max={chapterEnd}
                  value={Math.max(
                    selectedChapter.page,
                    Math.min(chapterEnd, savedPage),
                  )}
                  onChange={(e) =>
                    setStore((s) => ({
                      ...s,
                      progress: {
                        ...s.progress,
                        [selectedBookId]: Number(e.target.value),
                      },
                    }))
                  }
                  className="w-full accent-[var(--gold)]"
                />
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  onClick={() =>
                    openReader(
                      selectedBook,
                      store.chapterProgress[
                        `${selectedBookId}:${selectedChapterNo}`
                      ] || selectedChapter.page,
                    )
                  }
                  className="flex items-center gap-2 rounded-xl bg-[var(--gold)] px-5 py-3 font-semibold text-[#21362f]"
                >
                  <Play className="size-4 fill-current" />
                  继续阅读 Chapter {selectedChapter.n}
                </button>
                <span className="rounded-xl bg-white/10 px-4 py-3 text-sm">
                  本周重点：{planFocus}
                </span>
              </div>
            </div>
          </section>
          <section className="hidden">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm font-semibold tracking-wide text-[var(--brown)]">
                  THE WHOLE ARC · 全局路径
                </p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                  {planWeeksCount} 周学习计划
                </h2>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  每一张卡就是一周。你可以一眼看见终点，也只需要做好这一周。
                </p>
              </div>
              <button
                onClick={() => openPlanner()}
                className="rounded-full bg-[var(--ink)] px-4 py-2.5 text-sm font-semibold text-white"
              >
                制定学习计划
              </button>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {activeSchedule.map((week) => (
                <WeekCard
                  key={week.week}
                  week={week}
                  books={books}
                  completed={store.completedChapters}
                  adjusted={!!store.studyPlan?.adjustedWeeks?.[week.week]}
                  active={selectedWeek === week.week}
                  onOpen={() => {
                    chooseWeek(week.week);
                    const first = week.units[0];
                    if (first) {
                      chooseBook(first.bookId);
                      chooseChapter(first.chapterNos[0] || 1);
                    }
                  }}
                  onAdjust={adjustWeekChapter}
                  onToggle={toggleChapterComplete}
                />
              ))}
            </div>
          </section>
          <section className="mb-7 grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
            <div className="rounded-3xl border border-[var(--line)] bg-white p-6">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-semibold">{language === 'zh' ? '我的书架' : 'My bookshelf'}</h2>
                <label className="flex items-center gap-2 rounded-xl bg-[var(--ink)] px-3 py-2 text-sm font-semibold text-white">
                  <Upload className="size-4" />
                  {uploadingBook ? (language === 'zh' ? '正在导入…' : 'Importing…') : (language === 'zh' ? '上传 PDF' : 'Upload PDF')}
                  <input
                    aria-label="上传书籍 PDF"
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    disabled={uploadingBook}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadBook(file);
                      e.currentTarget.value = '';
                    }}
                  />
                </label>
              </div>
              <p className="-mt-2 mb-4 text-xs text-[var(--muted)]">
                {language === 'zh' ? `${books.length} 本 · 扫描件或低清晰度 PDF 上传后会标记为“需要整书 OCR”；完成后会保留在本机，阅读时无需逐页重复识别。建议 200–300 dpi。移除书籍不会删除你已保存的笔记、收藏或知识卡。` : `${books.length} books · Scanned or low-resolution PDFs are marked “Full-book OCR needed”. Once complete, results stay on this computer and are reused while reading. 200–300 dpi is recommended.`}
              </p>
              {hostedMode && (
                <p className="-mt-1 mb-4 rounded-xl border border-[var(--line)] bg-[#f8faf8] px-3 py-2 text-xs leading-5 text-[var(--muted)]">
                  {language === 'zh'
                    ? '公开测试版不附带预装书籍。请只上传你拥有合法使用权的 PDF；文件与 OCR 结果仅保存在当前浏览器。'
                    : 'The public beta includes no preloaded books. Upload only PDFs you have the right to use; files and OCR results stay in this browser.'}
                </p>
              )}
              {ocrIndexingBookId && ocrProgress && (() => {
                const target = books.find((item) => item.id === ocrIndexingBookId);
                const percent = Math.round((ocrProgress.current / ocrProgress.total) * 100);
                const elapsed = (Date.now() - ocrProgress.startedAt) / 1000;
                const remaining = ocrProgress.current ? (elapsed / ocrProgress.current) * (ocrProgress.total - ocrProgress.current) : 0;
                return <div className="mb-4 rounded-2xl border border-[var(--green)]/25 bg-[#edf5ef] p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <p className="font-semibold text-[var(--ink)]">{indexingMode === 'contents' ? (language === 'zh' ? `正在重建《${target?.title || '这本书'}》的目录` : `Rebuilding contents: ${target?.title || 'this book'}`) : (language === 'zh' ? `正在 OCR《${target?.title || '这本书'}》` : `OCR in progress: ${target?.title || 'this book'}`)}</p>
                    <p className="text-sm font-medium text-[var(--green)]">{ocrProgress.current} / {ocrProgress.total} {language === 'zh' ? '页' : 'pages'} · {percent}%</p>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-[var(--green)] transition-[width] duration-500" style={{ width: `${percent}%` }} /></div>
                  <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{ocrProgress.current === 0 ? (indexingMode === 'contents' ? (language === 'zh' ? '正在读取 PDF 自带文字层，不会调用 OCR。首页完成后会计算预计剩余时间。' : 'Reading the PDF text layer; OCR is not being used. An estimate appears after the first page.') : (language === 'zh' ? '正在启动识别引擎；首张页面完成后会计算预计剩余时间。' : 'Starting the OCR engine. An estimated remaining time appears after the first page.')) : (indexingMode === 'contents' ? (language === 'zh' ? `预计还需 ${formatOcrDuration(remaining)}。这是快速目录检查，不会重复 OCR。` : `About ${formatOcrDuration(remaining)} remaining. This is a fast contents check and does not repeat OCR.`) : (language === 'zh' ? `预计还需 ${formatOcrDuration(remaining)}。已完成的页面会保存；中断后再次开始将从未完成页面继续。` : `About ${formatOcrDuration(remaining)} remaining. Completed pages are saved and a later run resumes unfinished pages.`))}</p>
                </div>;
              })()}
              {uploadError && (
                <p className="mb-3 rounded-xl bg-[var(--gold-soft)] px-3 py-2 text-sm text-[var(--ink)]">
                  {uploadError}
                </p>
              )}
              <div className="space-y-3">
                {books.map((b) => (
                  <div
                    key={b.id}
                    className="flex w-full items-center gap-4 rounded-2xl bg-[var(--soft)] p-4 text-left"
                  >
                    <button
                      onClick={() => openReader(b)}
                      className="flex min-w-0 flex-1 items-center gap-4 text-left"
                    >
                      <img
                        src={b.cover}
                        alt={`${b.title} 封面`}
                        onError={(event) => { event.currentTarget.src = '/book-placeholder.svg'; }}
                        className="h-20 w-14 shrink-0 rounded-lg object-cover shadow-sm"
                      />
                      <span className="min-w-0 flex-1">
                        <b className="block break-words line-clamp-2">{b.title}</b>
                        <span className="mt-1 block text-sm text-[var(--muted)]">
                          {language === 'zh' ? `当前第 ${store.progress[b.id] || 1} 页 · 共 ${b.pages} 页` : `Page ${store.progress[b.id] || 1} of ${b.pages}`}
                        </span>
                        {b.file.startsWith('local:') && chaptersFor(b.id).length < 4 && !b.ocrTextReady && (
                          <span className="mt-1 block text-xs font-medium text-[var(--brown)]">
                            {language === 'zh' ? `目录待补全：目前仅识别 ${chaptersFor(b.id).length} 个章节。请先重建目录；若文字层不足，再进行整书 OCR。` : `Contents need review: only ${chaptersFor(b.id).length} chapters were detected. Rebuild the contents first; use full-book OCR only if the text layer is insufficient.`}
                          </span>
                        )}
                        {b.file.startsWith('local:') && chaptersFor(b.id).length >= 4 && (
                          <span className="mt-1 block text-xs font-medium text-[var(--green)]">
                            {language === 'zh' ? `目录已识别 · ${chaptersFor(b.id).length} 个章节` : `Contents identified · ${chaptersFor(b.id).length} chapters`}
                          </span>
                        )}
                        {b.file.startsWith('local:') && b.ocrTextReady && !b.ocrReady && (
                          <span className="mt-1 block text-xs font-medium text-[var(--green)]">
                            {language === 'zh' ? '整书 OCR 已完成，但目录仍不足 4 章，不能据此生成可靠计划。' : 'Full-book OCR is complete, but fewer than four chapters were identified; a reliable plan cannot be generated from it.'}
                          </span>
                        )}
                        <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-white">
                          <i
                            className="block h-full rounded-full"
                            style={{
                              width: `${((store.progress[b.id] || 1) / b.pages) * 100}%`,
                              background: b.color,
                            }}
                          />
                        </span>
                      </span>
                      <ChevronRight className="size-4 text-[var(--muted)]" />
                    </button>
                    <button
                      onClick={() => togglePlanBook(b.id)}
                      className={`rounded-lg px-2.5 py-2 text-xs font-semibold ${planBooks.includes(b.id) ? 'bg-[var(--gold)] text-[var(--ink)]' : 'bg-white text-[var(--muted)]'}`}
                      title="加入或移出本次计划购物车"
                    >
                      {planBooks.includes(b.id) ? (language === 'zh' ? '已选入计划' : 'In this plan') : (language === 'zh' ? '加入计划' : 'Add to plan')}
                    </button>
                    {b.file.startsWith('local:') && chaptersFor(b.id).length < 4 && !b.ocrTextReady && b.textLayerReady !== false && (
                      <button
                        onClick={() => rebuildBookContents(b)}
                        disabled={ocrIndexingBookId === b.id}
                        className="rounded-lg border border-[var(--green)] px-2.5 py-2 text-xs font-semibold text-[var(--green)] disabled:opacity-50"
                      >
                        {ocrIndexingBookId === b.id ? (language === 'zh' ? `重建目录 ${ocrProgress?.current || 0}/${ocrProgress?.total || b.pages}` : `Contents ${ocrProgress?.current || 0}/${ocrProgress?.total || b.pages}`) : (language === 'zh' ? '重建目录' : 'Rebuild contents')}
                      </button>
                    )}
                    {b.file.startsWith('local:') && chaptersFor(b.id).length < 4 && !b.ocrTextReady && b.textLayerReady === false && (
                      <button
                        onClick={() => ocrBookContents(b)}
                        disabled={ocrIndexingBookId === b.id}
                        className="rounded-lg border border-[var(--green)] px-2.5 py-2 text-xs font-semibold text-[var(--green)] disabled:opacity-50"
                      >
                        {ocrIndexingBookId === b.id ? (language === 'zh' ? `整书 OCR ${ocrProgress?.current || 0}/${ocrProgress?.total || b.pages}` : `OCR ${ocrProgress?.current || 0}/${ocrProgress?.total || b.pages}`) : (language === 'zh' ? '一键 OCR 整本书' : 'OCR entire book')}
                      </button>
                    )}
                    {b.file.startsWith('local:') && b.ocrTextReady && chaptersFor(b.id).length >= 4 && (
                      <span className="rounded-lg border border-[var(--green)] bg-white px-2.5 py-2 text-xs font-semibold text-[var(--green)]">
                        {language === 'zh' ? '已完成 OCR' : 'OCR complete'}
                      </span>
                    )}
                    <button
                      aria-label={`从书架移除 ${b.title}`}
                      title="从书架移除（保留笔记）"
                      onClick={() => archiveBook(b.id)}
                      className="rounded-lg p-2 text-[var(--muted)] hover:bg-white hover:text-[var(--ink)]"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex min-h-[260px] flex-col items-center justify-center rounded-3xl border border-[var(--line)] bg-[var(--gold-soft)] p-7 text-center">
              <CalendarRange className="size-7 text-[var(--ink)]" />
              <p className="mt-4 text-sm font-semibold text-[var(--muted)]">
                {language === 'zh' ? '计划控制台' : 'Plan console'}
              </p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                {language === 'zh' ? '制定学习计划' : 'Create a study plan'}
              </h2>
              <p className="mt-3 max-w-sm text-sm leading-6 text-[var(--muted)]">
                {language === 'zh' ? '先从书架选择书，再用一句话或语音告诉 AI 你的目标与时间。它会生成可预览、可对话修改的计划。' : 'Choose books from your shelf, then tell AI your goal and available time. It will create a plan you can preview and refine.'}
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <button
                  onClick={() => openPlanner()}
                  className="rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-white"
                >
                  {language === 'zh' ? '创建新计划' : 'Create a new plan'}
                </button>
              </div>
            </div>
          </section>
          {showPlanner && (
            <PlannerModal
              books={books}
              selected={planBooks}
              onToggle={togglePlanBook}
              brief={planBrief}
              setBrief={setPlanBrief}
              preview={planPreview}
              onPreview={extractPlanFromBrief}
              generating={planGenerating}
              onListen={listenPlanBrief}
              listening={plannerListening}
              planName={planName}
              setPlanName={setPlanName}
              planStartDate={planStartDate}
              setPlanStartDate={setPlanStartDate}
              error={planError}
              onClose={() => setShowPlanner(false)}
              onSave={saveStudyPlan}
            />
          )}
        </main>
      )}

      {view === 'reader' && (
        <main className="reader-grid">
          <section className="flex min-h-0 flex-col border-r border-[var(--line)] bg-[#343735]">
            <div className="flex h-14 items-center justify-between border-b border-white/10 px-4 text-white">
              <div className="flex items-center gap-3">
                <select
                  value={book.id}
                  onChange={(e) =>
                    openReader(books.find((b) => b.id === e.target.value)!)
                  }
                  className="max-w-[260px] rounded-lg bg-white/10 px-3 py-2 text-sm"
                >
                  {books.map((b) => (
                    <option className="text-black" value={b.id} key={b.id}>
                      {b.title}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-white/50">{language === 'zh' ? `第 ${page} 页` : `Page ${page}`}</span>
                <span className="hidden text-xs text-[var(--gold)] md:inline">{sessionStart ? (language === 'zh' ? `本次阅读已开始 · 从第 ${sessionStartPage} 页追踪` : `Reading session active · tracking from page ${sessionStartPage}`) : lastSession ? (language === 'zh' ? `已打卡 · 实际阅读 ${lastSession.pages.length} 页` : `Checked in · ${lastSession.pages.length} pages read`) : ''}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={summarizeToday}
                  disabled={summaryStatus === 'working' || summaryStatus === 'done'}
                  className="rounded-lg bg-white/10 px-3 py-2 text-sm font-medium disabled:opacity-50"
                >
                  {summaryStatus === 'working' ? (language === 'zh' ? '正在生成…' : 'Generating…') : summaryStatus === 'done' ? (language === 'zh' ? '已生成回顾' : 'Recap ready') : (language === 'zh' ? '生成本次回顾' : 'Summarize session')}
                </button>
                <button
                  onClick={finishSession}
                  className="flex items-center gap-2 rounded-lg bg-[var(--gold)] px-3 py-2 text-sm font-semibold text-[#243c34]"
                >
                  <Check className="size-4" />
                  {language === 'zh' ? '结束本次阅读' : 'Finish this session'}
                </button>
              </div>
            </div>
            <PdfPage
              file={book.file.startsWith('local:') ? localBookUrls[book.id] || '' : book.file}
              page={page}
              bookId={book.id}
              language={language}
              onSelect={handlePdfSelection}
              onPageText={handlePageText}
            />
            <div className="flex h-14 items-center justify-center gap-3 border-t border-white/10 text-white">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                className="rounded-lg bg-white/10 p-2"
              >
                <ChevronLeft className="size-4" />
              </button>
              <label className="text-sm">
                {language === 'zh' ? '页码' : 'Page'}{' '}
                <input
                  value={page}
                  onChange={(e) =>
                    setPage(Math.max(1, Number(e.target.value) || 1))
                  }
                  className="mx-2 w-16 rounded-lg bg-white/10 px-2 py-1.5 text-center"
                />{' '}
                / {book.pages}
              </label>
              <button
                onClick={() => setPage(Math.min(book.pages, page + 1))}
                className="rounded-lg bg-white/10 p-2"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </section>
          <aside className="flex min-h-0 flex-col bg-[var(--paper)]">
            <div className="border-b border-[var(--line)] p-5">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-[var(--green)] text-white">
                  <Sparkles className="size-5" />
                </span>
                <div>
                  <h2 className="font-semibold">{language === 'zh' ? 'PE 导师' : 'PE Mentor'}</h2>
                  <p className="text-xs text-[var(--muted)]">
                    {provider === 'deepseek' ? 'DeepSeek' : 'OpenAI'} · {model}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <label className="mb-2 block text-sm font-medium">{language === 'zh' ? '当前划选' : 'Selected text'}</label>
              <textarea
                value={selection}
                onChange={(e) => setSelection(e.target.value)}
                placeholder={language === 'zh' ? '在左侧 PDF 中划选一句或一段，原文会自动出现在这里。' : 'Select a sentence or passage in the PDF; it will appear here.'}
                className="min-h-24 w-full resize-y rounded-2xl border border-[var(--line)] bg-white p-4 text-[15px] leading-6 outline-none"
              />
              {selectionSuggestion && selectionSuggestion !== selection && (
                <button
                  onClick={() => setSelection(selectionSuggestion)}
                  className="mt-2 w-full rounded-xl bg-[var(--gold-soft)] px-3 py-2 text-left text-sm leading-5 text-[var(--brown)]"
                >
                  {language === 'zh' ? '检测到跨行文字可能不完整 · 点击补全为整句：' : 'This selection may be broken across lines · Click to restore the full sentence:'}
                  {selectionSuggestion}
                </button>
              )}
              <section className="mt-3 rounded-2xl border border-[var(--line)] bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{language === 'zh' ? '只想留下这一刻？' : 'Want to keep this moment?'}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {language === 'zh' ? '收藏原句、写下感想，或录一段语音；不必向 AI 提问。' : 'Save the quote, write a thought, or record a voice note — no AI question required.'}
                    </p>
                  </div>
                  <Bookmark className="size-5 text-[var(--green)]" />
                </div>
                <textarea
                  value={clipComment}
                  onChange={(e) => setClipComment(e.target.value)}
                  placeholder={language === 'zh' ? '我为什么想留下它？（可选）' : 'Why do I want to keep it? (optional)'}
                  className="mt-3 min-h-18 w-full resize-y rounded-xl bg-[var(--soft)] p-3 text-sm outline-none"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    disabled={!selection.trim()}
                    onClick={() => saveClip()}
                    className="rounded-xl border border-[var(--line-strong)] px-3 py-2 text-sm font-semibold disabled:opacity-40"
                  >
                    {language === 'zh' ? '收藏文字' : 'Save quote'}
                  </button>
                  <button
                    disabled={!selection.trim()}
                    onClick={toggleRecording}
                    className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold disabled:opacity-40 ${recording ? 'bg-[#b42318] text-white' : 'bg-[var(--ink)] text-white'}`}
                  >
                    {recording ? (
                      <Square className="size-3 fill-current" />
                    ) : (
                      <Mic className="size-4" />
                    )}
                    {recording ? (language === 'zh' ? '结束录音并保存' : 'Stop & save recording') : (language === 'zh' ? '录制语音感想' : 'Record a voice note')}
                  </button>
                </div>
              </section>
              <label className="mb-2 mt-3 block text-sm font-medium">
                {language === 'zh' ? '你想问什么？' : 'What would you like to ask?'}
              </label>
              <div className="flex gap-2">
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      ask('custom');
                    }
                  }}
                  placeholder={language === 'zh' ? '例如：用浅显的小例子解释；这句话的假设是什么？' : 'For example: explain it simply; what assumptions does this make?'}
                  className="min-h-20 flex-1 resize-none rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 outline-none"
                />
                <button onClick={toggleQuestionVoice} title={language === 'zh' ? '语音输入问题' : 'Voice input'} className={`rounded-xl px-3 font-semibold ${questionListening ? 'bg-[#b42318] text-white' : 'border border-[var(--line)] bg-white text-[var(--green)]'}`}>
                  <Mic className="size-5" />
                </button>
                <button
                  disabled={asking || !question.trim()}
                  onClick={() => ask('custom')}
                  className="rounded-xl bg-[var(--green)] px-4 font-semibold text-white disabled:opacity-40"
                >
                  {language === 'zh' ? '提问' : 'Ask'}
                </button>
              </div>
              {asking && (
                <div className="mt-5 flex items-center gap-3 rounded-2xl bg-white p-5 text-sm text-[var(--muted)]">
                  <span className="size-4 animate-spin rounded-full border-2 border-[var(--line-strong)] border-t-[var(--green)]" />
                  {language === 'zh' ? '正在结合 PE 视角思考…' : 'Thinking through a PE lens…'}
                </div>
              )}
              {summaryStatus === 'working' && <div className="mt-4 rounded-2xl border border-[var(--gold)] bg-[var(--gold-soft)] p-4 text-sm">{language === 'zh' ? '正在整理本次实际阅读页、你的问题和核心结论；完成后会自动保存到读书笔记。' : 'Organising pages read, your questions, and key takeaways. The recap will be saved automatically.'}</div>}
              {summaryPreview && <section className="mt-4 rounded-2xl border border-[var(--green)] bg-[#f3f8f5] p-4"><div className="flex items-center justify-between"><p className="font-semibold text-[var(--green)]">{language === 'zh' ? '本次阅读回顾 · 已保存' : 'Reading recap · saved'}</p><button onClick={() => setView('history')} className="text-xs font-semibold text-[var(--green)]">{language === 'zh' ? '查看归档' : 'View archive'}</button></div><div className="mt-3 whitespace-pre-wrap text-sm leading-7">{summaryPreview}</div></section>}
              <div className="mb-3 mt-6 flex items-center justify-between">
                <h3 className="font-semibold">{language === 'zh' ? '今日读书笔记' : 'Today\'s reading notes'}</h3>
                <span className="text-xs text-[var(--muted)]">
                  {todayQuestions.length} {language === 'zh' ? '条' : 'items'}
                </span>
              </div>
              <div className="space-y-4">
                {todayQuestions.length ? (
                  todayQuestions
                    .slice()
                    .reverse()
                    .map((q) => (
                      <article
                        key={q.id}
                        className="rounded-2xl border border-[var(--line)] bg-white p-4"
                      >
                        <p className="text-xs text-[var(--muted)]">
                          {BOOKS.find((b) => b.id === q.bookId)?.short} · {language === 'zh' ? `第 ${q.page} 页` : `Page ${q.page}`}
                        </p>
                        <blockquote className="mt-2 border-l-2 border-[var(--gold)] pl-3 text-sm leading-6">
                          {q.quote}
                        </blockquote>
                        <p className="mt-3 font-medium">{q.question}</p>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#46534e]">
                          {q.answer}
                        </p>
                      </article>
                    ))
                ) : (
                  <Empty
                    icon={<MessageSquareText />}
                    title={language === 'zh' ? '今天还没有笔记' : 'No notes today'}
                    text={language === 'zh' ? '划选原文并提出问题，第一条读书笔记会出现在这里。' : 'Select a passage and ask a question; your first note will appear here.'}
                  />
                )}
              </div>
              {store.summaries.find((s) => s.date === today) && (
                <section className="mt-5 rounded-2xl bg-[var(--green)] p-5 text-white">
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
                    Today&apos;s summary
                  </p>
                  <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-white/90">
                    {store.summaries.find((s) => s.date === today)?.content}
                  </div>
                </section>
              )}
            </div>
          </aside>
        </main>
      )}

      {view === 'history' && (
        <PageShell
          title={language === 'zh' ? '读书笔记' : 'Reading notes'}
          subtitle={language === 'zh' ? `已经归档 ${store.questions.length} 条划线、问题与解释，全部保留书名、日期和页码。` : `${store.questions.length} saved highlights, questions, and explanations, each with its book, date, and page.`}
        >
          <div className="mb-5 flex max-w-3xl flex-wrap items-center gap-2">
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-3">
              <Search className="size-4 text-[var(--muted)]" />
              <input
              value={historyQuery}
              onChange={(e) => setHistoryQuery(e.target.value)}
              className="h-11 min-w-[220px] flex-1 outline-none"
              placeholder={language === 'zh' ? '搜索问题、原文或回答' : 'Search questions, quotes, or answers'}
              />
            </div>
            <select value={historyBook} onChange={(e) => setHistoryBook(e.target.value)} className="h-11 rounded-xl border border-[var(--line)] bg-white px-3 text-sm">
              <option value="all">{language === 'zh' ? '全部书籍' : 'All books'}</option>
              {books.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
            </select>
          </div>
          {store.summaries.length > 0 && (
            <section className="mb-6 space-y-3">
              <p className="text-sm font-semibold text-[var(--green)]">{language === 'zh' ? '按阅读场次归档的回顾' : 'Reading-session recaps'}</p>
              {store.summaries.slice().reverse().filter((item) => historyBook === 'all' || item.bookId === historyBook).map((item) => (
                <details key={item.createdAt} className="rounded-2xl border border-[var(--line)] bg-white p-5">
                  <summary className="cursor-pointer font-semibold">{item.bookId ? books.find((b) => b.id === item.bookId)?.title : (language === 'zh' ? '未关联书籍的旧回顾' : 'Older unlinked recap')} · {item.date}{item.startPage ? ` · ${language === 'zh' ? `第 ${item.startPage}–${item.endPage} 页` : `Pages ${item.startPage}–${item.endPage}`}` : ''}</summary>
                  <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[#3f4b47]">{item.content}</div>
                </details>
              ))}
            </section>
          )}
          {filteredQuestions.length ? (
            <div className="space-y-4">
              {filteredQuestions.map((q) => (
                <article
                  key={q.id}
                  className="rounded-2xl border border-[var(--line)] bg-white p-5"
                >
                  <div className="mb-3 flex items-center justify-between text-xs text-[var(--muted)]">
                    <span>
                      {q.bookId === 'mock' ? (language === 'zh' ? '技术模拟' : 'Technical mock') : books.find((b) => b.id === q.bookId)?.title} · {q.page ? (language === 'zh' ? `第 ${q.page} 页` : `Page ${q.page}`) : (language === 'zh' ? '已归档' : 'Archived')}
                    </span>
                    <span>{new Date(q.createdAt).toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US')}</span>
                  </div>
                  <blockquote className="rounded-xl border-l-4 border-[var(--gold)] bg-[var(--soft)] p-4 text-sm leading-6">
                    {q.quote}
                  </blockquote>
                  <h3 className="mt-4 font-semibold">{q.question}</h3>
                  <p className="mt-2 whitespace-pre-wrap leading-7 text-[#3f4b47]">
                    {q.answer}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <Empty
              icon={<History />}
              title={language === 'zh' ? '还没有历史记录' : 'No history yet'}
              text={language === 'zh' ? '完成第一次提问后，记录会出现在这里。' : 'Your records will appear here after your first question.'}
            />
          )}
        </PageShell>
      )}

      {view === 'review' && (
        <PageShell
          title={language === 'zh' ? '面试问题操练场' : 'Interview Practice'}
          subtitle={language === 'zh' ? '以投行经典技术题的答题结构为骨架，再加入 PE 投资判断、交易语境和英文追问。' : 'Build technical answers with PE judgment, transaction context, and English follow-up questions.'}
        >
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-3xl bg-[var(--green)] p-7 text-white">
              <p className="text-sm text-white/60">{language === 'zh' ? '训练方式' : 'Practice mode'}</p>
              <h2 className="mt-2 text-2xl font-semibold">
                {language === 'zh' ? '先回答，再获得评价' : 'Answer first. Then get feedback.'}
              </h2>
              <p className="mt-3 leading-7 text-white/75">
                {language === 'zh' ? '系统从概念准确性、结构清晰度、投资判断、下行风险和英文表达五个维度评价；不会在你回答前展示标准答案。' : 'Your answer is assessed on conceptual accuracy, structure, investment judgment, downside risks, and English expression. The model answer stays hidden until you answer.'}
              </p>
              <button onClick={() => { setMockOpen(true); if (!mockQuestion) runTechnicalMock('generate'); }} className="mt-7 rounded-xl bg-[var(--gold)] px-4 py-2.5 font-semibold text-[#243c34]">
                {language === 'zh' ? '开始技术题模拟' : 'Start technical mock'}
              </button>
            </div>
            <div className="rounded-3xl border border-[var(--line)] bg-white p-7">
              <h2 className="font-semibold">{language === 'zh' ? '训练素材' : 'Training material'}</h2>
              <div className="mt-5 space-y-3">
                <Stat label={language === 'zh' ? '已记录问题' : 'Saved questions'} value={store.questions.length} />
                <Stat
                  label={language === 'zh' ? '已完成学习日' : 'Completed study days'}
                  value={store.logs.filter((l) => l.completed).length}
                />
                <Stat
                  label={language === 'zh' ? '导入面试资料' : 'Imported interview material'}
                  value={
                    store.imports.filter((x) => x.kind === 'interview').length
                  }
                />
              </div>
            </div>
          </div>
          {mockOpen && (
            <section className="mt-6 rounded-3xl border border-[var(--green)] bg-white p-6">
              <div className="flex items-center justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wider text-[var(--green)]">Technical mock · DeepSeek Pro</p><h2 className="mt-1 text-xl font-semibold">{language === 'zh' ? '先作答，再看反馈' : 'Answer before feedback'}</h2></div><button onClick={() => setMockOpen(false)} className="rounded-xl border border-[var(--line)] p-2"><X className="size-4" /></button></div>
              <div className="mt-5 rounded-2xl bg-[var(--soft)] p-4 whitespace-pre-wrap leading-7">{mockBusy && !mockQuestion ? (language === 'zh' ? '正在根据已归档面经出题…' : 'Preparing a question from your archive…') : mockQuestion}</div>
              <textarea value={mockAnswer} onChange={(e) => setMockAnswer(e.target.value)} placeholder={language === 'zh' ? '在这里写下你的完整回答；提交后会自动归档到读书笔记。' : 'Write your answer here. Feedback will be automatically archived.'} className="mt-4 min-h-36 w-full rounded-2xl border border-[var(--line)] p-4 outline-none focus:border-[var(--green)]" />
              <div className="mt-4 flex flex-wrap gap-3"><button disabled={mockBusy} onClick={() => runTechnicalMock('review')} className="rounded-xl bg-[var(--green)] px-4 py-2.5 font-semibold text-white disabled:opacity-50">{mockBusy ? (language === 'zh' ? '正在评价…' : 'Reviewing…') : (language === 'zh' ? '提交并获取评价' : 'Submit for feedback')}</button><button disabled={mockBusy} onClick={() => runTechnicalMock('generate')} className="rounded-xl border border-[var(--line)] px-4 py-2.5 font-medium">{language === 'zh' ? '换一道题' : 'New question'}</button></div>
              {mockFeedback && <div className="mt-5 whitespace-pre-wrap rounded-2xl bg-[var(--green)] p-5 leading-7 text-white">{mockFeedback}</div>}
            </section>
          )}
          <div className="mt-6">
            <ImportWorkbench
              kind={importKind}
              setKind={setImportKind}
              url={importUrl}
              setUrl={setImportUrl}
              title={importTitle}
              setTitle={setImportTitle}
              content={importContent}
              setContent={setImportContent}
              onSave={saveImportedItem}
              importing={importing}
              error={importError}
              lockedKind="interview"
              language={language}
            />
          </div>
          <ImportArchive items={store.imports.filter((item) => item.kind === 'interview')} kind="interview" language={language} />
        </PageShell>
      )}

      {view === 'settings' && (
        <PageShell
          title="AI 与数据设置"
          subtitle="先粘贴一把 DeepSeek Key 即可开始。系统按任务自动选择 Flash 或 Pro；OpenAI 是未来高级模拟的可选项。"
        >
          <div className="max-w-2xl space-y-5">
            <section className="rounded-3xl border border-[var(--line)] bg-white p-6">
              <div className="mb-5 flex items-center gap-3">
                <KeyRound className="text-[var(--green)]" />
                <h2 className="font-semibold">你的 API Key</h2>
              </div>
              <label className="mb-2 block text-sm font-medium">DeepSeek API Key（现在必填）</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="粘贴 sk-…；只保存在这台电脑的浏览器里"
                className="h-11 w-full rounded-xl border border-[var(--line)] px-3 outline-none"
              />
              <label className="mb-2 mt-4 block text-sm font-medium">OpenAI API Key（可选，暂时不需要）</label>
              <input
                type="password"
                value={openAiKey}
                onChange={(e) => setOpenAiKey(e.target.value)}
                placeholder="以后启用高级面试模拟时再添加"
                className="h-11 w-full rounded-xl border border-[var(--line)] px-3 outline-none"
              />
              <button
                onClick={saveSettings}
                className="mt-4 flex items-center gap-2 rounded-xl bg-[var(--green)] px-4 py-2.5 font-semibold text-white"
              >
                {saved ? (
                  <>
                    <Check className="size-4" />
                    已保存
                  </>
                ) : (
                  '保存设置'
                )}
              </button>
            </section>
            <section className="rounded-3xl border border-[var(--line)] bg-white p-6">
              <h2 className="font-semibold">系统会怎样使用你的 Key</h2>
              <div className="mt-4 space-y-3 text-sm leading-6">
                <div className="rounded-2xl bg-[var(--soft)] p-4"><b>DeepSeek Flash · 日常默认</b><br />陪读问答、学习计划、当日阅读回顾、知识库检索、公式整理、面经与投资雷达归档。先以成本和速度优先。</div>
                <div className="rounded-2xl bg-[var(--soft)] p-4"><b>DeepSeek Pro · 高难任务</b><br />只用于技术模拟的出题、追问与评分。它是当前网站的最高档路由；不需要 OpenAI Key。</div>
              </div>
              <div className="mt-5 grid gap-3 rounded-2xl border border-[var(--line)] p-4 text-sm md:grid-cols-2">
                <div><label className="block font-semibold">Flash 思考模式</label><select value={flashThinking} onChange={(e) => setFlashThinking(e.target.value as 'enabled' | 'disabled')} className="mt-2 h-10 w-full rounded-xl border border-[var(--line)] bg-white px-3"><option value="disabled">关闭：最快、最省</option><option value="enabled">开启：更仔细</option></select></div>
                <div><label className="block font-semibold">Flash 推理强度</label><select disabled={flashThinking === 'disabled'} value={flashEffort} onChange={(e) => setFlashEffort(e.target.value as 'low' | 'medium' | 'high')} className="mt-2 h-10 w-full rounded-xl border border-[var(--line)] bg-white px-3 disabled:opacity-40"><option value="low">低</option><option value="medium">中</option><option value="high">高</option></select></div>
                <div className="md:col-span-2"><label className="block font-semibold">Pro 推理强度（仅技术模拟）</label><select value={proEffort} onChange={(e) => setProEffort(e.target.value as 'low' | 'medium' | 'high')} className="mt-2 h-10 w-full rounded-xl border border-[var(--line)] bg-white px-3"><option value="low">低：更快</option><option value="medium">中：平衡</option><option value="high">高：更深入</option></select></div>
              </div>
              <p className="mt-4 text-xs leading-5 text-[var(--muted)]">本地版会把 Key 存在当前浏览器，不上传到我们的数据库。正式上线前会改为用户登录后的加密服务端配置。</p>
            </section>
            <section className="rounded-3xl border border-[var(--line)] bg-white p-6">
              <div className="flex items-center justify-between gap-4"><div><h2 className="font-semibold">今日 AI 用量</h2><p className="mt-1 text-sm text-[var(--muted)]">本机估算，用于控制习惯；最终扣费以 DeepSeek 控制台账单为准。</p></div><button onClick={() => { const empty = { date: today, input: 0, output: 0, requests: 0 }; setTokenUsage(empty); localStorage.setItem('pe-token-usage', JSON.stringify(empty)); }} className="text-sm font-medium text-[var(--green)]">清零本地统计</button></div>
              <div className="mt-4 grid grid-cols-3 gap-3"><div className="rounded-2xl bg-[var(--soft)] p-4"><p className="text-xs text-[var(--muted)]">请求</p><b className="mt-1 block text-xl">{tokenUsage.requests}</b></div><div className="rounded-2xl bg-[var(--soft)] p-4"><p className="text-xs text-[var(--muted)]">输入 tokens</p><b className="mt-1 block text-xl">≈ {tokenUsage.input.toLocaleString()}</b></div><div className="rounded-2xl bg-[var(--soft)] p-4"><p className="text-xs text-[var(--muted)]">输出 tokens</p><b className="mt-1 block text-xl">≈ {tokenUsage.output.toLocaleString()}</b></div></div>
            </section>
            <section className="rounded-3xl border border-[var(--line)] bg-white p-6">
              <h2 className="font-semibold">数据与备份</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                当前版本把记录保存在这台电脑的浏览器中，并支持完整备份。下一步将迁移至本地
                SQLite 数据库。
              </p>
              <button
                onClick={exportData}
                className="mt-4 flex items-center gap-2 rounded-xl border border-[var(--line-strong)] px-4 py-2.5 font-medium"
              >
                <Download className="size-4" />
                导出全部学习数据
              </button>
            </section>
          </div>
        </PageShell>
      )}
      {view === 'knowledge' && (
        <PageShell
          title={knowledgeAnswer ? (language === 'zh' ? '检索结果' : 'Search result') : (language === 'zh' ? '知识卡' : 'Knowledge cards')}
          subtitle={
            knowledgeAnswer
              ? (language === 'zh' ? '由首页检索生成，并结合相关历史读书笔记。' : 'Generated from your search and connected reading notes.')
              : (language === 'zh' ? '已经整理完成、可以直接复用的中英文投资与面试框架。' : 'Organised investment and interview frameworks, ready to reuse in Chinese and English.')
          }
        >
          {!knowledgeAnswer && !searching && (
            <section className="mb-6 rounded-2xl border border-[var(--line)] bg-white p-5">
              <div className="mb-3 flex items-center gap-2">
                <Search className="size-5 text-[var(--green)]" />
                <h2 className="font-semibold">{language === 'zh' ? '检索全部 PE 知识' : 'Search all PE knowledge'}</h2>
              </div>
              <div className="flex gap-2">
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') searchKnowledge();
                  }}
                  className="h-12 flex-1 rounded-xl border border-[var(--line)] bg-[var(--paper)] px-4 outline-none focus:border-[var(--green)]"
                  placeholder={language === 'zh' ? '例如：什么是 WACC？如何对 AI 公司进行估值？' : 'For example: What is WACC? How would you value an AI company?'}
                />
                <button
                  onClick={searchKnowledge}
                  className="rounded-xl bg-[var(--green)] px-5 font-semibold text-white"
                >
                  {language === 'zh' ? '搜索' : 'Search'}
                </button>
              </div>
            </section>
          )}
          {!knowledgeAnswer && !searching && (
            <>
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex rounded-xl bg-[var(--soft)] p-1">
                  <button
                    onClick={() => setKnowledgeTab('formulas')}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold ${knowledgeTab === 'formulas' ? 'bg-white text-[var(--green)] shadow-sm' : 'text-[var(--muted)]'}`}
                  >
                    {language === 'zh' ? '核心公式' : 'Core formulas'}
                  </button>
                  <button
                    onClick={() => setKnowledgeTab('mine')}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold ${knowledgeTab === 'mine' ? 'bg-white text-[var(--green)] shadow-sm' : 'text-[var(--muted)]'}`}
                  >
                    {language === 'zh' ? '我的知识卡' : 'My knowledge cards'}
                  </button>
                </div>
                {knowledgeTab === 'formulas' && (
                  <div className="flex gap-2">
                    <select
                      value={formulaBook}
                      onChange={(e) => {
                        setFormulaBook(e.target.value);
                        setFormulaChapter('all');
                      }}
                      className="h-10 rounded-xl border border-[var(--line)] bg-white px-3 text-sm"
                    >
                      <option value="all">{language === 'zh' ? '全部书籍' : 'All books'}</option>
                      {books.map((book) => (
                        <option value={book.id} key={book.id}>{book.title}</option>
                      ))}
                    </select>
                    <select
                      value={formulaChapter}
                      onChange={(e) => setFormulaChapter(e.target.value)}
                      className="h-10 rounded-xl border border-[var(--line)] bg-white px-3 text-sm"
                    >
                      <option value="all">{language === 'zh' ? '全部章节' : 'All chapters'}</option>
                      {Array.from(
                        new Set(
                          allFormulas.filter(
                            (f) =>
                              formulaBook === 'all' || f.bookId === formulaBook,
                          ).map((f) => f.chapter),
                        ),
                      )
                        .sort((a, b) => a - b)
                        .map((n) => (
                          <option key={n} value={n}>
                            Chapter {n}
                          </option>
                        ))}
                    </select>
                    {formulaBook !== 'all' && (
                      <button
                        onClick={extractFormulasFromBook}
                        disabled={extractingFormulas}
                        className="rounded-xl bg-[var(--ink)] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                      >
                        {extractingFormulas ? (language === 'zh' ? '正在建立公式索引…' : 'Building formula index…') : (language === 'zh' ? 'AI 导出本书公式' : 'Extract formulas with AI')}
                      </button>
                    )}
                  </div>
                )}
              </div>
              {formulaError && (
                <p className="-mt-2 mb-4 rounded-xl bg-[var(--gold-soft)] px-3 py-2 text-sm text-[var(--ink)]">{formulaError}</p>
              )}
              {knowledgeTab === 'formulas' && (
                <div className="grid gap-5 xl:grid-cols-2">
                  {allFormulas.filter(
                    (f) =>
                      (formulaBook === 'all' || f.bookId === formulaBook) &&
                      (formulaChapter === 'all' ||
                        f.chapter === Number(formulaChapter)),
                  ).map((formula) => (
                    <FormulaKnowledgeCard
                      key={formula.id}
                      formula={formula}
                      stats={store.formulaStats[formula.id]}
                      language={language}
                      onToggleMastered={() =>
                        setStore((s) => {
                          const old = s.formulaStats[formula.id] || {
                            searches: 0,
                            lastSearched: '',
                            mastered: false,
                          };
                          return {
                            ...s,
                            formulaStats: {
                              ...s.formulaStats,
                              [formula.id]: { ...old, mastered: !old.mastered },
                            },
                          };
                        })
                      }
                    />
                  ))}
                </div>
              )}
            </>
          )}
          {!knowledgeAnswer &&
            !searching &&
            knowledgeTab === 'mine' &&
            (store.knowledge.length ? (
              <div className="grid gap-4 md:grid-cols-2">
                {store.knowledge
                  .slice()
                  .reverse()
                  .map((card) => (
                    <button
                      key={card.id}
                      onClick={() => {
                        setSearchQuery(card.query);
                        setKnowledgeAnswer(card.answer);
                      }}
                      className="rounded-2xl border border-[var(--line)] bg-white p-5 text-left hover:border-[var(--green)]"
                    >
                      <p className="text-xs text-[var(--muted)]">
                        {new Date(card.createdAt).toLocaleDateString('zh-CN')}
                      </p>
                      <h2 className="mt-2 text-lg font-semibold">
                        {card.query}
                      </h2>
                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--muted)]">
                        {card.answer}
                      </p>
                    </button>
                  ))}
              </div>
            ) : (
              <Empty
                icon={<LibraryBig />}
                title={language === 'zh' ? '还没有知识卡' : 'No knowledge cards yet'}
                text={language === 'zh' ? '请从学习台顶部搜索一个主题。整理后的结果会自动保存到这里。' : 'Search a topic from My Desk; organised results will be saved here.'}
              />
            ))}
          {searching && (
            <div className="rounded-3xl border border-[var(--line)] bg-white p-8 text-[var(--muted)]">
              {language === 'zh' ? '正在检索历史记录并整理中英文面试答案…' : 'Searching your history and organising bilingual interview answers…'}
            </div>
          )}
          {knowledgeAnswer && !searching && (
            <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
              <article className="rounded-3xl border border-[var(--line)] bg-white p-6 lg:p-8">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[var(--green)]">
                      {language === 'zh' ? '知识摘要' : 'Knowledge brief'}
                    </p>
                    <h2 className="mt-1 text-2xl font-semibold">
                      {searchQuery}
                    </h2>
                  </div>
                  <button
                    onClick={() =>
                      navigator.clipboard.writeText(knowledgeAnswer)
                    }
                    className="rounded-xl border border-[var(--line)] px-3 py-2 text-sm"
                  >
                    {language === 'zh' ? '复制答案' : 'Copy answer'}
                  </button>
                </div>
                <div className="whitespace-pre-wrap leading-7">
                  {knowledgeAnswer}
                </div>
              </article>
              <aside className="rounded-2xl border border-[var(--line)] bg-white p-5">
                <h3 className="font-semibold">相关历史问答</h3>
                {related.length ? (
                  <div className="mt-4 space-y-4">
                    {related.map((q) => (
                      <QuestionRow key={q.id} q={q} />
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                    还没有直接匹配的历史问题。本次答案将作为新的知识卡保存。
                  </p>
                )}
              </aside>
            </div>
          )}
        </PageShell>
      )}
      {view === 'plan' && (
        <PageShell
          title="学习计划"
          subtitle="每个计划是一条独立的学习路径。修改路径时，直接继续和 AI 对话。"
        >
          <div className="mb-7 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-[var(--line)] bg-[var(--gold-soft)] p-6">
            <div>
              <p className="text-sm font-semibold text-[var(--muted)]">
                PLAN CONTROL PANEL
              </p>
              <h2 className="mt-1 text-2xl font-semibold">
                把目标变成一段可执行的时间。
              </h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                同一时间段最多并行 5 个计划；计划数量不限。
              </p>
            </div>
            <button
              onClick={() => openPlanner()}
              className="rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-white"
            >
              创建学习计划
            </button>
          </div>
          {store.studyPlans.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[var(--line-strong)] p-10 text-center">
              <h2 className="text-xl font-semibold">还没有学习计划</h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                从书架挑选书籍，再用一句话告诉我你的时间和目标。
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {store.studyPlans.map((plan) => {
                const isActive = plan.id === activePlan?.id;
                const collapsed = plan.collapsed ?? !isActive;
                return (
                  <section
                    key={plan.id}
                    className="rounded-3xl border border-[var(--line)] bg-white p-6"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <button
                        className="text-left"
                        onClick={() =>
                          setStore((s) => ({
                            ...s,
                            activePlanId: plan.id,
                            studyPlans: s.studyPlans.map((p) =>
                              p.id === plan.id
                                ? { ...p, collapsed: !collapsed }
                                : p,
                            ),
                          }))
                        }
                      >
                        <p className="text-sm font-semibold text-[var(--muted)]">
                          {plan.startDate} — {plan.endDate}
                        </p>
                        <h2 className="mt-1 text-xl font-semibold">
                          {plan.name}
                        </h2>
                        <p className="mt-2 text-sm text-[var(--muted)]">
                          {plan.bookIds
                            .map((id) => books.find((b) => b.id === id)?.title)
                            .filter(Boolean)
                            .join(' · ')}{' '}
                          · {plan.weeks} 周
                        </p>
                      </button>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            setStore((s) => ({ ...s, activePlanId: plan.id }))
                          }
                          className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold"
                        >
                          设为当前
                        </button>
                        <button
                          onClick={() => openPlanner(plan)}
                          className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold"
                        >
                          与 AI 修改
                        </button>
                        <button
                          onClick={() => openPlanReader(plan)}
                          className="rounded-full bg-[var(--ink)] px-4 py-2 text-sm font-semibold text-white"
                        >
                          继续阅读
                        </button>
                        <button
                          onClick={() =>
                            setStore((s) => ({
                              ...s,
                              studyPlans: s.studyPlans.map((p) =>
                                p.id === plan.id
                                  ? { ...p, collapsed: !collapsed }
                                  : p,
                              ),
                            }))
                          }
                          className="rounded-full bg-[var(--soft)] px-4 py-2 text-sm font-semibold"
                        >
                          {collapsed ? '展开' : '收起'}
                        </button>
                      </div>
                    </div>
                    {!collapsed && (
                      <div className="mt-6 grid gap-3 md:grid-cols-2">
                        {(
                          plan.schedule ||
                          buildSchedule(plan.bookIds, plan.weeks)
                        ).map((week) => {
                          const keys = week.units.flatMap((u) =>
                            u.chapterNos.map((n) => `${u.bookId}:${n}`),
                          );
                          const done =
                            keys.length > 0 &&
                            keys.every(
                              (key) =>
                                (plan.completedChapters ||
                                  store.completedChapters)[key],
                            );
                          return (
                            <article
                              key={week.week}
                              className="week-card rounded-2xl p-4"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-xs font-semibold tracking-wide text-[var(--muted)]">
                                    WEEK {week.week}
                                  </p>
                                  <h3 className="mt-1 font-semibold">
                                    {week.focus}
                                  </h3>
                                </div>
                                <img
                                  className={`mascot ${done ? '' : 'mascot-grumpy'}`}
                                  src={
                                    done
                                      ? '/mascot-happy-v2.png'
                                      : '/mascot-grumpy.png'
                                  }
                                  alt={done ? '开心的小猫' : '傲娇的小猫'}
                                />
                              </div>
                              <p className="mt-3 text-sm leading-6">
                                <b>阅读：</b>
                                {week.units
                                  .map(
                                    (u) =>
                                      `${books.find((b) => b.id === u.bookId)?.short || '书'} ${u.chapterNos.map((n) => `Ch.${n}`).join('、')}`,
                                  )
                                  .join('；')}
                              </p>
                              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                                <b className="text-[var(--ink)]">学会：</b>
                                {week.outcome}
                              </p>
                              <p className="mt-2 text-xs text-[var(--muted)]">
                                节奏：{formatStudyTime(plan.weekdayTime)}；{plan.weekendTime}
                              </p>
                            </article>
                          );
                        })}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          )}
        </PageShell>
      )}
      {view === 'plan' && false && (
        <PageShell
          title="12 周学习计划"
          subtitle="可以查看每周主题、章节和产出，也可以从任意一周直接开始。"
        >
          <div className="space-y-4">
            {WEEKS.map((w, i) => (
              <section
                key={w.week}
                className={`rounded-2xl border bg-white p-5 ${selectedWeek === w.week ? 'border-[var(--green)] ring-1 ring-[var(--green)]' : 'border-[var(--line)]'}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-[var(--green)]">
                      第 {w.week} 周
                    </p>
                    <h2 className="mt-1 text-xl font-semibold">{w.theme}</h2>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                      {w.outcome}
                    </p>
                    <div className="mt-4 grid gap-2 text-sm">
                      <p className="rounded-xl bg-[var(--soft)] px-4 py-3">
                        <b>McKinsey Valuation：</b>
                        {WEEK_DETAILS[i].mc}
                      </p>
                      <p className="rounded-xl bg-[var(--gold-soft)] px-4 py-3">
                        <b>Investment Banking：</b>
                        {WEEK_DETAILS[i].ib}
                      </p>
                      <p className="px-1 pt-1 text-[var(--muted)]">
                        <b className="text-[var(--ink)]">本周学会：</b>
                        {WEEK_DETAILS[i].learn}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {CHAPTERS.valuation
                          .filter(
                            (c) =>
                              WEEK_DETAILS[i].mc.includes(`Ch.${c.n}`) ||
                              (i === 0 && c.n <= 3),
                          )
                          .slice(0, 8)
                          .map((c) => {
                            const done =
                              !!store.completedChapters[`valuation:${c.n}`];
                            return (
                              <button
                                key={c.n}
                                onClick={() =>
                                  toggleChapterComplete('valuation', c.n)
                                }
                                className={`rounded-lg px-3 py-2 text-xs font-semibold ${done ? 'bg-[var(--green)] text-white' : 'border border-[var(--line)]'}`}
                              >
                                {done ? '✓ ' : ''}MV Ch.{c.n}
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      chooseWeek(w.week);
                      setView('home');
                    }}
                    className="rounded-xl bg-[var(--green)] px-4 py-2.5 text-sm font-semibold text-white"
                  >
                    {selectedWeek === w.week ? '当前阶段' : '进入这一周'}
                  </button>
                </div>
              </section>
            ))}
          </div>
          <section className="mt-7 rounded-3xl border border-[var(--line)] bg-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">灵活管理全部章节</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  不准备深入学习的章节可以直接标记完成；之后随时点击恢复。
                </p>
              </div>
              <span className="text-sm font-semibold text-[var(--green)]">
                {completedPlanChapters} / {plannedChapterKeys.length}
              </span>
            </div>
            <div className="mt-5 space-y-5">
              {(store.studyPlan?.bookIds || BOOKS.map((b) => b.id)).map(
                (bookId) => (
                  <div key={bookId}>
                    <h3 className="mb-3 font-semibold">
                      {BOOKS.find((b) => b.id === bookId)?.title}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {chaptersFor(bookId).map((c) => {
                        const done =
                          !!store.completedChapters[`${bookId}:${c.n}`];
                        return (
                          <button
                            key={c.n}
                            title={c.title}
                            onClick={() => toggleChapterComplete(bookId, c.n)}
                            className={`rounded-lg px-3 py-2 text-xs font-semibold ${done ? 'bg-[var(--green)] text-white' : 'border border-[var(--line)] bg-[var(--soft)]'}`}
                          >
                            {done ? '✓ ' : ''}Ch.{c.n}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ),
              )}
            </div>
          </section>
        </PageShell>
      )}
      {view === 'intel' && (
        <PageShell
          title={language === 'zh' ? '投资雷达' : 'Deal Radar'}
          subtitle={language === 'zh' ? '把公众号文章、交易新闻和行业资料转成可复用的一级市场判断框架。' : 'Turn deal news and industry material into reusable private-market judgment.'}
        >
          <ImportWorkbench
            kind={importKind}
            setKind={setImportKind}
            url={importUrl}
            setUrl={setImportUrl}
            title={importTitle}
            setTitle={setImportTitle}
            content={importContent}
            setContent={setImportContent}
            onSave={saveImportedItem}
            importing={importing}
            error={importError}
            lockedKind="deal"
            language={language}
          />
          <ImportArchive items={store.imports.filter((item) => item.kind === 'deal')} kind="deal" language={language} />
        </PageShell>
      )}
    </div>
  );
}

function Nav({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium ${active ? 'bg-[var(--green)] text-white' : 'text-[var(--muted)] hover:bg-[var(--soft)]'}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
function BrandMark() {
  return (
    <img
      className="size-11 object-contain"
      src="/bookie-logo.png"
      alt="Bookie 布可"
    />
  );
}
function WeekCard({
  week,
  books,
  completed,
  adjusted,
  active,
  onOpen,
  onAdjust,
  onToggle,
}: {
  week: PlannedWeek;
  books: Book[];
  completed: Record<string, boolean>;
  adjusted: boolean;
  active: boolean;
  onOpen: () => void;
  onAdjust: (
    week: number,
    bookId: string,
    chapterIndex: number,
    replacement: number,
  ) => void;
  onToggle: (bookId: string, chapter: number) => void;
}) {
  const chapters = week.units.flatMap((unit) =>
    unit.chapterNos.map((n) => `${unit.bookId}:${n}`),
  );
  const done = chapters.length > 0 && chapters.every((key) => completed[key]);
  return (
    <article
      className={`week-card rounded-[24px] p-4 ${active ? 'is-current' : ''} ${done ? 'is-done' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold tracking-wide text-[var(--brown)]">
            WEEK {week.week}
          </p>
          <h3 className="mt-1 font-semibold">{week.focus}</h3>
        </div>
        <span className="text-2xl" title={done ? '已完成' : '本周待完成'}>
          {done ? '🏅' : '😾'}
        </span>
      </div>
      <div className="mt-3 space-y-2">
        {week.units.map((unit) => (
          <div key={unit.bookId} className="rounded-2xl bg-white/55 p-3">
            <p className="text-xs font-semibold text-[var(--muted)]">
              {books.find((b) => b.id === unit.bookId)?.title || 'My book'}
            </p>
            <p className="mt-1 text-sm leading-5">{unit.summary}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {unit.chapterNos.map((chapterNo) => {
                const isComplete = !!completed[`${unit.bookId}:${chapterNo}`];
                return (
                  <button
                    key={chapterNo}
                    onClick={() => onToggle(unit.bookId, chapterNo)}
                    className={`rounded-full px-2 py-1 text-[11px] font-semibold ${isComplete ? 'bg-[var(--brown)] text-white' : 'bg-white/80 text-[var(--muted)]'}`}
                  >
                    {isComplete ? '✓ ' : ''}Ch.{chapterNo}
                  </button>
                );
              })}
            </div>
            {!adjusted && active && unit.chapterNos.length > 0 && (
              <label className="mt-2 block text-xs text-[var(--muted)]">
                只可调整一次{' '}
                <select
                  defaultValue={unit.chapterNos[0]}
                  onChange={(e) =>
                    onAdjust(week.week, unit.bookId, 0, Number(e.target.value))
                  }
                  className="ml-1 rounded-lg border border-[var(--line)] bg-white px-1 py-1 text-xs"
                >
                  {chaptersFor(unit.bookId).map((chapter) => (
                    <option key={chapter.n} value={chapter.n}>
                      Ch.{chapter.n} · {chapter.title}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {adjusted && (
              <p className="mt-2 text-xs font-semibold text-[var(--brown)]">
                本周已使用一次调整
              </p>
            )}
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs leading-5 text-[var(--muted)]">
        {week.outcome}
      </p>
      <button
        onClick={onOpen}
        className="mt-3 rounded-full bg-white/70 px-3 py-2 text-xs font-semibold"
      >
        {active ? '当前周' : '进入本周'}
      </button>
    </article>
  );
}
function DailyStudyCalendar({ plan, books, onOpenDay }: { plan: StudyPlan; books: Book[]; onOpenDay?: (day: PlannedDay) => void }) {
  const schedule = plan.schedule || [];
  const days = plan.dailySchedule?.length
    ? plan.dailySchedule
    : dailyRowsForSchedule(schedule, plan.startDate, plan.weekdayTime, plan.weekendTime);
  if (!days.length) return null;
  return <div className="mt-5 space-y-5">
    {schedule.map((week) => {
      const weekDays = days.filter((day) => day.week === week.week);
      return <section key={week.week} className="rounded-2xl border border-[var(--line)] bg-[#fbfcfb] p-3 sm:p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <b className="text-sm">第 {week.week} 周 · 每日阅读安排</b>
          <span className="text-xs text-[var(--muted)]">{weekDays[0]?.date.replaceAll('-', '.')} – {weekDays.at(-1)?.date.replaceAll('-', '.')}</span>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-7">
          {weekDays.map((day) => {
            const guidance = plan.dailyGuidance?.find((item) => item.week === day.week && item.day === day.day);
            const completed = day.tasks.length > 0 && day.tasks.every((task) => Array.from({ length: task.end - task.start + 1 }, (_, index) => (plan.completedChapters || {})[`${task.bookId}:${task.start + index}`]).every(Boolean));
            const isLate = !completed && day.date < localDateKey(new Date());
            const mood = completed ? 'done' : isLate ? 'late' : 'cheer';
            const mascot = mood === 'done' ? '/mascot-happy-v2.png' : mood === 'late' ? '/mascot-grumpy.png' : '/bookie-logo.png';
            const moodLabel = mood === 'done' ? 'Bookie 很开心：今日任务已完成' : mood === 'late' ? 'Bookie 有点不开心：今日任务尚未完成' : 'Bookie 正在为你加油';
            const content = <>
              <div className="flex items-start justify-between gap-2">
                <div><b className="text-xs">{day.label} ({day.date.slice(5).replace('-', '.')})</b><span className="mt-1 block text-[10px] text-[var(--muted)]">{mood === 'done' ? '已完成' : mood === 'late' ? '待补上' : '加油'}</span></div>
                <img src={mascot} alt={moodLabel} title={moodLabel} className={`day-mascot ${mood === 'late' ? 'mascot-grumpy' : mood === 'cheer' ? 'mascot-cheer' : ''}`} />
                <span className="text-[11px] text-[var(--muted)]">{day.time}</span>
              </div>
              {day.tasks.length ? <>
                <p className="mt-2 text-xs font-semibold leading-5 text-[var(--ink)]">
                  {day.tasks.map((task) => {
                    const book = books.find((item) => item.id === task.bookId);
                    return `${scheduleBookLabel(book)} · Ch.${task.start}${task.end !== task.start ? `–Ch.${task.end}` : ''}${task.part ? `（第 ${task.part} 段）` : ''}`;
                  }).join('；')}
                </p>
                {(day.outcome || guidance?.outcome) && <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{day.outcome || guidance?.outcome}</p>}
                {!guidance?.outcome && <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{plan.aiPlanApplied ? '阅读本章核心内容' : 'AI 重点未生成，请重新生成计划预览'}</p>}
              </> : <p className="mt-3 text-xs leading-5 text-[var(--muted)]">本周没有可分配章节</p>}
            </>;
            return onOpenDay && day.tasks.length ? <button key={day.date} onClick={() => onOpenDay(day)} className="min-h-28 rounded-xl bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:ring-2 hover:ring-[var(--green)]/30" title="打开当天安排的章节">{content}</button> : <article key={day.date} className={`min-h-28 rounded-xl p-3 ${day.tasks.length ? 'bg-white shadow-sm' : 'bg-[var(--soft)]/70'}`}>{content}</article>;
          })}
        </div>
      </section>;
    })}
  </div>;
}

function PlannerModal({
  books,
  selected,
  onToggle,
  brief,
  setBrief,
  preview,
  onPreview,
  generating,
  onListen,
  listening,
  planName,
  setPlanName,
  planStartDate,
  setPlanStartDate,
  error,
  onClose,
  onSave,
}: {
  books: Book[];
  selected: string[];
  onToggle: (id: string) => void;
  brief: string;
  setBrief: (v: string) => void;
  preview: StudyPlan | null;
  onPreview: () => void;
  generating: boolean;
  onListen: () => void;
  listening: boolean;
  planName: string;
  setPlanName: (v: string) => void;
  planStartDate: string;
  setPlanStartDate: (v: string) => void;
  error: string;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
    >
      <section className="planner-dialog max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl p-6 shadow-2xl lg:p-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--green)]">
              学习计划控制台
            </p>
            <h2 className="mt-1 text-2xl font-semibold">
              先选书，再告诉 AI 你想去哪里。
            </h2>
            <p className="mt-2 text-sm text-[var(--muted)]">已选择 {selected.length} / 3 本书；点击书籍卡片可多选或取消。</p>
          </div>
          <button onClick={onClose} className="rounded-xl bg-white p-2">
            <X className="size-5" />
          </button>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium">
            计划名称
            <input
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              className="mt-2 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 outline-none"
              placeholder="例如：2026 秋招 PE 冲刺"
            />
          </label>
          <label className="text-sm font-medium">
            开始日期
            <input
              type="date"
              value={planStartDate}
              onChange={(e) => setPlanStartDate(e.target.value)}
              className="mt-2 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 outline-none"
            />
          </label>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {books.map((book) => {
            const active = selected.includes(book.id);
            return (
              <button
                key={book.id}
                onClick={() => onToggle(book.id)}
                className={`plan-book flex items-center gap-4 rounded-[26px] border p-4 text-left ${active ? 'is-active' : ''}`}
              >
                <img
                  src={book.cover}
                  alt=""
                  className="h-24 w-16 rounded-lg object-cover"
                />
                <span>
                  <b>{book.title}</b>
                  <span className="mt-2 block text-sm text-[var(--muted)]">
                    {chaptersFor(book.id).length} 个章节
                  </span>
                  <span className="mt-3 block text-sm font-semibold text-[var(--brown)]">
                    {active ? '✓ 已加入计划' : '加入计划'}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        <section className="planner-chat mt-6 rounded-[28px] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">告诉我这段学习要服务什么目标。</p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                直接说你的背景、目标、期限和可用时间。支持中文、英文和语音。
              </p>
            </div>
            <button
              onClick={onListen}
              className={`grid size-10 place-items-center rounded-full ${listening ? 'bg-[var(--brown)] text-white' : 'bg-white text-[var(--ink)]'}`}
              aria-label="语音输入"
            >
              <Mic className="size-5" />
            </button>
          </div>
          <textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder="例如：我做过两年跨境基础设施投资，想用三个月跳槽大型 PE。工作日晚上十点后能读两小时，周末可以多投入……"
            className="mt-4 min-h-32 w-full resize-y rounded-2xl border border-[var(--line)] bg-white p-4 leading-7 outline-none"
          />
          <button
            disabled={!selected.length || !brief.trim() || generating}
            onClick={onPreview}
            className="mt-4 rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-40"
          >
            {generating ? '正在生成 · 通常约 10–25 秒' : preview ? '重新生成计划预览' : '生成计划预览'}
          </button>
          {generating && <p className="mt-3 text-sm font-medium text-[var(--green)]">正在按你的日期、工作日/周末时长和两本书目录生成最终版本，请勿重复点击。</p>}
        </section>
        {preview && (
          <section className="mt-5 rounded-[28px] border border-[var(--line)] bg-white p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[var(--brown)]">
                  计划预览
                </p>
                <h3 className="mt-1 text-xl font-semibold">
                  {preview.name} · {preview.startDate} 至 {preview.endDate}
                </h3>
              </div>
              <span className="rounded-full bg-[var(--gold-soft)] px-3 py-2 text-xs font-semibold">
                继续对话即可修改
              </span>
            </div>
            {error && <p className="mt-3 rounded-xl bg-[#fff5f4] px-3 py-2 text-sm font-medium text-[#b42318]">AI 章节重点未生成：{error}</p>}
            <p className="mt-4 text-sm leading-6 text-[var(--muted)]">AI 会结合你的目标和时间给出每天的学习重点；章节范围按工作日与周末的可用时长分配。确认前可继续对话修改。</p>
            <DailyStudyCalendar plan={preview} books={books} />
            <button
              onClick={onSave}
              className="mt-5 rounded-full bg-[var(--brown)] px-5 py-3 text-sm font-semibold text-white"
            >
              确认并启用此计划
            </button>
          </section>
        )}
      </section>
    </div>
  );
}

function ImportArchive({ items, kind, language }: { items: ImportedItem[]; kind: 'interview' | 'deal'; language: 'zh' | 'en' }) {
  const [company, setCompany] = useState('all');
  const [industry, setIndustry] = useState('all');
  const companies = [...new Set(items.flatMap((item) => item.archive?.companies || []))].sort();
  const industries = [...new Set(items.flatMap((item) => item.archive?.industries || []))].sort();
  const filtered = items.filter((item) =>
    (company === 'all' || item.archive?.companies?.includes(company)) &&
    (industry === 'all' || item.archive?.industries?.includes(industry)),
  );
  const folders = filtered.reduce<Record<string, ImportedItem[]>>((all, item) => {
    const folder = item.archive?.folder || (language === 'zh' ? '未归档资料' : 'Unfiled');
    (all[folder] ||= []).push(item);
    return all;
  }, {});
  return <section className="mt-6 rounded-3xl border border-[var(--line)] bg-white p-5 sm:p-6">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><p className="text-sm font-semibold text-[var(--brown)]">{language === 'zh' ? '自动归档' : 'Auto archive'}</p><h2 className="mt-1 text-lg font-semibold">{kind === 'interview' ? (language === 'zh' ? '面经档案库' : 'Interview archive') : (language === 'zh' ? '投资雷达档案库' : 'Deal radar archive')}</h2><p className="mt-1 text-sm text-[var(--muted)]">{language === 'zh' ? 'AI 分析完成后自动按公司、行业与主题归类；点开文件夹可回看完整分析。' : 'AI files each completed analysis by company, industry, and topic.'}</p></div>
      <div className="flex flex-wrap gap-2"><select value={company} onChange={(event) => setCompany(event.target.value)} className="h-10 rounded-xl border border-[var(--line)] px-3 text-sm"><option value="all">{language === 'zh' ? '全部公司' : 'All companies'}</option>{companies.map((value) => <option key={value}>{value}</option>)}</select><select value={industry} onChange={(event) => setIndustry(event.target.value)} className="h-10 rounded-xl border border-[var(--line)] px-3 text-sm"><option value="all">{language === 'zh' ? '全部行业' : 'All industries'}</option>{industries.map((value) => <option key={value}>{value}</option>)}</select></div>
    </div>
    {!filtered.length ? <p className="mt-6 rounded-2xl bg-[var(--soft)] p-5 text-sm text-[var(--muted)]">{language === 'zh' ? '导入第一份资料后，它会在这里自动归档。' : 'Your first analysed item will appear here automatically.'}</p> : <div className="mt-5 space-y-3">{Object.entries(folders).sort(([a], [b]) => a.localeCompare(b, 'zh-CN')).map(([folder, records]) => <details key={folder} open className="rounded-2xl border border-[var(--line)] bg-[var(--soft)]"><summary className="cursor-pointer list-none px-4 py-3 font-semibold"><span>{folder}</span><span className="ml-2 rounded-full bg-white px-2 py-1 text-xs text-[var(--muted)]">{records.length}</span></summary><div className="grid gap-3 border-t border-[var(--line)] p-3 md:grid-cols-2">{records.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((item) => <details key={item.id} className="rounded-xl bg-white p-4"><summary className="cursor-pointer list-none"><p className="font-semibold">{item.title}</p><p className="mt-1 text-xs text-[var(--muted)]">{new Date(item.createdAt).toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US')} · {item.archive?.topic || (language === 'zh' ? '待补充主题' : 'Topic pending')}</p><div className="mt-2 flex flex-wrap gap-1">{[...(item.archive?.companies || []), ...(item.archive?.industries || []), ...(item.archive?.tags || [])].slice(0, 6).map((tag) => <span key={tag} className="rounded-full bg-[var(--gold-soft)] px-2 py-1 text-xs text-[var(--brown)]">{tag}</span>)}</div></summary><div className="mt-4 border-t border-[var(--line)] pt-4 whitespace-pre-wrap text-sm leading-6 text-[var(--ink)]">{item.analysis}</div></details>)}</div></details>)}</div>}
  </section>;
}

function ImportWorkbench({
  kind,
  setKind,
  url,
  setUrl,
  title,
  setTitle,
  content,
  setContent,
  onSave,
  importing,
  error,
  lockedKind,
  language = 'zh',
}: {
  kind: 'interview' | 'deal';
  setKind: (v: 'interview' | 'deal') => void;
  url: string;
  setUrl: (v: string) => void;
  title: string;
  setTitle: (v: string) => void;
  content: string;
  setContent: (v: string) => void;
  onSave: () => void;
  importing: boolean;
  error: string;
  lockedKind: 'interview' | 'deal';
  language?: 'zh' | 'en';
}) {
  return (
    <section className="rounded-3xl border border-[var(--line)] bg-white p-6">
      <div className="mb-4">
        <p className="text-sm font-semibold text-[var(--brown)]">
          {lockedKind === 'interview' ? (language === 'zh' ? '面试资料导入' : 'Interview material') : (language === 'zh' ? '交易资料导入' : 'Deal material')}
        </p>
        <h2 className="mt-1 text-lg font-semibold">
          {lockedKind === 'interview'
            ? (language === 'zh' ? '把经验文章变成你的答题训练' : 'Turn an article into answer practice')
            : (language === 'zh' ? '把新闻变成你的投资视角' : 'Turn news into investment perspective')}
        </h2>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={language === 'zh' ? '资料标题' : 'Title'}
          className="h-11 rounded-xl border border-[var(--line)] px-3"
        />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={language === 'zh' ? '粘贴公众号或网页链接' : 'Paste a web link'}
          className="h-11 rounded-xl border border-[var(--line)] px-3"
        />
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={language === 'zh' ? '若微信链接无法自动读取，把正文复制到这里。交易资料会按交易概况、各方地位、估值、投资逻辑、技术亮点、风险与发展前景拆解。' : 'If a WeChat link cannot be read automatically, paste the text here. It will be broken down by deal overview, parties, valuation, thesis, technology, risks, and outlook.'}
        className="mt-3 min-h-32 w-full rounded-xl border border-[var(--line)] p-3 leading-6"
      />
      <div className="mt-3 flex items-center justify-between gap-4">
        <p className="text-xs leading-5 text-[var(--muted)]">
          {language === 'zh' ? '系统会优先尝试链接；微信限制访问时使用你粘贴的正文。' : 'The system tries the link first; paste the article when WeChat blocks access.'}
        </p>
        <button
          onClick={onSave}
          disabled={importing}
          className="shrink-0 rounded-xl bg-[var(--green)] px-4 py-2.5 font-semibold text-white"
        >
          {importing ? (language === 'zh' ? '正在读取并分析…' : 'Reading and analysing…') : (language === 'zh' ? '导入并生成分析' : 'Import and analyse')}
        </button>
      </div>
      {error && (
        <p className="mt-3 rounded-xl bg-[var(--gold-soft)] p-3 text-sm text-[var(--ink)]">
          {error}
        </p>
      )}
    </section>
  );
}
function Metric({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <b className="block text-xl">{value}</b>
      <span className="text-xs text-[var(--muted)]">{label}</span>
    </div>
  );
}
function Quick({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm font-medium hover:border-[var(--green)]"
    >
      {label}
    </button>
  );
}
function Empty({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="grid min-h-44 place-items-center rounded-2xl bg-[var(--soft)] p-6 text-center">
      <div>
        <span className="mx-auto mb-3 grid size-10 place-items-center rounded-xl bg-white text-[var(--muted)]">
          {icon}
        </span>
        <b>{title}</b>
        <p className="mt-1 max-w-sm text-sm leading-6 text-[var(--muted)]">
          {text}
        </p>
      </div>
    </div>
  );
}
function QuestionRow({ q }: { q: QA }) {
  return (
    <div className="border-b border-[var(--line)] pb-4 last:border-0">
      <p className="line-clamp-1 font-medium">{q.question}</p>
      <p className="mt-1 line-clamp-1 text-sm text-[var(--muted)]">
        第 {q.page} 页 · {q.quote}
      </p>
    </div>
  );
}
function FormulaKnowledgeCard({
  formula,
  stats,
  onToggleMastered,
  language = 'zh',
}: {
  formula: FormulaCard;
  stats?: { searches: number; lastSearched: string; mastered: boolean };
  onToggleMastered: () => void;
  language?: 'zh' | 'en';
}) {
  const needsReview = !stats?.mastered && (stats?.searches || 0) >= 3;
  const sourceBook = BOOKS.find((b) => b.id === formula.bookId);
  return (
    <article
      className={`formula-card rounded-3xl border p-6 ${needsReview ? 'border-[#b69ad1] ring-1 ring-[#b69ad1]/30' : 'border-[var(--line)]'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--gold-soft)] text-[var(--brown)]">
            <Calculator className="size-5" />
          </span>
          <div>
            <p className="text-xs text-[var(--muted)]">
              {sourceBook?.title || (language === 'zh' ? '我的上传书籍' : 'My uploaded book')} · Chapter {formula.chapter}
              {formula.sourcePage ? (language === 'zh' ? ` · PDF 第 ${formula.sourcePage} 页` : ` · PDF page ${formula.sourcePage}`) : ''}
            </p>
            <h2 className="mt-1 text-lg font-semibold">{formula.name}</h2>
          </div>
        </div>
        {needsReview && (
          <span className="shrink-0 rounded-full bg-[var(--gold-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--ink)]">
            {language === 'zh' ? '重点复习' : 'Review'}
          </span>
        )}
      </div>
      <div className="formula-equation my-5 overflow-x-auto rounded-2xl px-5 py-4 font-serif text-lg">
        {formula.formula}
      </div>
      <div className="space-y-4 text-sm leading-6">
        <section>
          <b>{language === 'zh' ? '变量口径' : 'Variables'}</b>
          <p className="mt-1 text-[var(--muted)]">{formula.variables}</p>
        </section>
        <section>
          <b>{language === 'zh' ? '为什么这样推导' : 'Why this works'}</b>
          <p className="mt-1 text-[var(--muted)]">{formula.derivation}</p>
        </section>
        <section>
          <b>{language === 'zh' ? 'PE 投资应用' : 'PE application'}</b>
          <p className="mt-1 text-[var(--muted)]">{formula.peUse}</p>
        </section>
        <section className="rounded-xl bg-[var(--soft)] p-4">
          <b>{language === 'zh' ? '中文面试表达' : 'Chinese interview answer'}</b>
          <p className="mt-1">{formula.interviewCn}</p>
          <b className="mt-3 block">English interview answer</b>
          <p className="mt-1 text-[var(--muted)]">{formula.interviewEn}</p>
        </section>
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-[var(--line)] pt-4">
        <span className="text-xs text-[var(--muted)]">
          {language === 'zh' ? `检索 ${stats?.searches || 0} 次` : `${stats?.searches || 0} searches`}
          {(stats?.searches || 0) >= 2 && !stats?.mastered
            ? ' · 可能仍未掌握'
            : ''}
        </span>
        <button
          onClick={onToggleMastered}
          className={`rounded-xl px-3 py-2 text-sm font-semibold ${stats?.mastered ? 'bg-[var(--green)] text-white' : 'border border-[var(--line)]'}`}
        >
          {stats?.mastered ? '已掌握' : '标记为已掌握'}
        </button>
      </div>
    </article>
  );
}
function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-[var(--soft)] px-4 py-3">
      <span className="text-sm text-[var(--muted)]">{label}</span>
      <b>{value}</b>
    </div>
  );
}
function PageShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto max-w-6xl p-5 lg:p-8">
      <div className="mb-7">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-2 text-[var(--muted)]">{subtitle}</p>
      </div>
      {children}
    </main>
  );
}

function PdfPage({
  file,
  page,
  bookId,
  language,
  onSelect,
  onPageText,
}: {
  file: string;
  page: number;
  bookId: string;
  language: 'zh' | 'en';
  onSelect: (text: string, fullSentence: string) => void;
  onPageText: (text: string) => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const textLayer = useRef<HTMLDivElement>(null);
  const pageText = useRef('');
  const ocrCache = useRef<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [needsOcr, setNeedsOcr] = useState(false);
  const [ocrBusy, setOcrBusy] = useState(false);
  useEffect(() => {
    let cancelled = false;
    async function render() {
      if (!file) return;
      setLoading(true);
      setError('');
      try {
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
        const pdf = await pdfjs.getDocument(file).promise;
        const pdfPage = await pdf.getPage(Math.min(page, pdf.numPages));
        const base = pdfPage.getViewport({ scale: 1 });
        const scale = Math.min(1.55, Math.max(0.8, 760 / base.width));
        const viewport = pdfPage.getViewport({ scale });
        const context = canvas.current?.getContext('2d');
        if (!context || !canvas.current || !textLayer.current || cancelled)
          return;
        canvas.current.width = viewport.width * devicePixelRatio;
        canvas.current.height = viewport.height * devicePixelRatio;
        canvas.current.style.width = `${viewport.width}px`;
        canvas.current.style.height = `${viewport.height}px`;
        context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
        await pdfPage.render({
          canvas: canvas.current,
          canvasContext: context,
          viewport,
        }).promise;
        const content = await pdfPage.getTextContent();
        pageText.current = content.items
          .map((item) => ('str' in item ? item.str : ''))
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
        if (!pageText.current && bookId.startsWith('local-')) {
          const savedOcr = await loadOcrPage(bookId, page);
          if (savedOcr) pageText.current = savedOcr;
        }
        onPageText(pageText.current);
        const layer = textLayer.current;
        layer.innerHTML = '';
        layer.style.width = `${viewport.width}px`;
        layer.style.height = `${viewport.height}px`;
        if (pageText.current && !content.items.length) {
          const cachedOverlay = document.createElement('span');
          cachedOverlay.textContent = pageText.current;
          cachedOverlay.style.cssText = 'position:absolute;inset:0;padding:24px;white-space:pre-wrap;line-height:1.9;color:transparent;user-select:text;cursor:text;';
          layer.appendChild(cachedOverlay);
        } else {
          const officialTextLayer = new pdfjs.TextLayer({ textContentSource: content, container: layer, viewport });
          await officialTextLayer.render();
        }
        setNeedsOcr(!pageText.current);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : 'PDF 加载失败');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    render();
    return () => {
      cancelled = true;
    };
  }, [file, page, bookId, onPageText]);
  async function runOcr() {
    if (!canvas.current) return;
    setOcrBusy(true);
    setError('');
    try {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker(['eng', 'chi_sim']);
      const result = await worker.recognize(canvas.current);
      await worker.terminate();
      const text = result.data.text.replace(/\s+/g, ' ').trim();
      if (!text) throw new Error(language === 'zh' ? '这一页未识别到文字。请尝试更清晰的原件。' : 'No text was recognised on this page. Try a clearer original.');
      ocrCache.current[page] = text;
      await saveOcrPage(bookId, page, text);
      pageText.current = text;
      onPageText(text);
      const layer = textLayer.current;
      if (layer) {
        layer.innerHTML = '';
        const textOverlay = document.createElement('span');
        textOverlay.textContent = text;
        textOverlay.style.cssText = 'position:absolute;inset:0;padding:24px;white-space:pre-wrap;line-height:1.9;color:transparent;user-select:text;cursor:text;';
        layer.appendChild(textOverlay);
      }
      setNeedsOcr(false);
    } catch (ocrError) {
      setError(ocrError instanceof Error ? ocrError.message : (language === 'zh' ? 'OCR 识别失败。' : 'OCR failed.'));
    } finally {
      setOcrBusy(false);
    }
  }
  function capture() {
    const text = window.getSelection()?.toString().replace(/\s+/g, ' ').trim();
    if (text) onSelect(text, sentenceAround(pageText.current, text));
  }
  return (
    <div
      className="relative min-h-0 flex-1 overflow-auto bg-[#cacbc7] p-5"
      onMouseUp={capture}
    >
      <div className="relative mx-auto w-fit bg-white shadow-2xl">
        <canvas ref={canvas} />
        <div ref={textLayer} className="textLayer select-text" />
        {needsOcr && !loading && (
          <div className="absolute inset-x-0 bottom-4 mx-auto w-fit rounded-xl bg-[#243c34]/92 px-4 py-3 text-center text-sm text-white shadow-xl">
            <p>{language === 'zh' ? '这是扫描页，没有可划选的文字层。' : 'This scanned page has no selectable text layer.'}</p>
            <button onClick={runOcr} disabled={ocrBusy} className="mt-2 rounded-lg bg-white px-3 py-1.5 font-semibold text-[#243c34] disabled:opacity-60">{ocrBusy ? (language === 'zh' ? '正在识别本页…' : 'Recognising this page…') : (language === 'zh' ? '启用本页 OCR' : 'Enable OCR for this page')}</button>
          </div>
        )}
      </div>
      {loading && (
        <div className="absolute inset-0 grid place-items-center bg-[#343735]/70 text-sm text-white">
          正在打开第 {page} 页…
        </div>
      )}
      {error && (
        <div className="absolute inset-0 grid place-items-center bg-[#343735] p-8 text-center text-white">
          无法显示 PDF：{error}
        </div>
      )}
    </div>
  );
}

function sentenceAround(pageText: string, selected: string) {
  const full = pageText.replace(/\s+/g, ' ').trim();
  const exact = full.toLowerCase().indexOf(selected.toLowerCase());
  let index = exact;
  if (index < 0) {
    const words = selected.split(' ').filter(Boolean);
    for (let start = 1; start < Math.min(5, words.length); start += 1) {
      const candidate = words.slice(start).join(' ');
      const found = full.toLowerCase().indexOf(candidate.toLowerCase());
      if (found >= 0) {
        index = Math.max(0, found - words.slice(0, start).join(' ').length - 1);
        break;
      }
    }
  }
  if (index < 0) return selected;
  const start = Math.max(
    0,
    full.lastIndexOf('.', index - 1) + 1,
    full.lastIndexOf('?', index - 1) + 1,
    full.lastIndexOf('!', index - 1) + 1,
  );
  const after = Math.max(index + selected.length, 0);
  const ends = ['.', '?', '!']
    .map((mark) => full.indexOf(mark, after))
    .filter((n) => n >= 0);
  const end = ends.length
    ? Math.min(...ends) + 1
    : Math.min(full.length, index + selected.length + 300);
  const sentence = full.slice(start, end).trim();
  return sentence.length > 8 && sentence.length < 800 ? sentence : selected;
}
