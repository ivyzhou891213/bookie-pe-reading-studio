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
  title: string;
  url?: string;
  content?: string;
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

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ImportRequest;
    if (!body.apiKey)
      return Response.json(
        { error: '请先在设置中填写 API Key。' },
        { status: 400 },
      );
    let source = body.content?.trim() || '';
    let fetchNote = '';
    if (!source && body.url) {
      try {
        const response = await fetch(body.url, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
        });
        if (response.ok)
          source = stripHtml(await response.text()).slice(0, 45000);
        else fetchNote = `链接读取失败（${response.status}）`;
      } catch {
        fetchNote = '链接受到平台限制，无法自动读取';
      }
    }
    if (source.length < 120)
      return Response.json(
        {
          error: `${fetchNote || '没有取得足够正文'}。请把文章正文复制到输入框后重试。`,
        },
        { status: 422 },
      );
    const instruction =
      body.kind === 'interview'
        ? '把资料转成 PE/投行面试训练题库。参考经典投行技术题的答题纪律，但不复制题库原文。每道题输出：中英题目、考察点、60秒框架、中英文示范答案、3个追问、常见错误、与估值/M&A/LBO的连接。回答要体现投资判断。'
        : '把资料拆成一级市场研究卡。严格区分文章事实和你的推断，缺失价格或数据写“未披露/待核实”，不得编造。输出：交易概况与时间；各方及地位；标的业务与技术壁垒；价格及估值；收购逻辑；协同和投后计划；行业空间与KPI；下行风险与反证；教材知识连接；中文面试观点和90秒英文表达。';
    const archiveRule = body.kind === 'interview'
      ? 'archive.folder 必须是明确出现的公司名；若无法确认则为“未识别公司”。companies 只列资料明确提及的雇主/面试公司；industries 仅列资料明确出现的行业；topic 用简短中文概括面试主题。'
      : 'archive.folder 用最主要的行业或交易主题；companies 列出资料明确提及的 PE/投资方、被投企业或退出方；industries 使用简洁行业名；topic 用简短中文概括“投资 / 退出 / 募资 / 组合管理”等交易主题。';
    const prompt = `${instruction}\n\n同时自动归档，避免用户再手工分类。${archiveRule}\n只返回合法 JSON：{"analysis":"完整的结构化分析（可用 Markdown）","archive":{"folder":"...","companies":["..."],"industries":["..."],"topic":"...","tags":["..."]}}。不得凭空补写公司、行业、金额或交易事实。\n\n标题：${body.title}\n来源：${body.url || '用户粘贴正文'}\n\n正文：${source}`;
    const { response, data } = await callDeepSeek(body, {
        messages: [
          {
            role: 'system',
            content:
              '你是大型 PE 基金投资经理、投行技术面试教练和产业研究员。分析必须结构化、可验证、可用于投资委员会和面试。只输出合法 JSON。',
          },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 1400,
    });
    if (!response.ok)
      return Response.json(
        { error: deepSeekErrorMessage(response.status, data.error?.message) },
        { status: response.status },
      );
    const parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}') as { analysis?: string; archive?: { folder?: string; companies?: unknown; industries?: unknown; topic?: string; tags?: unknown } };
    return Response.json({
      analysis: parsed.analysis || '没有生成分析。',
      archive: {
        folder: parsed.archive?.folder || (body.kind === 'interview' ? '未识别公司' : '未归档资料'),
        companies: Array.isArray(parsed.archive?.companies) ? parsed.archive.companies.map(String).slice(0, 8) : [],
        industries: Array.isArray(parsed.archive?.industries) ? parsed.archive.industries.map(String).slice(0, 8) : [],
        topic: parsed.archive?.topic || '',
        tags: Array.isArray(parsed.archive?.tags) ? parsed.archive.tags.map(String).slice(0, 10) : [],
      },
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : '资料处理失败。' },
      { status: 500 },
    );
  }
}
