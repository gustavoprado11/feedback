import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendWeeklyReport } from '@/lib/email';

// This endpoint should be called by a cron job (e.g., Vercel Cron)
// Recommended: Run every Monday at 9:00 AM

export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get all establishments with weekly reports enabled
    const { data: establishments, error: estError } = await supabase
      .from('establishments')
      .select('*')
      .eq('weekly_report_enabled', true);

    if (estError) {
      throw estError;
    }

    if (!establishments || establishments.length === 0) {
      return NextResponse.json({ message: 'No establishments with weekly reports enabled' });
    }

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const results = [];

    for (const establishment of establishments) {
      try {
        // Get feedbacks from the last 7 days
        const { data: currentFeedbacks, error: feedbackError } = await supabase
          .from('feedbacks')
          .select('*')
          .eq('establishment_id', establishment.id)
          .gte('created_at', weekAgo.toISOString())
          .order('created_at', { ascending: false });

        if (feedbackError) {
          console.error(`Error fetching feedbacks for ${establishment.name}:`, feedbackError);
          continue;
        }

        // Get feedbacks from the previous week for comparison
        const { data: previousFeedbacks } = await supabase
          .from('feedbacks')
          .select('*')
          .eq('establishment_id', establishment.id)
          .gte('created_at', twoWeeksAgo.toISOString())
          .lt('created_at', weekAgo.toISOString());

        const feedbacks = currentFeedbacks || [];
        const prevFeedbacks = previousFeedbacks || [];

        // Calculate stats
        const totalFeedbacks = feedbacks.length;
        const positiveFeedbacks = feedbacks.filter(f => f.rating === 'great').length;
        const neutralFeedbacks = feedbacks.filter(f => f.rating === 'okay').length;
        const negativeFeedbacks = feedbacks.filter(f => f.rating === 'bad').length;
        const happinessRate = totalFeedbacks > 0
          ? Math.round((positiveFeedbacks / totalFeedbacks) * 100)
          : 0;

        // Calculate previous week's happiness rate
        const prevTotal = prevFeedbacks.length;
        const prevPositive = prevFeedbacks.filter(f => f.rating === 'great').length;
        const previousHappinessRate = prevTotal > 0
          ? Math.round((prevPositive / prevTotal) * 100)
          : undefined;

        // Get top comments (feedbacks with comments)
        const topComments = feedbacks
          .filter(f => f.comment && f.comment.trim())
          .slice(0, 5)
          .map(f => ({
            rating: f.rating,
            comment: f.comment,
            date: new Date(f.created_at).toLocaleDateString('pt-BR'),
          }));

        // Format dates for the report
        const periodStart = weekAgo.toLocaleDateString('pt-BR');
        const periodEnd = now.toLocaleDateString('pt-BR');

        // Send the report
        await sendWeeklyReport(establishment.alert_email, {
          establishmentName: establishment.name,
          totalFeedbacks,
          positiveFeedbacks,
          neutralFeedbacks,
          negativeFeedbacks,
          happinessRate,
          previousHappinessRate,
          topComments,
          periodStart,
          periodEnd,
        });

        results.push({
          establishment: establishment.name,
          email: establishment.alert_email,
          status: 'sent',
        });
      } catch (error) {
        console.error(`Error processing ${establishment.name}:`, error);
        results.push({
          establishment: establishment.name,
          email: establishment.alert_email,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      message: 'Weekly reports processed',
      results,
    });
  } catch (error) {
    console.error('Weekly report cron error:', error);
    return NextResponse.json(
      { error: 'Failed to process weekly reports' },
      { status: 500 }
    );
  }
}
