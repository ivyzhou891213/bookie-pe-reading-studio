type PlannerRequest = {
  provider: 'deepseek' | 'openai';
  model: string;
  apiKey: string;
  thinking?: 'enabled' | 'disabled';
  reasoningEffort?: 'low' | 'medium' | 'high';
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
    const prompt = `你是中文学习规划助手。请输出完整的逐日排程。严格规则：完整目录中的每章必须恰好出现一次；同一本书章节须递增；不能包含复盘、休息或空任务。工作日与周末 hours 不同，长章节 pages 更多，应优先放在可用时长更长的日期。bookId 必须复制目录中的 id；每个任务只用 start/end 整数表示连续章节。必须为每一个固定日期写一条记录，即使任务为空也写 tasks:[]。outcome 为不超过18个中文字的中文重点。${body.repair ? '这是第二次修复：务必检查每个 week/day 都存在、每章仅一次。' : ''} 只输出 JSON，不要 markdown 或解释，格式只能是：{"dailySchedule":[{"week":1,"day":1,"tasks":[{"bookId":"id","start":1,"end":2}],"outcome":"中文重点"}]}。\n目标：${body.brief}\n目录：${JSON.stringify(body.books)}\n日期与时长：${JSON.stringify(body.draftDailySchedule || [])}`;
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
        max_tokens: 5000,
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
