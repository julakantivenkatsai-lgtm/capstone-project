/**
 * MaintIQ – Dataset Service & Validation Engine
 * Loads reference UCI AI4I 2020 dataset, parses uploaded CSV files in-browser,
 * checks data validity, and strips data-leakage features.
 */

import {
  AI4IRecord,
  DatasetStatistics,
  DatasetSummaryStats,
  DatasetValidationResult,
  MachineType,
  ValidationIssue
} from '../types';
import rawDataset from './ai4i2020.json';

export class DatasetService {
  private static cachedReference: AI4IRecord[] | null = null;

  /**
   * Return the bundled UCI AI4I 2020 Predictive Maintenance benchmark dataset.
   */
  static getReferenceDataset(): AI4IRecord[] {
    if (!this.cachedReference) {
      this.cachedReference = rawDataset as AI4IRecord[];
    }
    return this.cachedReference;
  }

  /**
   * Parse CSV text into validated records in the browser without external network calls.
   */
  static parseCSV(csvText: string): { records: AI4IRecord[]; validation: DatasetValidationResult } {
    const lines = csvText.trim().split(/\r?\n/);
    const issues: ValidationIssue[] = [];

    if (lines.length < 2) {
      return {
        records: [],
        validation: {
          isValid: false,
          totalRows: 0,
          validRows: 0,
          skippedRows: 0,
          detectedFeatures: [],
          missingFeatures: ['All'],
          leakedColumnsExcluded: [],
          issues: [{ type: 'error', message: 'CSV file contains no data rows.' }]
        }
      };
    }

    const headerLine = lines[0];
    const rawHeaders = headerLine.split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));

    // Matching helper for flexible column header naming
    const matchCol = (names: string[]) => {
      return rawHeaders.findIndex(h =>
        names.some(n => h.toLowerCase().replace(/[\s_\[\]\-]/g, '') === n.toLowerCase().replace(/[\s_\[\]\-]/g, ''))
      );
    };

    const typeIdx = matchCol(['type', 'machinetype']);
    const airTempIdx = matchCol(['airtemperaturek', 'airtemperature', 'airtemp', 'airtempk']);
    const procTempIdx = matchCol(['processtemperaturek', 'processtemperature', 'processtemp', 'proctempk']);
    const speedIdx = matchCol(['rotationalspeedrpm', 'rotationalspeed', 'speedrpm', 'speed', 'rpm']);
    const torqueIdx = matchCol(['torquenm', 'torque']);
    const toolWearIdx = matchCol(['toolwearmin', 'toolwear', 'wearmin', 'wear']);
    const failureIdx = matchCol(['machinefailure', 'failure', 'target']);

    // Check for leakable failure modes to exclude them
    const leakedFound: string[] = [];
    ['twf', 'hdf', 'pwf', 'osf', 'rnf', 'udi', 'productid'].forEach(leakName => {
      const idx = matchCol([leakName]);
      if (idx !== -1) {
        leakedFound.push(rawHeaders[idx]);
      }
    });

    const detectedFeatures: string[] = [];
    const missingFeatures: string[] = [];

    if (typeIdx !== -1) detectedFeatures.push('Type');
    else missingFeatures.push('Type');

    if (airTempIdx !== -1) detectedFeatures.push('Air temperature [K]');
    else missingFeatures.push('Air temperature [K]');

    if (procTempIdx !== -1) detectedFeatures.push('Process temperature [K]');
    else missingFeatures.push('Process temperature [K]');

    if (speedIdx !== -1) detectedFeatures.push('Rotational speed [rpm]');
    else missingFeatures.push('Rotational speed [rpm]');

    if (torqueIdx !== -1) detectedFeatures.push('Torque [Nm]');
    else missingFeatures.push('Torque [Nm]');

    if (toolWearIdx !== -1) detectedFeatures.push('Tool wear [min]');
    else missingFeatures.push('Tool wear [min]');

    if (missingFeatures.length > 0) {
      issues.push({
        type: 'error',
        message: `Missing required prediction features: ${missingFeatures.join(', ')}.`
      });
      return {
        records: [],
        validation: {
          isValid: false,
          totalRows: lines.length - 1,
          validRows: 0,
          skippedRows: lines.length - 1,
          detectedFeatures,
          missingFeatures,
          leakedColumnsExcluded: leakedFound,
          issues
        }
      };
    }

    if (leakedFound.length > 0) {
      issues.push({
        type: 'info',
        message: `Sanitized dataset: Excluded ${leakedFound.length} auxiliary/leakage columns (${leakedFound.join(', ')}) from prediction feature space.`
      });
    }

    const records: AI4IRecord[] = [];
    let skipped = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cols = line.split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
      const rawType = cols[typeIdx]?.toUpperCase();
      const validTypes: MachineType[] = ['L', 'M', 'H'];
      const type: MachineType = validTypes.includes(rawType as MachineType) ? (rawType as MachineType) : 'L';

      const airTemp = parseFloat(cols[airTempIdx]);
      const procTemp = parseFloat(cols[procTempIdx]);
      const speed = parseFloat(cols[speedIdx]);
      const torque = parseFloat(cols[torqueIdx]);
      const wear = parseFloat(cols[toolWearIdx]);
      const failure = failureIdx !== -1 ? (parseInt(cols[failureIdx], 10) === 1 ? 1 : 0) : 0;

      if (isNaN(airTemp) || isNaN(procTemp) || isNaN(speed) || isNaN(torque) || isNaN(wear)) {
        skipped++;
        continue;
      }

      records.push({
        UDI: i,
        Product_ID: `IMPORT_${i}`,
        Type: type,
        Air_temperature_K: airTemp,
        Process_temperature_K: procTemp,
        Rotational_speed_rpm: Math.round(speed),
        Torque_Nm: torque,
        Tool_wear_min: wear,
        Machine_failure: failure
      });
    }

    if (skipped > 0) {
      issues.push({
        type: 'warning',
        message: `Skipped ${skipped} rows with malformed or missing numeric sensor values.`
      });
    }

    return {
      records,
      validation: {
        isValid: records.length > 0,
        totalRows: lines.length - 1,
        validRows: records.length,
        skippedRows: skipped,
        detectedFeatures,
        missingFeatures: [],
        leakedColumnsExcluded: leakedFound,
        issues
      }
    };
  }

  /**
   * Compute descriptive statistics and target correlations across numerical features
   */
  static computeStatistics(records: AI4IRecord[]): DatasetStatistics {
    const totalRecords = records.length;
    if (totalRecords === 0) {
      return {
        totalRecords: 0,
        failureCount: 0,
        normalCount: 0,
        failureRatePercentage: 0,
        typeDistribution: { L: 0, M: 0, H: 0 },
        featureStats: {},
        correlationsWithTarget: []
      };
    }

    let failures = 0;
    const typeCounts = { L: 0, M: 0, H: 0 };

    const airVals: number[] = [];
    const procVals: number[] = [];
    const speedVals: number[] = [];
    const torqueVals: number[] = [];
    const wearVals: number[] = [];
    const targetVals: number[] = [];

    records.forEach(r => {
      if (r.Machine_failure === 1) failures++;
      if (r.Type in typeCounts) typeCounts[r.Type]++;
      airVals.push(r.Air_temperature_K);
      procVals.push(r.Process_temperature_K);
      speedVals.push(r.Rotational_speed_rpm);
      torqueVals.push(r.Torque_Nm);
      wearVals.push(r.Tool_wear_min);
      targetVals.push(r.Machine_failure);
    });

    const calcSummary = (arr: number[]): DatasetSummaryStats => {
      const sorted = [...arr].sort((a, b) => a - b);
      const n = sorted.length;
      const sum = sorted.reduce((acc, v) => acc + v, 0);
      const mean = sum / n;
      const variance = sorted.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / n;
      const std = Math.sqrt(variance);

      const q = (p: number) => {
        const idx = Math.floor(p * (n - 1));
        return sorted[idx];
      };

      return {
        count: n,
        mean: parseFloat(mean.toFixed(2)),
        std: parseFloat(std.toFixed(2)),
        min: sorted[0],
        p25: q(0.25),
        median: q(0.50),
        p75: q(0.75),
        max: sorted[n - 1]
      };
    };

    // Pearson correlation
    const calcCorr = (x: number[], y: number[]): number => {
      const n = x.length;
      const meanX = x.reduce((a, b) => a + b, 0) / n;
      const meanY = y.reduce((a, b) => a + b, 0) / n;
      let num = 0;
      let denX = 0;
      let denY = 0;
      for (let i = 0; i < n; i++) {
        const dx = x[i] - meanX;
        const dy = y[i] - meanY;
        num += dx * dy;
        denX += dx * dx;
        denY += dy * dy;
      }
      const denom = Math.sqrt(denX * denY);
      return denom === 0 ? 0 : parseFloat((num / denom).toFixed(3));
    };

    return {
      totalRecords,
      failureCount: failures,
      normalCount: totalRecords - failures,
      failureRatePercentage: parseFloat(((failures / totalRecords) * 100).toFixed(2)),
      typeDistribution: typeCounts,
      featureStats: {
        'Air temperature [K]': calcSummary(airVals),
        'Process temperature [K]': calcSummary(procVals),
        'Rotational speed [rpm]': calcSummary(speedVals),
        'Torque [Nm]': calcSummary(torqueVals),
        'Tool wear [min]': calcSummary(wearVals)
      },
      correlationsWithTarget: [
        { feature: 'Torque [Nm]', correlation: calcCorr(torqueVals, targetVals) },
        { feature: 'Tool wear [min]', correlation: calcCorr(wearVals, targetVals) },
        { feature: 'Air temperature [K]', correlation: calcCorr(airVals, targetVals) },
        { feature: 'Process temperature [K]', correlation: calcCorr(procVals, targetVals) },
        { feature: 'Rotational speed [rpm]', correlation: calcCorr(speedVals, targetVals) }
      ].sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))
    };
  }

  /**
   * Generate downloadable sample CSV template
   */
  static generateSampleCSV(): string {
    const records = this.getReferenceDataset().slice(0, 50);
    const headers = [
      'Type',
      'Air temperature [K]',
      'Process temperature [K]',
      'Rotational speed [rpm]',
      'Torque [Nm]',
      'Tool wear [min]'
    ];
    const rows = records.map(r => [
      r.Type,
      r.Air_temperature_K,
      r.Process_temperature_K,
      r.Rotational_speed_rpm,
      r.Torque_Nm,
      r.Tool_wear_min
    ]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }
}
