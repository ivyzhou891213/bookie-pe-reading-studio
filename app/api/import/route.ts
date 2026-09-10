import { callDeepSeek, deepSeekErrorMessage } from '@/lib/deepseek-server';
import type { DeepSeekModelTier } from '@/lib/ai-models';

type ImportRequest = {
  apiKey: string;
  defaultModel?: DeepSeekModelTier;
  autoRoute?: boolean;
  task?: 'import' | 'investment-analysis';
  thinking?: 'enabled' | 'disabled';
  reasoningEffort?: 'low' | 'medium' | 'high' | 'max';
  kind: 'interview' | 'deal';
  title?: string;
  url?: string;
  content?: string;
};

type Archive = {
  folder?: string;
  companies?: unknown;
  industries?: unknown;
  topic?: string;
  tags?: unknown;
};

function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function publicUrl(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error('链接格式不正确。请粘贴完整的 http 或 https 公开链接。');
  }
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('只支持 http 或 https 的公开网页链接。');
  const host = url.hostname.toLowerCase();
  const privateHost = host === 'localhost' || host.endsWith('.local') || host === '::1'
    || /^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host)
    || /^169\.254\./.test(host) || /^172\.(1[6-9]|2\d|3[0-1])\./.test(host);
  if (privateHost) throw new Error('为了保护数据安全，不能读取本地或内网地址。');
  return url.toString();
}

async function fetchText(url: string, reader = false) {
  const response = await fetch(reader ? `https://r.jina.ai/${url}` : url, {
    headers: reader
      ? { Accept: 'text/plain' }
      : { 'User-Agent': 'Mozilla/5.0 (compatible; ReadingStudio/1.0)', Accept: 'text/html,application/xhtml+xml' },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) return '';
  const text = await response.text();
  return (reader ? text : stripHtml(text)).replace(/\s+/g, ' ').trim().slice(0, 36_000);
}

async function readPublicArticle(url: string) {
  const direct = await fetchText(url).catch(() => '');
  if (direct.length >= 500) return direct;

  // Public pages that block normal server requests (including many WeChat
  // articles) receive one reader-service fallback. The UI tells users not to
  // submit private links because this fetch leaves the app's server.
  const readerText = await fetchText(url, true).catch(() => '');
  if (readerText.length >= 500) return readerText;
  throw new Error('链接暂时无法读取。该网页可能限制外部访问或需要登录；请换一条公开链接后重试。');
}

function parseJson(content: string) {
  const cleaned = content.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  return JSON.parse(cleaned) as { analysis?: string; archive?: Archive };
}

function promptFor(kind: ImportRequest['kind'], title: string, url: string, source: string) {
  const task = kind === 'interview'
    ? '从文章中提取面试经验，不得补写未出现的公司、问题或答案。最多 4 道明确出现或可直接归纳的问题。analysis 用简短 Markdown：每题包括“问题（中文 / English）”“考察点”“中文答题框架”“English answer framework”。若文章没有足够面经，明确写出。'
    : '只总结文章明确披露的信息，不做投资建议，不编造数据。analysis 用 5–7 条简短 Markdown，依次覆盖：涉及公司与角色、行业与产业链、业务/产品、规模或关键数据、技术或竞争点、事件/交易动作、待核实信息。';
  const archive = kind === 'interview'
    ? 'archive.folder 是文章中的面试公司，无法确认则“未识别公司”；companies 只列明确出现的公司；industries 仅列明确出现的行业；topic 简短说明面经主题。'
    : 'archive.folder 是主要行业或主题；companies 只列明确出现的公司；industries 使用简短行业名；topic 简短概括事件。';
  return `${task}\n${archive}\n只返回合法 JSON，格式为 {"analysis":"...","archive":{"folder":"...","companies":["..."],"industries":["..."],"topic":"...","tags":["..."]}}。\n标题：${title || '未命名资料'}\n来源：${url || '用户提供正文'}\n正文：${source}`;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ImportRequest;
    if (!body.apiKey?.trim()) return Response.json({ error: '请先在设置中填写 API Key。' }, { status: 400 });
    if (body.kind !== 'interview' && body.kind !== 'deal') return Response.json({ error: '资料类型无效。' }, { status: 400 });

    const source = body.content?.trim() || (body.url?.trim() ? await readPublicArticle(publicUrl(body.url.trim())) : '');
    if (source.length < 120) return Response.json({ error: '没有读取到足够的文章正文，请换一条公开链接后重试。' }, { status: 422 });

    const { response, data } = await callDeepSeek(body, {
      messages: [
        { role: 'system', content: '你是严谨的中文金融学习助理。只依据提供的文章，输出紧凑、有效的 JSON，不要添加代码块或解释。' },
        { role: 'user', content: promptFor(body.kind, body.title?.trim() || '', body.url?.trim() || '', source) },
      ],
      response_format: { type: 'json_object' },
      max_tokens: body.kind === 'interview' ? 1300 : 850,
    });
    if (!response.ok) return Response.json({ error: deepSeekErrorMessage(response.status, data.error?.message) }, { status: response.status });

    let parsed: { analysis?: string; archive?: Archive };
    try {
      parsed = parseJson(data.choices?.[0]?.message?.content || '');
    } catch {
      return Response.json({ error: '文章已读取，但 AI 没有完整返回结果。请重试；系统没有保存不完整内容。' }, { status: 502 });
    }
    return Response.json({
      analysis: parsed.analysis?.trim() || '没有生成可用分析。',
      archive: {
        folder: parsed.archive?.folder || (body.kind === 'interview' ? '未识别公司' : '未归档资料'),
        companies: Array.isArray(parsed.archive?.companies) ? parsed.archive.companies.map(String).slice(0, 8) : [],
        industries: Array.isArray(parsed.archive?.industries) ? parsed.archive.industries.map(String).slice(0, 8) : [],
        topic: parsed.archive?.topic || '',
        tags: Array.isArray(parsed.archive?.tags) ? parsed.archive.tags.map(String).slice(0, 8) : [],
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '资料处理失败，请稍后重试。';
    return Response.json({ error: message }, { status: 500 });
  }
}
