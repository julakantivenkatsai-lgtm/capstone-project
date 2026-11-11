/**
 * MaintIQ - Machine Health Intelligence
 * TypeScript Machine Learning Pipeline
 */

import { PredictionInput, PredictionOutput } from '../types';

export function sigmoid(z: number): number {
  return 1.0 / (1.0 + Math.exp(-Math.max(-20, Math.min(20, z))));
}

export class MLPipeline {
  extractFeatures(input: PredictionInput): number[] {
    const typeCode = input.Type === 'H' ? 2 : (input.Type === 'M' ? 1 : 0);
    const air = input.Air_temperature_K;
    const proc = input.Process_temperature_K;
    const speed = input.Rotational_speed_rpm;
    const torque = input.Torque_Nm;
    const wear = input.Tool_wear_min;

    // Derived physical interaction terms
    const deltaT = proc - air;
    const power = torque * (speed * (2 * Math.PI / 60));
    const strain = wear * torque;

    return [typeCode, air, proc, speed, torque, wear, deltaT, power, strain];
  }

  computeRisk(input: PredictionInput): PredictionOutput {
    const deltaT = input.Process_temperature_K - input.Air_temperature_K;
    const power = Math.round(input.Torque_Nm * input.Rotational_speed_rpm * (2 * Math.PI / 60));
    const strain = Math.round(input.Tool_wear_min * input.Torque_Nm);

    // Heuristic GBDT decision rule calibration
    let score = 0;
    if (strain > 11000) score += 0.65;
    if (input.Tool_wear_min > 200) score += 0.40;
    if (deltaT < 8.6 && input.Rotational_speed_rpm < 1380) score += 0.55;
    if (power > 9000 || power < 3500) score += 0.45;
    if (input.Torque_Nm > 60) score += 0.25;

    const prob = sigmoid((score - 0.5) * 4);
    const riskPercentage = prob * 100;

    let riskCategory: 'Normal' | 'Warning' | 'Critical' = 'Normal';
    if (prob > 0.65) riskCategory = 'Critical';
    else if (prob > 0.35) riskCategory = 'Warning';

    // Simulated Isolation Forest anomaly score
    const speedNorm = Math.abs(input.Rotational_speed_rpm - 1538) / 179;
    const torqueNorm = Math.abs(input.Torque_Nm - 40) / 10;
    const anomalyScore = Math.min(0.95, 0.4 + (speedNorm + torqueNorm) * 0.12);
    const isAnomaly = anomalyScore >= 0.58;

    let recommendation = "Machine operating within standard physical bounds. Regular periodic maintenance recommended.";
    if (strain > 11000) {
      recommendation = "HIGH OVERSTRAIN: Tool wear × torque exceeds threshold. Replace cutting insert immediately.";
    } else if (input.Tool_wear_min > 200) {
      recommendation = "TOOL WEAR LIMIT REACHED: Tool wear exceeded 200 min. Schedule replacement.";
    } else if (deltaT < 8.6 && input.Rotational_speed_rpm < 1380) {
      recommendation = "HEAT DISSIPATION HAZARD: Thermal gradient < 8.6 K under low speed. Inspect coolant supply.";
    } else if (power > 9000 || power < 3500) {
      recommendation = "POWER CONSUMPTION OUTLIER: Spindle power outside safe operating envelope (3.5 - 9 kW).";
    }

    return {
      timestamp: new Date().toLocaleTimeString(),
      inputs: input,
      probability: prob,
      riskPercentage,
      riskCategory,
      anomalyScore,
      isAnomaly,
      powerWatts: power,
      deltaT,
      overstrainIndex: strain,
      recommendation
    };
  }
}
