export const AuthService = {
  async checkSession(): Promise<boolean> {
    try {
      const res = await fetch('/api/session', { credentials: 'include' });
      if (!res.ok) return false;
      const data = await res.json();
      return data.authenticated === true;
    } catch (_) {
      return false;
    }
  },
  async login(username: string, password: string): Promise<{ success: boolean; error?: string }> {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password })
    });
    if (res.ok) return { success: true };
    const err = await res.json();
    return { success: false, error: err.error || 'Login failed' };
  },
  async logout(): Promise<boolean> {
    const res = await fetch('/api/logout', { method: 'POST', credentials: 'include' });
    return res.ok;
  }
};
