import React, { useState } from 'react';
import { AuthService } from '../services/authService';
import { LogIn, Loader2, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Both fields are required');
      return;
    }
    setLoading(true);
    setError(null);
    const res = await AuthService.login(username, password);
    setLoading(false);
    if (res.success) {
      onSuccess();
    } else {
      setError(res.error ?? 'Invalid username or password');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0A0F1D',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <form onSubmit={handleSubmit} style={{
        background: 'rgba(13,21,39,0.85)',
        padding: '2rem',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '360px',
        boxShadow: '0 0 30px rgba(20,184,166,0.2)',
        backdropFilter: 'blur(8px)'
      }}>
        <h2 style={{
          color: '#F8FAFC',
          marginBottom: '1.5rem',
          fontSize: '1.5rem',
          textAlign: 'center',
          fontWeight: 800
        }}>Welcome Back</h2>
        {error && (
          <div style={{
            background: '#dc2626',
            color: '#F8FAFC',
            padding: '0.75rem',
            borderRadius: '8px',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="username" style={{ display: 'block', color: '#94A3B8', marginBottom: '0.4rem' }}>Username</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.6rem 0.8rem',
              borderRadius: '6px',
              border: '1px solid #1E293B',
              background: '#1E293B',
              color: '#F8FAFC'
            }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="password" style={{ display: 'block', color: '#94A3B8', marginBottom: '0.4rem' }}>Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.6rem 0.8rem',
              borderRadius: '6px',
              border: '1px solid #1E293B',
              background: '#1E293B',
              color: '#F8FAFC'
            }}
          />
        </div>
        <button type="submit" disabled={loading} style={{
          width: '100%',
          padding: '0.75rem',
          borderRadius: '6px',
          border: 'none',
          background: '#14B8A6',
          color: '#0A0F1D',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          cursor: loading ? 'default' : 'pointer'
        }}>
          {loading ? <Loader2 className="animate-spin" size={18} /> : <LogIn size={18} />} {loading ? 'Signing In…' : 'Sign In'}
        </button>
      </form>
    </div>
  );
};
