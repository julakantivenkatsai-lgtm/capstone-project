export type MachineType = 'L' | 'M' | 'H';

export interface AI4IRecord {
  UDI: number;
  Product_ID: string;
  Type: MachineType;
  Air_temperature_K: number;
  Process_temperature_K: number;
  Rotational_speed_rpm: number;
  Torque_Nm: number;
  Tool_wear_min: number;
  Machine_failure: number;
  TWF?: number;
  HDF?: number;
  PWF?: number;
  OSF?: number;
  RNF?: number;
}

export interface PredictionInput {
  Type: MachineType;
  Air_temperature_K: number;
  Process_temperature_K: number;
  Rotational_speed_rpm: number;
  Torque_Nm: number;
  Tool_wear_min: number;
}

export type RiskLevel = 'Normal' | 'Warning' | 'Critical';

export interface PredictionOutput {
  timestamp: string;
  inputs: PredictionInput;
  probability: number;
  riskPercentage: number;
  riskCategory: RiskLevel;
  anomalyScore: number;
  isAnomaly: boolean;
  powerWatts: number;
  deltaT: number;
  overstrainIndex: number;
  recommendation: string;
}

export interface ModelMetrics {
  name: string;
  precision: number;
  recall: number;
  f1: number;
  accuracy: number;
  rocAuc: number;
  prAuc: number;
  optimalThreshold: number;
  tp: number;
  fp: number;
  tn: number;
  fn: number;
}
