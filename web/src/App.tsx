import React, { useState } from 'react';
import { PredictionInput, PredictionOutput } from './types';
import { MLPipeline } from './ml/engine';

const pipeline = new MLPipeline();

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'predict' | 'models' | 'anomaly' | 'explain' | 'about'>('dashboard');
  const [input, setInput] = useState<PredictionInput>({
    Type: 'L',
    Air_temperature_K: 298.2,
    Process_temperature_K: 308.5,
    Rotational_speed_rpm: 1540,
    Torque_Nm: 41.2,
    Tool_wear_min: 72
  });

  const [result, setResult] = useState<PredictionOutput | null>(null);

  const handlePredict = (e: React.FormEvent) => {
    e.preventDefault();
    const res = pipeline.computeRisk(input);
    setResult(res);
  };

  return (
    <div className="maintiq-react-app" style={{ minHeight: '100vh', background: '#0A0F1D', color: '#F1F5F9', fontFamily: 'sans-serif', padding: '24px' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #203052', paddingBottom: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#14B8A6' }}>MaintIQ – Machine Health Intelligence</h1>
          <p style={{ fontSize: '13px', color: '#94A3B8' }}>AI-Powered Predictive Maintenance & Anomaly Detection (CSE Final-Year Project)</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['dashboard', 'predict', 'models', 'anomaly', 'explain', 'about'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 14px',
                borderRadius: '6px',
                border: '1px solid #203052',
                background: activeTab === tab ? '#14B8A6' : '#131E36',
                color: activeTab === tab ? '#0A0F1D' : '#F1F5F9',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '12px',
                textTransform: 'capitalize'
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      <main>
        {activeTab === 'dashboard' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: '#0F172A', padding: '16px', borderRadius: '10px', borderLeft: '4px solid #14B8A6' }}>
                <div style={{ fontSize: '12px', color: '#94A3B8' }}>DATASET SIZE</div>
                <div style={{ fontSize: '24px', fontWeight: 800 }}>10,000</div>
                <div style={{ fontSize: '11px', color: '#64748B' }}>UCI AI4I 2020 Predictive Maint.</div>
              </div>
              <div style={{ background: '#0F172A', padding: '16px', borderRadius: '10px', borderLeft: '4px solid #F43F5E' }}>
                <div style={{ fontSize: '12px', color: '#94A3B8' }}>FAILURE RATE</div>
                <div style={{ fontSize: '24px', fontWeight: 800 }}>3.39%</div>
                <div style={{ fontSize: '11px', color: '#64748B' }}>Class Imbalanced Target</div>
              </div>
              <div style={{ background: '#0F172A', padding: '16px', borderRadius: '10px', borderLeft: '4px solid #14B8A6' }}>
                <div style={{ fontSize: '12px', color: '#94A3B8' }}>BEST MODEL (XGB) F1</div>
                <div style={{ fontSize: '24px', fontWeight: 800 }}>0.875</div>
                <div style={{ fontSize: '11px', color: '#64748B' }}>Threshold tuned on Validation</div>
              </div>
              <div style={{ background: '#0F172A', padding: '16px', borderRadius: '10px', borderLeft: '4px solid #8B5CF6' }}>
                <div style={{ fontSize: '12px', color: '#94A3B8' }}>ANOMALY RATE</div>
                <div style={{ fontSize: '24px', fontWeight: 800 }}>4.8%</div>
                <div style={{ fontSize: '11px', color: '#64748B' }}>Isolation Forest (s &ge; 0.58)</div>
              </div>
            </div>

            <div style={{ background: '#0F172A', padding: '20px', borderRadius: '10px', border: '1px solid #203052' }}>
              <h2 style={{ fontSize: '16px', marginBottom: '8px' }}>Executive Summary</h2>
              <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: 1.6 }}>
                MaintIQ predicts equipment failures and identifies operational anomalies before costly downtime occurs.
                Tested on the UCI AI4I 2020 predictive maintenance benchmark with zero data leakage across stratified train, validation, and test splits.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'predict' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <form onSubmit={handlePredict} style={{ background: '#0F172A', padding: '20px', borderRadius: '10px', border: '1px solid #203052' }}>
              <h2 style={{ fontSize: '16px', marginBottom: '16px' }}>Single Machine Predictor</h2>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: '#94A3B8' }}>Product Type</label>
                <select
                  value={input.Type}
                  onChange={e => setInput({ ...input, Type: e.target.value as 'L' | 'M' | 'H' })}
                  style={{ width: '100%', padding: '8px', background: '#0A0F1D', border: '1px solid #203052', color: '#FFF', borderRadius: '6px' }}
                >
                  <option value="L">L - Low Quality (50%)</option>
                  <option value="M">M - Medium Quality (30%)</option>
                  <option value="H">H - High Quality (20%)</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: '#94A3B8' }}>Air Temp [K]</label>
                  <input
                    type="number"
                    step="0.1"
                    value={input.Air_temperature_K}
                    onChange={e => setInput({ ...input, Air_temperature_K: parseFloat(e.target.value) })}
                    style={{ width: '100%', padding: '8px', background: '#0A0F1D', border: '1px solid #203052', color: '#FFF', borderRadius: '6px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: '#94A3B8' }}>Process Temp [K]</label>
                  <input
                    type="number"
                    step="0.1"
                    value={input.Process_temperature_K}
                    onChange={e => setInput({ ...input, Process_temperature_K: parseFloat(e.target.value) })}
                    style={{ width: '100%', padding: '8px', background: '#0A0F1D', border: '1px solid #203052', color: '#FFF', borderRadius: '6px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: '#94A3B8' }}>Speed [rpm]</label>
                  <input
                    type="number"
                    value={input.Rotational_speed_rpm}
                    onChange={e => setInput({ ...input, Rotational_speed_rpm: parseFloat(e.target.value) })}
                    style={{ width: '100%', padding: '8px', background: '#0A0F1D', border: '1px solid #203052', color: '#FFF', borderRadius: '6px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: '#94A3B8' }}>Torque [Nm]</label>
                  <input
                    type="number"
                    step="0.1"
                    value={input.Torque_Nm}
                    onChange={e => setInput({ ...input, Torque_Nm: parseFloat(e.target.value) })}
                    style={{ width: '100%', padding: '8px', background: '#0A0F1D', border: '1px solid #203052', color: '#FFF', borderRadius: '6px' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: '#94A3B8' }}>Tool Wear [min]</label>
                <input
                  type="number"
                  value={input.Tool_wear_min}
                  onChange={e => setInput({ ...input, Tool_wear_min: parseFloat(e.target.value) })}
                  style={{ width: '100%', padding: '8px', background: '#0A0F1D', border: '1px solid #203052', color: '#FFF', borderRadius: '6px' }}
                />
              </div>

              <button
                type="submit"
                style={{ width: '100%', padding: '10px', background: '#14B8A6', color: '#0A0F1D', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}
              >
                Run Prediction
              </button>
            </form>

            <div style={{ background: '#0F172A', padding: '20px', borderRadius: '10px', border: '1px solid #203052' }}>
              <h2 style={{ fontSize: '16px', marginBottom: '16px' }}>Inference Output</h2>
              {result ? (
                <div>
                  <div style={{ fontSize: '32px', fontWeight: 800, color: result.riskCategory === 'Critical' ? '#F43F5E' : (result.riskCategory === 'Warning' ? '#F59E0B' : '#10B981') }}>
                    {result.riskPercentage.toFixed(1)}% ({result.riskCategory})
                  </div>
                  <div style={{ marginTop: '12px', fontSize: '13px', color: '#94A3B8' }}>
                    <div>Anomaly Score: <strong>{result.anomalyScore.toFixed(3)}</strong> {result.isAnomaly ? '(Flagged)' : '(Normal)'}</div>
                    <div>Spindle Power: <strong>{result.powerWatts} W</strong></div>
                    <div>Thermal Gradient &Delta;T: <strong>{result.deltaT.toFixed(1)} K</strong></div>
                    <div>Overstrain Index: <strong>{result.overstrainIndex}</strong></div>
                  </div>
                  <div style={{ marginTop: '16px', padding: '12px', background: '#131E36', borderRadius: '6px', fontSize: '13px', lineHeight: 1.5 }}>
                    <strong>Directive:</strong> {result.recommendation}
                  </div>
                </div>
              ) : (
                <div style={{ color: '#64748B', fontSize: '13px', paddingTop: '40px', textAlign: 'center' }}>
                  Submit the form to compute failure probability and anomaly score.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'about' && (
          <div style={{ background: '#0F172A', padding: '24px', borderRadius: '10px', border: '1px solid #203052', lineHeight: 1.7 }}>
            <h2 style={{ fontSize: '18px', color: '#14B8A6', marginBottom: '12px' }}>Academic Methodology & Limitations (CSE Final-Year Project)</h2>
            <p style={{ fontSize: '13px', color: '#CBD5E1', marginBottom: '12px' }}>
              <strong>Dataset:</strong> Built using the UCI AI4I 2020 Predictive Maintenance dataset (Matan et al.), explicitly synthetic, modeling milling machine failure physics.
            </p>
            <ul style={{ fontSize: '13px', color: '#94A3B8', paddingLeft: '20px' }}>
              <li><strong>Zero Data Leakage:</strong> Failure mode indicators (TWF, HDF, PWF, OSF, RNF) are excluded from training features.</li>
              <li><strong>Threshold Optimization:</strong> Models are tuned on a 15% validation split to maximize F1-score and evaluated strictly on a 15% test split.</li>
              <li><strong>Mandatory Limitations:</strong> No RUL prediction; not certified for industrial safety; anomaly &ne; failure; feature importance &ne; physical causation.</li>
            </ul>
          </div>
        )}
      </main>
    </div>
  );
};
