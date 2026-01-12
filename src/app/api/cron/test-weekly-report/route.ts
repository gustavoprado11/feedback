import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendWeeklyReport, type WeeklyReportData } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { establishmentId } = await request.json();

    if (!establishmentId) {
      return NextResponse.json(
        { error: 'establishmentId is required' },
        { status: 400 }
      );
    }

    // Get establishment details
    const { data: establishment, error: estError } = await supabase
      .from('establishments')
      .select('id, name, alert_email')
      .eq('id', establishmentId)
      .single();

    if (estError || !establishment) {
      return NextResponse.json(
        { error: 'Establishment not found' },
        { status: 404 }
      );
    }

    // Calculate date ranges
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Get feedbacks from last week
    const { data: weekFeedbacks, error: weekError } = await supabase
      .from('feedbacks')
      .select('rating, comment, created_at')
      .eq('establishment_id', establishment.id)
      .gte('created_at', oneWeekAgo.toISOString())
      .order('created_at', { ascending: false });

    if (weekError) {
      console.error('Error fetching feedbacks:', weekError);
      return NextResponse.json(
        { error: 'Error fetching feedbacks' },
        { status: 500 }
      );
    }

    // Get feedbacks from previous week for comparison
    const { data: prevWeekFeedbacks } = await supabase
      .from('feedbacks')
      .select('rating')
      .eq('establishment_id', establishment.id)
      .gte('created_at', twoWeeksAgo.toISOString())
      .lt('created_at', oneWeekAgo.toISOString());

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

    // Send email
    await sendWeeklyReport(establishment.alert_email, reportData);

    return NextResponse.json({
      success: true,
      message: 'Test report sent successfully',
      data: {
        establishmentName: establishment.name,
        alertEmail: establishment.alert_email,
        stats: {
          totalFeedbacks,
          badCount,
          okayCount,
          greatCount,
          previousWeekTotal,
        },
      },
    });

  } catch (error) {
    console.error('Error in test weekly report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
