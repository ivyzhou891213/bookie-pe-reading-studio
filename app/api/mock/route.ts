type MockRequest = {
  provider: 'deepseek' | 'openai'; model: string; apiKey: string; thinking?: 'enabled' | 'disabled'; reasoningEffort?: 'low' | 'medium' | 'high';
  action: 'generate' | 'review'; question?: string; answer?: string; materials?: string;
};

export async function POST(request: Request) {
  try {
    const body = await request.json() as MockRequest;
    if (!body.apiKey) return Response.json({ error: '请先配置 API Key。' }, { status: 400 });
    const endpoint = body.provider === 'deepseek' ? 'https://api.deepseek.com/chat/completions' : 'https://api.openai.com/v1/chat/completions';
    const prompt = body.action === 'generate'
      ? `生成一道 PE / 投行技术模拟题。优先参考下列已归档面经，但不能编造任何公司的真实面试偏好。题目要可在 3–5 分钟内回答，涵盖估值、三表、M&A 或 LBO 之一。只输出题目本身（可带一行英文追问），不要给答案。\n\n已归档资料：\n${body.materials || '暂无资料，请出一道通用 PE 技术题。'}`
      : `请严格评价以下候选人的技术面试回答。输出 Markdown，按五项给 1–5 分：概念准确性、结构、投资判断、下行风险、英文表达；逐项说明原因。再给出一版更好的 90 秒中文回答框架、一个英文 follow-up 和一个最关键的改进动作。不要把未提供的公司信息当事实。\n\n题目：${body.question}\n\n候选人回答：${body.answer}`;
    const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${body.apiKey}` }, body: JSON.stringify({ model: body.model, messages: [{ role: 'system', content: '你是严格、务实的 PE 与投行技术面试教练。输出简洁、可操作、不过度奉承。' }, { role: 'user', content: prompt }], thinking: { type: body.thinking || 'enabled' }, reasoning_effort: body.reasoningEffort || 'high', max_tokens: 700, stream: false }) });
    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }>; error?: { message?: string } };
    if (!response.ok) return Response.json({ error: data.error?.message || '模型服务返回错误。' }, { status: response.status });
    const content = data.choices?.[0]?.message?.content || '';
    return Response.json(body.action === 'generate' ? { question: content } : { feedback: content });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : '无法完成模拟。' }, { status: 500 }); }
}
