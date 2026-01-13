'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/9B628qgT21XT2KYfcIfw400';

interface User {
  id: string;
  email: string;
  subscriptionStatus?: string;
}

function SubscribeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [autoRedirectCountdown, setAutoRedirectCountdown] = useState(0);

  const isAutoRedirect = searchParams.get('auto') === 'true';

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          const userData = {
            id: data.user.id,
            email: data.user.email,
            subscriptionStatus: data.user.subscriptionStatus,
          };
          setUser(userData);

          // If user already has active subscription, redirect to dashboard
          if (userData.subscriptionStatus === 'active' || userData.subscriptionStatus === 'trialing') {
            router.push('/dashboard');
          } else if (isAutoRedirect) {
            // Start countdown for auto-redirect
            setAutoRedirectCountdown(3);
          }
        } else {
          router.push('/login?redirect=/subscribe');
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        router.push('/login?redirect=/subscribe');
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [router, isAutoRedirect]);

  // Auto-redirect countdown
  useEffect(() => {
    if (autoRedirectCountdown > 0) {
      const timer = setTimeout(() => {
        setAutoRedirectCountdown(autoRedirectCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (autoRedirectCountdown === 0 && isAutoRedirect && !loading && user) {
      handleSubscribe();
    }
  }, [autoRedirectCountdown, isAutoRedirect, loading, user]);

  const handleSubscribe = () => {
    // Open Stripe payment link in the same window
    window.location.href = STRIPE_PAYMENT_LINK;

    // Start checking for payment completion
    setCheckingPayment(true);
    startPaymentCheck();
  };

  const startPaymentCheck = () => {
    // Poll the API every 3 seconds to check if payment was completed
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user.subscriptionStatus === 'active' || data.user.subscriptionStatus === 'trialing') {
            clearInterval(interval);
            setCheckingPayment(false);
            router.push('/dashboard?payment=success');
          }
        }
      } catch (error) {
        console.error('Error checking payment:', error);
      }
    }, 3000);

    // Stop checking after 5 minutes
    setTimeout(() => {
      clearInterval(interval);
      setCheckingPayment(false);
    }, 300000);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  const isRenewal = user?.subscriptionStatus === 'canceled' || user?.subscriptionStatus === 'past_due';

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold text-gray-800 mb-4">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 3 .97 4.29L2 22l5.71-.97C9 21.64 10.46 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.38 0-2.68-.28-3.88-.78l-.28-.12-2.9.49.49-2.9-.12-.28C4.78 14.68 4.5 13.38 4.5 12c0-4.14 3.36-7.5 7.5-7.5s7.5 3.36 7.5 7.5-3.36 7.5-7.5 7.5z"/>
              </svg>
            </div>
            Diz Aí
          </Link>

          <div className="flex items-center justify-center gap-4 mt-4">
            <span className="text-gray-600 text-sm">{user?.email}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              Sair
            </button>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-12">
          {/* Status Badge */}
          {isRenewal && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-amber-800 font-medium">
                  {user?.subscriptionStatus === 'canceled'
                    ? 'Sua assinatura foi cancelada'
                    : 'Pagamento pendente'}
                </p>
              </div>
            </div>
          )}

          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
              {isRenewal ? 'Renovar Assinatura' : 'Assine para Começar'}
            </h1>
            <p className="text-gray-600 text-lg">
              {isRenewal
                ? 'Renove sua assinatura para continuar usando o Diz Aí'
                : 'Complete seu cadastro assinando o plano para acessar todas as funcionalidades'}
            </p>
          </div>

          {/* Plan Details */}
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-8 text-white mb-8">
            <div className="text-center mb-6">
              <div className="inline-block px-4 py-1 bg-white/20 rounded-full text-sm font-medium mb-4">
                Plano Profissional
              </div>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-5xl font-bold">R$ 19,90</span>
                <span className="text-xl opacity-90">/mês</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <p className="font-semibold">Estabelecimentos ilimitados</p>
                  <p className="text-sm opacity-90">Cadastre quantos locais precisar</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <p className="font-semibold">Feedbacks em tempo real</p>
                  <p className="text-sm opacity-90">Receba alertas instantâneos por email</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <p className="font-semibold">QR Codes personalizados</p>
                  <p className="text-sm opacity-90">Para cada estabelecimento</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <p className="font-semibold">Integração com Google Reviews</p>
                  <p className="text-sm opacity-90">Encaminhe clientes satisfeitos para o Google</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <p className="font-semibold">Relatórios semanais</p>
                  <p className="text-sm opacity-90">Resumo automático por email</p>
                </div>
              </div>
            </div>
          </div>

          {/* Auto-redirect Notice */}
          {autoRedirectCountdown > 0 && (
            <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-500 border-t-transparent"></div>
                <p className="text-indigo-800 font-medium">
                  Redirecionando para o pagamento em {autoRedirectCountdown} segundo{autoRedirectCountdown > 1 ? 's' : ''}...
                </p>
              </div>
            </div>
          )}

          {/* CTA Button */}
          <button
            type="button"
            onClick={handleSubscribe}
            disabled={checkingPayment || autoRedirectCountdown > 0}
            className={`
              w-full py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105
              ${checkingPayment || autoRedirectCountdown > 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg hover:shadow-xl'
              }
            `}
          >
            {checkingPayment ? 'Aguardando confirmação...' : autoRedirectCountdown > 0 ? 'Redirecionando...' : isRenewal ? 'Renovar Assinatura' : 'Assinar Agora'}
          </button>

          {checkingPayment && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
                <p className="text-blue-800 text-sm">
                  Aguardando confirmação do pagamento. Você será redirecionado automaticamente quando o pagamento for aprovado.
                </p>
              </div>
            </div>
          )}

          {/* Security Info */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Pagamento seguro processado pelo Stripe</span>
            </div>
            <p className="text-center text-xs text-gray-400 mt-2">
              Cancele a qualquer momento sem multas
            </p>
          </div>
        </div>

        {/* Help Text */}
        <div className="text-center mt-6">
          <p className="text-gray-600 text-sm">
            Precisa de ajuda? Entre em contato pelo email de cadastro
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SubscribePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    }>
      <SubscribeContent />
    </Suspense>
  );
}
