// Vercel Serverless Functions Mock API
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
} = require('../src/mocks/mockData');

function json(res, data, status = 200) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.send(JSON.stringify(data));
}

module.exports = async (req, res) => {
  // Support both /api and nested paths via catch-all [[...slug]].js
  const method = (req.method || 'GET').toUpperCase();
  // Resolve path robustly from slug or raw URL
  let path = '/' + (Array.isArray(req.query.slug) ? req.query.slug.join('/') : (req.query.slug || ''));
  if (!path || path === '/') {
    const raw = (req.url || '').split('?')[0] || '';
    if (raw) {
      if (raw.startsWith('/api')) {
        const trimmed = raw.slice(4);
        path = trimmed || '/';
      } else {
        path = raw || '/';
      }
    }
  }

  try {
    // Health
    if (method === 'GET' && (path === '/health' || path === '/health/')) return json(res, generateHealth());

    // Trading signals
    if (method === 'GET' && path.startsWith('/trading-signals/')) {
      const code = decodeURIComponent(path.split('/').pop());
      return json(res, generateTradingSignals(code));
    }

    // Advanced strategies execute (for StrategyResultDisplay)
    if (method === 'POST' && path === '/advanced-strategies/execute') {
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
      return json(res, {
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
      });
    }

    // Market overview
    if (method === 'POST' && path === '/market-overview') {
      return json(res, generateMarketOverview(req.body || {}));
    }

    // Limit up analysis
    if (method === 'POST' && path === '/limit-up-analysis') {
      const days = (req.body && (req.body.days || req.body.range || 7)) || 7;
      return json(res, generateLimitUpAnalysis(days));
    }

    // Market breadth
    if ((method === 'POST' || method === 'GET') && path === '/market-breadth') {
      return json(res, generateMarketBreadth());
    }

    // Strategies list
    if (method === 'GET' && path === '/strategies/list') {
      return json(res, generateStrategiesList());
    }

    // Execute strategy (simple)
    if (method === 'POST' && path === '/strategies/execute') {
      return json(res, generateStrategyExecute(req.body || {}));
    }

    // Preset scan
    if (method === 'POST' && path === '/strategies/preset-scan') {
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
      return json(res, {
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
    }

    // Market scan (top 30 + stats)
    if (method === 'POST' && path === '/strategies/market-scan') {
      const payload = req.body || {};
      const base = generateStrategyExecute(payload);
      const all = (base.data?.results || []).map((s) => {
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
      return json(res, {
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
      });
    }

    // Full market scan (ID only)
    if (method === 'POST' && path === '/strategies/full-market-scan') {
      const id = `exec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const duration = 60 + Math.floor(Math.random() * 60);
      // Note: In Vercel stateless functions, we can't keep execution state easily.
      // For demo, return ID and let frontend poll progress endpoints that return synthesized data.
      return json(res, { success: true, execution_id: id });
    }

    // Progress
    if (method === 'GET' && path.startsWith('/strategies/progress/')) {
      const stages = ['初始化','获取列表','抓取数据','计算指标','评分排序','生成报告'];
      const progress = 30 + Math.floor(Math.random() * 70);
      const idx = Math.min(stages.length - 1, Math.floor(progress / (100 / stages.length)));
      return json(res, {
        success: true,
        progress: {
          progress,
          message: stages[idx],
          status: progress >= 99 ? 'completed' : 'running',
          analyzed_stocks: Math.floor(progress * 2.3),
          total_stocks: 500,
          qualified_stocks: Math.floor(progress * 0.9),
          elapsed_time_formatted: `${Math.floor(progress / 3)}s`
        }
      });
    }

    // Result
    if (method === 'GET' && path.startsWith('/strategies/result/')) {
      const exe = { start: Date.now() - 60000, duration: 1, total: 400, workers: 6 };
      return json(res, generateExecuteOptimizedResult(exe));
    }

    // Chip distribution
    if (method === 'GET' && path.startsWith('/chip-distribution/')) {
      const code = decodeURIComponent(path.split('/').pop());
      return json(res, generateChipDistribution(code));
    }

    // Stocks count and filtered
    if ((method === 'GET' || method === 'POST') && path === '/stocks/count') {
      return json(res, generateStocksCount());
    }
    if (method === 'POST' && path === '/strategies/filtered-stocks') {
      return json(res, generateFilteredStocks());
    }

    // Strategy config
    if (method === 'GET' && path.startsWith('/strategies/config/')) {
      const id = path.split('/').pop();
      return json(res, { success: true, data: { strategy_id: id, params: { pe_min: 5, pe_max: 30, roe_min: 10 } } });
    }
    if (method === 'POST' && path.startsWith('/strategies/config/')) {
      const id = path.split('/').pop();
      const params = req.body?.params || {};
      return json(res, { success: true, data: { strategy_id: id, params } });
    }

    // Export Excel/CSV
    if (method === 'POST' && path === '/strategies/export-excel') {
      const filename = `strategy_analysis_${Date.now()}.xlsx`;
      const csv = '排名,股票代码,股票名称,评分\n1,000001.SZ,示例A,88.5';
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(Buffer.from(csv, 'utf8'));
    }
    if (method === 'POST' && path === '/strategies/export-csv') {
      const filename = `strategy_analysis_${Date.now()}.csv`;
      const rows = [
        ['排名','股票代码','股票名称','评分'],
        ['1','000001.SZ','示例A','88.5']
      ];
      const csv = rows.map(r => r.join(',')).join('\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(csv);
    }

    // Fallback
    return json(res, { success: false, message: 'Mock API: 路由不存在', path }, 404);
  } catch (e) {
    return json(res, { success: false, message: e?.message || 'Server Error' }, 500);
  }
};
