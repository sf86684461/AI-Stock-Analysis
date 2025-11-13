function randn() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function round(n, d = 2) { const p = Math.pow(10, d); return Math.round(n * p) / p; }

const INDUSTRIES = ['银行','保险','证券','计算机','电子','半导体','新能源','医药生物','消费','汽车','房地产','钢铁','化工','有色金属','军工'];
const AREAS = ['上海','深圳','北京','广东','浙江','江苏'];
const SIGNALS = ['强烈买入','买入','持有','卖出','强烈卖出'];
const STYLES = ['价值投资','成长','动量','均衡'];

function genCodeByMarket(i) {
  const r = Math.random();
  if (r < 0.28) return `600${String(100 + (i % 900)).padStart(3,'0')}.SH`;
  if (r < 0.56) return `000${String(100 + (i % 900)).padStart(3,'0')}.SZ`;
  if (r < 0.80) return `300${String(100 + (i % 900)).padStart(3,'0')}.SZ`;
  if (r < 0.95) return `688${String(100 + (i % 900)).padStart(3,'0')}.SH`;
  return `8${String(10000 + (i % 90000)).padStart(5,'0')}.BJ`;
}

function genName(i) {
  const prefixes = ['华夏','中科','国泰','天弘','安信','招商','兴业','长江','恒生','海通','金石','同花','中金','广发','东方'];
  const suffixes = ['科技','信息','控股','集团','消费','能源','医药','电气','材料','软件','电子','汽车','环保','新材','设备'];
  return prefixes[i % prefixes.length] + suffixes[(i * 7) % suffixes.length];
}

function genStock(i) {
  const code = genCodeByMarket(i);
  const name = genName(i);
  const industry = pick(INDUSTRIES);
  const area = pick(AREAS);
  const base = Math.abs(randn()) * 30 + 5;
  const preClose = round(base, 2);
  const pct = clamp(round(randn() * 2.5, 2), -9.8, 9.8);
  const close = round(preClose * (1 + pct / 100), 2);
  // 前端以“万手”展示，这里 volume 按“手”提供，便于前端换算；规模调小以更贴近真实
  const volume = Math.floor(Math.abs(randn()) * 3e6 + 3e5); // 手
  // 前端以“亿”展示，这里 amount 按“万元”提供（UI: amount/10000 => 亿元）
  const amount = Math.floor((close * volume) / 100); // 万元（近似成交额）
  const turnover = round(clamp(Math.abs(randn()) * 2.5 + 1.2, 0.2, 25), 2);
  const pe = round(clamp(Math.abs(randn()) * 10 + 18, 2, 120), 2);
  const pb = round(clamp(Math.abs(randn()) * 1.2 + 2, 0.3, 15), 3);
  const roe = round(clamp(Math.abs(randn()) * 5 + 12, 0, 35), 1);
  const macd = round(randn() * 0.5, 3);
  const rsi = round(clamp(50 + randn() * 15, 5, 95), 1);
  const score = Math.min(99, Math.max(45, Math.round(75 + randn() * 12)));
  const signal = pick(SIGNALS);
  const style = pick(STYLES);
  return {
    code,
    name,
    industry,
    area,
    close,
    pre_close: preClose,
    change_pct: pct,
    volume,
    amount,
    turnover_rate: turnover,
    pe,
    pb,
    roe,
    macd,
    rsi,
    score,
    signal_type: signal,
    investment_style: style
  };
}

function filterAndSortStocks(stocks, { keyword = '', sort_field = 'score', sort_order = 'desc' } = {}) {
  let list = stocks;
  if (keyword) {
    const q = keyword.toLowerCase();
    list = list.filter(s => (s.code + s.name + s.industry + (s.area||'')).toLowerCase().includes(q));
  }
  const sf = sort_field;
  list = list.slice().sort((a,b) => {
    const av = a[sf] ?? 0; const bv = b[sf] ?? 0;
    return sort_order === 'asc' ? (av - bv) : (bv - av);
  });
  return list;
}

function generateMarketOverview(params = {}) {
  const totalPool = 600;
  const pool = Array.from({ length: totalPool }, (_, i) => genStock(i + 1));
  const filtered = filterAndSortStocks(pool, params || {});
  const page = Math.max(1, parseInt(params.page || 1, 10));
  const pageSize = Math.max(1, Math.min(200, parseInt(params.page_size || 50, 10)));
  const start = (page - 1) * pageSize;
  const stocks = filtered.slice(start, start + pageSize);
  return {
    success: true,
    data: {
      stocks,
      total: filtered.length,
      data_source: 'TuShare Pro + AkShare (Mock)'
    },
    processing_time: `${round(Math.random() * 1.2 + 0.3, 2)}秒`
  };
}

