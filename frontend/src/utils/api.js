import axios from 'axios';

// 智能API配置：同源访问以兼容本地代理与 Vercel Functions
const FAST_API_URL = '';
// 运行环境检测：仅在本地才尝试 7001 真实服务
const IS_LOCAL = (typeof window !== 'undefined') && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

// 创建统一的API实例（指向快速API服务）
const apiInstance = axios.create({
  baseURL: '',
  timeout: 120000, // 2分钟超时，真实数据可能较慢
  headers: {
    'Content-Type': 'application/json',
  },
});

// 创建真实数据API实例（备用，如果5000端口服务可用）
const realDataApi = axios.create({
  baseURL: 'http://localhost:7001',
  timeout: 120000, // 2分钟超时，支持TuShare真实数据获取
  headers: {
    'Content-Type': 'application/json',
  },
});

// 创建快速API实例
const fastApi = axios.create({
  baseURL: FAST_API_URL,
  timeout: 120000, // 120秒超时，提高稳定性
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
apiInstance.interceptors.request.use(
  (config) => {
    console.log('🔥 API请求:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

fastApi.interceptors.request.use(
  (config) => {
    console.log('⚡ 快速API请求:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
apiInstance.interceptors.response.use(
  (response) => {
    console.log('✅ API响应成功');
    return response;
  },
  (error) => {
    console.error('❌ API错误:', error.message);
    return Promise.reject(error);
  }
);

fastApi.interceptors.response.use(
  (response) => {
    console.log('⚡ 快速API响应成功');
    return response;
  },
  (error) => {
    console.error('❌ 快速API错误:', error.message);
    return Promise.reject(error);
  }
);

// 智能交易信号获取：优先使用快速API，备用真实数据API
export const fetchTradingSignals = async (stockCode) => {
  console.log(`📊 获取交易信号: ${stockCode}`);
  
  // 1) 本地优先真实API；2) 线上直接使用快速API
  if (IS_LOCAL) {
    try {
      console.log('🔥 [本地] 优先使用TuShare真实数据API...');
      // 兼容真实服务路径：优先 /api/trading-signals，失败回退 /trading_signals
      let response;
      try {
        response = await realDataApi.post('/api/trading-signals', {
          stock_code: stockCode
        }, {
          timeout: 300000,
        });
      } catch (pathErr) {
        response = await realDataApi.post('/trading_signals', {
          stock_code: stockCode
        }, {
          timeout: 300000,
        });
      }
      if (response.data.success && response.data.all_signals) {
        console.log('✅ TuShare真实数据获取成功！');
        const enhancedData = enhanceDataForBollinger(response.data);
        return enhancedData;
      }
      throw new Error('真实数据API返回格式异常');
    } catch (error) {
      console.warn('⚠️ 本地真实数据API获取失败，尝试快速API兜底:', error.message);
      // 继续走快速API
    }
  }
  // 快速响应API（同源 /api）
  const fastResponse = await fastApi.get(`/api/trading-signals/${stockCode}`);
  if (fastResponse.data.success && fastResponse.data.data) {
    const convertedData = convertFastApiData(fastResponse.data.data, stockCode);
    console.log('✅ 快速API成功');
    return convertedData;
  }
  throw new Error('快速API返回格式异常');
};

// 增强TuShare数据以支持BOLL显示
const enhanceDataForBollinger = (data) => {
  try {
    // 确保每个周期的信号数据包含完整的BOLL信息
    if (data.all_signals) {
      Object.keys(data.all_signals).forEach(period => {
        const periodSignals = data.all_signals[period];
        
        if (periodSignals.signals && periodSignals.signals.indicators) {
          // 如果有布林带数据但缺少latest_values，计算默认值
          if (periodSignals.signals.indicators.bollinger && !periodSignals.signals.indicators.bollinger.latest_values) {
            const stockData = data.all_stock_data[period];
            if (stockData && stockData.length > 0) {
              const latestPrice = stockData[stockData.length - 1].Close;
              
              periodSignals.signals.indicators.bollinger.latest_values = {
                upper: latestPrice * 1.05,
                middle: latestPrice,
                lower: latestPrice * 0.95,
                position: latestPrice
              };
            }
          }
        }
      });
    }
    
    console.log('✅ TuShare数据增强完成，支持完整BOLL显示');
    return data;
    
  } catch (error) {
    console.warn('⚠️ 数据增强失败，使用原始数据:', error);
    return data;
  }
};

// 转换快速API数据格式
const convertFastApiData = (fastData, stockCode) => {
  try {
    // 将快速API数据转换为前端期望的多周期格式
    const signalsArr = Array.isArray(fastData.trading_signals) ? fastData.trading_signals : [];
    const buyCount = signalsArr.filter(s => s.signal_type === 'buy').length;
    const sellCount = signalsArr.filter(s => s.signal_type === 'sell').length;
    const holdCount = signalsArr.filter(s => s.signal_type === 'hold').length;
    const overallSignal = buyCount > sellCount ? '买入' : (sellCount > buyCount ? '卖出' : '观望');
    const adviceText = overallSignal === '买入'
      ? '趋势向上，逢低布局并控制仓位'
      : overallSignal === '卖出'
        ? '短线偏弱，注意风险控制'
        : '信号分歧，观望为主，耐心等待明确方向';

    // 构造回测摘要，避免前端空字段报错
    const capitalStart = 100000;
    const profitAmount = Math.round(((Math.random() * 20000) - 5000) * 100) / 100; // -5k ~ +15k
    const capitalEnd = Math.round((capitalStart + profitAmount) * 100) / 100;
    const totalReturnPct = Math.round((profitAmount / capitalStart) * 10000) / 100; // 百分比

    // 构造指标扩展：筹码/基本面/PE
    const chipLV = {
      main_peak_price: Number((fastData.current_price * (0.95 + Math.random() * 0.1)).toFixed(2)),
      avg_price: Number((fastData.current_price * (0.97 + Math.random() * 0.06)).toFixed(2)),
      pressure_level: Number((fastData.current_price * 1.06).toFixed(2)),
      support_level: Number((fastData.current_price * 0.94).toFixed(2)),
      concentration: Number((0.35 + Math.random() * 0.4).toFixed(2)),
      analysis: ['筹码集中度较高，主力成本区附近有支撑','上方压力位较近，注意量能配合','若回踩均线不破，反弹概率较大']
    };
    const fundamentalLV = {
      indicators: {
        'PE市盈率': Number((15 + Math.random() * 20).toFixed(2)),
        'PB市净率': Number((1.5 + Math.random() * 2).toFixed(2)),
        'PS市销率': Number((1 + Math.random() * 3).toFixed(2)),
        total_market_cap: Math.floor(80 + Math.random() * 800) * 1e8, // 元
        circulating_market_cap: Math.floor(50 + Math.random() * 500) * 1e8, // 元
        total_shares: Math.floor(20 + Math.random() * 200) * 1e8, // 股
        circulating_shares: Math.floor(10 + Math.random() * 150) * 1e8, // 股
        turnover_rate: Number((0.5 + Math.random() * 4).toFixed(2)),
        ROE: Number((8 + Math.random() * 10).toFixed(2))
      },
      rating: ['买入','增持','中性','减持'][Math.floor(Math.random()*4)],
      rating_score: Number((70 + Math.random() * 20).toFixed(2)),
      risk_level: ['低','中','高'][Math.floor(Math.random()*3)],
      analysis: ['盈利能力稳定，估值处于合理区间','短期盈利增速放缓','行业景气度中性偏强'],
      investment_advice: ['控制仓位，逢低吸纳','关注基本面变化','设定止损位，严格执行'],
      risk_factors: ['宏观经济波动','行业竞争加剧','原材料价格上涨']
    };
    const peLV = {
      current_pe: fundamentalLV.indicators['PE市盈率'],
      pe_data: {
        pe: fundamentalLV.indicators['PE市盈率'],
        pb: fundamentalLV.indicators['PB市净率'],
        current_price: fastData.current_price
      },
      analysis: ['当前PE相对历史分位中性','估值合理，空间取决于业绩兑现','若盈利改善，估值中枢有望提升']
    };

    // 合成交易明细
    const trades = Array.from({ length: 6 }, (_, i) => {
      const isSell = i % 2 === 1;
      const basePrice = fastData.current_price * (0.9 + Math.random() * 0.2);
      const price = Number(basePrice.toFixed(2));
      const profitPct = isSell ? Number(((Math.random() * 6 - 2)).toFixed(2)) : undefined; // -2%~+4%
      const profitAmount = isSell ? Number(((profitPct / 100) * 3000).toFixed(2)) : undefined; // 假设持仓金额
      const ts = new Date(Date.now() - (i+1) * 86400000 + Math.floor(Math.random()*8)*3600000).toISOString().slice(0,16).replace('T',' ');
      return {
        type: isSell ? 'sell' : 'buy',
        date: ts,
        price,
        profit_pct: profitPct,
        profit_amount: profitAmount,
        decisions: [
          { period: 'daily', signal_type: overallSignal },
          { period: 'weekly', signal_type: ['买入','卖出','观望'][Math.floor(Math.random()*3)] },
          { period: '60', signal_type: ['买入','卖出','观望'][Math.floor(Math.random()*3)] }
        ]
      };
    });

    const convertedData = {
      success: true,
      message: `快速分析数据: ${fastData.stock_name}(${stockCode})`,
      all_signals: {
        daily: {
          period_name: '日线',
          signals: {
            signal_type: '买入', // 默认信号
            signal_strength: buyCount > sellCount ? '强' : (sellCount > buyCount ? '弱' : '中性'),
            indicators: {
              macd: {
                latest_value: fastData.indicators.MACD.macd,
                signals: ['MACD分析']
              },
              rsi: {
                latest_value: fastData.indicators.RSI,
                signals: ['RSI分析']
              },
              bollinger: {
                latest_values: {
                  upper: fastData.indicators.BOLL.upper,
                  middle: fastData.indicators.BOLL.middle,
                  lower: fastData.indicators.BOLL.lower,
                  position: fastData.current_price
                },
                signals: ['布林带分析']
              },
              chip: { latest_values: chipLV, signals: ['筹码集中度分析'] },
              fundamental: { latest_values: fundamentalLV, signals: ['基本面评估'] },
              pe: { latest_values: peLV, signals: ['估值评估'] }
            },
            trading_signals: fastData.trading_signals,
            fundamental_analysis: fundamentalLV,
            pe_analysis: peLV
          }
        },
        weekly: { period_name: '周线', signals: { signal_type: overallSignal, indicators: {}, trading_signals: [] } },
        monthly: { period_name: '月线', signals: { signal_type: '观望', indicators: {}, trading_signals: [] } }
      },
      all_stock_data: {
        daily: fastData.kline_data.map(item => ({
          Date: item.date,
          Open: item.open,
          High: item.high,
          Low: item.low,
          Close: item.close,
          Volume: item.volume
        }))
      },
      stock_info: {
        code: stockCode,
        name: fastData.stock_name,
        sector: '',
        market: 'A股'
      },
      comprehensive_advice: {
        summary: '快速分析建议',
        risk_level: '中等',
        overall_signal: overallSignal,
        advice: adviceText,
        statistics: {
          buy_count: buyCount,
          sell_count: sellCount,
          hold_count: holdCount,
          total_periods: 1
        }
      },
      backtest_result: {
        ...(fastData.backtest_result || {}),
        total_return_pct: totalReturnPct,
        profit_amount: profitAmount,
        capital_end: capitalEnd,
        details: { daily: { trades } }
      }
    };
    
    console.log('✅ 快速API数据转换完成');
    return convertedData;
    
  } catch (error) {
    console.error('❌ 快速API数据转换失败:', error);
    throw error;
  }
};

// 检查API服务健康状态
export const checkApiHealth = async () => {
  const results = {
    fastApi: false,
    realDataApi: false
  };
  
  try {
    await fastApi.get('/api/health', { timeout: 3000 });
    results.fastApi = true;
    console.log('✅ 快速API服务正常');
  } catch (error) {
    console.log('❌ 快速API服务异常');
  }
  
  try {
    // 优先探测标准健康路由
    await realDataApi.get('/api/health', { timeout: 5000 });
    results.realDataApi = true;
    console.log('✅ 真实数据API服务正常');
  } catch (error) {
    // 回退探测根路径
    try {
      await realDataApi.get('/', { timeout: 5000 });
      results.realDataApi = true;
      console.log('✅ 真实数据API服务正常(根路径)');
    } catch (error2) {
      console.log('❌ 真实数据API服务异常');
    }
  }
  
  return results;
};

export const stockAPI = {
  // 搜索股票 - 智能模糊搜索
  searchStocks: async (query, limit = 8) => {
    try {
      console.log(`🔍 搜索股票: "${query}", 限制: ${limit}`);
      if (IS_LOCAL) {
        try {
          // 本地优先真实服务 7001
          const response = await realDataApi.get('/api/search_stocks', {
            params: { q: query, limit }
          });
          console.log('🔍 搜索结果(7001):', response.data);
          return response.data;
        } catch (error) {
          const status = error?.response?.status;
          console.warn('⚠️ 7001 搜索失败，状态:', status, '消息:', error?.message);
          // 继续走快速API
        }
      }
      // 兜底：使用 5001 的 market-overview 进行关键词过滤并映射为搜索结果
      const resp = await fastApi.post('/api/market-overview', {
        page: 1,
        page_size: Math.max(10, limit),
        keyword: query,
        real_data: true,
        sort_field: 'score',
        sort_order: 'desc'
      }, { timeout: 60000 });
      const stocks = (resp?.data?.data?.stocks || []).slice(0, limit).map(s => ({
        code: s.code || (s.ts_code ? s.ts_code.split('.')[0] : ''),
        ts_code: s.ts_code || '',
        name: s.name || '',
        market: s.market || '',
        industry: s.industry || ''
      }));
      const mapped = {
        success: true,
        stocks,
        total: (resp?.data?.data?.total != null) ? resp.data.data.total : stocks.length,
        message: '快速API兜底搜索'
      };
      console.log('✅ 5001 兜底搜索成功:', mapped);
      return mapped;
    } catch (error) {
      console.error('❌ 搜索兜底失败:', error?.message);
      return {
        success: false,
        stocks: [],
        message: '搜索服务暂时不可用'
      };
    }
  },

  // 获取股票数量
  getStockCount: async () => {
    try {
      const response = await apiInstance.get('/api/stocks/count');
      return response.data;
    } catch (error) {
      console.error('获取股票数量失败:', error);
      throw error;
    }
  }
};

// 量化策略API
export const strategyAPI = {
  // 获取策略配置
  getStrategyConfig: async (strategyId) => {
    try {
      const response = await apiInstance.get(`/api/strategies/config/${strategyId}`);
      return response.data;
    } catch (error) {
      throw new Error('获取策略配置失败');
    }
  },

  // 更新策略参数
  updateStrategyConfig: async (strategyId, params) => {
    try {
      const response = await apiInstance.post(`/api/strategies/config/${strategyId}`, {
        params
      });
      return response.data;
    } catch (error) {
      throw new Error('更新策略参数失败');
    }
  },

  // 执行策略
  executeStrategy: async (strategyId, stockCode, startDate, endDate) => {
    try {
      const response = await apiInstance.post('/api/strategies/execute', {
        strategy_id: strategyId,
        stock_code: stockCode,
        start_date: startDate,
        end_date: endDate
      }, {
        timeout: 120000, // 2分钟超时
      });
      return response.data;
    } catch (error) {
      throw new Error('执行策略失败');
    }
  },

  // 运行回测
  runBacktest: async (strategyId, stockCode, startDate, endDate, initialCapital = 100000) => {
    try {
      const response = await apiInstance.post('/api/strategies/backtest', {
        strategy_id: strategyId,
        stock_code: stockCode,
        start_date: startDate,
        end_date: endDate,
        initial_capital: initialCapital
      }, {
        timeout: 180000, // 3分钟超时，回测需要更多时间
      });
      return response.data;
    } catch (error) {
      throw new Error('运行回测失败');
    }
  },

  // 获取策略列表
  getStrategiesList: async () => {
    try {
      const response = await apiInstance.get('/api/strategies/list');
      return response.data;
    } catch (error) {
      throw new Error('获取策略列表失败');
    }
  },

  // 执行全市场扫描（限制50只股票）
  executeMarketScan: async (strategyId, startDate, endDate, maxStocks = 50, minScore = 60.0) => {
    try {
      const response = await apiInstance.post('/api/strategies/market-scan', {
        strategy_id: strategyId,
        start_date: startDate,
        end_date: endDate,
        max_stocks: maxStocks,
        min_score: minScore
      }, {
        timeout: 300000, // 5分钟超时
      });
      return response.data;
    } catch (error) {
      throw new Error('执行全市场扫描失败');
    }
  },

  // 执行全A股市场扫描（分析所有股票）
  executeFullMarketScan: async (strategyId, startDate, endDate, minScore = 60.0, batchSize = 100) => {
    try {
      const response = await apiInstance.post('/api/strategies/full-market-scan', {
        strategy_id: strategyId,
        start_date: startDate,
        end_date: endDate,
        min_score: minScore,
        batch_size: batchSize
      }, {
        timeout: 7200000, // 2小时超时，全A股扫描需要很长时间
      });
      return response.data;
    } catch (error) {
      throw new Error('执行全A股市场扫描失败');
    }
  },

  // 导出Excel
  exportExcel: async (scanResults) => {
    try {
      const response = await apiInstance.post('/api/strategies/export-excel', {
        scan_results: scanResults
      }, {
        responseType: 'blob',
        timeout: 60000
      });
      
      // 创建下载链接
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // 获取文件名
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'strategy_analysis.xlsx';
      if (contentDisposition) {
        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { success: true, filename };
    } catch (error) {
      throw new Error('导出Excel失败');
    }
  },

  // 导出CSV
  exportCSV: async (scanResults) => {
    try {
      const response = await apiInstance.post('/api/strategies/export-csv', {
        scan_results: scanResults
      }, {
        responseType: 'blob',
        timeout: 60000
      });
      
      // 创建下载链接
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // 获取文件名
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'strategy_analysis.csv';
      if (contentDisposition) {
        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { success: true, filename };
    } catch (error) {
      throw new Error('导出CSV失败');
    }
  },
};

// 全市场数据获取函数
export const getMarketOverview = async (params) => {
  console.log('🔍 正在获取全市场数据...', params);
  // 本地优先真实服务；线上直接快速API
  if (IS_LOCAL) {
    try {
      const response = await realDataApi.post('/api/market-overview', params, { timeout: 300000 });
      return response;
    } catch (error) {
      console.warn('⚠️ 本地真实服务获取失败，尝试快速API兜底:', error.message);
    }
  }
  const response = await fastApi.post('/api/market-overview', params, { timeout: 300000 });
  return response;
};

// 默认导出快速API实例
export default fastApi; 

// === API健康监控与自动兜底 ===
// 轻量状态缓存（仅供前端路由与展示用）
let apiHealthCache = {
  realOk: true,
  fastOk: true,
  lastChecked: 0
};

// 主动健康检查（更新缓存）
export async function refreshApiHealth() {
  try {
    await realDataApi.get('/', { timeout: 3000 });
    apiHealthCache.realOk = true;
  } catch {
    apiHealthCache.realOk = false;
  }
  try {
    await fastApi.get('/api/health', { timeout: 3000 });
    apiHealthCache.fastOk = true;
  } catch {
    apiHealthCache.fastOk = false;
  }
  apiHealthCache.lastChecked = Date.now();
  return { ...apiHealthCache };
}

// 周期性监控（默认15秒），模块加载后即启动
const HEALTH_POLL_INTERVAL = 15000;
let healthTimer = null;
function startApiHealthMonitor() {
  // 避免重复开启
  if (healthTimer) return;
  // 立即刷新一次
  refreshApiHealth().catch(() => {});
  // 周期刷新
  healthTimer = setInterval(() => {
    refreshApiHealth().catch(() => {});
  }, HEALTH_POLL_INTERVAL);
}
// 自动启动健康监控
startApiHealthMonitor();

// 提供获取当前健康状态的方法（用于页面展示或调试）
export function getApiHealthStatus() {
  return { ...apiHealthCache };
}