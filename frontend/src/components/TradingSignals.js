import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Grid,
  Paper,
  Alert,
  Tabs,
  Tab,
  Collapse,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Info,
  ExpandMore,
  ExpandLess,
  Timeline,
  Security,
  AccountBalance,
  TableRows,
  BarChart,
  Assessment,
} from '@mui/icons-material';

const TradingSignals = ({ allSignals, comprehensiveAdvice, backtestResult }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('daily');
  const [expandedSections, setExpandedSections] = useState({
    overview: true,
    details: true,
    indicators: false,
    chip_distribution: false,
    fundamentals: false,
    pe_analysis: false,
    risk: false,
    trades: true,
  });

  // 使用 ref 来跟踪滚动和用户交互状态
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef(null);
  const lastInteractionRef = useRef(0);
  const containerRef = useRef(null);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // 优化的 toggleSection 函数，完全防止滚动干扰
  const toggleSection = useCallback((section, event) => {
    // 记录用户交互时间戳
    const now = Date.now();
    lastInteractionRef.current = now;

    // 阻止滚动相关的事件传播
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    // 延迟执行状态更新，确保不会被滚动事件干扰
    setTimeout(() => {
      // 只有在没有新的用户交互时才执行状态更新
      if (lastInteractionRef.current === now) {
        setExpandedSections(prev => ({
          ...prev,
          [section]: !prev[section]
        }));
      }
    }, 10);
  }, []);

  // 滚动开始处理函数 - 优化版
  const handleScrollStart = useCallback(() => {
    isScrollingRef.current = true;
    
    // 清除之前的计时器
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    // 延长恢复时间，确保滚动完全结束
    scrollTimeoutRef.current = setTimeout(() => {
      isScrollingRef.current = false;
    }, 150);
  }, []);

  // 滚轮事件处理函数 - 优化版
  const handleWheelEvent = useCallback((event) => {
    // 只处理滚动，不阻止卡片操作
    const isCardHeader = event.target.closest('[data-card-header]');
    const isToggleButton = event.target.closest('[data-toggle-button]');
    
    if (!isCardHeader && !isToggleButton) {
      handleScrollStart();
    }
  }, [handleScrollStart]);

  // 防止滚动时误触发状态变化的包装函数
  const createScrollSafeHandler = useCallback((handler) => {
    return (event) => {
      // 如果正在滚动或刚完成滚动，忽略事件
      if (isScrollingRef.current) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      handler(event);
    };
  }, []);

  // Early return 必须在所有 Hooks 之后
  if (!allSignals || !comprehensiveAdvice) return null;

  const handlePeriodChange = (event, newPeriod) => {
    if (newPeriod !== null) {
      setSelectedPeriod(newPeriod);
    }
  };

  // 获取当前选中周期的信号
  const currentSignals = allSignals[selectedPeriod]?.signals;
  if (!currentSignals) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="info">
          当前周期暂无交易信号数据
        </Alert>
      </Box>
    );
  }

  // 确定信号类型样式
  const getSignalTypeColor = (signalType) => {
    if (signalType.includes('强烈买入')) return 'success';
    if (signalType.includes('买入')) return 'success';
    if (signalType.includes('强烈卖出')) return 'error';
    if (signalType.includes('卖出')) return 'secondary';
    return 'warning';
  };

  // 确定风险等级样式
  const getRiskLevelColor = (riskLevel) => {
    switch (riskLevel) {
      case '高': return 'error';
      case '中': return 'warning';
      default: return 'info';
    }
  };

  // 获取信号图标
  const getSignalIcon = (signalType) => {
    if (signalType.includes('买入')) return <CheckCircle color="success" />;
    if (signalType.includes('卖出')) return <Cancel color="error" />;
    return <Info color="warning" />;
  };

  // 渲染值的辅助函数
  const renderValue = (value) => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'number') {
      return value.toFixed(2);
    }
    if (typeof value === 'string') {
      return value;
    }
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  };

  // 数值格式化工具
  const formatNum = (v, unit = '') => {
    if (v === null || v === undefined || Number.isNaN(Number(v))) return '-';
    return `${Number(v).toFixed(2)}${unit}`;
  };
  const formatPercent = (v) => {
    if (v === null || v === undefined || Number.isNaN(Number(v))) return '-';
    return `${Number(v * 100).toFixed(1)}%`;
  };

  // 指标中文分行渲染
  const renderIndicatorItem = (key, value) => {
    const lv = value?.latest_values || {};
    const signals = value?.signals || [];
    const labelMap = {
      bollinger: '布林带',
      chip: '筹码',
      fundamental: '基本面',
      ma: '均线',
      macd: 'MACD',
      pe: '估值(PE)',
      rsi: 'RSI',
      volume: '成交量'
    };
    const label = labelMap[key] || key;
    const rows = [];

    switch (key) {
      case 'bollinger': {
        rows.push(`上轨：${formatNum(lv.upper, '元')}`);
        rows.push(`中轨：${formatNum(lv.middle, '元')}`);
        rows.push(`下轨：${formatNum(lv.lower, '元')}`);
        if (lv.position !== undefined) rows.push(`价格位置：${formatNum(lv.position, '元')}`);
        break;
      }
      case 'chip': {
        rows.push(`主力成本：${formatNum(lv.main_peak_price, '元')}`);
        rows.push(`平均成本：${formatNum(lv.avg_price, '元')}`);
        rows.push(`压力位：${formatNum(lv.pressure_level, '元')}`);
        rows.push(`支撑位：${formatNum(lv.support_level, '元')}`);
        if (lv.concentration !== undefined) rows.push(`筹码集中度：${formatPercent(lv.concentration)}`);
        break;
      }
      case 'fundamental': {
        const ind = lv.indicators || value?.indicators || {};
        Object.entries(ind).slice(0, 6).forEach(([k, v]) => {
          const unit = /率|ROE|换手/.test(k) ? (typeof v === 'number' ? '%' : '') : '';
          rows.push(`${k}：${typeof v === 'number' ? (unit === '%' ? `${v.toFixed(2)}%` : v.toFixed(2)) : v}`);
        });
        break;
      }
      case 'ma': {
        rows.push(`MA5：${formatNum(lv.MA5 ?? lv.ma5, '元')}`);
        rows.push(`MA10：${formatNum(lv.MA10 ?? lv.ma10, '元')}`);
        rows.push(`MA20：${formatNum(lv.MA20 ?? lv.ma20, '元')}`);
        rows.push(`MA60：${formatNum(lv.MA60 ?? lv.ma60, '元')}`);
        break;
      }
      case 'macd': {
        // 支持 histogram/macd/signal
        if (lv.dif !== undefined || lv.dea !== undefined || lv.macd !== undefined) {
          if (lv.dif !== undefined) rows.push(`DIF：${formatNum(lv.dif)}`);
          if (lv.dea !== undefined) rows.push(`DEA：${formatNum(lv.dea)}`);
          if (lv.macd !== undefined) rows.push(`MACD：${formatNum(lv.macd)}`);
        } else {
          rows.push(`MACD：${formatNum(lv.macd)}`);
          rows.push(`Signal：${formatNum(lv.signal)}`);
          rows.push(`柱状图：${formatNum(lv.histogram)}`);
        }
        break;
      }
      case 'pe': {
        rows.push(`当前PE：${formatNum(value?.current_pe ?? lv.current_pe, '倍')}`);
        const pd = value?.pe_data || lv.pe_data || {};
        if (pd.pe !== undefined) rows.push(`PE：${formatNum(pd.pe, '倍')}`);
        if (pd.pb !== undefined) rows.push(`PB：${formatNum(pd.pb, '倍')}`);
        if (pd.current_price !== undefined) rows.push(`当前价：${formatNum(pd.current_price, '元')}`);
        break;
      }
      case 'rsi': {
        const rsiVal = lv.latest_value ?? value?.latest_value;
        if (rsiVal !== undefined) rows.push(`RSI：${formatNum(rsiVal)}`);
        break;
      }
      case 'volume': {
        if (lv.volume !== undefined) {
          const v = Number(String(lv.volume).replace(/,/g, ''));
          const formatted = Number.isFinite(v)
            ? (v >= 1e8 ? `${(v / 1e8).toFixed(2)}亿` : `${(v / 1e4).toFixed(2)}万`)
            : '-';
          rows.push(`成交量：${formatted}`);
        }
        if (lv.ratio !== undefined) rows.push(`量比：${formatNum(lv.ratio, '倍')}`);
        break;
      }
      default: {
        // 其他类型：展示 latest_values 的前几个键
        Object.entries(lv).slice(0, 4).forEach(([k, v]) => {
          const unit = /price|cost|level|upper|middle|lower|MA\d+/.test(k) ? '元' : '';
          rows.push(`${k}：${typeof v === 'number' ? formatNum(v, unit) : (v ?? '-')}`);
        });
      }
    }

    return (
      <Paper sx={{ p: 1, bgcolor: '#000', color: '#fff' }}>
        <Typography variant="caption" sx={{ color: '#fff' }}>
          {label}
        </Typography>
        <Box sx={{ mt: 0.5 }}>
          {rows.length === 0 ? (
            <Typography variant="caption" sx={{ display: 'block' }}>暂无数据</Typography>
          ) : (
            rows.map((line, idx) => (
              <Typography key={idx} variant="body2" sx={{ display: 'block', lineHeight: '22px' }}>
                {line}
              </Typography>
            ))
          )}
          {signals.length > 0 && signals.map((s, idx) => (
            <Typography key={`sig-${idx}`} variant="caption" sx={{ display: 'block' }}>
              {s}
            </Typography>
          ))}
        </Box>
      </Paper>
    );
  };

  // 渲染筹码分布分析
  const renderChipDistribution = () => {
    // 从indicators中获取筹码分布数据
    const chipData = currentSignals.indicators?.chip?.latest_values || 
                     allSignals[selectedPeriod]?.indicators?.chip_distribution;
    
    if (!chipData) {
      return (
        <Alert severity="info" sx={{ fontSize: '0.875rem' }}>
          正在获取筹码分布数据...
        </Alert>
      );
    }

    return (
      <Grid container spacing={1}>
        <Grid item xs={6}>
          <Paper sx={{ p: 1, bgcolor: '#000', color: '#fff' }}>
            <Typography variant="caption" color="text.secondary">
              主力成本
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
              {chipData.main_peak_price ? `${chipData.main_peak_price.toFixed(2)}元` : '-'}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6}>
          <Paper sx={{ p: 1, bgcolor: '#000', color: '#fff' }}>
            <Typography variant="caption" color="text.secondary">
              平均成本
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
              {chipData.avg_price ? `${chipData.avg_price.toFixed(2)}元` : '-'}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6}>
          <Paper sx={{ p: 1, bgcolor: '#000', color: '#fff' }}>
            <Typography variant="caption" color="text.secondary">
              压力位
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
              {chipData.pressure_level ? `${chipData.pressure_level.toFixed(2)}元` : '-'}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6}>
          <Paper sx={{ p: 1, bgcolor: '#000', color: '#fff' }}>
            <Typography variant="caption" color="text.secondary">
              支撑位
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
              {chipData.support_level ? `${chipData.support_level.toFixed(2)}元` : '-'}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 1, bgcolor: '#000', color: '#fff' }}>
            <Typography variant="caption" color="text.secondary">
              筹码集中度
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
              {chipData.concentration ? `${(chipData.concentration * 100).toFixed(1)}%` : '-'}
            </Typography>
          </Paper>
        </Grid>
        {chipData.analysis && Array.isArray(chipData.analysis) && (
          <Grid item xs={12}>
            <Paper sx={{ p: 1, bgcolor: '#000', color: '#fff' }}>
              <Typography variant="caption" color="text.secondary">
                分析要点
              </Typography>
              <Box sx={{ mt: 0.5 }}>
                {chipData.analysis.slice(0, 3).map((item, index) => (
                  <Typography key={index} variant="caption" sx={{ display: 'block' }}>
                    {item}
                  </Typography>
                ))}
              </Box>
            </Paper>
          </Grid>
        )}
      </Grid>
    );
  };

  // 渲染PE分析
  const renderPEAnalysis = () => {
    // 从pe_analysis中获取数据
    const peData = currentSignals.pe_analysis || 
                   currentSignals.indicators?.pe?.latest_values ||
                   allSignals[selectedPeriod]?.pe_analysis;
    
    if (!peData) {
      return (
        <Alert severity="info" sx={{ fontSize: '0.875rem' }}>
          正在获取PE分析数据...
        </Alert>
      );
    }

    const peInfo = peData.pe_data || peData.latest_values || {};
    const analysis = peData.analysis || [];

    // 兜底计算 EPS 与 ROE
    const eps = (() => {
      // 安全数值解析（支持字符串与带逗号）
      const num = (x) => {
        if (x === null || x === undefined) return null;
        const n = typeof x === 'number' ? x : parseFloat(String(x).replace(/,/g, ''));
        return Number.isFinite(n) ? n : null;
      };
      const epsDirect = num(peInfo.eps);
      if (epsDirect !== null) return epsDirect;

      const price = num(
        peInfo.current_price ??
        currentSignals.indicators?.pe?.latest_values?.pe_data?.current_price ??
        currentSignals.indicators?.pe?.latest_values?.current_price ??
        null
      );
      const curPe = num(peData.current_pe ?? peInfo.pe ?? null);

      if (price !== null && curPe !== null && curPe !== 0) {
        return price / curPe;
      }
      return null;
    })();

    const roe = (() => {
      const num = (x) => {
        if (x === null || x === undefined) return null;
        const n = typeof x === 'number' ? x : parseFloat(String(x).replace(/,/g, ''));
        return Number.isFinite(n) ? n : null;
      };
      const direct = num(peInfo.roe);
      if (direct !== null) return direct;

      const fInd =
        currentSignals.fundamental_analysis?.indicators ||
        currentSignals.fundamental_indicators?.indicators ||
        currentSignals.indicators?.fundamental?.latest_values?.indicators ||
        {};
      const v = fInd.ROE ?? fInd['净资产收益率'] ?? null;
      const parsed = num(v);
      return parsed !== null ? parsed : null;
    })();

    return (
      <Grid container spacing={1}>
        <Grid item xs={6}>
          <Paper sx={{ p: 1, bgcolor: '#000', color: '#fff' }}>
            <Typography variant="caption" color="text.secondary">
              当前PE
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
              {peData.current_pe ? `${peData.current_pe.toFixed(2)}倍` : '-'}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6}>
          <Paper sx={{ p: 1, bgcolor: '#000', color: '#fff' }}>
            <Typography variant="caption" color="text.secondary">
              市净率(PB)
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
              {peInfo.pb ? `${peInfo.pb.toFixed(2)}倍` : '-'}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6}>
          <Paper sx={{ p: 1, bgcolor: '#000', color: '#fff' }}>
            <Typography variant="caption" color="text.secondary">
              每股收益(EPS)
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
              {typeof eps === 'number' ? `${eps.toFixed(3)}元` : '-'}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6}>
          <Paper sx={{ p: 1, bgcolor: '#000', color: '#fff' }}>
            <Typography variant="caption" color="text.secondary">
              净资产收益率(ROE)
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
              {typeof roe === 'number' ? `${(roe <= 1 ? roe * 100 : roe).toFixed(2)}%` : '-'}
            </Typography>
          </Paper>
        </Grid>
        {analysis && analysis.length > 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 1, bgcolor: '#000', color: '#fff' }}>
              <Typography variant="caption" color="text.secondary">
                估值分析
              </Typography>
              <Box sx={{ mt: 0.5 }}>
                {analysis.slice(0, 4).map((item, index) => (
                  <Typography key={index} variant="caption" sx={{ display: 'block' }}>
                    {item}
                  </Typography>
                ))}
              </Box>
            </Paper>
          </Grid>
        )}
      </Grid>
    );
  };

  // 渲染基本面分析（严格中文分行与单位规范）
  const renderFundamentalAnalysis = () => {
    const fd = currentSignals.fundamental_analysis ||
               currentSignals.fundamental_indicators ||
               currentSignals.indicators?.fundamental?.latest_values ||
               allSignals[selectedPeriod]?.fundamental_indicators;

    if (!fd || Object.keys(fd).length === 0) {
      return (
        <Alert severity="info" sx={{ fontSize: '0.875rem' }}>
          正在获取基本面数据...
        </Alert>
      );
    }

    const toNum = (x) => {
      if (x === null || x === undefined) return null;
      const n = typeof x === 'number' ? x : parseFloat(String(x).replace(/,/g, ''));
      return Number.isFinite(n) ? n : null;
    };
    const times = (n) => (n == null ? '-' : `${toNum(n).toFixed(2)}倍`);
    const pct = (n) => {
      if (n == null) return '-';
      const v = toNum(n);
      // 支持后端给 0.43 或 43 两种
      const p = v <= 1 ? v * 100 : v;
      return `${p.toFixed(2)}%`;
    };
    const yuan = (n) => (n == null ? '-' : `${toNum(n).toFixed(2)}元`);
    const moneyCompact = (n) => {
      const v = toNum(n);
      if (v == null) return '-';
      if (v >= 1e8) return `${(v / 1e8).toFixed(2)}亿元`;
      return `${(v / 1e4).toFixed(2)}万元`;
    };
    const sharesCompact = (n) => {
      const v = toNum(n);
      if (v == null) return '-';
      if (v >= 1e8) return `${(v / 1e8).toFixed(2)}亿股`;
      return `${(v / 1e4).toFixed(2)}万股`;
    };

    const ind = fd.indicators || {};
    // 规范键名映射
    const indicatorItems = [
      { label: '市盈率(PE)', value: ind['PE市盈率'] ?? ind.PE市盈率 ?? ind.pe, fmt: times },
      { label: '市净率(PB)', value: ind['PB市净率'] ?? ind.PB市净率 ?? ind.pb, fmt: times },
      { label: '市销率(PS)', value: ind['PS市销率'] ?? ind.PS市销率 ?? ind.ps, fmt: times },
      { label: '总市值', value: ind['总市值'] ?? ind.total_market_cap, fmt: moneyCompact },
      { label: '流通市值', value: ind['流通市值'] ?? ind.circulating_market_cap, fmt: moneyCompact },
      { label: '总股本', value: ind['总股本'] ?? ind.total_shares, fmt: sharesCompact },
      { label: '流通股本', value: ind['流通股本'] ?? ind.circulating_shares, fmt: sharesCompact },
      { label: '换手率', value: ind['换手率'] ?? ind.turnover_rate, fmt: pct },
      { label: 'ROE(净资产收益率)', value: ind['净资产收益率'] ?? ind.ROE, fmt: pct },
    ];

    const rating = fd.rating;
    const ratingScore = toNum(fd.rating_score);
    const riskLevel = fd.risk_level;
    const analysis = Array.isArray(fd.analysis) ? fd.analysis : [];
    const advice = Array.isArray(fd.investment_advice) ? fd.investment_advice : [];
    const riskFactors = Array.isArray(fd.risk_factors) ? fd.risk_factors : [];

    return (
      <Grid container spacing={1}>
        {/* 关键指标 */}
        <Grid item xs={12}>
          <Paper sx={{ p: 1, bgcolor: '#000', color: '#fff' }}>
            <Typography variant="caption" sx={{ color: '#fff' }}>
              关键指标
            </Typography>
            <Box sx={{ mt: 0.5 }}>
              {indicatorItems
                .filter(i => i.value !== undefined && i.value !== null)
                .map((i, idx) => (
                  <Typography key={idx} variant="body2" sx={{ display: 'block', lineHeight: '22px' }}>
                    {i.label}：{i.fmt(i.value)}
                  </Typography>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* 评级与评分 */}
        <Grid item xs={6}>
          <Paper sx={{ p: 1, bgcolor: '#000', color: '#fff' }}>
            <Typography variant="caption" sx={{ color: '#fff' }}>
              评级
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
              {rating ?? '-'}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6}>
          <Paper sx={{ p: 1, bgcolor: '#000', color: '#fff' }}>
            <Typography variant="caption" sx={{ color: '#fff' }}>
              评分
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
              {ratingScore != null ? `${ratingScore.toFixed(2)}分` : '-'}
            </Typography>
          </Paper>
        </Grid>

        {/* 风险等级与因子（若你希望只在风险评估面板显示，可移除这两块） */}
        <Grid item xs={6}>
          <Paper sx={{ p: 1, bgcolor: '#000', color: '#fff' }}>
            <Typography variant="caption" sx={{ color: '#fff' }}>
              风险等级
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
              {riskLevel ?? '-'}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6}>
          <Paper sx={{ p: 1, bgcolor: '#000', color: '#fff' }}>
            <Typography variant="caption" sx={{ color: '#fff' }}>
              风险因子
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
              {riskFactors.length > 0 ? riskFactors.join('，') : '无'}
            </Typography>
          </Paper>
        </Grid>

        {/* 分析要点 */}
        {analysis.length > 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 1, bgcolor: '#000', color: '#fff' }}>
              <Typography variant="caption" sx={{ color: '#fff' }}>
                分析要点
              </Typography>
              <Box sx={{ mt: 0.5 }}>
                {analysis.slice(0, 6).map((item, index) => (
                  <Typography key={index} variant="caption" sx={{ display: 'block' }}>
                    {item}
                  </Typography>
                ))}
              </Box>
            </Paper>
          </Grid>
        )}

        {/* 投资建议 */}
        {advice.length > 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 1, bgcolor: '#000', color: '#fff' }}>
              <Typography variant="caption" sx={{ color: '#fff' }}>
                投资建议
              </Typography>
              <Box sx={{ mt: 0.5 }}>
                {advice.slice(0, 6).map((item, index) => (
                  <Typography key={index} variant="caption" sx={{ display: 'block' }}>
                    {item}
                  </Typography>
                ))}
              </Box>
            </Paper>
          </Grid>
        )}
      </Grid>
    );
  };



  // 构建信号芯片的辅助函数
  const buildSignalChip = (periodKey, periodName, sig, keySeed) => {
    let color = 'default';
    if (sig.includes('强烈买入')) color = 'success';
    else if (sig.includes('买入')) color = 'success';
    else if (sig.includes('强烈卖出')) color = 'error';
    else if (sig.includes('卖出')) color = 'secondary';
    else color = 'warning';
    return (
      <Chip
        key={`${periodKey}-${keySeed}`} 
        label={`${periodName} ${sig}`} 
        color={color} 
        size="small" 
        sx={{ mr: 0.5, mb: 0.5 }}
      />
    );
  };

  const stats = (comprehensiveAdvice && comprehensiveAdvice.statistics)
    ? comprehensiveAdvice.statistics
    : { buy_count: 0, sell_count: 0, hold_count: 0, total_periods: 0 };
  const overall = comprehensiveAdvice?.overall_signal || '综合结论';
  const advice = comprehensiveAdvice?.advice || '暂无建议';

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ p: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* 综合建议区域 - 固定在顶部 */}
        <Box sx={{ p: 2, bgcolor: 'primary.50', borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h5" component="h2" sx={{ mb: 1, fontWeight: 'bold' }}>
            {overall}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {advice}
          </Typography>

          {/* 统计信息 - 紧凑布局 */}
          <Grid container spacing={1} sx={{ mb: 1 }}>
            <Grid item xs={3}>
              <Paper sx={{ p: 1, textAlign: 'center', bgcolor: 'success.main', color: 'white' }}>
                <Typography variant="h6">{stats.buy_count}</Typography>
                <Typography variant="caption">买入</Typography>
              </Paper>
            </Grid>
            <Grid item xs={3}>
              <Paper sx={{ p: 1, textAlign: 'center', bgcolor: 'error.main', color: 'white' }}>
                <Typography variant="h6">{stats.sell_count}</Typography>
                <Typography variant="caption">卖出</Typography>
              </Paper>
            </Grid>
            <Grid item xs={3}>
              <Paper sx={{ p: 1, textAlign: 'center', bgcolor: 'warning.main', color: 'white' }}>
                <Typography variant="h6">{stats.hold_count}</Typography>
                <Typography variant="caption">观望</Typography>
              </Paper>
            </Grid>
            <Grid item xs={3}>
              <Paper sx={{ p: 1, textAlign: 'center', bgcolor: 'info.main', color: 'white' }}>
                <Typography variant="h6">{stats.total_periods}</Typography>
                <Typography variant="caption">总周期</Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* 回测结果 */}
          {backtestResult && (
            <Box sx={{ mt: 1 }}>
              <Paper sx={{ p: 1, textAlign: 'center' }}>
                <Typography variant="body2">
                  回测收益率: {backtestResult.total_return_pct}% | 收益金额: ¥{backtestResult.profit_amount.toLocaleString()} | 期末资产: ¥{backtestResult.capital_end.toLocaleString()}
                </Typography>
              </Paper>

              {/* 交易明细表格 - 可折叠 */}
              {backtestResult.details && (
                <Card variant="outlined" sx={{ mt: 1, '&:hover': { boxShadow: 2 } }}>
                  <Box 
                    sx={{ 
                      p: 1.5, 
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      bgcolor: 'background.default',
                      userSelect: 'none',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                    data-card-header="true"
                    onClick={createScrollSafeHandler((event) => toggleSection('trades', event))}
                    onWheel={handleWheelEvent}
                    onScroll={handleScrollStart}
                    onTouchMove={handleScrollStart}
                  >
                    <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TableRows color="info" />
                      交易明细 ({backtestResult.details.daily?.trades?.length || 0})
                    </Typography>
                    <IconButton size="small" data-toggle-button="true">
                      {expandedSections.trades ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                  </Box>

                  <Collapse in={expandedSections.trades}>
                    <TableContainer 
                      component={Paper} 
                      sx={{ maxHeight: 300 }}
                      onWheel={handleWheelEvent}
                      onScroll={handleScrollStart}
                    >
                      <Table size="small" stickyHeader>
                        <TableHead>
                          <TableRow>
                            <TableCell>类型</TableCell>
                            <TableCell>时间</TableCell>
                            <TableCell>价格</TableCell>
                            <TableCell>收益%</TableCell>
                            <TableCell>收益额</TableCell>
                            <TableCell>决策</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {backtestResult.details.daily?.trades?.map((trade, idx) => {
                            let decisionChips = [];
                            if (trade.decisions && trade.decisions.length > 0) {
                              decisionChips = trade.decisions.map((d, chipIdx) => {
                                const label = ['15', '30', '60'].includes(d.period) ? `${d.period}min` : (allSignals?.[d.period]?.period_name || d.period);
                                return buildSignalChip(d.period, label, d.signal_type, chipIdx);
                              });
                            } else {
                              // fallback to current signals snapshot
                              decisionChips = Object.entries(allSignals || {}).map(([key, data]) => {
                                const label = ['15', '30', '60'].includes(key) ? `${key}min` : (data.period_name || key);
                                const sig = data.signals?.signal_type || '未知';
                                return buildSignalChip(key, label, sig, idx);
                              });
                            }

                            return (
                              <TableRow key={idx}>
                                <TableCell>{trade.type === 'buy' ? '买入' : '卖出'}</TableCell>
                                <TableCell>{trade.date}</TableCell>
                                <TableCell>{trade.price.toFixed(2)}</TableCell>
                                {trade.type === 'sell' ? (
                                  <>
                                    <TableCell
                                      sx={{ color: trade.profit_pct >= 0 ? 'error.main' : 'success.main' }}
                                    >
                                      {trade.profit_pct >= 0 ? '+' : ''}{trade.profit_pct.toFixed(2)}%
                                    </TableCell>
                                    <TableCell
                                      sx={{ color: trade.profit_amount >= 0 ? 'error.main' : 'success.main' }}
                                    >
                                      {trade.profit_amount >= 0 ? '+' : ''}{trade.profit_amount.toFixed(2)}
                                    </TableCell>
                                  </>
                                ) : (
                                  <>
                                    <TableCell>-</TableCell>
                                    <TableCell>-</TableCell>
                                  </>
                                )}
                                <TableCell sx={{ whiteSpace: 'normal' }}>
                                  <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                                    {decisionChips}
                                  </Box>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Collapse>
                </Card>
              )}
            </Box>
          )}
        </Box>

        {/* 周期选择器 - 二级标签 */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={selectedPeriod} 
            onChange={handlePeriodChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ minHeight: 40 }}
          >
            {Object.entries(allSignals).map(([periodKey, periodData]) => (
              <Tab 
                key={periodKey} 
                value={periodKey} 
                label={periodData.period_name}
                sx={{ minHeight: 40, py: 1 }}
              />
            ))}
          </Tabs>
        </Box>

        {/* 周期内容 - 可滚动区域 */}
        <Box 
          ref={containerRef}
          sx={{ 
            flex: 1, 
            overflow: 'auto',
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: '#f1f1f1',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#888',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: '#555',
            }
          }}
          onWheel={handleWheelEvent}
          onScroll={handleScrollStart}
          onTouchMove={handleScrollStart}
        >
          <Box sx={{ p: 2 }}>
            {/* 当前周期信号概览 */}
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {getSignalIcon(currentSignals.signal_type)}
                  <Typography variant="h6" component="h3">
                    {currentSignals.signal_type}
                  </Typography>
                </Box>
                <Chip
                  label={`信号强度: ${currentSignals.signal_strength}`}
                  color={getSignalTypeColor(currentSignals.signal_type)}
                  size="small"
                />
              </Box>
              
              {currentSignals.advice && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  {currentSignals.advice}
                </Alert>
              )}
            </Box>

            {/* 信号详情 - 可折叠区域 */}
            <Grid container spacing={2}>
              {/* 技术指标信号 */}
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ '&:hover': { boxShadow: 2 } }}>
                  <Box 
                    sx={{ 
                      p: 1.5, 
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      bgcolor: 'background.default',
                      userSelect: 'none',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                    data-card-header="true"
                    onClick={createScrollSafeHandler((event) => toggleSection('indicators', event))}
                    onWheel={handleWheelEvent}
                    onScroll={handleScrollStart}
                    onTouchMove={handleScrollStart}
                  >
                    <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Timeline color="primary" />
                      技术指标信号
                    </Typography>
                    <IconButton size="small" data-toggle-button="true">
                      {expandedSections.indicators ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                  </Box>
                  
                  <Collapse in={expandedSections.indicators}>
                    <Box sx={{ p: 1.5, pt: 0 }} onWheel={handleWheelEvent}>
                      <Grid container spacing={1}>
                        {currentSignals.indicators && Object.entries(currentSignals.indicators).map(([key, value]) => (
                          <Grid item xs={6} key={key}>
                            {renderIndicatorItem(key, value)}
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  </Collapse>
                </Card>
              </Grid>

              {/* 筹码分布 */}
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ '&:hover': { boxShadow: 2 } }}>
                  <Box 
                    sx={{ 
                      p: 1.5, 
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      bgcolor: 'background.default',
                      userSelect: 'none',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                                         data-card-header="true"
                     onClick={createScrollSafeHandler((event) => toggleSection('chip_distribution', event))}
                     onWheel={handleWheelEvent}
                     onScroll={handleScrollStart}
                     onTouchMove={handleScrollStart}
                   >
                     <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                       <BarChart color="info" />
                       筹码分布
                     </Typography>
                     <IconButton size="small" data-toggle-button="true">
                       {expandedSections.chip_distribution ? <ExpandLess /> : <ExpandMore />}
                     </IconButton>
                  </Box>
                  
                  <Collapse in={expandedSections.chip_distribution}>
                    <Box sx={{ p: 1.5, pt: 0, bgcolor: '#000', color: '#fff' }} onWheel={handleWheelEvent}>
                      {renderChipDistribution()}
                    </Box>
                  </Collapse>
                </Card>
              </Grid>

              {/* 基本面分析 */}
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ '&:hover': { boxShadow: 2 } }}>
                  <Box 
                    sx={{ 
                      p: 1.5, 
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      bgcolor: 'background.default',
                      userSelect: 'none',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                    data-card-header="true"
                    onClick={createScrollSafeHandler((event) => toggleSection('fundamentals', event))}
                    onWheel={handleWheelEvent}
                    onScroll={handleScrollStart}
                    onTouchMove={handleScrollStart}
                  >
                    <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccountBalance color="secondary" />
                      基本面分析
                    </Typography>
                    <IconButton size="small" data-toggle-button="true">
                      {expandedSections.fundamentals ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                  </Box>
                  
                  <Collapse in={expandedSections.fundamentals}>
                    <Box sx={{ p: 1.5, pt: 0, bgcolor: '#000', color: '#fff' }} onWheel={handleWheelEvent}>
                      {renderFundamentalAnalysis()}
                    </Box>
                  </Collapse>
                </Card>
              </Grid>

              {/* PE分析 */}
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ '&:hover': { boxShadow: 2 } }}>
                  <Box 
                    sx={{ 
                      p: 1.5, 
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      bgcolor: 'background.default',
                      userSelect: 'none',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                                         data-card-header="true"
                     onClick={createScrollSafeHandler((event) => toggleSection('pe_analysis', event))}
                     onWheel={handleWheelEvent}
                     onScroll={handleScrollStart}
                     onTouchMove={handleScrollStart}
                   >
                     <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                       <Assessment color="warning" />
                       PE分析
                     </Typography>
                     <IconButton size="small" data-toggle-button="true">
                       {expandedSections.pe_analysis ? <ExpandLess /> : <ExpandMore />}
                     </IconButton>
                  </Box>
                  
                  <Collapse in={expandedSections.pe_analysis}>
                    <Box sx={{ p: 1.5, pt: 0, bgcolor: '#000', color: '#fff' }} onWheel={handleWheelEvent}>
                      {renderPEAnalysis()}
                    </Box>
                  </Collapse>
                </Card>
              </Grid>

              {/* 风险评估 */}
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ '&:hover': { boxShadow: 2 } }}>
                  <Box 
                    sx={{ 
                      p: 1.5, 
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      bgcolor: 'background.default',
                      userSelect: 'none',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                    data-card-header="true"
                    onClick={createScrollSafeHandler((event) => toggleSection('risk', event))}
                    onWheel={handleWheelEvent}
                    onScroll={handleScrollStart}
                    onTouchMove={handleScrollStart}
                  >
                    <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Security color="warning" />
                      风险评估
                    </Typography>
                    <IconButton size="small" data-toggle-button="true">
                      {expandedSections.risk ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                  </Box>
                  
                  <Collapse in={expandedSections.risk}>
                    <Box sx={{ p: 1.5, pt: 0 }} onWheel={handleWheelEvent}>
                      {(() => {
                        // 优先使用后端提供的风险评估；否则从基本面数据兜底；再否则根据信号类型推断
                        const fa = currentSignals.fundamental_analysis || {};
                        const fi = currentSignals.fundamental_indicators || {};
                        const derived = (fa.risk_level || fa.risk_factors) ? {
                          risk_level: fa.risk_level,
                          risk_factors: fa.risk_factors
                        } : (fi.risk_level || fi.risk_factors) ? {
                          risk_level: fi.risk_level,
                          risk_factors: fi.risk_factors
                        } : null;

                        let risk = currentSignals.risk_assessment || derived;
                        if (!risk) {
                          const st = currentSignals.signal_type || '';
                          let level = '中';
                          if (st.includes('强烈卖出')) level = '高';
                          else if (st.includes('卖出')) level = '中';
                          else if (st.includes('强烈买入')) level = '中';
                          else if (st.includes('买入')) level = '低';
                          risk = { risk_level: level, risk_factors: [] };
                        }

                        return (
                          <Grid container spacing={1}>
                            <Grid item xs={6}>
                              <Paper sx={{ p: 1, bgcolor: '#000', color: '#fff' }}>
                                <Typography variant="caption" sx={{ color: '#fff' }}>
                                  风险等级
                                </Typography>
                                <Typography component="div" variant="body2" sx={{ fontWeight: 'medium' }}>
                                  <Chip 
                                    label={risk.risk_level || '未知'}
                                    color={getRiskLevelColor(risk.risk_level)}
                                    size="small"
                                  />
                                </Typography>
                              </Paper>
                            </Grid>
                            <Grid item xs={6}>
                              <Paper sx={{ p: 1, bgcolor: '#000', color: '#fff' }}>
                                <Typography variant="caption" sx={{ color: '#fff' }}>
                                  风险因子
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                  {Array.isArray(risk.risk_factors) && risk.risk_factors.length > 0 ? risk.risk_factors.join(', ') : '无'}
                                </Typography>
                              </Paper>
                            </Grid>
                          </Grid>
                        );
                      })()}
                    </Box>
                  </Collapse>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default TradingSignals; 