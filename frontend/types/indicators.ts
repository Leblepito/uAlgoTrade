export type ParameterType = "number" | "boolean" | "select";

export interface ParameterDefinition {
  key: string;
  label: string;
  type: ParameterType;
  default: number | boolean | string;
  min?: number;
  max?: number;
  step?: number;
  options?: Array<{ value: string; label: string }>;
  description?: string;
}

export interface IndicatorConfig {
  id: string;
  name: string;
  category: string;
  parameters: ParameterDefinition[];
}

export type IndicatorParameters = Record<string, Record<string, number | boolean | string>>;

export const INDICATOR_CONFIGS: Record<string, IndicatorConfig> = {
  "support-resistance": {
    id: "support-resistance",
    name: "Support / Resistance",
    category: "Zones",
    parameters: [
      { key: "atrLength", label: "ATR Length", type: "number", default: 50, min: 10, max: 200, step: 1, description: "ATR calculation period" },
      { key: "multiplicativeFactor", label: "Zone Multiplier", type: "number", default: 8, min: 1, max: 20, step: 0.5, description: "Zone width multiplier" },
      { key: "extendLast", label: "Extend Last", type: "number", default: 6, min: 1, max: 20, step: 1, description: "Number of recent levels to extend" },
    ],
  },
  "market-structure": {
    id: "market-structure",
    name: "Market Structure",
    category: "Smart Money",
    parameters: [
      { key: "zigZagLength", label: "ZigZag Length", type: "number", default: 7, min: 3, max: 30, step: 1, description: "Bars for swing detection" },
      { key: "fibFactor", label: "Fib Factor", type: "number", default: 0.33, min: 0.1, max: 1, step: 0.01, description: "Fibonacci break factor" },
    ],
  },
  "elliott-wave": {
    id: "elliott-wave",
    name: "Elliott Wave",
    category: "Patterns",
    parameters: [
      { key: "length1", label: "Length 1", type: "number", default: 4, min: 2, max: 20, step: 1, description: "First wave length" },
      { key: "length2", label: "Length 2", type: "number", default: 8, min: 2, max: 30, step: 1, description: "Second wave length" },
      { key: "length3", label: "Length 3", type: "number", default: 16, min: 2, max: 50, step: 1, description: "Third wave length" },
      { key: "useLength1", label: "Use Length 1", type: "boolean", default: true, description: "Enable first wave" },
      { key: "useLength2", label: "Use Length 2", type: "boolean", default: true, description: "Enable second wave" },
      { key: "useLength3", label: "Use Length 3", type: "boolean", default: false, description: "Enable third wave" },
    ],
  },
};

export function getDefaultParameters(): IndicatorParameters {
  const defaults: IndicatorParameters = {};
  for (const [id, config] of Object.entries(INDICATOR_CONFIGS)) {
    defaults[id] = {};
    for (const param of config.parameters) {
      defaults[id][param.key] = param.default;
    }
  }
  return defaults;
}
