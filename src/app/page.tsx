import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 3 .97 4.29L2 22l5.71-.97C9 21.64 10.46 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.38 0-2.68-.28-3.88-.78l-.28-.12-2.9.49.49-2.9-.12-.28C4.78 14.68 4.5 13.38 4.5 12c0-4.14 3.36-7.5 7.5-7.5s7.5 3.36 7.5 7.5-3.36 7.5-7.5 7.5z"/>
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-800">Diz Aí</span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-gray-600 hover:text-gray-800 font-medium"
            >
              Entrar
            </Link>
            <Link
              href="/register?plan=true"
              className="px-4 py-2 bg-indigo-500 text-white font-medium rounded-xl hover:bg-indigo-600 transition-colors"
            >
              Assinar - R$ 19,90/mês
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main>
        <section className="py-20 px-4 relative overflow-hidden">
          {/* Animated Feedback Notifications */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Notification 1 - Top Left */}
            <div className="absolute top-20 left-10 animate-fade-in-up opacity-0" style={{ animationDelay: '0s', animationDuration: '3s', animationIterationCount: 'infinite' }}>
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 max-w-xs">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-800">Ótimo</span>
                      <span className="text-xs text-gray-400">agora</span>
                    </div>
                    <p className="text-xs text-gray-600">Adorei o atendimento!</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Notification 2 - Top Right */}
            <div className="absolute top-32 right-10 animate-fade-in-up opacity-0" style={{ animationDelay: '2s', animationDuration: '3s', animationIterationCount: 'infinite' }}>
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 max-w-xs">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 17.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5 1.5.67 1.5 1.5 1.5zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-800">Ok</span>
                      <span className="text-xs text-gray-400">agora</span>
                    </div>
                    <p className="text-xs text-gray-600">Pode melhorar</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Notification 3 - Bottom Left */}
            <div className="absolute bottom-32 left-20 animate-fade-in-up opacity-0" style={{ animationDelay: '4s', animationDuration: '3s', animationIterationCount: 'infinite' }}>
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 max-w-xs">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-800">Ótimo</span>
                      <span className="text-xs text-gray-400">agora</span>
                    </div>
                    <p className="text-xs text-gray-600">Ambiente perfeito!</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Notification 4 - Middle Right */}
            <div className="absolute top-1/2 right-5 animate-fade-in-up opacity-0" style={{ animationDelay: '6s', animationDuration: '3s', animationIterationCount: 'infinite' }}>
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 max-w-xs">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-800">Ruim</span>
                      <span className="text-xs text-gray-400">agora</span>
                    </div>
                    <p className="text-xs text-gray-600">Demora no atendimento</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Notification 5 - Bottom Right */}
            <div className="absolute bottom-20 right-32 animate-fade-in-up opacity-0" style={{ animationDelay: '8s', animationDuration: '3s', animationIterationCount: 'infinite' }}>
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 max-w-xs">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-800">Ótimo</span>
                      <span className="text-xs text-gray-400">agora</span>
                    </div>
                    <p className="text-xs text-gray-600">Comida deliciosa!</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Notification 6 - Middle Left */}
            <div className="absolute top-1/2 left-5 animate-fade-in-up opacity-0" style={{ animationDelay: '10s', animationDuration: '3s', animationIterationCount: 'infinite' }}>
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 max-w-xs">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 17.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5 1.5.67 1.5 1.5 1.5zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-800">Ok</span>
                      <span className="text-xs text-gray-400">agora</span>
                    </div>
                    <p className="text-xs text-gray-600">Preço justo</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h1 className="text-4xl md:text-5xl font-black text-gray-800 mb-6 leading-tight">
              Feedback dos seus clientes em <span className="text-indigo-500 whitespace-nowrap">30 segundos</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Colete feedback de forma rápida, anônima e privada via QR Code.
              Convide clientes satisfeitos para o Google Reviews e receba relatórios semanais por e-mail.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
              <Link
                href="/register?plan=true"
                className="inline-block px-8 py-4 bg-indigo-500 text-white font-bold text-lg rounded-xl hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-200"
              >
                Começar Agora - R$ 19,90/mês
              </Link>
              <Link
                href="/register?plan=true"
                className="inline-block px-8 py-4 bg-white text-indigo-500 font-bold text-lg rounded-xl hover:bg-gray-50 transition-colors border-2 border-indigo-500"
              >
                Ver Detalhes do Plano
              </Link>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-800 text-center mb-12">
              Como Funciona
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">1. Gere seu QR Code</h3>
                <p className="text-gray-600">
                  Cadastre seu estabelecimento e receba um QR Code único para imprimir ou exibir.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">2. Cliente escaneia</h3>
                <p className="text-gray-600">
                  O cliente escaneia o QR Code e dá sua opinião em menos de 30 segundos, sem cadastro.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">3. Receba alertas</h3>
                <p className="text-gray-600">
                  Veja todos os feedbacks no seu painel e receba alertas instantâneos sobre problemas.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-800 text-center mb-12">
              Por que usar Diz Aí?
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-gray-100">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 mb-1">100% Anônimo</h3>
                    <p className="text-gray-600 text-sm">
                      Clientes dão opiniões honestas porque não precisam se identificar.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-100">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 mb-1">Super Rápido</h3>
                    <p className="text-gray-600 text-sm">
                      Menos de 30 segundos para o cliente deixar seu feedback.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-100">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 mb-1">Alertas em Tempo Real</h3>
                    <p className="text-gray-600 text-sm">
                      Seja notificado imediatamente sobre feedbacks negativos.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-100">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 mb-1">Privado</h3>
                    <p className="text-gray-600 text-sm">
                      Feedback visível apenas para você. Sem exposição pública.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-100">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 mb-1">Convite para Google Reviews</h3>
                    <p className="text-gray-600 text-sm">
                      Clientes satisfeitos são automaticamente convidados a avaliar no Google.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-100">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 mb-1">Relatórios Semanais</h3>
                    <p className="text-gray-600 text-sm">
                      Receba por e-mail um resumo dos principais feedbacks da semana.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-4 bg-indigo-500">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Pronto para ouvir seus clientes?
            </h2>
            <p className="text-indigo-100 mb-8">
              Por apenas R$ 19,90/mês, veja a diferença que o feedback em tempo real pode fazer.
            </p>
            <Link
              href="/register?plan=true"
              className="inline-block px-8 py-4 bg-white text-indigo-500 font-bold text-lg rounded-xl hover:bg-gray-100 transition-colors"
            >
              Assinar Agora - R$ 19,90/mês
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-6 h-6 bg-indigo-500 rounded flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 3 .97 4.29L2 22l5.71-.97C9 21.64 10.46 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.38 0-2.68-.28-3.88-.78l-.28-.12-2.9.49.49-2.9-.12-.28C4.78 14.68 4.5 13.38 4.5 12c0-4.14 3.36-7.5 7.5-7.5s7.5 3.36 7.5 7.5-3.36 7.5-7.5 7.5z"/>
              </svg>
            </div>
            <span className="font-bold text-gray-800">Diz Aí</span>
          </div>
          <p className="text-gray-500 text-sm">
            Feedback simples para estabelecimentos. Feito com carinho.
          </p>
        </div>
      </footer>
    </div>
  );
}
