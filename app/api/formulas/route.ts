import { randomUUID } from 'node:crypto';
import { callDeepSeek, deepSeekErrorMessage } from '@/lib/deepseek-server';
import type { DeepSeekModelTier } from '@/lib/ai-models';

type FormulaRequest = {
  apiKey: string;
  defaultModel?: DeepSeekModelTier;
  autoRoute?: boolean;
  task?: 'formulas';
  thinking?: 'enabled' | 'disabled';
  reasoningEffort?: 'low' | 'medium' | 'high' | 'max';
  bookId: string;
  bookTitle: string;
  excerpts: Array<{ page: number; text: string }>;
};

function stringValue(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as FormulaRequest;
    if (!body.apiKey || !body.excerpts?.length) {
      return Response.json({ error: '没有可供分析的 PDF 文字内容。' }, { status: 400 });
    }
    const prompt = `你是私募股权投资学习助手。根据下列《${body.bookTitle}》的 PDF 页段，只抽取其中确实出现或由文字明确推导出的核心公式。不可虚构。返回 JSON：{"formulas":[{"chapter":1,"name":"...","aliases":["..."],"formula":"...","variables":"...","derivation":"...","peUse":"...","interviewCn":"...","interviewEn":"...","sourcePage":1}]}。每项均须有中英文面试表达；最多 30 项。\n\n页段：${JSON.stringify(body.excerpts)}`;
    const { response, data } = await callDeepSeek(body, {
      messages: [
        { role: 'system', content: '只输出合法 JSON；不能根据常识补写原文没有出现的公式。' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 1200,
    });
    if (!response.ok) {
      return Response.json({ error: deepSeekErrorMessage(response.status, data.error?.message) }, { status: response.status });
    }
    const parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}') as { formulas?: Array<Record<string, unknown>> };
    const formulas = (parsed.formulas || []).map((formula) => ({
      id: `custom-${randomUUID()}`,
      bookId: body.bookId,
      chapter: Number(formula.chapter || 1),
      name: stringValue(formula.name, '未命名公式'),
      aliases: Array.isArray(formula.aliases) ? formula.aliases.map(String) : [],
      formula: stringValue(formula.formula),
      variables: stringValue(formula.variables),
      derivation: stringValue(formula.derivation),
      peUse: stringValue(formula.peUse),
      interviewCn: stringValue(formula.interviewCn),
      interviewEn: stringValue(formula.interviewEn),
      sourcePage: Number(formula.sourcePage || 1),
    }));
    return Response.json({ formulas, usage: data.usage });
  } catch (error) {
    return Response.json({ error: error instanceof Error && error.message === 'MISSING_API_KEY' ? '请先配置 API Key。' : '公式索引生成失败。' }, { status: 500 });
  }
}
