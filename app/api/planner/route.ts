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
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PlannerRequest;
    if (!body.apiKey || !body.brief)
      return Response.json(
        { error: '缺少学习描述或 API Key。' },
        { status: 400 },
      );
    const prompt = `你是严谨、克制的私人股权学习规划师。阅读用户描述，提取学习规划参数，并审阅系统依据工作日/周末时间容量生成的每日任务。用户选择的书：${body.books.join('、')}。不得改动日期、阅读时间或章节范围；只补充简洁的学习重点与成果。每周生成 focus（不超过16个中文字）和 outcome（不超过45个中文字）；每个有阅读任务的日期生成 focus（不超过14个中文字）和 outcome（不超过28个中文字）。若用户明确说“不需要复盘或休息”，绝不建议复盘、休息或留空日。成果要说明当天可掌握的知识或判断，不要泛泛谈面试。只返回合法 JSON，不要 markdown：{"weeks":12,"weekdayTime":"...","weekendTime":"...","background":"...","goal":"...","weeklySummaries":[{"week":1,"focus":"...","outcome":"..."}],"dailySummaries":[{"week":1,"day":1,"focus":"...","outcome":"..."}]}。weeks 必须是 2-52 的整数；对用户明确给出的周期和时间必须原样尊重。\n\n用户描述：${body.brief}\n\n每周章节安排：${JSON.stringify(body.draftSchedule || [])}\n\n每日安排：${JSON.stringify(body.draftDailySchedule || [])}`;
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
        max_tokens: 1400,
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
    return Response.json({
      extracted: JSON.parse(data.choices?.[0]?.message?.content || '{}'),
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : '计划解析失败。' },
      { status: 500 },
    );
  }
}
