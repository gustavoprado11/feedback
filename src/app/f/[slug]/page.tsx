'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

type Rating = 'bad' | 'okay' | 'great' | null;

interface Establishment {
  id: string;
  name: string;
  slug: string;
}

export default function FeedbackPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [establishment, setEstablishment] = useState<Establishment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRating, setSelectedRating] = useState<Rating>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function fetchEstablishment() {
      try {
        const res = await fetch(`/api/public/establishment/${slug}`);
        if (res.ok) {
          const data = await res.json();
          setEstablishment(data.establishment);
        } else {
          setError('Estabelecimento não encontrado');
        }
      } catch {
        setError('Erro ao carregar página');
      } finally {
        setLoading(false);
      }
    }
    fetchEstablishment();
  }, [slug]);

  const handleSubmit = async () => {
    if (!selectedRating) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: selectedRating,
          comment: comment.trim() || undefined,
          establishmentSlug: slug,
        }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        setError('Erro ao enviar feedback');
      }
    } catch {
      setError('Erro ao enviar feedback');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !establishment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">404</div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">
            Página não encontrada
          </h1>
          <p className="text-gray-600">
            O link do QR Code pode estar incorreto.
          </p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#f0fdf4] flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <div className="w-16 h-16 bg-green-200 rounded-full flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-green-600"
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
              </div>
            </div>
          </div>
          <h1 className="text-3xl font-black text-gray-800 mb-4">
            Obrigado!
          </h1>
          <p className="text-gray-600 max-w-xs mx-auto">
            Seu feedback ajuda {establishment.name} a melhorar. Agradecemos seu tempo.
          </p>
        </div>
        <footer className="absolute bottom-6 text-sm text-gray-500">
          Powered by <span className="text-indigo-500 font-semibold">Diz Aí</span>
        </footer>
      </div>
    );
  }

  const ratings = [
    {
      value: 'bad' as const,
      label: 'Ruim',
      icon: (
        <svg viewBox="0 0 24 24" className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 15s1.5-2 4-2 4 2 4 2" />
          <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="3" strokeLinecap="round" />
          <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="3" strokeLinecap="round" />
        </svg>
      ),
      selectedClass: 'border-red-400 bg-red-50 text-red-500',
    },
    {
      value: 'okay' as const,
      label: 'Ok',
      icon: (
        <svg viewBox="0 0 24 24" className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="8" y1="15" x2="16" y2="15" />
          <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="3" strokeLinecap="round" />
          <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="3" strokeLinecap="round" />
        </svg>
      ),
      selectedClass: 'border-amber-400 bg-amber-50 text-amber-500',
    },
    {
      value: 'great' as const,
      label: 'Ótimo',
      icon: (
        <svg viewBox="0 0 24 24" className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 14s1.5 2 4 2 4-2 4-2" />
          <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="3" strokeLinecap="round" />
          <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="3" strokeLinecap="round" />
        </svg>
      ),
      selectedClass: 'border-green-400 bg-green-50 text-green-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-black text-gray-800 mb-1">
              Como foi sua experiência em
            </h1>
            <h2 className="text-2xl md:text-3xl font-black text-indigo-500">
              {establishment.name}?
            </h2>
            <p className="text-gray-500 mt-3">
              Selecione uma avaliação abaixo.
            </p>
          </div>

          <div className="flex gap-4 justify-center mb-8">
            {ratings.map((rating) => (
              <button
                key={rating.value}
                onClick={() => setSelectedRating(rating.value)}
                className={`
                  flex flex-col items-center justify-center p-4 w-28 h-28 rounded-2xl border-2 transition-all
                  ${
                    selectedRating === rating.value
                      ? rating.selectedClass
                      : 'border-gray-200 bg-white text-gray-400 hover:border-gray-300'
                  }
                `}
              >
                {rating.icon}
                <span className="mt-2 font-medium text-sm">
                  {rating.label}
                </span>
              </button>
            ))}
          </div>

          {selectedRating && (
            <div className="animate-fadeIn">
              <label className="block text-gray-700 font-medium mb-2">
                Algo mais? (Opcional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Conte o que podemos melhorar..."
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-indigo-400 focus:outline-none resize-none h-32 text-gray-700"
                maxLength={500}
              />
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className={`
                  w-full mt-4 py-4 rounded-xl font-bold text-white text-lg transition-all
                  ${
                    submitting
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-indigo-500 hover:bg-indigo-600 active:scale-98 shadow-lg shadow-indigo-200'
                  }
                `}
              >
                {submitting ? 'Enviando...' : 'Enviar Feedback'}
              </button>
            </div>
          )}
        </div>
      </main>

      <footer className="py-4 text-center text-sm text-gray-500">
        Powered by <span className="text-indigo-500 font-semibold">Diz Aí</span>
      </footer>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .active\\:scale-98:active {
          transform: scale(0.98);
        }
      `}</style>
    </div>
  );
}
