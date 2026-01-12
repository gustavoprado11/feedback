import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendWeeklyReport, type WeeklyReportData } from '@/lib/email';

export async function POST(request: Request) {
  console.log('[TEST-WEEKLY-REPORT] Starting request...');

  try {
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('[TEST-WEEKLY-REPORT] Error parsing JSON:', parseError);
      return NextResponse.json(
        {
          error: 'Invalid JSON in request body',
          details: 'Please send a valid JSON with {"establishmentId": "your-id"}'
        },
        { status: 400 }
      );
    }

    const { establishmentId } = body;
    console.log('[TEST-WEEKLY-REPORT] Establishment ID:', establishmentId);

    if (!establishmentId) {
      return NextResponse.json(
        {
          error: 'establishmentId is required',
          example: { establishmentId: 'uuid-here' }
        },
        { status: 400 }
      );
    }

    // Get establishment details
    console.log('[TEST-WEEKLY-REPORT] Fetching establishment from database...');
    const { data: establishment, error: estError } = await supabase
      .from('establishments')
      .select('id, name, alert_email')
      .eq('id', establishmentId)
      .single();

    if (estError) {
      console.error('[TEST-WEEKLY-REPORT] Database error:', estError);
      return NextResponse.json(
        {
          error: 'Database error',
          details: estError.message
        },
        { status: 500 }
      );
    }

    if (!establishment) {
      console.log('[TEST-WEEKLY-REPORT] Establishment not found');
      return NextResponse.json(
        { error: 'Establishment not found with the provided ID' },
        { status: 404 }
      );
    }

    console.log('[TEST-WEEKLY-REPORT] Found establishment:', establishment.name);
    console.log('[TEST-WEEKLY-REPORT] Alert email:', establishment.alert_email);

    // Calculate date ranges
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    console.log('[TEST-WEEKLY-REPORT] Fetching feedbacks from:', oneWeekAgo.toISOString());

    // Get feedbacks from last week
    const { data: weekFeedbacks, error: weekError } = await supabase
      .from('feedbacks')
      .select('rating, comment, created_at')
      .eq('establishment_id', establishment.id)
      .gte('created_at', oneWeekAgo.toISOString())
      .order('created_at', { ascending: false });

    if (weekError) {
      console.error('[TEST-WEEKLY-REPORT] Error fetching feedbacks:', weekError);
      return NextResponse.json(
        {
          error: 'Error fetching feedbacks',
          details: weekError.message
        },
        { status: 500 }
      );
    }

    console.log('[TEST-WEEKLY-REPORT] Found', weekFeedbacks?.length || 0, 'feedbacks from last week');

    // Get feedbacks from previous week for comparison
    const { data: prevWeekFeedbacks } = await supabase
      .from('feedbacks')
      .select('rating')
      .eq('establishment_id', establishment.id)
      .gte('created_at', twoWeeksAgo.toISOString())
      .lt('created_at', oneWeekAgo.toISOString());

    console.log('[TEST-WEEKLY-REPORT] Found', prevWeekFeedbacks?.length || 0, 'feedbacks from previous week');

    // Calculate stats
    const totalFeedbacks = weekFeedbacks?.length || 0;
    const badCount = weekFeedbacks?.filter(f => f.rating === 'bad').length || 0;
    const okayCount = weekFeedbacks?.filter(f => f.rating === 'okay').length || 0;
    const greatCount = weekFeedbacks?.filter(f => f.rating === 'great').length || 0;
    const previousWeekTotal = prevWeekFeedbacks?.length || 0;

    console.log('[TEST-WEEKLY-REPORT] Stats:', { totalFeedbacks, badCount, okayCount, greatCount, previousWeekTotal });

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

    console.log('[TEST-WEEKLY-REPORT] Negative feedbacks with comments:', negativeFeedbacks.length);
    console.log('[TEST-WEEKLY-REPORT] Positive feedbacks with comments:', positiveFeedbacks.length);

    // Check if there are any feedbacks to report
    if (totalFeedbacks === 0) {
      console.log('[TEST-WEEKLY-REPORT] No feedbacks found, but sending test email anyway');
    }

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
    console.log('[TEST-WEEKLY-REPORT] Sending email to:', establishment.alert_email);

    try {
      await sendWeeklyReport(establishment.alert_email, reportData);
      console.log('[TEST-WEEKLY-REPORT] Email sent successfully!');
    } catch (emailError: any) {
      console.error('[TEST-WEEKLY-REPORT] Error sending email:', emailError);
      return NextResponse.json(
        {
          error: 'Error sending email',
          details: emailError.message || 'Unknown email error',
          smtpConfigured: !!(process.env.SMTP_USER && process.env.SMTP_PASS)
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Test report sent successfully! Check your inbox.',
      data: {
        establishmentName: establishment.name,
        alertEmail: establishment.alert_email,
        dateRange: {
          from: oneWeekAgo.toISOString(),
          to: now.toISOString(),
        },
        stats: {
          totalFeedbacks,
          badCount,
          okayCount,
          greatCount,
          previousWeekTotal,
          negativeFeedbacksWithComments: negativeFeedbacks.length,
          positiveFeedbacksWithComments: positiveFeedbacks.length,
        },
      },
    });

  } catch (error: any) {
    console.error('[TEST-WEEKLY-REPORT] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message || 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
