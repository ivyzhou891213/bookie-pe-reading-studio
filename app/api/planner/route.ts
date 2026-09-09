type PlannerRequest = {
  provider: 'deepseek' | 'openai';
  model: string;
  apiKey: string;
  thinking?: 'enabled' | 'disabled';
  reasoningEffort?: 'low' | 'medium' | 'high';
  brief: string;
  books: string[];
  draftSchedule?: Array<{ week: number; reading: Array<{ book?: string; chapters: string[] }> }>;
  draftDailySchedule?: Array<{ week: number; day: number; date: string; time: string; reading: Array<{ book?: string; chapters: string }> }>;
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
    const prompt = `你是私人股权学习规划助手。系统已经确定日期、时间和章节范围；不要改动它们。根据每个章节正文摘录，为每个每日任务写一句不超过16个中文字的简体中文重点。重点必须对应当天章节，不能复用，也不要建议面试、复盘、休息。只输出一个紧凑、合法的 JSON 对象，不要 markdown、不要解释、不要换行：{"dailySummaries":[{"week":1,"day":1,"outcome":"一句中文重点"}]}。必须覆盖下方“每日安排”中的每一天。\n\n用户要求：${body.brief}\n\n每日安排：${JSON.stringify(body.draftDailySchedule || [])}\n\n对应章节正文摘录：${JSON.stringify(body.chapterContexts || [])}`;
    const endpoint =
      body.provider === 'deepseek'
        ? 'https://api.deepseek.com/chat/completions'
        : 'https://api.openai.com/v1/chat/completions';
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${body.apiKey}`,
      },
      body: JSON.stringify({
        model: body.model,
        messages: [
          {
            role: 'system',
            content: '你是严谨的学习规划助手。只输出合法 JSON。',
          },
          { role: 'user', content: prompt },
        ],
        stream: false,
        thinking: { type: body.thinking || 'disabled' },
        reasoning_effort: body.reasoningEffort || 'low',
        max_tokens: 1200,
        response_format: { type: 'json_object' },
      }),
    });
    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      error?: { message?: string };
    };
    if (!response.ok)
      return Response.json(
        { error: data.error?.message || '模型服务返回错误。' },
        { status: response.status },
      );
    try {
      return Response.json({
        extracted: JSON.parse(data.choices?.[0]?.message?.content || '{}'),
      });
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
