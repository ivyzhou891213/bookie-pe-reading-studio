import { callDeepSeek, deepSeekErrorMessage } from '@/lib/deepseek-server';
import type { DeepSeekModelTier } from '@/lib/ai-models';

type PlannerRequest = {
  apiKey: string;
  defaultModel?: DeepSeekModelTier;
  autoRoute?: boolean;
  task?: 'planner';
  thinking?: 'enabled' | 'disabled';
  reasoningEffort?: 'low' | 'medium' | 'high' | 'max';
  brief: string;
  repair?: boolean;
  books: Array<{ id: string; title: string; chapters: Array<{ n: number; title: string; pages: number }> }>;
  draftSchedule?: Array<{ week: number; reading: Array<{ book?: string; chapters: string[] }> }>;
  draftDailySchedule?: Array<{ week: number; day: number; date: string; time: string; hours?: number; reading: Array<{ book?: string; chapters: string }> }>;
  chapterContexts?: Array<{ book: string; chapter: string; text: string }>;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PlannerRequest;
    if (!body.apiKey || !body.brief)
      return Response.json(
        { error: '缺少学习描述或 API Key。' },
        { status: 400 },
      );
    // The client already creates and verifies the complete chapter allocation.
    // Asking a model to reproduce it makes one malformed row discard useful AI
    // work. The model therefore owns only the concise daily learning focus.
    const prompt = `你是中文 PE / 投行学习规划助手。以下每天的日期、时间和章节范围已经由系统完成并验证，绝对不要改动、删减、重排或补充章节。你的唯一任务是为每一天写一个与当天真实章节对应的精炼中文学习重点。每条 outcome 限 12–24 个中文字，具体说明当天要理解的估值、建模、交易或公司分析概念；不能写“阅读本章”“复盘”“休息”“待完成”等空话。必须覆盖每个 week/day 各一次。${body.repair ? '上次遗漏或格式不完整；这次务必只补齐所有 dailyGuidance 行。' : ''} 只输出合法 JSON，不要 markdown，格式只能是：{"dailyGuidance":[{"week":1,"day":1,"outcome":"理解 ROIC 如何驱动价值创造"}]}。\n学习目标：${body.brief}\n已确认的每日安排：${JSON.stringify(body.draftDailySchedule || [])}`;
    const { response, data, model } = await callDeepSeek(body, {
        messages: [
          {
            role: 'system',
            content: '你是严谨的学习规划助手。只输出合法 JSON。',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 2400,
        response_format: { type: 'json_object' },
    });
    if (!response.ok)
      return Response.json(
        { error: deepSeekErrorMessage(response.status, data.error?.message) },
        { status: response.status },
      );
    try {
      const raw = data.choices?.[0]?.message?.content || '{}';
      const json = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
      return Response.json({ extracted: JSON.parse(json), usage: data.usage, model });
    } catch {
      return Response.json(
        { error: 'AI 返回的计划重点不完整，请重新生成。' },
        { status: 502 },
      );
    }
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : '计划解析失败。' },
      { status: 500 },
    );
  }
}
