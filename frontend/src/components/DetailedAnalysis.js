import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Paper,
  Alert,
  Tabs,
  Tab,
  Collapse,
  IconButton,
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  TrendingUp,
  ShowChart,
  Analytics,
  Timeline,
  Assessment,
  Speed,
  BarChart,
} from '@mui/icons-material';

const DetailedAnalysis = ({ allSignals }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('daily');
  const [expandedSections, setExpandedSections] = useState({
    macd: true,
    rsi: false,
    bollinger: false,
    ma: false,
    volume: false,
    chip: false,
    kdj: false,
    other: false
  });

  const handlePeriodChange = (event, newPeriod) => {
    if (newPeriod !== null) {
      setSelectedPeriod(newPeriod);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // 布林带分析中文卡片渲染
  const renderBollingerSection = (bollinger) => {
    if (!bollinger) return null;
    const latest = bollinger.latest_values || {};
    const upper = latest.upper, middle = latest.middle, lower = latest.lower;
    const fmtYuan = (v) => (typeof v === 'number' ? `${v.toFixed(2)}元` : (v != null ? String(v) : '-'));
    return (
      <Grid item xs={12} key="bollinger">
        <Card variant="outlined">
          <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'background.default' }} onClick={() => toggleSection('bollinger')}>
            <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {React.cloneElement(<Timeline />, { color: 'info' })}
              布林带分析
            </Typography>
            <IconButton size="small">
              {expandedSections['bollinger'] ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>
          <Collapse in={expandedSections['bollinger']}>
            <Box sx={{ p: 1.5, pt: 0 }}>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Paper sx={{ p: 1, bgcolor: '#000', color: '#fff' }}>
                    <Typography variant="caption" sx={{ color: '#fff' }}>上轨</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>{fmtYuan(upper)}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 1, bgcolor: '#000', color: '#fff' }}>
                    <Typography variant="caption" sx={{ color: '#fff' }}>中轨</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>{fmtYuan(middle)}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 1, bgcolor: '#000', color: '#fff' }}>
                    <Typography variant="caption" sx={{ color: '#fff' }}>下轨</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>{fmtYuan(lower)}</Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          </Collapse>
        </Card>
      </Grid>
    );
  };

  // 移动平均线分析中文卡片渲染
  const renderMASection = (ma) => {
    if (!ma) return null;
    const lv = ma.latest_values || {};
    const fmtYuan = (v) => (typeof v === 'number' ? `${v.toFixed(2)}元` : (v != null ? String(v) : '-'));
    const getAny = (keys) => {
      for (const k of keys) {
        if (lv[k] !== undefined) return lv[k];
      }
      return undefined;
    };
    const items = [
      { label: 'MA5',  value: getAny(['MA5','ma5','MA_5','ma_5','ma05','MA05']) },
      { label: 'MA10', value: getAny(['MA10','ma10','MA_10','ma_10','ma010','MA010']) },
      { label: 'MA20', value: getAny(['MA20','ma20','MA_20','ma_20']) },
      { label: 'MA60', value: getAny(['MA60','ma60','MA_60','ma_60']) },
    ];
    return (
      <Grid item xs={12} key="ma">
        <Card variant="outlined">
          <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'background.default' }} onClick={() => toggleSection('ma')}>
            <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {React.cloneElement(<TrendingUp />, { color: 'success' })}
              移动平均线分析
            </Typography>
            <IconButton size="small">
              {expandedSections['ma'] ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>
          <Collapse in={expandedSections['ma']}>
            <Box sx={{ p: 1.5, pt: 0 }}>
              <Grid container spacing={1}>
                {items.map((i, idx) => (
                  <Grid item xs={6} key={`ma-${idx}`}>
                    <Paper sx={{ p: 1, bgcolor: '#000', color: '#fff' }}>
                      <Typography variant="caption" sx={{ color: '#fff' }}>{i.label}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>{fmtYuan(i.value)}</Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Collapse>
        </Card>
      </Grid>
    );
  };

  // 成交量分析中文卡片渲染
  const renderVolumeSection = (volume) => {
    if (!volume) return null;
    const lv = volume.latest_values || {};
    const toNum = (x) => {
      if (x == null) return null;
      const n = typeof x === 'number' ? x : parseFloat(String(x).replace(/,/g, ''));
      return Number.isFinite(n) ? n : null;
    };
    const volFmt = (n) => {
      const v = toNum(n);
      if (v == null) return '-';
      if (v >= 1e8) return `${(v / 1e8).toFixed(2)}亿`;
      return `${(v / 1e4).toFixed(2)}万`;
    };
    const ratioFmt = (n) => {
      const v = toNum(n);
      return v == null ? '-' : `${v.toFixed(2)}倍`;
    };
    return (
      <Grid item xs={12} key="volume">
        <Card variant="outlined">
          <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'background.default' }} onClick={() => toggleSection('volume')}>
            <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {React.cloneElement(<BarChart />, { color: 'warning' })}
              成交量分析
            </Typography>
            <IconButton size="small">
              {expandedSections['volume'] ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>
          <Collapse in={expandedSections['volume']}>
            <Box sx={{ p: 1.5, pt: 0 }}>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Paper sx={{ p: 1, bgcolor: '#000', color: '#fff' }}>
                    <Typography variant="caption" sx={{ color: '#fff' }}>成交量</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>{volFmt(lv.volume)}</Typography>
                  </Paper>
                </Grid>
                {lv.ratio !== undefined && (
                  <Grid item xs={6}>
                    <Paper sx={{ p: 1, bgcolor: '#000', color: '#fff' }}>
                      <Typography variant="caption" sx={{ color: '#fff' }}>量比</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>{ratioFmt(lv.ratio)}</Typography>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </Box>
          </Collapse>
        </Card>
      </Grid>
    );
  };

  // 筹码分布分析中文卡片渲染
  const renderChipSection = (chip) => {
    if (!chip) return null;
    const lv = chip.latest_values || {};
    const fmtYuan = (v) => (typeof v === 'number' ? `${v.toFixed(2)}元` : (v != null ? String(v) : '-'));
    const pctFmt = (n) => (typeof n === 'number' ? `${(n * 100).toFixed(1)}%` : (n != null ? String(n) : '-'));
    const items = [
      { label: '主力成本', value: lv.main_peak_price },
      { label: '平均成本', value: lv.avg_price },
      { label: '压力位', value: lv.pressure_level },
      { label: '支撑位', value: lv.support_level },
    ];
    return (
      <Grid item xs={12} key="chip">
        <Card variant="outlined">
          <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'background.default' }} onClick={() => toggleSection('chip')}>
            <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {React.cloneElement(<Assessment />, { color: 'error' })}
              筹码分布分析
            </Typography>
            <IconButton size="small">
              {expandedSections['chip'] ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>
          <Collapse in={expandedSections['chip']}>
            <Box sx={{ p: 1.5, pt: 0 }}>
              <Grid container spacing={1}>
                {items.map((i, idx) => (
                  <Grid item xs={6} key={`chip-${idx}`}>
                    <Paper sx={{ p: 1, bgcolor: '#000', color: '#fff' }}>
                      <Typography variant="caption" sx={{ color: '#fff' }}>{i.label}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>{fmtYuan(i.value)}</Typography>
                    </Paper>
                  </Grid>
                ))}
                {'concentration' in lv && (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 1, bgcolor: '#000', color: '#fff' }}>
                      <Typography variant="caption" sx={{ color: '#fff' }}>筹码集中度</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>{pctFmt(lv.concentration)}</Typography>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </Box>
          </Collapse>
        </Card>
      </Grid>
    );
  };

  // PE分析中文卡片渲染
  const renderPESection = (pe) => {
    if (!pe) return null;
    const lv = pe.latest_values || {};
    const peData = lv.pe_data || {};
    const toNum = (x) => {
      if (x == null) return null;
      const n = typeof x === 'number' ? x : parseFloat(String(x).replace(/,/g, ''));
      return Number.isFinite(n) ? n : null;
    };
    const times = (n) => {
      const v = toNum(n);
      return v == null ? '-' : `${v.toFixed(2)}倍`;
    };
    const yuan = (n) => {
      const v = toNum(n);
      return v == null ? '-' : `${v.toFixed(2)}元`;
    };
    const price = toNum(peData.current_price ?? lv.current_price);
    const curPe = toNum(lv.current_pe ?? peData.pe);
    const eps = toNum(peData.eps) ?? (price != null && curPe ? (curPe !== 0 ? price / curPe : null) : null);
    const items = [
      { label: '当前PE', value: lv.current_pe, fmt: times },
      { label: '市净率(PB)', value: peData.pb ?? lv.pb, fmt: times },
      { label: '当前价', value: peData.current_price ?? lv.current_price, fmt: yuan },
      { label: '每股收益(EPS)', value: eps, fmt: (v) => (v == null ? '-' : `${v.toFixed(3)}元`) },
    ];
    return (
      <Grid item xs={12} key="pe">
        <Card variant="outlined">
          <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'background.default' }} onClick={() => toggleSection('pe')}>
            <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {React.cloneElement(<Analytics />, { color: 'primary' })}
              PE分析
            </Typography>
            <IconButton size="small">
              {expandedSections['pe'] ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>
          <Collapse in={expandedSections['pe']}>
            <Box sx={{ p: 1.5, pt: 0 }}>
              <Grid container spacing={1}>
                {items.map((i, idx) => (
                  <Grid item xs={6} key={`pe-${idx}`}>
                    <Paper sx={{ p: 1, bgcolor: '#000', color: '#fff' }}>
                      <Typography variant="caption" sx={{ color: '#fff' }}>{i.label}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        {typeof i.fmt === 'function' ? i.fmt(i.value) : (i.value ?? '-')}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Collapse>
        </Card>
      </Grid>
    );
  };

  // 基本面分析中文卡片渲染（黑底白字、中文单位分行）
  const renderFundamentalSection = (fundamental) => {
    if (!fundamental) return null;
    const toNum = (x) => {
      if (x === null || x === undefined) return null;
      const n = typeof x === 'number' ? x : parseFloat(String(x).replace(/,/g, ''));
      return Number.isFinite(n) ? n : null;
    };
    const times = (n) => {
      const v = toNum(n);
      return v == null ? '-' : `${v.toFixed(2)}倍`;
    };
    const pct = (n) => {
      const v = toNum(n);
      if (v == null) return '-';
      const p = v <= 1 ? v * 100 : v;
      return `${p.toFixed(2)}%`;
    };
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
    const latest = fundamental.latest_values || {};
    const ind = latest.indicators || fundamental.indicators || {};
    const items = [
      { label: '市盈率(PE)', value: ind['PE市盈率'] ?? ind.pe, fmt: times },
      { label: '市净率(PB)', value: ind['PB市净率'] ?? ind.pb, fmt: times },
      { label: '市销率(PS)', value: ind['PS市销率'] ?? ind.ps, fmt: times },
      { label: '总市值', value: ind['总市值'] ?? ind.total_market_cap, fmt: moneyCompact },
      { label: '流通市值', value: ind['流通市值'] ?? ind.circulating_market_cap, fmt: moneyCompact },
      { label: '总股本', value: ind['总股本'] ?? ind.total_shares, fmt: sharesCompact },
      { label: '流通股本', value: ind['流通股本'] ?? ind.circulating_shares, fmt: sharesCompact },
      { label: '换手率', value: ind['换手率'] ?? ind.turnover_rate, fmt: pct },
      { label: 'ROE(净资产收益率)', value: ind['净资产收益率'] ?? ind.ROE, fmt: pct },
    ];
    const rating = fundamental.rating ?? latest.rating;
    const ratingScore = toNum(fundamental.rating_score ?? latest.rating_score);
    const analysis = Array.isArray(fundamental.analysis ?? latest.analysis) ? (fundamental.analysis ?? latest.analysis) : [];
    const advice = Array.isArray(fundamental.investment_advice ?? latest.investment_advice) ? (fundamental.investment_advice ?? latest.investment_advice) : [];
    return (
      <Grid item xs={12} key="fundamental">
        <Card variant="outlined">
          <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'background.default' }} onClick={() => toggleSection('fundamental')}>
            <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {React.cloneElement(<Analytics />, { color: 'primary' })}
              基本面分析
            </Typography>
            <IconButton size="small">
              {expandedSections['fundamental'] ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>
          <Collapse in={expandedSections['fundamental']}>
            <Box sx={{ p: 1.5, pt: 0 }}>
              <Grid container spacing={1}>
                {items.filter(i => i.value !== undefined && i.value !== null).map((i, idx) => (
                  <Grid item xs={6} key={`fund-${idx}`}>
                    <Paper sx={{ p: 1, bgcolor: '#000', color: '#fff' }}>
                      <Typography variant="caption" sx={{ color: '#fff' }}>{i.label}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>{i.fmt(i.value)}</Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
              {analysis.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Paper sx={{ p: 1, bgcolor: '#000', color: '#fff' }}>
                    <Typography variant="caption" sx={{ color: '#fff' }}>分析要点</Typography>
                    <Box sx={{ mt: 0.5 }}>
                      {analysis.slice(0, 6).map((item, index) => (
                        <Typography key={index} variant="caption" sx={{ display: 'block' }}>{item}</Typography>
                      ))}
                    </Box>
                  </Paper>
                </Box>
              )}
              {advice.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Paper sx={{ p: 1, bgcolor: '#000', color: '#fff' }}>
                    <Typography variant="caption" sx={{ color: '#fff' }}>投资建议</Typography>
                    <Box sx={{ mt: 0.5 }}>
                      {advice.slice(0, 6).map((item, index) => (
                        <Typography key={index} variant="caption" sx={{ display: 'block' }}>{item}</Typography>
                      ))}
                    </Box>
                  </Paper>
                </Box>
              )}
            </Box>
          </Collapse>
        </Card>
      </Grid>
    );
  };

  // 检查数据是否存在
  if (!allSignals || Object.keys(allSignals).length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="info">
          暂无详细分析数据，请先生成交易信号
        </Alert>
      </Box>
    );
  }

  // 获取当前选中周期的信号
  const currentSignals = allSignals[selectedPeriod]?.signals;
  if (!currentSignals || !currentSignals.indicators) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="info">
          当前周期暂无详细分析数据
        </Alert>
      </Box>
    );
  }

  const indicators = currentSignals.indicators || {};

  // 智能渲染对象
  const renderValue = (value) => {
    if (value === null || value === undefined) {
      return '暂无数据';
    }
    
    if (typeof value === 'object') {
      if (value.latest_values && typeof value.latest_values === 'object') {
        const entries = Object.entries(value.latest_values);
        if (entries.length === 0) return '暂无数据';
        
        return entries.map(([key, val]) => {
          const displayValue = typeof val === 'number' ? val.toFixed(2) : String(val);
          return `${key}: ${displayValue}`;
        }).join(', ');
      }
      
      if (value.latest_value !== undefined) {
        const displayValue = typeof value.latest_value === 'number' 
          ? value.latest_value.toFixed(2) 
          : String(value.latest_value);
        return displayValue;
      }
      
      try {
        const entries = Object.entries(value);
        if (entries.length === 0) return '暂无数据';
        
        return entries.map(([key, val]) => {
          const displayValue = typeof val === 'number' ? val.toFixed(2) : String(val);
          return `${key}: ${displayValue}`;
        }).join(', ');
      } catch (e) {
        return JSON.stringify(value);
      }
    }
    
    if (typeof value === 'number') {
      return value.toFixed(2);
    }
    
    return String(value);
  };

  const renderAnalysisSection = (key, data, title, icon, color = 'primary') => {
    if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
      return null;
    }

    return (
      <Grid item xs={12} key={key}>
        <Card variant="outlined">
          <Box 
            sx={{ 
              p: 1.5, 
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              bgcolor: 'background.default'
            }}
            onClick={() => toggleSection(key)}
          >
            <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {React.cloneElement(icon, { color })}
              {title}
            </Typography>
            <IconButton size="small">
              {expandedSections[key] ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>
          
          <Collapse in={expandedSections[key]}>
            <Box sx={{ p: 1.5, pt: 0 }}>
              {/* 信号描述 */}
              {data.signals && data.signals.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    分析信号
                  </Typography>
                  <Paper sx={{ p: 1.5, bgcolor: 'background.paper' }}>
                    {data.signals.map((signal, index) => (
                      <Typography key={index} variant="body2" sx={{ mb: 0.5 }}>
                        • {signal}
                      </Typography>
                    ))}
                  </Paper>
                </Box>
              )}
              
              {/* 数值数据 */}
              {data.latest_values && Object.keys(data.latest_values).length > 0 && (
                <Grid container spacing={1}>
                  {Object.entries(data.latest_values).map(([valueKey, value]) => (
                    <Grid item xs={6} key={valueKey}>
                      <Paper sx={{ p: 1, bgcolor: 'background.paper' }}>
                        <Typography variant="caption" color="text.secondary">
                          {valueKey}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {renderValue(value)}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              )}
              
              {/* 其他数据 */}
              {!data.signals && !data.latest_values && (
                <Paper sx={{ p: 1.5, bgcolor: 'background.paper' }}>
                  <Typography variant="body2">
                    {renderValue(data)}
                  </Typography>
                </Paper>
              )}
            </Box>
          </Collapse>
        </Card>
      </Grid>
    );
  };



  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ p: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* 当前周期信息 - 固定在顶部 */}
        <Box sx={{ p: 2, bgcolor: 'secondary.50', borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" color="secondary.main" gutterBottom>
            📊 {allSignals[selectedPeriod]?.period_name} 详细分析
          </Typography>
          <Typography variant="body2" color="text.secondary">
            信号类型: {currentSignals.signal_type} | 信号强度: {currentSignals.signal_strength} | 风险等级: {currentSignals.risk_level}
          </Typography>
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

        {/* 分析内容 - 可滚动区域 */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <Box sx={{ p: 2 }}>
            <Grid container spacing={2}>
              {/* MACD分析 */}
              {renderAnalysisSection(
                'macd',
                indicators.macd,
                'MACD分析',
                <ShowChart />,
                'primary'
              )}

              {/* RSI分析 */}
              {renderAnalysisSection(
                'rsi',
                indicators.rsi,
                'RSI分析',
                <Speed />,
                'secondary'
              )}

              {/* 布林带分析 */}
              {renderBollingerSection(indicators.bollinger)}

              {/* 移动平均线分析 */}
              {renderMASection(indicators.ma)}

              {/* 成交量分析 */}
              {renderVolumeSection(indicators.volume)}
              {/* PE分析 */}
              {renderPESection(indicators.pe)}

              {/* 筹码分布分析 */}
              {renderChipSection(indicators.chip)}

              {/* KDJ分析 */}
              {renderAnalysisSection(
                'kdj',
                indicators.kdj,
                'KDJ分析',
                <Analytics />,
                'primary'
              )}

              {/* 其他指标 */}
              {Object.entries(indicators).map(([key, data]) => {
                // 跳过已经渲染的指标
                if (['macd', 'rsi', 'bollinger', 'ma', 'volume', 'chip', 'kdj', 'pe'].includes(key)) {
                  return null;
                }

                // 基本面分析：中文单位与分行卡片展示
                if (key === 'fundamental') {
                  return renderFundamentalSection(data);
                }
                
                // 其他未特殊处理指标：保留通用渲染
                return renderAnalysisSection(
                  key,
                  data,
                  `${key.toUpperCase()}分析`,
                  <Analytics />,
                  'default'
                );
              })}
            </Grid>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default DetailedAnalysis; 