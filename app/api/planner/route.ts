type PlannerRequest = {
  provider: 'deepseek' | 'openai';
  model: string;
  apiKey: string;
  thinking?: 'enabled' | 'disabled';
  reasoningEffort?: 'low' | 'medium' | 'high';
  brief: string;
  books: string[];
  draftSchedule?: Array<{ week: number; reading: Array<{ book?: string; chapters: string[] }> }>;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PlannerRequest;
    if (!body.apiKey || !body.brief)
      return Response.json(
        { error: '缺少学习描述或 API Key。' },
        { status: 400 },
      );
    const prompt = `你是严谨的私人股权学习规划师。阅读用户描述，提取学习规划参数，并为每周写不同、具体、专业的学习成果。用户选择的书：${body.books.join('、')}。下面的阅读章节分配已经由系统按时间容量计算；不要更改章节，只为每周生成不同的 focus（不超过16字）和 outcome（不超过60字，必须点出本周的估值/交易/投资判断应用）。只返回合法 JSON，不要 markdown：{"weeks":12,"weekdayTime":"...","weekendTime":"...","background":"...","goal":"...","weeklySummaries":[{"week":1,"focus":"...","outcome":"..."}]}。weeks 必须是 2-52 的整数；对用户明确给出的周期和时间必须原样尊重。\n\n用户描述：${body.brief}\n\n已排定章节：${JSON.stringify(body.draftSchedule || [])}`;
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
        max_tokens: 900,
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
