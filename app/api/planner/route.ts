type PlannerRequest = {
  provider: 'deepseek' | 'openai';
  model: string;
  apiKey: string;
  thinking?: 'enabled' | 'disabled';
  reasoningEffort?: 'low' | 'medium' | 'high';
  brief: string;
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
    const prompt = `你是严谨的中文学习规划助手。请真正完成逐日排程，而不是只改文案。硬规则：(1) 只能安排完整目录中的章节；每章必须恰好出现一次，不能遗漏、重复、调换同一本书的章节顺序，也不要安排复盘、休息或空泛任务。(2) 日期与每天的可用时长已经固定；工作日和周末时长不同，短时段少排、长时段多排，并参考每章 pages。(3) bookId 必须原样使用；同一天连续章节合成一个范围。(4) outcome 只写一句不超过18个中文字的中文学习重点，必须对应当天实际章节，不要英文、面试建议或复盘建议。只输出紧凑、合法的 JSON 对象，不要 markdown、解释或换行，严格使用：{"dailySchedule":[{"week":1,"day":1,"tasks":[{"bookId":"book-id","start":1,"end":2}],"outcome":"一句中文重点"}]}。\n\n用户目标与时间：${body.brief}\n\n完整目录（所有章节必须被安排）：${JSON.stringify(body.books)}\n\n固定日期与可用时长：${JSON.stringify(body.draftDailySchedule || [])}\n\n章节正文摘录（若缺失，仅按目录标题概括）：${JSON.stringify(body.chapterContexts || [])}`;
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
