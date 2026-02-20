export interface BacktestRequest {
  symbol: string;
  timeframe: string;
  startDate: string;
  endDate: string;
  initialWallet: number;
  stopLossPercent: number;
  takeProfitPercent: number;
  makerFee: number;
  takerFee: number;
  positionSizePercent: number;
  strategy: IndicatorStrategy;
}

export interface IndicatorStrategy {
  indicatorType: string;
  signalType: string;
  parameters: Record<string, number | boolean | string>;
}

export interface BacktestResult {
  initialBalance: number;
  finalBalance: number;
  totalPnL: number;
  totalPnLPercent: number;
  winRate: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  sharpeRatio: number;
  profitFactor: number;
  averageWin: number;
  averageLoss: number;
  averageWinPercent: number;
  averageLossPercent: number;
  largestWin: number;
  largestLoss: number;
  totalFeesPaid: number;
  averageHoldingPeriod: string;

  trades: TradeRecord[];

  equityCurve: EquityPoint[];

  symbol: string;
  timeframe: string;
  startDate: string;
  endDate: string;
  strategyUsed: string;
}

export interface TradeRecord {
  id: number;
  direction: "LONG" | "SHORT";
  entryDate: string;
  entryPrice: number;
  exitDate: string;
  exitPrice: number;
  stopLoss: number;
  takeProfit: number;
  positionSize: number;
  quantity: number;
  pnL: number;
  pnLPercent: number;
  fees: number;
  exitReason: "TP" | "SL" | "Signal" | "EndOfData";
  balanceAfter: number;
  signalSource: string;
  holdingPeriodMinutes: number;
}

export interface EquityPoint {
  timestamp: number;
  date: string;
  balance: number;
  drawdown: number;
  drawdownPercent: number;
}

export interface StrategyOption {
  id: string;
  name: string;
  description: string;
}

export interface IndicatorInfo {
  id: string;
  name: string;
  strategies: StrategyOption[];
  defaultParameters: Record<string, number | boolean | string>;
}

export interface SymbolInfo {
  id: string;
  name: string;
  type: string;
}

export interface TimeframeInfo {
  id: string;
  name: string;
  minutes: number;
}

export interface DefaultSettings {
  symbol: string;
  timeframe: string;
  startDate: string;
  endDate: string;
  initialWallet: number;
  stopLossPercent: number;
  takeProfitPercent: number;
  makerFee: number;
  takerFee: number;
  positionSizePercent: number;
  strategy: IndicatorStrategy;
}

export interface BacktestFormState {
  symbol: string;
  timeframe: string;
  startDate: string;
  endDate: string;
  initialWallet: string;
  stopLossPercent: string;
  takeProfitPercent: string;
  makerFee: string;
  takerFee: string;
  positionSizePercent: string;
  indicatorType: string;
  signalType: string;
  parameters: Record<string, string>;
}

export interface ApiError {
  error: string;
}

function utcDateInputValue(daysOffset: number): string {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysOffset));
  return d.toISOString().slice(0, 10);
}

export function formatCurrency(value: number, decimals = 2): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatPercent(value: number, decimals = 2): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(new Date(dateString));
}

export function formatShortDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export const DEFAULT_FORM_STATE: BacktestFormState = {
  symbol: "BTCUSDT",
  timeframe: "1h",
  startDate: utcDateInputValue(-90),
  endDate: utcDateInputValue(1),
  initialWallet: "1000",
  stopLossPercent: "2",
  takeProfitPercent: "4",
  makerFee: "0.1",
  takerFee: "0.1",
  positionSizePercent: "100",
  indicatorType: "support-resistance",
  signalType: "bounce",
  parameters: {},
};

export function formStateToRequest(state: BacktestFormState): BacktestRequest {
  const params: Record<string, number | boolean | string> = {};

  for (const [key, value] of Object.entries(state.parameters)) {
    if (value === "true" || value === "false") {
      params[key] = value === "true";
    } else if (!isNaN(Number(value))) {
      params[key] = Number(value);
    } else {
      params[key] = value;
    }
  }

  return {
    symbol: state.symbol,
    timeframe: state.timeframe,
    startDate: state.startDate,
    endDate: state.endDate,
    initialWallet: parseFloat(state.initialWallet),
    stopLossPercent: parseFloat(state.stopLossPercent),
    takeProfitPercent: parseFloat(state.takeProfitPercent),
    makerFee: parseFloat(state.makerFee),
    takerFee: parseFloat(state.takerFee),
    positionSizePercent: parseFloat(state.positionSizePercent),
    strategy: {
      indicatorType: state.indicatorType,
      signalType: state.signalType,
      parameters: params,
    },
  };
}
