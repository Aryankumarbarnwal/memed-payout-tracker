'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth, homeFor } from '@/lib/auth';
import { Role, User } from '@/lib/types';

export default function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('creator');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const body = mode === 'signup' ? { name, email, password, role } : { email, password };
      const res = await api<{ token: string; user: User }>(`/api/auth/${mode}`, {
        method: 'POST',
        body,
      });
      login(res.token, res.user);
      router.replace(homeFor(res.user.role));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card" style={{ maxWidth: 380, margin: '60px auto' }}>
      <h2>{mode === 'login' ? 'Login' : 'Create account'}</h2>
      <form onSubmit={onSubmit}>
        {mode === 'signup' && (
          <>
            <label>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required />
            <label>I am a</label>
            <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
              <option value="creator">Creator</option>
              <option value="brand">Brand</option>
            </select>
          </>
        )}
        <label>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />
        {error && <p className="error">{error}</p>}
        <div style={{ marginTop: 16 }}>
          <button disabled={busy}>{busy ? 'Please wait...' : mode === 'login' ? 'Login' : 'Sign up'}</button>
        </div>
      </form>
      <p className="muted">
        {mode === 'login' ? (
          <>No account? <Link href="/signup">Sign up</Link></>
        ) : (
          <>Already registered? <Link href="/login">Login</Link></>
        )}
      </p>
    </div>
  );
}