function generateMarketBreadth() {
  const up = Math.floor(1000 + Math.random() * 1500);
  const down = Math.floor(2200 + Math.random() * 1800);
  const flat = Math.floor(50 + Math.random() * 120);
  const total = up + down + flat;
  const upRatio = round(up / total * 100, 1);
  const downRatio = round(down / total * 100, 1);
  const limUp = Math.floor(40 + Math.random() * 60);
  const limDown = Math.floor(5 + Math.random() * 25);
  const dist = [
    { range: '涨停(>9.5%)', count: limUp, percentage: round(limUp / total * 100, 2) },
    { range: '大涨(5%-9.5%)', count: Math.floor(total * 0.03), percentage: 3.0 },
    { range: '中涨(2%-5%)', count: Math.floor(total * 0.08), percentage: 8.0 },
    { range: '小涨(0%-2%)', count: Math.floor(total * 0.12), percentage: 12.0 },
    { range: '平盘(-0.5%-0.5%)', count: flat, percentage: round(flat / total * 100, 2) },
    { range: '小跌(0%-2%)', count: Math.floor(total * 0.18), percentage: 18.0 },
    { range: '中跌(2%-5%)', count: Math.floor(total * 0.10), percentage: 10.0 },
    { range: '大跌(5%-9.5%)', count: Math.floor(total * 0.03), percentage: 3.0 },
    { range: '跌停(<-9.5%)', count: limDown, percentage: round(limDown / total * 100, 2) }
  ];
  const volDist = [
    { range: '超大量(>10亿)', count: Math.floor(total * 0.005), percentage: 0.5 },
    { range: '大量(1-10亿)', count: Math.floor(total * 0.06), percentage: 6.0 },
    { range: '中量(0.2-1亿)', count: Math.floor(total * 0.32), percentage: 32.0 },
    { range: '小量(<0.2亿)', count: Math.floor(total * 0.615), percentage: 61.5 }
  ];
  const mcDist = [
    { range: '超大盘(>1000亿)', count: Math.floor(total * 0.02), percentage: 2.0 },
    { range: '大盘股(100-1000亿)', count: Math.floor(total * 0.11), percentage: 11.0 },
    { range: '中盘股(50-100亿)', count: Math.floor(total * 0.18), percentage: 18.0 },
    { range: '小盘股(<50亿)', count: Math.floor(total * 0.69), percentage: 69.0 }
  ];
  const activity = {
    active_stocks: Math.floor(total * 0.6),
    active_ratio: 60.0,
    high_turnover_stocks: Math.floor(total * 0.085),
    high_turnover_ratio: 8.5,
    volume_surge_stocks: Math.floor(total * 0.07),
    volume_surge_ratio: 7.0,
    avg_turnover_rate: round(1.8 + Math.random() * 1.2, 1),
    avg_volume_ratio: round(0.9 + Math.random() * 0.4, 2)
  };
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
  const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
  return {
    success: true,
    data: {
      trade_date: dateStr,
      total_stocks: total,
      data_source: 'TuShare Pro深度API + AkShare (Mock) ',
      data_quality: `${round(95 + Math.random() * 3, 1)}%`,
      analysis_time: timeStr,
      up_down_analysis: {
        up_count: up,
        down_count: down,
        flat_count: flat,
        total_count: total,
        up_ratio: upRatio,
        down_ratio: downRatio,
        advance_decline_ratio: round(up / Math.max(1, down), 2)
      },
      limit_analysis: {
        limit_up_count: limUp,
        limit_down_count: limDown,
        limit_up_ratio: round(limUp / total * 100, 2),
        limit_down_ratio: round(limDown / total * 100, 2)
      },
      price_change_distribution: dist,
      volume_distribution: volDist,
      market_cap_distribution: mcDist,
      market_activity: activity
    }
  };
}

