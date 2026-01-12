'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function PricingPage() {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if user is authenticated
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.email) {
          setUser(data);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const checkout = searchParams.get('checkout');
    if (checkout === 'cancelled') {
      alert('Pagamento cancelado. Você pode tentar novamente quando quiser.');
    }
  }, [searchParams]);

  const handleSubscribe = async () => {
    if (!user) {
      router.push('/login?redirect=/pricing');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Erro ao iniciar checkout. Tente novamente.');
        setLoading(false);
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao processar pagamento. Tente novamente.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <Link href="/" className="text-2xl font-bold text-indigo-600 mb-8 inline-block">
            Diz Aí
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Planos e Preços
          </h1>
          <p className="text-xl text-gray-600">
            Comece a coletar feedbacks dos seus clientes hoje mesmo
          </p>
        </div>

        {/* Pricing Card */}
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-indigo-500">
            {/* Badge */}
            <div className="bg-indigo-500 text-white text-center py-3 px-4">
              <span className="font-semibold text-lg">Plano Profissional</span>
            </div>

            {/* Content */}
            <div className="p-8">
              {/* Price */}
              <div className="text-center mb-8">
                <div className="flex items-baseline justify-center mb-2">
                  <span className="text-5xl font-bold text-gray-900">R$ 19,90</span>
                  <span className="text-xl text-gray-600 ml-2">/mês</span>
                </div>
                <p className="text-gray-600">Cancele quando quiser</p>
              </div>

              {/* Features */}
              <ul className="space-y-4 mb-8">
                {[
                  'Estabelecimentos ilimitados',
                  'Feedbacks ilimitados',
                  'QR Codes personalizados',
                  'Dashboard com estatísticas',
                  'Alertas por email',
                  'Integração com Google Reviews',
                  'Relatórios semanais',
                  'Suporte prioritário',
                ].map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <svg
                      className="w-5 h-5 text-green-500 mr-3 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <button
                onClick={handleSubscribe}
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processando...' : 'Assinar Agora'}
              </button>

              {!user && (
                <p className="text-center text-sm text-gray-600 mt-4">
                  Você será direcionado para fazer login primeiro
                </p>
              )}

              {/* Security */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  🔒 Pagamento seguro processado pelo Stripe
                </p>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-8 text-center">
            <p className="text-gray-600 mb-4">
              Já tem uma conta?{' '}
              <Link href="/login" className="text-indigo-600 hover:underline font-semibold">
                Fazer login
              </Link>
            </p>
            <p className="text-sm text-gray-500">
              Ao assinar, você concorda com nossos termos de serviço
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
