'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useRequireRole } from '@/lib/auth';
import { Campaign, Submission } from '@/lib/types';

export default function CreatorPage() {
  const { user, loading, logout } = useRequireRole('creator');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [campaignId, setCampaignId] = useState('');
  const [postUrl, setPostUrl] = useState('');
  const [viewsInput, setViewsInput] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [c, s] = await Promise.all([
      api<{ campaigns: Campaign[] }>('/api/campaigns'),
      api<{ submissions: Submission[]; totalEarnings: number }>('/api/submissions/mine'),
    ]);
    setCampaigns(c.campaigns);
    setSubmissions(s.submissions);
    setTotalEarnings(s.totalEarnings);
    setCampaignId((prev) => prev || c.campaigns[0]?.id || '');
  }, []);

  useEffect(() => {
  // eslint-disable-next-line react-hooks/set-state-in-effect
    if (user) load().catch((e) => setError(e.message));
  }, [user, load]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setNotice('');
    setBusy(true);
    try {
      await api('/api/submissions', { method: 'POST', body: { campaignId, postUrl } });
      setPostUrl('');
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  // Platform data simulate karta hai (assignment: PATCH /views pe auth nahi)
  async function updateViews(id: string) {
    setError('');
    setNotice('');
    try {
      const res = await api<{ paidNow: number }>(`/api/submissions/${id}/views`, {
        method: 'PATCH',
        body: { views: Number(viewsInput[id]) },
      });
      setNotice(`Views updated. Paid now: ₹${res.paidNow}`);
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  if (loading || !user) return <p className="muted">Loading...</p>;

  return (
    <>
      <div className="row between" style={{ marginBottom: 16 }}>
        <h1>Creator: {user.name}</h1>
        <button className="secondary" onClick={logout}>Logout</button>
      </div>

      <div className="card">
        <h3>Total earnings</h3>
        <div style={{ fontSize: 28, fontWeight: 600 }}>₹{totalEarnings.toLocaleString('en-IN')}</div>
      </div>

      {error && <p className="error">{error}</p>}
      {notice && <p className="muted">{notice}</p>}

      <div className="card">
        <h3>Submit a post</h3>
        {campaigns.length === 0 ? (
          <p className="muted">No live campaigns right now.</p>
        ) : (
          <form onSubmit={onSubmit}>
            <label>Campaign</label>
            <select value={campaignId} onChange={(e) => setCampaignId(e.target.value)}>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.platform}), ₹{c.remaining} left
                </option>
              ))}
            </select>
            <label>Post link</label>
            <input type="url" placeholder="https://www.instagram.com/reel/..." value={postUrl} onChange={(e) => setPostUrl(e.target.value)} required />
            <div style={{ marginTop: 16 }}>
              <button disabled={busy}>{busy ? 'Submitting...' : 'Submit post'}</button>
            </div>
          </form>
        )}
      </div>

      <h3>Live campaigns</h3>
      {campaigns.map((c) => (
        <div className="card" key={c.id}>
          <div className="row between">
            <strong>{c.name}</strong>
            <span className="badge">{c.platform}</span>
          </div>
          <p className="muted">
            {c.milestones.map((m) => `${m.views.toLocaleString('en-IN')} views → ₹${m.payout}`).join('  |  ')}
          </p>
        </div>
      ))}

      <h3>My submissions</h3>
      {submissions.length === 0 && <p className="muted">Nothing submitted yet.</p>}
      {submissions.map((s) => (
        <div className="card" key={s.id}>
          <div className="row between">
            <strong>{s.campaign?.name ?? 'Campaign'}</strong>
            {s.flagged && <span className="badge flag">Flagged</span>}
          </div>
          <p className="muted" style={{ wordBreak: 'break-all' }}>{s.postUrl}</p>
          <div className="row between">
            <span>Views: {s.views.toLocaleString('en-IN')}</span>
            <span>Earned: ₹{s.paidAmount.toLocaleString('en-IN')}</span>
          </div>
          <div className="row" style={{ marginTop: 10 }}>
            <input
              type="number"
              min={0}
              placeholder="Simulate new view count"
              value={viewsInput[s.id] ?? ''}
              onChange={(e) => setViewsInput((p) => ({ ...p, [s.id]: e.target.value }))}
            />
            <button className="secondary" onClick={() => updateViews(s.id)} disabled={!viewsInput[s.id]}>
              Update views
            </button>
          </div>
        </div>
      ))}
    </>
  );
}