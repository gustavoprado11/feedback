'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';

interface User {
  id: string;
  email: string;
  subscriptionStatus?: string;
  subscriptionEndDate?: string;
}

interface Establishment {
  id: string;
  name: string;
  slug: string;
  alert_email: string;
  google_review_url?: string | null;
  show_google_review_prompt?: boolean;
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
  const [googleReviewUrl, setGoogleReviewUrl] = useState('');
  const [showGoogleReviewPrompt, setShowGoogleReviewPrompt] = useState(false);
  const [savingGoogleSettings, setSavingGoogleSettings] = useState(false);
  const [googleSaveMessage, setGoogleSaveMessage] = useState('');
  const [managingSubscription, setManagingSubscription] = useState(false);
  const [editingEstablishment, setEditingEstablishment] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAlertEmail, setEditAlertEmail] = useState('');
  const [savingEstablishment, setSavingEstablishment] = useState(false);
  const [establishmentSaveMessage, setEstablishmentSaveMessage] = useState('');

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser({
            id: data.user.id,
            email: data.user.email,
            subscriptionStatus: data.user.subscriptionStatus,
            subscriptionEndDate: data.user.subscriptionEndDate,
          });
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
        const data: { establishments: Establishment[] } = await res.json();
        setEstablishments(data.establishments);
        const fallbackEstablishment = data.establishments[0];
        const currentEstablishment = selectedEstablishment
          ? data.establishments.find(
            (item: Establishment) => item.id === selectedEstablishment.id
          )
          : null;
        if (fallbackEstablishment && !currentEstablishment) {
          selectEstablishment(fallbackEstablishment);
        }
      } else if (res.status === 403) {
        // User doesn't have active subscription
        const data = await res.json();
        alert(data.error);
        router.push('/pricing');
      }
    } catch (error) {
      console.error('Error loading establishments:', error);
    } finally {
      setLoading(false);
    }
  }

  const selectEstablishment = useCallback(async (establishment: Establishment) => {
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
      const ratingParam = filter === 'bad' ? '&rating=bad' : '';
      const res = await fetch(`/api/establishments/${establishment.id}?${ratingParam}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedEstablishment(data.establishment);
        setGoogleReviewUrl(data.establishment.google_review_url || '');
        setShowGoogleReviewPrompt(Boolean(data.establishment.show_google_review_prompt));
        setFeedbacks(data.feedbacks);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error loading feedbacks:', error);
    }
  }, [filter]);

  useEffect(() => {
    async function reloadFeedbacks() {
      if (!selectedEstablishment) return;

      try {
        const ratingParam = filter === 'bad' ? '&rating=bad' : '';
        const res = await fetch(`/api/establishments/${selectedEstablishment.id}?${ratingParam}`);
        if (res.ok) {
          const data = await res.json();
          setFeedbacks(data.feedbacks);
          setStats(data.stats);
        }
      } catch (error) {
        console.error('Error reloading feedbacks:', error);
      }
    }

    reloadFeedbacks();
  }, [filter, selectedEstablishment?.id]);

  const handleManageSubscription = async () => {
    setManagingSubscription(true);

    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Erro ao acessar portal de gerenciamento');
        setManagingSubscription(false);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Erro ao acessar portal de gerenciamento');
      setManagingSubscription(false);
    }
  };

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

  const handleEditEstablishment = () => {
    if (!selectedEstablishment) return;
    setEditName(selectedEstablishment.name);
    setEditAlertEmail(selectedEstablishment.alert_email);
    setEditingEstablishment(true);
    setEstablishmentSaveMessage('');
  };

  const handleCancelEdit = () => {
    setEditingEstablishment(false);
    setEditName('');
    setEditAlertEmail('');
    setEstablishmentSaveMessage('');
  };

  const handleSaveEstablishment = async () => {
    if (!selectedEstablishment) return;

    setSavingEstablishment(true);
    setEstablishmentSaveMessage('');

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
        // Update the selected establishment with new data
        setSelectedEstablishment((prev) => ({
          ...prev!,
          name: data.establishment.name,
          alert_email: data.establishment.alert_email,
        }));
        // Update establishments list
        setEstablishments((prev) =>
          prev.map((est) =>
            est.id === selectedEstablishment.id
              ? { ...est, name: data.establishment.name, alert_email: data.establishment.alert_email }
              : est
          )
        );
        setEstablishmentSaveMessage('✓ Informações atualizadas com sucesso!');
        setEditingEstablishment(false);

        // Clear success message after 3 seconds
        setTimeout(() => setEstablishmentSaveMessage(''), 3000);
      } else {
        const errorData = await res.json();
        setEstablishmentSaveMessage(`✗ Erro: ${errorData.error || 'Não foi possível salvar'}`);
      }
    } catch (error) {
      console.error('Error saving establishment:', error);
      setEstablishmentSaveMessage('✗ Erro ao salvar. Tente novamente.');
    } finally {
      setSavingEstablishment(false);
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
        // Update the selected establishment with new data
        setSelectedEstablishment((prev) => ({
          ...prev!,
          google_review_url: data.establishment.google_review_url,
          show_google_review_prompt: data.establishment.show_google_review_prompt,
        }));
        setGoogleSaveMessage('✓ Configurações salvas com sucesso!');

        // Clear success message after 3 seconds
        setTimeout(() => setGoogleSaveMessage(''), 3000);
      } else {
        const errorData = await res.json();
        setGoogleSaveMessage(`✗ Erro: ${errorData.error || 'Não foi possível salvar'}`);
      }
    } catch (error) {
      console.error('Error saving Google review settings:', error);
      setGoogleSaveMessage('✗ Erro ao salvar as configurações. Tente novamente.');
    } finally {
      setSavingGoogleSettings(false);
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
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 3 .97 4.29L2 22l5.71-.97C9 21.64 10.46 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.38 0-2.68-.28-3.88-.78l-.28-.12-2.9.49.49-2.9-.12-.28C4.78 14.68 4.5 13.38 4.5 12c0-4.14 3.36-7.5 7.5-7.5s7.5 3.36 7.5 7.5-3.36 7.5-7.5 7.5z"/>
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-800">Diz Aí</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-gray-600">{user?.email}</span>
            <button
              type="button"
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
              type="button"
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
              {/* Subscription Status */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="font-bold text-gray-800 mb-1">Assinatura</h3>
                <p className="text-gray-500 text-sm mb-4">Gerencie sua assinatura</p>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Status</span>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        user?.subscriptionStatus === 'active'
                          ? 'bg-green-100 text-green-700'
                          : user?.subscriptionStatus === 'trialing'
                          ? 'bg-blue-100 text-blue-700'
                          : user?.subscriptionStatus === 'past_due'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {user?.subscriptionStatus === 'active'
                        ? 'Ativa'
                        : user?.subscriptionStatus === 'trialing'
                        ? 'Período de teste'
                        : user?.subscriptionStatus === 'past_due'
                        ? 'Pagamento pendente'
                        : 'Inativa'}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Plano</span>
                    <span className="font-medium text-gray-800">Profissional</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Valor</span>
                    <span className="font-medium text-gray-800">R$ 19,90/mês</span>
                  </div>

                  {user?.subscriptionEndDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Próxima cobrança</span>
                      <span className="text-gray-800">
                        {new Date(user.subscriptionEndDate).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  )}
                </div>

                {user?.subscriptionStatus === 'active' || user?.subscriptionStatus === 'trialing' ? (
                  <button
                    type="button"
                    onClick={handleManageSubscription}
                    disabled={managingSubscription}
                    className="w-full mt-4 py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    {managingSubscription ? 'Carregando...' : 'Gerenciar Assinatura'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => router.push('/pricing')}
                    className="w-full mt-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-bold"
                  >
                    Assinar Agora
                  </button>
                )}
              </div>

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
                    type="button"
                    onClick={downloadQRCode}
                    className="flex-1 flex items-center justify-center gap-2 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Salvar
                  </button>
                  <button
                    type="button"
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
                  {!editingEstablishment && (
                    <button
                      type="button"
                      onClick={handleEditEstablishment}
                      className="text-indigo-500 hover:text-indigo-600 text-sm font-medium flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Editar
                    </button>
                  )}
                </div>

                {!editingEstablishment ? (
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
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">Nome</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full p-3 border border-gray-200 rounded-xl focus:border-indigo-400 focus:outline-none"
                        placeholder="Nome do estabelecimento"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">Slug</label>
                      <input
                        type="text"
                        value={selectedEstablishment?.slug}
                        disabled
                        className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500 mt-1">O slug não pode ser alterado</p>
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">Email de Alerta</label>
                      <input
                        type="email"
                        value={editAlertEmail}
                        onChange={(e) => setEditAlertEmail(e.target.value)}
                        className="w-full p-3 border border-gray-200 rounded-xl focus:border-indigo-400 focus:outline-none"
                        placeholder="email@exemplo.com"
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        disabled={savingEstablishment}
                        className="flex-1 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveEstablishment}
                        disabled={savingEstablishment}
                        className={`flex-1 py-3 rounded-xl font-bold text-white transition-colors ${
                          savingEstablishment ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
                        }`}
                      >
                        {savingEstablishment ? 'Salvando...' : 'Salvar'}
                      </button>
                    </div>

                    {establishmentSaveMessage && (
                      <p className={`text-sm font-medium ${
                        establishmentSaveMessage.startsWith('✓')
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        {establishmentSaveMessage}
                      </p>
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
                    savingGoogleSettings ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  {savingGoogleSettings ? 'Salvando...' : 'Salvar configurações'}
                </button>
                {googleSaveMessage && (
                  <p className={`text-sm mt-3 font-medium ${
                    googleSaveMessage.startsWith('✓')
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}>
                    {googleSaveMessage}
                  </p>
                )}
              </div>
            </div>

            {/* Right Column - Feedbacks */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <h3 className="font-bold text-gray-800">Feedbacks em Tempo Real</h3>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
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
                      type="button"
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
