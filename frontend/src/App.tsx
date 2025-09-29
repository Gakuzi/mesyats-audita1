import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import api from './lib/api';
import InterviewForm from './components/InterviewForm';

type Week = { id: number; title: string | null; status: string };

function AuthGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => setSession(sess));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!ready) return <div className="p-6">Загрузка…</div>;
  if (!session) return <AuthForm />;
  return <>{children}</>;
}

function AuthForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const signIn = async () => {
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
  };

  const signUp = async () => {
    setError(null);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setError(error.message);
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-sm bg-white shadow p-6 rounded">
        <h1 className="text-xl font-semibold mb-4">Вход</h1>
        <input className="input mb-2 w-full border p-2 rounded" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="input mb-4 w-full border p-2 rounded" type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
        <div className="flex gap-2">
          <button className="bg-blue-600 text-white px-3 py-2 rounded" onClick={signIn}>Войти</button>
          <button className="bg-gray-200 px-3 py-2 rounded" onClick={signUp}>Регистрация</button>
        </div>
      </div>
    </div>
  );
}

function Weeks() {
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/api/weeks');
      setWeeks(data.weeks ?? []);
    } catch (e: any) {
      setError(e?.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const approve = async (id: number) => {
    await api.post(`/api/weeks/${id}/approve`);
    await load();
  };

  if (loading) return <div className="p-4">Загрузка недель…</div>;
  if (error) return <div className="p-4 text-red-600">Ошибка: {error}</div>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Недели</h2>
        <button className="text-sm text-gray-600" onClick={() => supabase.auth.signOut()}>Выйти</button>
      </div>
      <ul className="space-y-2">
        {weeks.map((w) => (
          <li key={w.id} className="bg-white p-3 rounded shadow flex items-center justify-between">
            <div>
              <div className="font-medium">{w.title ?? `Неделя #${w.id}`}</div>
              <div className="text-sm text-gray-500">Статус: {w.status}</div>
            </div>
            {w.status !== 'approved' && (
              <button className="bg-green-600 text-white px-3 py-2 rounded" onClick={() => approve(w.id)}>
                Согласовать
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState<'weeks' | 'interview'>('weeks');
  return (
    <AuthGate>
      <div className="p-4">
        <div className="flex gap-2 mb-4">
          <button className={`px-3 py-2 rounded ${tab==='weeks'?'bg-blue-600 text-white':'bg-gray-200'}`} onClick={() => setTab('weeks')}>Недели</button>
          <button className={`px-3 py-2 rounded ${tab==='interview'?'bg-blue-600 text-white':'bg-gray-200'}`} onClick={() => setTab('interview')}>Интервью</button>
        </div>
        {tab === 'weeks' ? <Weeks /> : <InterviewForm />}
      </div>
    </AuthGate>
  );
}
