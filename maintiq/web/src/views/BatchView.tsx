import React, { useRef, useState } from 'react';
import {
  Download,
  Filter,
  FileSpreadsheet
} from 'lucide-react';
import { PredictionInput, PredictionOutput } from '../types';
import { DatasetService } from '../data/datasetService';
import { mlEngine } from '../ml/engine';
import { StorageService } from '../services/storageService';

export const BatchView: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [batchResults, setBatchResults] = useState<PredictionOutput[]>([]);
  const [filterRisk, setFilterRisk] = useState<'all' | 'Normal' | 'Warning' | 'Critical'>('all');
  const [batchStats, setBatchStats] = useState<{ total: number; critical: number; warning: number; normal: number; anomalies: number } | null>(null);

  const handleBatchFile = (file: File) => {
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        const { records } = DatasetService.parseCSV(text);
        if (records.length > 0) {
          const results: PredictionOutput[] = [];
          let crit = 0;
          let warn = 0;
          let norm = 0;
          let anom = 0;

          records.forEach((r) => {
            const input: PredictionInput = {
              Type: r.Type,
              Air_temperature_K: r.Air_temperature_K,
              Process_temperature_K: r.Process_temperature_K,
              Rotational_speed_rpm: r.Rotational_speed_rpm,
              Torque_Nm: r.Torque_Nm,
              Tool_wear_min: r.Tool_wear_min
            };
            const res = mlEngine.predict(input, 'xgboost');
            results.push(res);
            if (res.riskCategory === 'Critical') crit++;
            else if (res.riskCategory === 'Warning') warn++;
            else norm++;
            if (res.isAnomaly) anom++;
          });

          setBatchResults(results);
          setBatchStats({
            total: results.length,
            critical: crit,
            warning: warn,
            normal: norm,
            anomalies: anom
          });

          // Save batch to localStorage
          StorageService.addBatchPredictions(results, `batch_${Date.now()}`);
        }
      }
      setIsProcessing(false);
    };
    reader.readAsText(file);
  };

  const handleExportCSV = () => {
    if (batchResults.length === 0) return;
    const headers = [
      'Record_ID',
      'Type',
      'Air_temp_K',
      'Process_temp_K',
      'Speed_rpm',
      'Torque_Nm',
      'Tool_wear_min',
      'Failure_Probability',
      'Risk_Category',
      'Anomaly_Score',
      'Is_Anomaly',
      'Spindle_Power_W',
      'Thermal_DeltaT_K',
      'Overstrain_Index',
      'Recommendation'
    ];
    const rows = batchResults.map((r, i) => [
      `BATCH_${i + 1}`,
      r.inputs.Type,
      r.inputs.Air_temperature_K,
      r.inputs.Process_temperature_K,
      r.inputs.Rotational_speed_rpm,
      r.inputs.Torque_Nm,
      r.inputs.Tool_wear_min,
      (r.probability * 100).toFixed(1) + '%',
      r.riskCategory,
      r.anomalyScore.toFixed(3),
      r.isAnomaly ? 'YES' : 'NO',
      r.physicalMetrics.powerWatts,
      r.physicalMetrics.deltaT.toFixed(1),
      r.physicalMetrics.overstrainIndex,
      `"${r.recommendation.replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `maintiq_batch_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredResults = batchResults.filter(r => {
    if (filterRisk === 'all') return true;
    return r.riskCategory === filterRisk;
  });

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Upload Drop Area */}
      <div className="maintiq-card" style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#F8FAFC' }}>Batch Telemetry Inference</h2>
            <p style={{ fontSize: '12px', color: '#94A3B8' }}>Upload a CSV file of multiple equipment records to process predictions in parallel</p>
          </div>
          {batchResults.length > 0 && (
            <button onClick={handleExportCSV} className="maintiq-btn-primary" style={{ fontSize: '12px' }}>
              <Download size={14} />
              <span>Export CSV Report</span>
            </button>
          )}
        </div>

        <div
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: '2px dashed #26354D',
            borderRadius: '8px',
            padding: '28px',
            textAlign: 'center',
            background: '#0F172A',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <input
            type="file"
            ref={fileInputRef}
            accept=".csv"
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleBatchFile(e.target.files[0]);
              }
            }}
          />
          <div style={{ padding: '10px', borderRadius: '50%', background: '#131E36', color: '#14B8A6' }}>
            <FileSpreadsheet size={24} />
          </div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#F1F5F9' }}>
            {isProcessing ? 'Processing batch telemetry in-browser...' : 'Click to select batch telemetry CSV'}
          </div>
          <div style={{ fontSize: '11px', color: '#64748B' }}>
            Processes all machine entries without transmitting data externally
          </div>
        </div>
      </div>

      {/* Batch Summary Metrics */}
      {batchStats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
          <div className="maintiq-card" style={{ padding: '14px', borderLeft: '4px solid #14B8A6' }}>
            <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 700 }}>BATCH SIZE</div>
            <div style={{ fontSize: '22px', fontWeight: 800 }}>{batchStats.total}</div>
            <div style={{ fontSize: '10px', color: '#64748B' }}>Total Machines</div>
          </div>
          <div className="maintiq-card" style={{ padding: '14px', borderLeft: '4px solid #F43F5E' }}>
            <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 700 }}>CRITICAL RISK</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#F43F5E' }}>{batchStats.critical}</div>
            <div style={{ fontSize: '10px', color: '#64748B' }}>Immediate Action</div>
          </div>
          <div className="maintiq-card" style={{ padding: '14px', borderLeft: '4px solid #F59E0B' }}>
            <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 700 }}>WARNING RISK</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#F59E0B' }}>{batchStats.warning}</div>
            <div style={{ fontSize: '10px', color: '#64748B' }}>Inspection Required</div>
          </div>
          <div className="maintiq-card" style={{ padding: '14px', borderLeft: '4px solid #10B981' }}>
            <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 700 }}>NORMAL</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#10B981' }}>{batchStats.normal}</div>
            <div style={{ fontSize: '10px', color: '#64748B' }}>Within Bounds</div>
          </div>
          <div className="maintiq-card" style={{ padding: '14px', borderLeft: '4px solid #8B5CF6' }}>
            <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 700 }}>ANOMALIES</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#8B5CF6' }}>{batchStats.anomalies}</div>
            <div style={{ fontSize: '10px', color: '#64748B' }}>Isolation Forest</div>
          </div>
        </div>
      )}

      {/* Batch Results Table */}
      {batchResults.length > 0 && (
        <div className="maintiq-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#F8FAFC' }}>
              Batch Classification Records ({filteredResults.length} / {batchResults.length})
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Filter size={14} color="#64748B" />
              {(['all', 'Critical', 'Warning', 'Normal'] as const).map(risk => (
                <button
                  key={risk}
                  onClick={() => setFilterRisk(risk)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    border: '1px solid #1E293B',
                    background: filterRisk === risk ? '#14B8A6' : '#131E36',
                    color: filterRisk === risk ? '#0A0F1D' : '#94A3B8',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 600
                  }}
                >
                  {risk}
                </button>
              ))}
            </div>
          </div>

          <div style={{ overflowX: 'auto', maxHeight: '420px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
              <thead style={{ position: 'sticky', top: 0, background: '#131E36' }}>
                <tr style={{ borderBottom: '1px solid #1E293B', color: '#64748B', textTransform: 'uppercase', fontSize: '11px' }}>
                  <th style={{ padding: '8px 10px' }}>#</th>
                  <th style={{ padding: '8px 10px' }}>Type</th>
                  <th style={{ padding: '8px 10px' }}>Speed</th>
                  <th style={{ padding: '8px 10px' }}>Torque</th>
                  <th style={{ padding: '8px 10px' }}>Wear</th>
                  <th style={{ padding: '8px 10px' }}>Probability</th>
                  <th style={{ padding: '8px 10px' }}>Risk Category</th>
                  <th style={{ padding: '8px 10px' }}>Anomaly</th>
                  <th style={{ padding: '8px 10px' }}>Directive</th>
                </tr>
              </thead>
              <tbody>
                {filteredResults.map((r, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #1E293B' }}>
                    <td style={{ padding: '8px 10px', color: '#64748B' }}>{idx + 1}</td>
                    <td style={{ padding: '8px 10px', fontWeight: 600 }}>{r.inputs.Type}</td>
                    <td style={{ padding: '8px 10px', color: '#94A3B8' }} className="sensor-metric">{r.inputs.Rotational_speed_rpm} rpm</td>
                    <td style={{ padding: '8px 10px', color: '#94A3B8' }} className="sensor-metric">{r.inputs.Torque_Nm} Nm</td>
                    <td style={{ padding: '8px 10px', color: '#94A3B8' }} className="sensor-metric">{r.inputs.Tool_wear_min} min</td>
                    <td style={{ padding: '8px 10px', fontWeight: 700, color: r.riskCategory === 'Critical' ? '#F43F5E' : (r.riskCategory === 'Warning' ? '#F59E0B' : '#10B981') }} className="sensor-metric">
                      {r.riskPercentage}%
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <span className={`maintiq-badge ${r.riskCategory === 'Critical' ? 'badge-critical' : (r.riskCategory === 'Warning' ? 'badge-warning' : 'badge-normal')}`}>
                        {r.riskCategory}
                      </span>
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      {r.isAnomaly ? (
                        <span className="maintiq-badge badge-anomaly">Anomaly</span>
                      ) : (
                        <span style={{ color: '#64748B', fontSize: '11px' }}>Nominal</span>
                      )}
                    </td>
                    <td style={{ padding: '8px 10px', color: '#CBD5E1', fontSize: '11px', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={r.recommendation}>
                      {r.recommendation}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
