const express = require('express');
const cors = require('cors');
const path = require('path');

const {
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
} = require('./src/mocks/mockData');

const app = express();
const PORT = process.env.API_PORT || 5001;

app.use(cors());
app.use(express.json());

// 内存执行状态（并发策略）
const executions = new Map();

// 健康检查
app.get('/api/health', (req, res) => {
  res.json(generateHealth());
});

// 股票技术分析（快速）
app.get('/api/trading-signals/:code', (req, res) => {
  const { code } = req.params;
  res.json(generateTradingSignals(code));
});

// 市场概览（分页、搜索、排序）
app.post('/api/market-overview', (req, res) => {
  res.json(generateMarketOverview(req.body || {}));
});

// 涨停分析
app.post('/api/limit-up-analysis', (req, res) => {
  const days = (req.body && (req.body.days || req.body.range || 7)) || 7;
  res.json(generateLimitUpAnalysis(days));
});

// 市场宽度分析
app.post('/api/market-breadth', (req, res) => {
  res.json(generateMarketBreadth());
});
app.get('/api/market-breadth', (req, res) => {
  res.json(generateMarketBreadth());
});

// 策略列表
app.get('/api/strategies/list', (req, res) => {
  res.json(generateStrategiesList());
});

// 策略执行（简单版）
app.post('/api/strategies/execute', (req, res) => {
  res.json(generateStrategyExecute(req.body || {}));
});

// 预设扫描（返回标准结构，含 qualified_stocks）
app.post('/api/strategies/preset-scan', (req, res) => {
  const count = 50;
  const r = generateStrategyExecute(req.body || {});
  const stocks = (r.data?.results || []).slice(0, count).map((s) => ({
    stock_code: s.stock_code,
    stock_name: s.stock_name,
    exchange: s.stock_code.endsWith('.SH') ? 'SH' : 'SZ',
    score: s.strategy_score,
    pe: s.pe,
    pb: s.pb,
    roe: s.roe,
    market_cap: s.market_cap,
    data_source: 'mock',
    analysis_time: new Date().toISOString()
  }));
  res.json({
    success: true,
    total_filtered: r.data?.total_filtered || (stocks.length + 20),
    qualified_count: stocks.length,
    qualified_stocks: stocks,
    top_30_stocks: stocks.slice(0, 30),
    data_sources: { akshare: Math.floor(stocks.length * 0.6), tushare: Math.floor(stocks.length * 0.4) },
    total_analyzed: stocks.length + 50,
    data_quality: 96.5,
    execution_time: 8
  });
});

// 市场扫描（返回含 top_30、统计等专用结构）
app.post('/api/strategies/market-scan', (req, res) => {
  const payload = req.body || {};
  const base = generateStrategyExecute(payload);
  const all = (base.data?.results || []).map((s, idx) => {
    const priceChange = (Math.random() * 6 - 3);
    const gradePool = ['S+', 'S', 'A+', 'A', 'B+', 'B', 'C+', 'C'];
    const strengthPool = ['强烈买入', '买入', '卖出', '强烈卖出', '观望'];
    return {
      stock_code: s.stock_code,
      stock_name: s.stock_name,
      market: s.stock_code.endsWith('.SH') ? '沪A' : '深A',
      exchange: s.stock_code.endsWith('.SH') ? 'SH' : 'SZ',
      score: s.strategy_score,
      grade: gradePool[Math.floor(Math.random() * gradePool.length)],
      signals_count: 5 + Math.floor(Math.random() * 8),
      buy_signals: 2 + Math.floor(Math.random() * 6),
      sell_signals: 1 + Math.floor(Math.random() * 4),
      signal_strength: strengthPool[Math.floor(Math.random() * strengthPool.length)],
      latest_price: s.current_price,
      price_change: priceChange,
      recommendation: '⭐⭐⭐'.slice(0, 1 + Math.floor(Math.random() * 5)),
    };
  });

  const top30 = all.slice(0, 30);
  const gradeDist = top30.reduce((acc, it) => { acc[it.grade] = (acc[it.grade] || 0) + 1; return acc; }, {});
  const marketDist = top30.reduce((acc, it) => { acc[it.market] = (acc[it.market] || 0) + 1; return acc; }, {});
  const strengthDist = top30.reduce((acc, it) => { acc[it.signal_strength] = (acc[it.signal_strength] || 0) + 1; return acc; }, {});

  const resp = {
    success: true,
    strategy_name: payload.strategy_name || '市场扫描',
    scan_time: new Date().toISOString(),
    total_analyzed: all.length + 120,
    qualified_count: all.length,
    top_30_count: top30.length,
    top_30_stocks: top30,
    summary_stats: {
      grade_distribution: gradeDist,
      market_distribution: marketDist,
      signal_strength_distribution: strengthDist
    },
    max_score: Math.max(...top30.map(s => s.score || 0)),
    avg_score: top30.reduce((s, r) => s + (r.score || 0), 0) / Math.max(1, top30.length),
    elapsed_time: 5 + Math.floor(Math.random() * 10)
  };
  res.json(resp);
});

