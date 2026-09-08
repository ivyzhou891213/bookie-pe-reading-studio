type MentorRequest = { provider:'deepseek'|'openai'; model:string; apiKey:string; thinking?:'enabled'|'disabled'; reasoningEffort?:'low'|'medium'|'high'; book:string; page:number; quote:string; question:string; mode:string };
const SYSTEM = `你是克制、准确的双语阅读导师。先严格完成用户当次明确提出的任务，绝不擅自扩展到 PE、交易或面试；只有用户明确问“PE意义 / 投资应用 / 面试”等才加入相关内容。若用户请求“翻译 / translate / 看不懂 / 中文意思”，只给简洁中文翻译，必要时附一行关键词解释，不要额外分析。其余问题一律使用紧凑的中英双语：每个要点先中文，下一行给自然的英文对应表达；最多 3 个要点，总计不超过 220 个中文字符的等量篇幅。不要复述整段原文，不虚构交易事实，不使用冗长课程式标题。遇到“挑战我的理解”时只提出一个高质量问题，不立即给答案。`;
export async function POST(request:Request) {
  try {
    const body = await request.json() as MentorRequest;
    if (!body.apiKey || !body.quote || !body.question) return Response.json({error:'缺少 API Key、原文或问题。'},{status:400});
    const endpoint = body.provider==='deepseek'?'https://api.deepseek.com/chat/completions':'https://api.openai.com/v1/chat/completions';
    const prompt = `书籍：${body.book}\nPDF页码：${body.page}\n用户选中的原文：\n“${body.quote}”\n\n用户问题：${body.question}\n\n请只做用户要求的事，篇幅宁短勿长。`;
    const response = await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${body.apiKey}`},body:JSON.stringify({model:body.model,messages:[{role:'system',content:SYSTEM},{role:'user',content:prompt}],thinking:{type:body.thinking || 'disabled'},reasoning_effort:body.reasoningEffort || 'low',max_tokens:500,stream:false})});
    const data = await response.json() as {choices?:Array<{message?:{content?:string}}>;error?:{message?:string};usage?:unknown};
    if (!response.ok) return Response.json({error:data.error?.message||'模型服务返回错误。'},{status:response.status});
    return Response.json({answer:data.choices?.[0]?.message?.content||'导师没有返回内容。',usage:data.usage});
  } catch(error) { return Response.json({error:error instanceof Error?error.message:'无法处理请求。'},{status:500}); }
}
