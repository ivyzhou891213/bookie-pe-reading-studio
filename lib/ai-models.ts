export const DEEPSEEK_MODELS = {
  flash: 'deepseek-flash',
} as const;

export type DeepSeekModelTier = keyof typeof DEEPSEEK_MODELS;

export type AiTask =
  | 'mentor'
  | 'summary'
  | 'planner'
  | 'knowledge'
  | 'formulas'
  | 'import'
  | 'investment-analysis'
  | 'mock'
  | 'connection-test';

/**
 * This is the only task-to-tier policy in the app. On 2026-09-10, DeepSeek
 * released V4.1 Flash as `deepseek-flash` and announced V4 Pro retirement.
 * The provider states V4.1 Flash now wins on performance, cost and speed, so
 * every Reading Studio task uses the current stable Flash alias.
 */
export const AI_TASK_ROUTING: Record<AiTask, DeepSeekModelTier> = {
  mentor: 'flash',
  summary: 'flash',
  planner: 'flash',
  knowledge: 'flash',
  formulas: 'flash',
  import: 'flash',
  'investment-analysis': 'flash',
  mock: 'flash',
  'connection-test': 'flash',
};

export function isDeepSeekModelTier(value: unknown): value is DeepSeekModelTier {
  return value === 'flash';
}

export function deepSeekModelFor(
  task: AiTask,
  defaultTier: unknown = 'flash',
  autoRoute = true,
): { tier: DeepSeekModelTier; model: string } {
  const fallback = isDeepSeekModelTier(defaultTier) ? defaultTier : 'flash';
  const tier = autoRoute ? AI_TASK_ROUTING[task] : fallback;
  return { tier, model: DEEPSEEK_MODELS[tier] };
}

export function deepSeekDisplayName(_tier: DeepSeekModelTier) {
  return 'DeepSeek V4.1 Flash';
}
