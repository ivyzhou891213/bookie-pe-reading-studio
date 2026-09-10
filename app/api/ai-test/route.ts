import { callDeepSeek, deepSeekErrorMessage } from '@/lib/deepseek-server';
import { isDeepSeekModelTier } from '@/lib/ai-models';

type ConnectionTestRequest = {
  apiKey?: string;
  defaultModel?: 'flash';
};

export async function POST(request: Request) {
  const startedAt = Date.now();
  try {
    const body = await request.json() as ConnectionTestRequest;
    if (!body.apiKey?.trim()) {
      return Response.json({ error: '请先填写 DeepSeek API Key。' }, { status: 400 });
    }
    const { response, data, model } = await callDeepSeek(
      {
        apiKey: body.apiKey,
        task: 'connection-test',
        defaultModel: isDeepSeekModelTier(body.defaultModel) ? body.defaultModel : 'flash',
        autoRoute: false,
        thinking: 'disabled',
        reasoningEffort: 'low',
      },
      {
        max_tokens: 1,
        messages: [{ role: 'user', content: 'Reply with OK.' }],
      },
    );
    if (!response.ok) {
      return Response.json(
        { error: deepSeekErrorMessage(response.status, data.error?.message) },
        { status: response.status },
      );
    }
    return Response.json({ model: data.model || model, responseTimeMs: Date.now() - startedAt });
  } catch (error) {
    if (error instanceof Error && error.message === 'MISSING_API_KEY') {
      return Response.json({ error: '请先填写 DeepSeek API Key。' }, { status: 400 });
    }
    return Response.json({ error: '网络错误：无法连接到 DeepSeek。请检查网络后重试。' }, { status: 502 });
  }
}
