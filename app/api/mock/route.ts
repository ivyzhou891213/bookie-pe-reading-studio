import { callDeepSeek, deepSeekErrorMessage } from '@/lib/deepseek-server';
import type { DeepSeekModelTier } from '@/lib/ai-models';

type MockRequest = {
  apiKey: string;
  defaultModel?: DeepSeekModelTier;
  autoRoute?: boolean;
  task?: 'mock';
  thinking?: 'enabled' | 'disabled';
  reasoningEffort?: 'low' | 'medium' | 'high' | 'max';
  action: 'generate' | 'review';
  question?: string;
  answer?: string;
  materials?: string;
};

export async function POST(request: Request) {
  try {
    const body = await request.json() as MockRequest;
    if (!body.apiKey) return Response.json({ error: '请先配置 API Key。' }, { status: 400 });
    const prompt = body.action === 'generate'
      ? `生成一道 PE / 投行技术模拟题。优先参考下列已归档面经，但不能编造任何公司的真实面试偏好。题目要可在 3–5 分钟内回答，涵盖估值、三表、M&A 或 LBO 之一。只输出题目本身（可带一行英文追问），不要给答案。\n\n已归档资料：\n${body.materials || '暂无资料，请出一道通用 PE 技术题。'}`
      : `请严格评价以下候选人的技术面试回答。输出 Markdown，按五项给 1–5 分：概念准确性、结构、投资判断、下行风险、英文表达；逐项说明原因。再给出一版更好的 90 秒中文回答框架、一个英文 follow-up 和一个最关键的改进动作。不要把未提供的公司信息当事实。\n\n题目：${body.question}\n\n候选人回答：${body.answer}`;
    const { response, data, model } = await callDeepSeek(body, {
      messages: [
        { role: 'system', content: '你是严格、务实的 PE 与投行技术面试教练。输出简洁、可操作、不过度奉承。' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 700,
    });
    if (!response.ok) return Response.json({ error: deepSeekErrorMessage(response.status, data.error?.message) }, { status: response.status });
    const content = data.choices?.[0]?.message?.content || '';
    return Response.json(body.action === 'generate' ? { question: content, model } : { feedback: content, model });
  } catch (error) {
    return Response.json({ error: error instanceof Error && error.message === 'MISSING_API_KEY' ? '请先配置 API Key。' : '无法完成模拟。' }, { status: 500 });
  }
}
