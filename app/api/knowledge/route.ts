import { callDeepSeek, deepSeekErrorMessage } from '@/lib/deepseek-server';
import type { DeepSeekModelTier } from '@/lib/ai-models';

type HistoryItem={question:string;quote:string;answer:string;bookId:string;page:number};
type KnowledgeRequest={apiKey:string;defaultModel?:DeepSeekModelTier;autoRoute?:boolean;task?:'knowledge'|'summary';thinking?:'enabled'|'disabled';reasoningEffort?:'low'|'medium'|'high'|'max';query:string;history:HistoryItem[];mode?:'search'|'daily-summary'};

const SYSTEM=`你是大型私募股权基金的投资导师和面试教练。用户有基础设施和跨境投资经验。请把检索问题整理为可长期复用的双语知识卡，而不是泛泛聊天。必须区分教材理论、历史问答和你的分析；没有资料支持时不要虚构书中页码或案例事实。`;

export async function POST(request:Request){
  try{
    const body=await request.json() as KnowledgeRequest;
    if(!body.apiKey||!body.query)return Response.json({error:'缺少 API Key 或检索问题。'},{status:400});
    const history=(body.history||[]).slice(-6).map((x,i)=>`历史问答${i+1}（${x.bookId}，PDF第${x.page}页）\n问题：${x.question.slice(0,800)}\n原文：${x.quote.slice(0,2500)}\n回答：${x.answer.slice(0,1200)}`).join('\n\n');
    const prompt=body.mode==='daily-summary'
      ? `任务：${body.query}\n\n本次阅读原文、划线问题与回答：\n${history||'本次没有保存到可供分析的原文或问题。'}\n\n严格依据这次阅读的材料输出。不要套用知识卡格式；不要假设页数、章节或用户阅读量；没有资料支持时明确写“本次材料不足以判断”。`
      : `检索主题：${body.query}\n\n${history||'没有直接匹配的历史问答。'}\n\n请严格按以下结构输出：

【中文理解】
1. 一句话定义
2. 核心组成与公式（说明每个变量）
3. 不同公司/行业为什么会不同
4. PE 投资中的实际应用
5. 常见错误与追问
6. 教材理论线索（只写你有把握的书名和章节主题，不编页码）

【English Interview Answer】
给出自然、专业、可在60–90秒内说完的英文答案，不要逐句翻译中文。

【Likely Follow-up Questions】
列出3个英文追问，并用一两句英文给出答题方向。

如果主题是行业估值，必须比较适用的估值方法、适用条件、关键KPI、主要陷阱，并给出方法选择结论。`;
    const { response, data, model }=await callDeepSeek(body,{messages:[{role:'system',content:SYSTEM},{role:'user',content:prompt}],max_tokens:body.mode==='daily-summary'?420:700});
    if(!response.ok)return Response.json({error:deepSeekErrorMessage(response.status,data.error?.message)},{status:response.status});
    return Response.json({answer:data.choices?.[0]?.message?.content||'没有找到内容。',usage:data.usage,model});
  }catch(error){return Response.json({error:error instanceof Error && error.message === 'MISSING_API_KEY' ? '缺少 API Key 或检索问题。' : '无法处理检索。'},{status:500})}
}
