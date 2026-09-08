export type FormulaCard = {
  id: string;
  // Uploaded books receive generated ids, so formula cards must not be limited
  // to the two bundled titles.
  bookId: string;
  chapter: number;
  name: string;
  aliases: string[];
  formula: string;
  variables: string;
  derivation: string;
  peUse: string;
  interviewCn: string;
  interviewEn: string;
  sourcePage?: number;
};

export const FORMULAS: FormulaCard[] = [
  {
    id: 'roic-core',
    bookId: 'valuation',
    chapter: 8,
    name: 'ROIC（投入资本回报率）',
    aliases: [
      'roic',
      'return on invested capital',
      '投入资本回报率',
      'what drives roic',
    ],
    formula: 'ROIC = NOPAT ÷ Invested Capital',
    variables:
      'NOPAT 是税后经营利润；Invested Capital 是经营性资产减去无息经营负债。',
    derivation:
      '企业用投入资本产生经营利润；先剔除融资结构影响，再按税后口径计算，因此 NOPAT 除以投入资本衡量核心经营效率。',
    peUse:
      '判断增长是否创造价值、识别资本密集度和竞争优势，也是拆解退出价值的重要起点。',
    interviewCn:
      'ROIC 衡量公司每投入一元经营资本能创造多少税后经营利润。只有当 ROIC 持续高于 WACC，增长通常才创造价值。',
    interviewEn:
      'ROIC measures the after-tax operating profit generated per unit of invested capital. Growth generally creates value only when ROIC sustainably exceeds WACC.',
    sourcePage: 206,
  },
  {
    id: 'roic-unit-driver',
    bookId: 'valuation',
    chapter: 8,
    name: 'What Drives ROIC（单位经济模型）',
    aliases: [
      'what drives roic',
      'roic driver',
      'price per unit',
      'cost per unit',
      '单位经济',
    ],
    formula:
      'ROIC = (1 − Tax Rate) × (Price per Unit − Cost per Unit) ÷ Invested Capital per Unit',
    variables:
      'Price − Cost 是单位税前经营利润；Invested Capital per Unit 是支持一单位销量所需资本。',
    derivation:
      'NOPAT = (1−税率)×单位经营利润×销量；投入资本 = 单位投入资本×销量。分子分母同时约去销量，即得到单位经济表达。',
    peUse:
      '把抽象 ROIC 拆成定价权、成本优势和资本效率，便于把商业尽调发现转成模型假设。',
    interviewCn:
      'ROIC 的三个底层抓手是价格、单位成本和单位投入资本。PE 应判断改善来自可持续竞争优势，还是一次性削减。',
    interviewEn:
      'ROIC is ultimately driven by price, unit cost, and invested capital per unit. A PE investor should test whether improvement reflects durable advantage or temporary cost cutting.',
    sourcePage: 208,
  },
  {
    id: 'fcf',
    bookId: 'valuation',
    chapter: 3,
    name: '自由现金流（FCF）',
    aliases: ['fcf', 'free cash flow', '自由现金流', 'nopat plus depreciation'],
    formula:
      'FCF = NOPAT + Noncash Operating Expenses − Investment in Invested Capital',
    variables: '非现金费用通常含折旧摊销；投资包括资本开支和营运资本增加。',
    derivation:
      '从税后经营利润出发，加回未消耗现金的费用，再扣除维持和增长业务所需的新增资本。',
    peUse: '决定债务偿还能力、股东分配空间和 LBO 下行保护。',
    interviewCn:
      'FCF 是业务在支付经营成本、税费和必要再投资后，可供全部资本提供者分配的现金。',
    interviewEn:
      'FCF is the cash available to all capital providers after operating costs, taxes, and required reinvestment.',
  },
  {
    id: 'value-driver',
    bookId: 'valuation',
    chapter: 3,
    name: '价值驱动公式（Value Driver Formula）',
    aliases: ['value driver formula', '价值驱动公式', 'growth roic value'],
    formula: 'Value = NOPAT₁ × (1 − g ÷ ROIC) ÷ (WACC − g)',
    variables: 'g 是长期 NOPAT 增长率；g/ROIC 是支持增长所需的再投资率。',
    derivation:
      '稳定增长下，Reinvestment Rate = g/ROIC，因此 FCF₁ = NOPAT₁×(1−g/ROIC)；再代入永续增长公式。',
    peUse:
      '直接揭示增长、回报率和资本成本的联动，避免把所有收入增长都当成价值创造。',
    interviewCn:
      '增长的价值取决于增量 ROIC 相对 WACC；若二者相等，增长本身不增加价值。',
    interviewEn:
      'The value of growth depends on incremental ROIC relative to WACC; when the two are equal, growth by itself does not create value.',
  },
  {
    id: 'wacc',
    bookId: 'valuation',
    chapter: 15,
    name: 'WACC（加权平均资本成本）',
    aliases: [
      'wacc',
      'weighted average cost of capital',
      '加权平均资本成本',
      '资本成本',
    ],
    formula: 'WACC = E/(D+E) × Ke + D/(D+E) × Kd × (1−T)',
    variables:
      'E、D 用市场价值；Ke 是股权成本；Kd 是税前债务成本；T 是边际税率。',
    derivation:
      '企业现金流属于股东和债权人，因此按二者在目标资本结构中的市场价值权重，对各自要求回报加权；利息税盾使债务成本按税后计。',
    peUse:
      '影响 DCF 入场估值，也帮助判断不同业务、国家和资本结构的风险不能用同一折现率。',
    interviewCn:
      'WACC 是企业整体资本提供者要求回报的加权平均，权重应用市场价值和目标资本结构。',
    interviewEn:
      'WACC is the market-value-weighted required return of debt and equity capital, based on the company’s target capital structure.',
  },
  {
    id: 'capm',
    bookId: 'valuation',
    chapter: 15,
    name: 'CAPM（股权成本）',
    aliases: ['capm', 'cost of equity', '股权成本', 'beta'],
    formula: 'Ke = Rf + β × Market Risk Premium',
    variables:
      'Rf 是无风险利率；β 是系统性风险；市场风险溢价是市场相对无风险资产的额外回报。',
    derivation:
      '可分散风险不应获得补偿；股东只因承担与市场共同波动的系统性风险获得风险溢价。',
    peUse:
      '用于 DCF 和 APV；选择可比公司 beta、资本结构和国家风险时需要投资判断。',
    interviewCn:
      'CAPM 用无风险利率加上 beta 调整后的市场风险溢价估算股权成本。',
    interviewEn:
      'CAPM estimates the cost of equity as the risk-free rate plus beta times the market risk premium.',
  },
  {
    id: 'terminal-growth',
    bookId: 'valuation',
    chapter: 14,
    name: '永续增长终值',
    aliases: [
      'terminal value',
      'continuing value',
      'gordon growth',
      '终值',
      '永续增长',
    ],
    formula: 'TVₜ = FCFₜ₊₁ ÷ (WACC − g)',
    variables: 'FCFₜ₊₁ 是终值期第一年的规范化现金流；g 是可持续长期增长率。',
    derivation:
      '把从 t+1 开始、以固定速度 g 永续增长的现金流按 WACC 折现到 t 时点。',
    peUse:
      '终值常占 DCF 大部分；需要审查稳定期利润率、ROIC、再投资和增长是否彼此一致。',
    interviewCn:
      '终值不是简单套倍数，应建立在稳定期现金流和长期增长可持续的前提上。',
    interviewEn:
      'Terminal value should be based on normalized cash flow and a sustainable long-term growth rate, not treated as a mechanical plug.',
  },
  {
    id: 'ev-equity',
    bookId: 'valuation',
    chapter: 16,
    name: 'Enterprise Value 到 Equity Value',
    aliases: [
      'enterprise value to equity value',
      'ev to equity',
      'equity bridge',
      '企业价值 股权价值',
    ],
    formula:
      'Equity Value = Enterprise Value − Net Debt − Debt-like Items + Nonoperating Assets',
    variables:
      'Net Debt 为有息债务减现金；类债务项目可能包括养老金缺口、租赁等。',
    derivation:
      '企业价值属于所有资本提供者；扣除优先于普通股的索取权，再加入未计入经营价值的资产。',
    peUse:
      '直接决定 sponsor purchase price 和 sources & uses，类债务项目常是交易谈判重点。',
    interviewCn:
      '从 EV 到股权价值的核心是扣除净债务和类债务项目，并加回非经营资产。',
    interviewEn:
      'To bridge from enterprise value to equity value, subtract net debt and debt-like claims and add non-operating assets.',
  },
  {
    id: 'ev-ebitda',
    bookId: 'investment-banking',
    chapter: 1,
    name: 'EV / EBITDA',
    aliases: ['ev ebitda', 'enterprise value ebitda', '企业价值倍数'],
    formula: 'EV / EBITDA = Enterprise Value ÷ LTM or NTM EBITDA',
    variables:
      '分子与分母必须口径匹配；EV 对应利息前、面向全部资本提供者的 EBITDA。',
    derivation:
      'EV 是债权人和股东共同拥有的经营价值，因此与未扣利息的经营指标配对。',
    peUse:
      '入场与退出估值最常用倍数之一，但必须调整租赁、一次性项目及会计政策差异。',
    interviewCn:
      'EV/EBITDA 便于跨资本结构比较，但不能替代对资本开支、营运资本和增长质量的分析。',
    interviewEn:
      'EV/EBITDA improves comparability across capital structures, but it ignores capex, working capital, and the quality of growth.',
  },
  {
    id: 'pe-ratio',
    bookId: 'investment-banking',
    chapter: 1,
    name: 'P / E（市盈率）',
    aliases: ['p/e', 'pe ratio', 'price earnings', '市盈率'],
    formula: 'P / E = Equity Value per Share ÷ Diluted EPS',
    variables: '股权价值必须与归属于普通股股东的净利润匹配，通常采用摊薄股数。',
    derivation:
      '股价是普通股权益价值，EPS 是每股普通股收益，因此二者是匹配的股权口径。',
    peUse:
      '适合资本结构相近且盈利为正的公司；高杠杆、税率差异或亏损企业可比性较弱。',
    interviewCn:
      'P/E 是股权价值倍数，受杠杆、税率和非经营项目影响，因此跨公司比较时要谨慎。',
    interviewEn:
      'P/E is an equity-value multiple and is affected by leverage, taxes, and non-operating items, so cross-company comparability can be limited.',
  },
  {
    id: 'ps-ratio',
    bookId: 'investment-banking',
    chapter: 1,
    name: 'P / S 与 EV / Revenue',
    aliases: ['p/s', 'ps ratio', 'price sales', 'ev revenue', '市销率'],
    formula:
      'P/S = Equity Value ÷ Revenue; EV/Revenue = Enterprise Value ÷ Revenue',
    variables: 'Revenue 是利息前指标，严格口径上更适合与 EV 配对。',
    derivation:
      '当利润为负时收入仍可作为规模代理，但它不反映毛利率、费用效率或资本强度。',
    peUse:
      '常用于亏损的高增长科技公司；必须结合增长、毛利率、留存和达到正现金流所需资金。',
    interviewCn:
      '收入倍数适合尚未盈利的企业，但同样收入的价值会因毛利率、增长质量和资本效率而显著不同。',
    interviewEn:
      'Revenue multiples can be useful for unprofitable growth companies, but must be interpreted alongside margins, retention, growth quality, and capital efficiency.',
  },
  {
    id: 'moic',
    bookId: 'investment-banking',
    chapter: 5,
    name: 'MOIC（投入资本倍数）',
    aliases: [
      'moic',
      'multiple of invested capital',
      'money multiple',
      '投入资本倍数',
    ],
    formula:
      'MOIC = Sponsor Equity Proceeds at Exit ÷ Sponsor Equity Invested at Entry',
    variables: '退出股权收入应包括期间分红；投入额包括初始及后续追加股权。',
    derivation:
      '比较 sponsor 最终收回的总股权价值与实际投入，不考虑资金占用时间。',
    peUse: '直观衡量价值倍增，但必须与 IRR 一起看，避免忽略持有期。',
    interviewCn: 'MOIC 告诉你赚了几倍钱，IRR 告诉你以多快的速度赚到。',
    interviewEn:
      'MOIC tells you how many times your money you made, while IRR tells you how quickly you made it.',
  },
  {
    id: 'irr-simple',
    bookId: 'investment-banking',
    chapter: 5,
    name: 'IRR（简化单次进出）',
    aliases: ['irr', 'internal rate of return', '内部收益率'],
    formula: 'IRR = (Exit Proceeds ÷ Entry Equity)^(1 / Holding Years) − 1',
    variables: '该简式只适用于中间没有现金流的单次投入和退出。',
    derivation:
      'IRR 是使全部现金流净现值等于零的折现率；单次进出时等同于年化复合回报。',
    peUse: '受入场估值、杠杆、EBITDA 增长、去杠杆、退出倍数和持有期共同驱动。',
    interviewCn:
      'LBO 回报桥通常拆为 EBITDA 增长、净债务偿还和倍数变化，并由持有期决定年化速度。',
    interviewEn:
      'LBO returns are typically bridged through EBITDA growth, debt paydown, and multiple movement, with holding period determining the annualized return.',
  },
  {
    id: 'accretion-dilution',
    bookId: 'investment-banking',
    chapter: 7,
    name: '增厚 / 摊薄（Accretion / Dilution）',
    aliases: ['accretion dilution', '增厚 摊薄', 'pro forma eps'],
    formula:
      'Accretion / (Dilution) % = Pro Forma EPS ÷ Buyer Standalone EPS − 1',
    variables:
      'Pro Forma EPS 包含目标利润、协同、融资成本、增量折旧摊销和新增股数。',
    derivation:
      '比较并购后每股收益与买方独立 EPS，衡量交易对近期会计盈利的机械影响。',
    peUse:
      '对战略买方竞价能力有帮助，但增厚不等于创造价值，PE 更关注绝对回报和现金流。',
    interviewCn: 'EPS 增厚是融资和会计结果，不足以证明交易创造经济价值。',
    interviewEn:
      'EPS accretion is a financing and accounting outcome; it does not by itself prove that a transaction creates economic value.',
  },
];