// 全市场扫描（仅返回执行ID）
app.post('/api/strategies/full-market-scan', (req, res) => {
  const id = `exec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const duration = 60 + Math.floor(Math.random() * 60); // 60-120s
  executions.set(id, { start: Date.now(), duration, total: 500, workers: 8 });
  res.json({ success: true, execution_id: id });
});

// 并发优化 - 启动
app.post('/api/strategies/execute-optimized', (req, res) => {
  const payload = req.body || {};
  const idObj = generateExecuteOptimizedStart();
  const id = idObj.execution_id;
  const duration = 45 + Math.floor(Math.random() * 60);
  const total = payload.max_stocks || 500;
  const workers = payload.max_workers || 5;
  executions.set(id, { start: Date.now(), duration, total, workers });
  res.json({ success: true, execution_id: id });
});

// 并发优化 - 进度
app.get('/api/strategies/progress/:id', (req, res) => {
  const id = req.params.id;
  const exe = executions.get(id) || { start: Date.now(), duration: 30, total: 300, workers: 5 };
  const prog = generateExecuteOptimizedProgress(exe);
  // 如果完成，标记并保留状态用于结果
  if (prog.progress.status === 'completed') {
    // 保持 exe 存在，供 /result 使用
  }
  res.json({ success: true, progress: prog.progress });
});

// 并发优化 - 结果
app.get('/api/strategies/result/:id', (req, res) => {
  const id = req.params.id;
  const exe = executions.get(id) || { start: Date.now() - 60000, duration: 1, total: 400, workers: 6 };
  const result = generateExecuteOptimizedResult(exe);
  res.json(result);
});

// 高级策略执行（用于 StrategyResultDisplay 展示）
app.post('/api/advanced-strategies/execute', (req, res) => {
  const base = generateStrategyExecute(req.body || {});
  const stocks = (base.data?.results || []).map((s) => ({
    stock_code: s.stock_code,
    stock_name: s.stock_name,
    exchange: s.stock_code.endsWith('.SH') ? 'SH' : 'SZ',
    score: s.strategy_score,
    pe: s.pe,
    pb: s.pb,
    roe: s.roe,
    market_cap: s.market_cap,
    data_source: 'mock',
    analysis_time: new Date().toISOString()
  }));
  const payload = req.body || {};
  const resp = {
    success: true,
    strategy_info: {
      id: payload.strategy_id || 'mock_strategy',
      name: payload.strategy_name || 'Mock策略'
    },
    scan_summary: {
      rules: payload.parameters || {},
      remark: '基于Mock数据的策略扫描结果，仅用于演示'
    },
    qualified_stocks: stocks,
    top_30_stocks: stocks.slice(0, 30),
    data_sources: { akshare: Math.floor(stocks.length * 0.6), tushare: Math.floor(stocks.length * 0.4) },
    total_analyzed: stocks.length + 80,
    data_quality: 97.2,
    execution_time: 6
  };
  res.json(resp);
});

// 搜索与数量统计
app.post('/api/stocks/count', (req, res) => {
  res.json(generateStocksCount());
});
app.get('/api/stocks/count', (req, res) => {
  res.json(generateStocksCount());
});
app.post('/api/strategies/filtered-stocks', (req, res) => {
  res.json(generateFilteredStocks());
});

// 筹码分布
app.get('/api/chip-distribution/:code', (req, res) => {
  const { code } = req.params;
  res.json(generateChipDistribution(code));
});

// 回测接口（简化）
app.post('/api/strategies/backtest', (req, res) => {
  const payload = req.body || {};
  res.json({
    success: true,
    data: {
      strategy_id: payload.strategy_id || 'mock',
      stock_code: payload.stock_code || '000001.SZ',
      start_date: payload.start_date,
      end_date: payload.end_date,
      summary: {
        total_return: 25.6,
        annualized_return: 18.3,
        max_drawdown: 9.7,
        sharpe_ratio: 1.42
      }
    }
  });
});

// 策略配置（获取/更新）
app.get('/api/strategies/config/:id', (req, res) => {
  const id = req.params.id;
  res.json({
    success: true,
    data: {
      strategy_id: id,
      params: { pe_min: 5, pe_max: 30, roe_min: 10 }
    }
  });
});
app.post('/api/strategies/config/:id', (req, res) => {
  const id = req.params.id;
  const params = req.body?.params || {};
  res.json({ success: true, data: { strategy_id: id, params } });
});

// 导出Excel
app.post('/api/strategies/export-excel', (req, res) => {
  const filename = `strategy_analysis_${Date.now()}.xlsx`;
  const csv = '排名,股票代码,股票名称,评分\n1,000001.SZ,示例A,88.5';
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(Buffer.from(csv, 'utf8'));
});

// 导出CSV
app.post('/api/strategies/export-csv', (req, res) => {
  const filename = `strategy_analysis_${Date.now()}.csv`;
  const rows = [
    ['排名','股票代码','股票名称','评分'],
    ['1','000001.SZ','示例A','88.5']
  ];
  const csv = rows.map(r => r.join(',')).join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
});

// 兜底：未匹配路由
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Mock API: 路由不存在', path: req.path });
});

app.listen(PORT, () => {
  console.log(`Mock API server running at http://127.0.0.1:${PORT}`);
});