function generateLimitUpAnalysis(days = 7) {
  const n = Math.max(3, Math.min(30, parseInt(days || 7, 10)));
  const now = new Date();
  const daily_stats = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(now.getTime() - i * 86400000);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const total_limit_up = Math.floor(30 + Math.random() * 60);
    const first_limit_up = Math.floor(total_limit_up * (0.7 + Math.random() * 0.2));
    const continuous_limit_up = total_limit_up - first_limit_up;
    const next_day_rate = Math.floor(15 + Math.random() * 35);
    const sentiment = next_day_rate > 35 ? '强势' : (next_day_rate > 22 ? '中性' : '偏弱');
    daily_stats.push({
      trade_date: dateStr,
      total_limit_up,
      first_limit_up,
      continuous_limit_up,
      next_day_rate,
      market_sentiment: sentiment
    });
  }
  daily_stats.reverse();

  const time_distribution = [
    { time_range: '09:30-10:00', count: Math.floor(10 + Math.random() * 15), percentage: round(25 + Math.random() * 10, 1) },
    { time_range: '10:00-10:30', count: Math.floor(8 + Math.random() * 12), percentage: round(18 + Math.random() * 10, 1) },
    { time_range: '10:30-11:30', count: Math.floor(10 + Math.random() * 15), percentage: round(22 + Math.random() * 10, 1) },
    { time_range: '13:00-14:00', count: Math.floor(6 + Math.random() * 10), percentage: round(15 + Math.random() * 6, 1) },
    { time_range: '14:00-15:00', count: Math.floor(6 + Math.random() * 12), percentage: round(15 + Math.random() * 8, 1) }
  ];

  const total_first_limit_up = daily_stats.reduce((s, d) => s + d.first_limit_up, 0);
  const continuation_count = Math.floor(total_first_limit_up * (0.22 + Math.random() * 0.18));
  const success_rate = Math.floor(continuation_count / Math.max(1, total_first_limit_up) * 100);

  const continuation_analysis = {
    success_rate_pie: [
      { name: '继续涨停', value: success_rate },
      { name: '未涨停', value: 100 - success_rate }
    ],
    total_first_limit_up,
    continuation_count,
    success_rate
  };

  return {
    success: true,
    data: {
      daily_stats,
      time_distribution,
      continuation_analysis
    }
  };
}

function genKlineSeries(n = 60, base = 20) {
  const out = [];
  let price = base;
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const change = clamp(randn() * 0.8, -1.5, 1.5);
    const open = round(price * (1 + (randn() * 0.2) / 100), 2);
    price = round(Math.max(1, price * (1 + change / 100)), 2);
    const close = price;
    const high = round(Math.max(open, close) * (1 + Math.abs(randn()) * 0.005), 2);
    const low = round(Math.min(open, close) * (1 - Math.abs(randn()) * 0.005), 2);
    const volume = Math.floor(1000000 + Math.abs(randn()) * 9000000);
    out.push({ date: dateStr, open, high, low, close, volume });
  }
  return out;
}

function generateTradingSignals(stockCode = '000001.SZ') {
  const stock_name = '示例公司';
  const current_price = round(10 + Math.abs(randn()) * 20, 2);
  const dif = round(randn() * 0.2, 3);
  const dea = round(dif - Math.abs(randn()) * 0.1, 3);
  const macd = round(2 * (dif - dea), 3);
  const rsi = round(clamp(50 + randn() * 12, 10, 90), 1);
  const bollMiddle = current_price;
  const bollUpper = round(bollMiddle * (1 + (Math.abs(randn()) * 0.05 + 0.02)), 2);
  const bollLower = round(bollMiddle * (1 - (Math.abs(randn()) * 0.05 + 0.02)), 2);
  const kline_data = genKlineSeries(120, current_price);

  const trading_signals = [
    { signal_type: 'buy', signal_strength: 'strong', reason: 'MACD金叉', timestamp: new Date().toISOString() },
    { signal_type: 'hold', signal_strength: 'medium', reason: 'RSI中性区间', timestamp: new Date(Date.now() - 3600_000).toISOString() }
  ];

  return {
    success: true,
    data: {
      stock_code: stockCode,
      stock_name,
      current_price,
      indicators: {
        MACD: { dif, dea, macd },
        RSI: rsi,
        BOLL: { upper: bollUpper, middle: bollMiddle, lower: bollLower }
      },
      trading_signals,
      kline_data,
      backtest_result: {
        period: '1Y',
        win_rate: round(40 + Math.random() * 30, 1),
        sharpe: round(0.8 + Math.random() * 0.8, 2)
      }
    }
  };
}

function generateChipDistribution(stockCode = '000001.SZ') {
  const levels = 40;
  const base = round(10 + Math.random() * 20, 2);
  const distribution = [];
  let sum = 0;
  for (let i = 0; i < levels; i++) {
    const price = round(base * (0.7 + i / levels * 0.8), 2);
    const weight = Math.max(0.2, Math.abs(randn()));
    sum += weight;
    distribution.push({ price, weight });
  }
  distribution.forEach(d => d.weight = round(d.weight / sum * 100, 2));
  const avg = round(distribution.reduce((s, d) => s + d.price * d.weight, 0) / 100, 2);
  const concentration = round(50 + Math.random() * 30, 2);
  return {
    success: true,
    data: {
      stock_code: stockCode,
      distribution,
      statistics: {
        average_cost: avg,
        avg_cost: avg,
        concentration_ratio: round(concentration / 100, 3),
        concentration
      }
    }
  };
}

