'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useRequireRole } from '@/lib/auth';
import { Campaign } from '@/lib/types';

interface MilestoneInput {
  views: string;
  payout: string;
}

export default function BrandPage() {
  const { user, loading, logout } = useRequireRole('brand');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [name, setName] = useState('');
  const [platform, setPlatform] = useState<'instagram' | 'youtube'>('instagram');
  const [totalBudget, setTotalBudget] = useState('');
  const [milestones, setMilestones] = useState<MilestoneInput[]>([
    { views: '10000', payout: '500' },
  ]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await api<{ campaigns: Campaign[] }>('/api/campaigns/mine');
    setCampaigns(res.campaigns);
  }, []);

  useEffect(() => {
    if (user) load().catch((e) => setError(e.message));
  }, [user, load]);

  function updateMilestone(i: number, key: keyof MilestoneInput, value: string) {
    setMilestones((prev) => prev.map((m, idx) => (idx === i ? { ...m, [key]: value } : m)));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api('/api/campaigns', {
        method: 'POST',
        body: {
          name,
          platform,
          totalBudget: Number(totalBudget),
          milestones: milestones.map((m) => ({ views: Number(m.views), payout: Number(m.payout) })),
        },
      });
      setName('');
      setTotalBudget('');
      setMilestones([{ views: '10000', payout: '500' }]);
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (loading || !user) return <p className="muted">Loading...</p>;

  return (
    <>
      <div className="row between" style={{ marginBottom: 16 }}>
        <h1>Brand: {user.name}</h1>
        <button className="secondary" onClick={logout}>Logout</button>
      </div>

      <div className="card">
        <h3>Create campaign</h3>
        <form onSubmit={onSubmit}>
          <label>Campaign name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required />

          <div className="row">
            <div style={{ flex: 1 }}>
              <label>Platform</label>
              <select value={platform} onChange={(e) => setPlatform(e.target.value as 'instagram' | 'youtube')}>
                <option value="instagram">Instagram</option>
                <option value="youtube">YouTube</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label>Total budget (₹)</label>
              <input type="number" min={1} value={totalBudget} onChange={(e) => setTotalBudget(e.target.value)} required />
            </div>
          </div>

          <label>Milestones (views → payout ₹)</label>
          {milestones.map((m, i) => (
            <div className="row" key={i} style={{ marginBottom: 6 }}>
              <input type="number" min={1} placeholder="Views" value={m.views} onChange={(e) => updateMilestone(i, 'views', e.target.value)} required />
              <input type="number" min={1} placeholder="Payout" value={m.payout} onChange={(e) => updateMilestone(i, 'payout', e.target.value)} required />
              {milestones.length > 1 && (
                <button type="button" className="secondary" onClick={() => setMilestones((p) => p.filter((_, idx) => idx !== i))}>
                  Remove
                </button>
              )}
            </div>
          ))}
          <button type="button" className="secondary" onClick={() => setMilestones((p) => [...p, { views: '', payout: '' }])}>
            + Add milestone
          </button>

          {error && <p className="error">{error}</p>}
          <div style={{ marginTop: 16 }}>
            <button disabled={busy}>{busy ? 'Creating...' : 'Create campaign'}</button>
          </div>
        </form>
      </div>

      <h3>Your campaigns</h3>
      {campaigns.length === 0 && <p className="muted">No campaigns yet.</p>}
      {campaigns.map((c) => {
        const pct = Math.min(100, Math.round((c.spent / c.totalBudget) * 100));
        return (
          <div className="card" key={c.id}>
            <div className="row between">
              <strong>{c.name}</strong>
              <span className="badge">{c.platform}</span>
            </div>
            <div className="bar"><div style={{ width: `${pct}%` }} /></div>
            <div className="row between">
              <span>Spent: ₹{c.spent.toLocaleString('en-IN')}</span>
              <span>Remaining: ₹{c.remaining.toLocaleString('en-IN')}</span>
              <span className="muted">Total: ₹{c.totalBudget.toLocaleString('en-IN')}</span>
            </div>
            <p className="muted">
              {c.milestones.map((m) => `${m.views.toLocaleString('en-IN')} views → ₹${m.payout}`).join('  |  ')}
            </p>
          </div>
        );
      })}
    </>
  );
}