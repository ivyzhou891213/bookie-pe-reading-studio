import {
  deepSeekModelFor,
  type AiTask,
  type DeepSeekModelTier,
} from './ai-models';

type RoutingRequest = {
  apiKey?: string;
  task?: AiTask;
  defaultModel?: DeepSeekModelTier;
  autoRoute?: boolean;
  thinking?: 'enabled' | 'disabled';
  reasoningEffort?: 'low' | 'medium' | 'high' | 'max';
};

type CompletionPayload = Record<string, unknown>;

export async function callDeepSeek(
  request: RoutingRequest,
  payload: CompletionPayload,
) {
  if (!request.apiKey?.trim()) throw new Error('MISSING_API_KEY');
  const task = request.task || 'mentor';
  const routing = deepSeekModelFor(task, request.defaultModel, request.autoRoute !== false);
  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${request.apiKey.trim()}`,
    },
    body: JSON.stringify({
      ...payload,
      model: routing.model,
      thinking: { type: request.thinking || 'disabled' },
      reasoning_effort: request.reasoningEffort || 'low',
      stream: false,
    }),
  });
  const data = await response.json().catch(() => ({})) as {
    error?: { message?: string; code?: string };
    model?: string;
    choices?: Array<{ message?: { content?: string } }>;
    usage?: unknown;
  };
  return { response, data, ...routing };
}

export function deepSeekErrorMessage(status: number, providerMessage?: string) {
  const message = (providerMessage || '').toLowerCase();
  if (status === 401 || status === 403 || /invalid.*key|authentication|unauthorized/.test(message)) {
    return 'DeepSeek API Key 无效、已过期，或没有调用权限。';
  }
  if (status === 402 || /insufficient|balance|quota.*exceed|credit/.test(message)) {
    return 'DeepSeek 账户余额不足或额度已用完，请到 DeepSeek 控制台检查。';
  }
  if (status === 404 || /model.*not.*found|model.*does not exist/.test(message)) {
    return '当前 DeepSeek 模型不可用。请稍后重试或检查模型配置。';
  }
  if (status === 429 || /rate.?limit|too many requests/.test(message)) {
    return '请求过于频繁，已触发 DeepSeek 限流。请稍等后再试。';
  }
  if (status >= 500) return 'DeepSeek 服务暂时不可用，请稍后再试。';
  return providerMessage || '模型服务返回错误。';
}