function generateHealth() {
  return {
    success: true,
    status: 'ok',
    message: 'Mock API 服务正常运行',
    timestamp: new Date().toISOString(),
    version: 'mock-1.0.0'
  };
}

function generateStrategiesList() {
  return {
    success: true,
    data: {
      strategies: [
        {
          strategy_id: 'value_investment',
          strategy_name: '价值投资策略',
          description: '基于PE、PB、ROE等指标筛选低估值股票',
          parameters: { pe_range: [3, 30], pb_range: [0.3, 5], roe_min: 8 },
          risk_level: '低', expected_return: '稳健'
        },
        {
          strategy_id: 'growth_investment',
          strategy_name: '成长投资策略',
          description: '筛选高成长性股票',
          parameters: { revenue_growth_min: 20, profit_growth_min: 15, pe_max: 50 },
          risk_level: '中', expected_return: '较高'
        }
      ]
    }
  };
}

function generateStocksCount() {
  const total = 500 + Math.floor(Math.random() * 3500);
  return { success: true, total_count: total, total_stocks: total };
}

function generateFilteredStocks() {
  const total = 100 + Math.floor(Math.random() * 900);
  return { success: true, total_stocks: total };
}

function generateStrategyExecute(payload = {}) {
  const count = 20 + Math.floor(Math.random() * 30);
  const results = Array.from({ length: count }, (_, i) => {
    const s = genStock(i + 10);
    return {
      stock_code: s.code,
      stock_name: s.name,
      current_price: s.close,
      pe: s.pe,
      pb: s.pb,
      roe: s.roe,
      market_cap: Math.floor(50 + Math.random() * 3000),
      industry: s.industry,
      strategy_score: s.score,
      investment_style: s.investment_style,
      risk_level: pick(['低','中','高']),
      recommendation: pick(['强烈推荐','推荐','中性'])
    };
  });
  return {
    success: true,
    data: {
      execution_id: `exec_${Date.now()}`,
      strategy_name: payload.strategy_name || 'mock_strategy',
      execution_time: new Date().toISOString(),
      total_filtered: results.length + Math.floor(Math.random() * 50),
      qualified_count: results.length,
      data_source: 'Mock',
      results,
      statistics: {
        avg_pe: round(results.reduce((s,r)=>s+r.pe,0)/results.length,1),
        avg_pb: round(results.reduce((s,r)=>s+r.pb,0)/results.length,2),
        avg_roe: round(results.reduce((s,r)=>s+r.roe,0)/results.length,1),
        industry_distribution: results.reduce((acc,r)=>{acc[r.industry]=(acc[r.industry]||0)+1;return acc;}, {})
      }
    }
  };
}

function generateExecuteOptimizedStart() {
  return { success: true, execution_id: `mock_${Math.random().toString(36).slice(2,8)}_${Date.now()}` };
}

function generateExecuteOptimizedProgress(exe) {
  const elapsed = (Date.now() - exe.start) / 1000;
  const progress = Math.min(100, Math.round(elapsed * (100 / exe.duration)));
  const stages = ['初始化','获取列表','抓取数据','计算指标','评分排序','生成报告'];
  const idx = Math.min(stages.length - 1, Math.floor(progress / (100 / stages.length)));
  return {
    success: true,
    progress: {
      progress,
      message: stages[idx],
      status: progress >= 100 ? 'completed' : 'running',
      analyzed_stocks: Math.floor(progress * 2.3),
      total_stocks: exe.total || 500,
      qualified_stocks: Math.floor(progress * 0.9),
      elapsed_time_formatted: `${Math.floor(elapsed)}s`
    }
  };
}

function generateExecuteOptimizedResult(exe) {
  const qualified = 30 + Math.floor(Math.random() * 40);
  const stocks = Array.from({ length: qualified }, (_, i) => genStock(i + 200));
  return {
    success: true,
    total_filtered: stocks.length + 50,
    total_stocks: exe.total || 500,
    analyzed_stocks: exe.total || 500,
    qualified_count: stocks.length,
    concurrent_workers: exe.workers || 5,
    execution_time: (Date.now() - exe.start) / 1000,
    analysis_summary: { avg_time_per_stock: round(Math.random() * 1.2 + 0.3, 1) },
    qualified_stocks: stocks
  };
}

module.exports = {
  generateHealth,
  generateMarketOverview,
  generateMarketBreadth,
  generateLimitUpAnalysis,
  generateTradingSignals,
  generateChipDistribution,
  generateStrategiesList,
  generateStocksCount,
  generateFilteredStocks,
  generateStrategyExecute,
  generateExecuteOptimizedStart,
  generateExecuteOptimizedProgress,
  generateExecuteOptimizedResult
};
