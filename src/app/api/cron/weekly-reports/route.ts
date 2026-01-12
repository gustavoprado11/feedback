import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendWeeklyReport, type WeeklyReportData } from '@/lib/email';

export async function GET(request: Request) {
  try {
    // Verify this is being called by Vercel Cron or authorized source
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all establishments with active subscriptions
    const { data: establishments, error: estError } = await supabase
      .from('establishments')
      .select(`
        id,
        name,
        alert_email,
        users!inner(subscription_status)
      `)
      .eq('users.subscription_status', 'active');

    if (estError) {
      console.error('Error fetching establishments:', estError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!establishments || establishments.length === 0) {
      console.log('No active establishments found');
      return NextResponse.json({
        success: true,
        message: 'No active establishments to process',
        sent: 0
      });
    }

    // Calculate date ranges
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    let successCount = 0;
    let errorCount = 0;

    // Process each establishment
    for (const establishment of establishments) {
      try {
        // Get feedbacks from last week
        const { data: weekFeedbacks, error: weekError } = await supabase
          .from('feedbacks')
          .select('rating, comment, created_at')
          .eq('establishment_id', establishment.id)
          .gte('created_at', oneWeekAgo.toISOString())
          .order('created_at', { ascending: false });

        if (weekError) {
          console.error(`Error fetching feedbacks for ${establishment.name}:`, weekError);
          errorCount++;
          continue;
        }

        // Get feedbacks from previous week for comparison
        const { data: prevWeekFeedbacks, error: prevError } = await supabase
          .from('feedbacks')
          .select('rating')
          .eq('establishment_id', establishment.id)
          .gte('created_at', twoWeeksAgo.toISOString())
          .lt('created_at', oneWeekAgo.toISOString());

        if (prevError) {
          console.error(`Error fetching previous week feedbacks for ${establishment.name}:`, prevError);
        }

        // Calculate stats
        const totalFeedbacks = weekFeedbacks?.length || 0;
        const badCount = weekFeedbacks?.filter(f => f.rating === 'bad').length || 0;
        const okayCount = weekFeedbacks?.filter(f => f.rating === 'okay').length || 0;
        const greatCount = weekFeedbacks?.filter(f => f.rating === 'great').length || 0;
        const previousWeekTotal = prevWeekFeedbacks?.length || 0;

        // Get negative feedbacks with comments (limit to 5 most recent)
        const negativeFeedbacks = weekFeedbacks
          ?.filter(f => f.rating === 'bad' && f.comment)
          .slice(0, 5)
          .map(f => ({
            comment: f.comment!,
            created_at: f.created_at,
          })) || [];

        // Get positive feedbacks with comments (limit to 3 most recent)
        const positiveFeedbacks = weekFeedbacks
          ?.filter(f => f.rating === 'great' && f.comment)
          .slice(0, 3)
          .map(f => ({
            comment: f.comment!,
            created_at: f.created_at,
          })) || [];

        // Prepare report data
        const reportData: WeeklyReportData = {
          establishmentName: establishment.name,
          totalFeedbacks,
          badCount,
          okayCount,
          greatCount,
          negativeFeedbacks,
          positiveFeedbacks,
          previousWeekTotal,
        };

        // Send email (only if there were feedbacks this week)
        if (totalFeedbacks > 0) {
          await sendWeeklyReport(establishment.alert_email, reportData);
          successCount++;
          console.log(`Weekly report sent to ${establishment.alert_email} for ${establishment.name}`);
        } else {
          console.log(`No feedbacks for ${establishment.name}, skipping email`);
        }

      } catch (error) {
        console.error(`Error processing establishment ${establishment.name}:`, error);
        errorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Weekly reports processed',
      sent: successCount,
      errors: errorCount,
      total: establishments.length,
    });

  } catch (error) {
    console.error('Error in weekly reports cron:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
