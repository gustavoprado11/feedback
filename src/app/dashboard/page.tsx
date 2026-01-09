'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';

interface User {
  id: string;
  email: string;
}

interface Establishment {
  id: string;
  name: string;
  slug: string;
  alert_email: string;
  google_review_url?: string | null;
  show_google_review_prompt?: boolean;
  weekly_report_enabled?: boolean;
}

interface Feedback {
  id: string;
  rating: 'bad' | 'okay' | 'great';
  comment?: string;
  created_at: string;
}

interface Stats {
  total: number;
  happiness: number;
  issues: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [selectedEstablishment, setSelectedEstablishment] = useState<Establishment | null>(null);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, happiness: 0, issues: 0 });
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAlertEmail, setNewAlertEmail] = useState('');
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState<'all' | 'bad'>('all');
  const [dateFilter, setDateFilter] = useState<number | null>(null);
  const [googleReviewUrl, setGoogleReviewUrl] = useState('');
  const [showGoogleReviewPrompt, setShowGoogleReviewPrompt] = useState(false);
  const [savingGoogleSettings, setSavingGoogleSettings] = useState(false);
  const [googleSaveMessage, setGoogleSaveMessage] = useState('');
  const [weeklyReportEnabled, setWeeklyReportEnabled] = useState(false);
  const [savingWeeklyReport, setSavingWeeklyReport] = useState(false);
  const [weeklyReportMessage, setWeeklyReportMessage] = useState('');
  const [editingDetails, setEditingDetails] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAlertEmail, setEditAlertEmail] = useState('');
  const [savingDetails, setSavingDetails] = useState(false);
  const [detailsSaveMessage, setDetailsSaveMessage] = useState('');

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          loadEstablishments();
        } else {
          router.push('/login');
        }
      } catch {
        router.push('/login');
      }
    }
    checkAuth();
  }, [router]);

  async function loadEstablishments() {
    try {
      const res = await fetch('/api/establishments');
      if (res.ok) {
        const data = await res.json();
        setEstablishments(data.establishments);
        if (data.establishments.length > 0 && !selectedEstablishment) {
          selectEstablishment(data.establishments[0]);
        }
      }
    } catch (error) {
      console.error('Error loading establishments:', error);
    } finally {
      setLoading(false);
    }
  }

  const selectEstablishment = useCallback(async (establishment: Establishment, loadGoogleSettings = true) => {
    setSelectedEstablishment(establishment);
    setGoogleSaveMessage('');

    // Generate QR Code
    const feedbackUrl = `${window.location.origin}/f/${establishment.slug}`;
    try {
      const qr = await QRCode.toDataURL(feedbackUrl, {
        width: 300,
        margin: 2,
        color: { dark: '#1f2937', light: '#ffffff' },
      });
      setQrCodeUrl(qr);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }

    // Load feedbacks
    try {
      const params = new URLSearchParams();
      if (filter === 'bad') params.append('rating', 'bad');
      if (dateFilter) params.append('days', dateFilter.toString());
      const res = await fetch(`/api/establishments/${establishment.id}?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedEstablishment(data.establishment);
        if (loadGoogleSettings) {
          setGoogleReviewUrl(data.establishment.google_review_url || '');
          setShowGoogleReviewPrompt(Boolean(data.establishment.show_google_review_prompt));
          setWeeklyReportEnabled(Boolean(data.establishment.weekly_report_enabled));
        }
        setFeedbacks(data.feedbacks);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error loading feedbacks:', error);
    }
  }, [filter, dateFilter]);

  // Reload feedbacks when filter changes (without overwriting Google settings)
  useEffect(() => {
    if (selectedEstablishment) {
      selectEstablishment(selectedEstablishment, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, dateFilter]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const handleCreateEstablishment = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const res = await fetch('/api/establishments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          alertEmail: newAlertEmail || user?.email,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setEstablishments([...establishments, data.establishment]);
        selectEstablishment(data.establishment);
        setShowCreateModal(false);
        setNewName('');
        setNewAlertEmail('');
      }
    } catch (error) {
      console.error('Error creating establishment:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleSaveGoogleSettings = async () => {
    if (!selectedEstablishment) return;

    setSavingGoogleSettings(true);
    setGoogleSaveMessage('');

    try {
      const res = await fetch(`/api/establishments/${selectedEstablishment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          googleReviewUrl: googleReviewUrl.trim() || null,
          showGoogleReviewPrompt,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSelectedEstablishment(data.establishment);
        setGoogleReviewUrl(data.establishment.google_review_url || '');
        setShowGoogleReviewPrompt(Boolean(data.establishment.show_google_review_prompt));
        setGoogleSaveMessage('Configurações salvas.');
      } else {
        setGoogleSaveMessage('Não foi possível salvar as configurações.');
      }
    } catch (error) {
      console.error('Error saving Google review settings:', error);
      setGoogleSaveMessage('Não foi possível salvar as configurações.');
    } finally {
      setSavingGoogleSettings(false);
    }
  };

  const handleSaveWeeklyReport = async () => {
    if (!selectedEstablishment) return;

    setSavingWeeklyReport(true);
    setWeeklyReportMessage('');

    try {
      const res = await fetch(`/api/establishments/${selectedEstablishment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weeklyReportEnabled,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSelectedEstablishment(data.establishment);
        setWeeklyReportEnabled(Boolean(data.establishment.weekly_report_enabled));
        setWeeklyReportMessage('Configurações salvas.');
      } else {
        setWeeklyReportMessage('Não foi possível salvar.');
      }
    } catch (error) {
      console.error('Error saving weekly report settings:', error);
      setWeeklyReportMessage('Não foi possível salvar.');
    } finally {
      setSavingWeeklyReport(false);
    }
  };

  const handleStartEditDetails = () => {
    if (!selectedEstablishment) return;
    setEditName(selectedEstablishment.name);
    setEditAlertEmail(selectedEstablishment.alert_email);
    setEditingDetails(true);
    setDetailsSaveMessage('');
  };

  const handleCancelEditDetails = () => {
    setEditingDetails(false);
    setDetailsSaveMessage('');
  };

  const handleSaveDetails = async () => {
    if (!selectedEstablishment) return;

    setSavingDetails(true);
    setDetailsSaveMessage('');

    try {
      const res = await fetch(`/api/establishments/${selectedEstablishment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          alertEmail: editAlertEmail.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSelectedEstablishment(data.establishment);
        setEstablishments(establishments.map(e =>
          e.id === data.establishment.id ? data.establishment : e
        ));
        setEditingDetails(false);
        setDetailsSaveMessage('Dados salvos.');
      } else {
        setDetailsSaveMessage('Não foi possível salvar.');
      }
    } catch (error) {
      console.error('Error saving establishment details:', error);
      setDetailsSaveMessage('Não foi possível salvar.');
    } finally {
      setSavingDetails(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeUrl || !selectedEstablishment) return;

    const link = document.createElement('a');
    link.download = `qrcode-${selectedEstablishment.slug}.png`;
    link.href = qrCodeUrl;
    link.click();
  };

  const openFeedbackPage = () => {
    if (!selectedEstablishment) return;
    window.open(`/f/${selectedEstablishment.slug}`, '_blank');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;

    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRatingInfo = (rating: string) => {
    switch (rating) {
      case 'great':
        return { label: 'Ótimo', color: 'bg-green-100 text-green-700', icon: '😊' };
      case 'okay':
        return { label: 'Ok', color: 'bg-amber-100 text-amber-700', icon: '😐' };
      case 'bad':
        return { label: 'Ruim', color: 'bg-red-100 text-red-700', icon: '😞' };
      default:
        return { label: rating, color: 'bg-gray-100 text-gray-700', icon: '•' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center">
              <img
                src="/diz-ai-logo.svg"
                alt="Diz Aí"
                className="w-6 h-6"
              />
            </div>
            <span className="text-xl font-bold text-gray-800">Diz Aí</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-gray-600">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {establishments.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Nenhum estabelecimento cadastrado
            </h2>
            <p className="text-gray-600 mb-6">
              Cadastre seu primeiro estabelecimento para começar a coletar feedback.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-indigo-500 text-white font-bold rounded-xl hover:bg-indigo-600 transition-colors"
            >
              Cadastrar Estabelecimento
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                    <span className="text-2xl">😊</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-800">{stats.happiness}%</div>
                  <div className="text-gray-500 text-sm">SATISFAÇÃO</div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="text-3xl font-bold text-gray-800">{stats.issues}</div>
                  <div className="text-gray-500 text-sm">PROBLEMAS</div>
                </div>
              </div>

              {/* QR Code Card */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="font-bold text-gray-800 mb-1">Seu Portal de Feedback</h3>
                <p className="text-gray-500 text-sm mb-4">Escaneie para testar ou baixe para imprimir</p>

                {qrCodeUrl && (
                  <div className="flex justify-center mb-4">
                    <img
                      src={qrCodeUrl}
                      alt="QR Code"
                      className="w-48 h-48"
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={downloadQRCode}
                    className="flex-1 flex items-center justify-center gap-2 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Salvar
                  </button>
                  <button
                    onClick={openFeedbackPage}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-700 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Abrir
                  </button>
                </div>
              </div>

              {/* Establishment Details */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-800">Detalhes do Estabelecimento</h3>
                  {!editingDetails && (
                    <button
                      onClick={handleStartEditDetails}
                      className="text-indigo-500 hover:text-indigo-600 text-sm font-medium"
                    >
                      Editar
                    </button>
                  )}
                </div>

                {editingDetails ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-500 text-sm mb-1">Nome</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full p-2 border border-gray-200 rounded-lg focus:border-indigo-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-500 text-sm mb-1">Slug</label>
                      <span className="block font-mono text-sm text-gray-400 p-2">{selectedEstablishment?.slug}</span>
                    </div>
                    <div>
                      <label className="block text-gray-500 text-sm mb-1">Email de Alerta</label>
                      <input
                        type="email"
                        value={editAlertEmail}
                        onChange={(e) => setEditAlertEmail(e.target.value)}
                        className="w-full p-2 border border-gray-200 rounded-lg focus:border-indigo-400 focus:outline-none"
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={handleCancelEditDetails}
                        className="flex-1 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleSaveDetails}
                        disabled={savingDetails}
                        className={`flex-1 py-2 rounded-lg font-medium text-white text-sm transition-colors ${
                          savingDetails ? 'bg-gray-400' : 'bg-indigo-500 hover:bg-indigo-600'
                        }`}
                      >
                        {savingDetails ? 'Salvando...' : 'Salvar'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Nome</span>
                      <span className="font-medium text-gray-800">{selectedEstablishment?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Slug</span>
                      <span className="font-mono text-sm text-gray-600">{selectedEstablishment?.slug}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Email de Alerta</span>
                      <span className="text-gray-800">{selectedEstablishment?.alert_email}</span>
                    </div>
                    {detailsSaveMessage && (
                      <p className="text-sm text-green-600 pt-1">{detailsSaveMessage}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="font-bold text-gray-800 mb-1">Avaliação no Google</h3>
                <p className="text-gray-500 text-sm mb-4">
                  Cole o link direto da avaliação e defina quando exibir o convite.
                </p>

                <label className="block text-gray-700 font-medium mb-2">
                  Mostrar convite após feedback positivo
                </label>
                <button
                  type="button"
                  onClick={() => setShowGoogleReviewPrompt((prev) => !prev)}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                    showGoogleReviewPrompt ? 'bg-indigo-500' : 'bg-gray-200'
                  }`}
                  aria-pressed={showGoogleReviewPrompt}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      showGoogleReviewPrompt ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>

                <label className="block text-gray-700 font-medium mt-4 mb-2">
                  Link da avaliação no Google
                </label>
                <input
                  type="url"
                  value={googleReviewUrl}
                  onChange={(e) => setGoogleReviewUrl(e.target.value)}
                  placeholder="https://g.page/r/seu-negocio/review"
                  className="w-full p-3 border border-gray-200 rounded-xl focus:border-indigo-400 focus:outline-none"
                />

                <button
                  type="button"
                  onClick={handleSaveGoogleSettings}
                  disabled={savingGoogleSettings}
                  className={`w-full mt-4 py-3 rounded-xl font-bold text-white transition-colors ${
                    savingGoogleSettings ? 'bg-gray-400' : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  {savingGoogleSettings ? 'Salvando...' : 'Salvar configurações'}
                </button>
                {googleSaveMessage && (
                  <p className="text-sm text-gray-600 mt-3">{googleSaveMessage}</p>
                )}
              </div>

              {/* Weekly Report Settings */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="font-bold text-gray-800 mb-1">Relatório Semanal</h3>
                <p className="text-gray-500 text-sm mb-4">
                  Receba um resumo semanal com estatísticas e comentários por email.
                </p>

                <label className="block text-gray-700 font-medium mb-2">
                  Receber relatório semanal por email
                </label>
                <button
                  type="button"
                  onClick={() => setWeeklyReportEnabled((prev) => !prev)}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                    weeklyReportEnabled ? 'bg-indigo-500' : 'bg-gray-200'
                  }`}
                  aria-pressed={weeklyReportEnabled}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      weeklyReportEnabled ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>

                <p className="text-xs text-gray-400 mt-3">
                  O relatório será enviado para: <span className="font-medium text-gray-600">{selectedEstablishment?.alert_email}</span>
                </p>

                <button
                  type="button"
                  onClick={handleSaveWeeklyReport}
                  disabled={savingWeeklyReport}
                  className={`w-full mt-4 py-3 rounded-xl font-bold text-white transition-colors ${
                    savingWeeklyReport ? 'bg-gray-400' : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  {savingWeeklyReport ? 'Salvando...' : 'Salvar configurações'}
                </button>
                {weeklyReportMessage && (
                  <p className="text-sm text-gray-600 mt-3">{weeklyReportMessage}</p>
                )}
              </div>
            </div>

            {/* Right Column - Feedbacks */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex flex-col gap-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      <h3 className="font-bold text-gray-800">Feedbacks em Tempo Real</h3>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          filter === 'all'
                            ? 'bg-indigo-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        Todos
                      </button>
                      <button
                        onClick={() => setFilter('bad')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          filter === 'bad'
                            ? 'bg-indigo-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        Apenas Negativos
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div className="flex gap-1">
                      {[
                        { label: 'Todos', value: null },
                        { label: 'Hoje', value: 1 },
                        { label: '7 dias', value: 7 },
                        { label: '30 dias', value: 30 },
                        { label: '90 dias', value: 90 },
                      ].map((option) => (
                        <button
                          key={option.label}
                          onClick={() => setDateFilter(option.value)}
                          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                            dateFilter === option.value
                              ? 'bg-gray-800 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {feedbacks.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <div className="text-4xl mb-4">👻</div>
                    <h4 className="font-bold text-gray-800 mb-2">Nenhum feedback ainda</h4>
                    <p className="text-gray-500 text-sm">
                      Compartilhe seu QR Code com os clientes para começar a coletar insights!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {feedbacks.map((feedback) => {
                      const ratingInfo = getRatingInfo(feedback.rating);
                      return (
                        <div
                          key={feedback.id}
                          className={`p-4 rounded-xl border ${
                            feedback.rating === 'bad'
                              ? 'border-red-200 bg-red-50'
                              : 'border-gray-100 bg-white'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{ratingInfo.icon}</span>
                              <div>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${ratingInfo.color}`}>
                                  {ratingInfo.label}
                                </span>
                                {feedback.comment && (
                                  <p className="mt-2 text-gray-700">{feedback.comment}</p>
                                )}
                              </div>
                            </div>
                            <span className="text-xs text-gray-400">
                              {formatDate(feedback.created_at)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Novo Estabelecimento
            </h2>

            <form onSubmit={handleCreateEstablishment} className="space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Nome do Estabelecimento
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:border-indigo-400 focus:outline-none"
                  placeholder="Ex: Café Central"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Email para Alertas (opcional)
                </label>
                <input
                  type="email"
                  value={newAlertEmail}
                  onChange={(e) => setNewAlertEmail(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:border-indigo-400 focus:outline-none"
                  placeholder={user?.email || 'seu@email.com'}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Você receberá alertas quando houver feedback negativo.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className={`
                    flex-1 py-3 rounded-xl font-bold text-white transition-colors
                    ${creating ? 'bg-gray-400' : 'bg-indigo-500 hover:bg-indigo-600'}
                  `}
                >
                  {creating ? 'Criando...' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
