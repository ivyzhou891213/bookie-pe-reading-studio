import { randomUUID } from 'node:crypto';

type FormulaRequest = {
  provider: 'deepseek' | 'openai';
  model: string;
  apiKey: string;
  thinking?: 'enabled' | 'disabled';
  reasoningEffort?: 'low' | 'medium' | 'high';
  bookId: string;
  bookTitle: string;
  excerpts: Array<{ page: number; text: string }>;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as FormulaRequest;
    if (!body.apiKey || !body.excerpts?.length)
      return Response.json({ error: '没有可供分析的 PDF 文字内容。' }, { status: 400 });
    const prompt = `你是私募股权投资学习助手。根据下列《${body.bookTitle}》的 PDF 页段，只抽取其中确实出现或由文字明确推导出的核心公式。不可虚构。返回 JSON：{"formulas":[{"chapter":1,"name":"...","aliases":["..."],"formula":"...","variables":"...","derivation":"...","peUse":"...","interviewCn":"...","interviewEn":"...","sourcePage":1}]}。每项均须有中英文面试表达；最多 30 项。\n\n页段：${JSON.stringify(body.excerpts)}`;
    const endpoint = body.provider === 'deepseek'
      ? 'https://api.deepseek.com/chat/completions'
      : 'https://api.openai.com/v1/chat/completions';
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${body.apiKey}` },
      body: JSON.stringify({
        model: body.model,
        messages: [
          { role: 'system', content: '只输出合法 JSON；不能根据常识补写原文没有出现的公式。' },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        thinking: { type: body.thinking || 'disabled' },
        reasoning_effort: body.reasoningEffort || 'low',
        max_tokens: 1200,
        stream: false,
      }),
    });
    const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }>; error?: { message?: string } };
    if (!response.ok) return Response.json({ error: data.error?.message || '模型服务返回错误。' }, { status: response.status });
    const parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}') as { formulas?: Array<Record<string, unknown>> };
    const formulas = (parsed.formulas || []).map((formula) => ({
      id: `custom-${randomUUID()}`,
      bookId: body.bookId,
      chapter: Number(formula.chapter || 1),
      name: String(formula.name || '未命名公式'),
      aliases: Array.isArray(formula.aliases) ? formula.aliases.map(String) : [],
      formula: String(formula.formula || ''),
      variables: String(formula.variables || ''),
      derivation: String(formula.derivation || ''),
      peUse: String(formula.peUse || ''),
      interviewCn: String(formula.interviewCn || ''),
      interviewEn: String(formula.interviewEn || ''),
      sourcePage: Number(formula.sourcePage || 1),
    }));
    return Response.json({ formulas });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : '公式索引生成失败。' }, { status: 500 });
  }
}
