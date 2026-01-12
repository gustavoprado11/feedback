import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
export interface User {
  id: string;
  email: string;
  password: string;
  created_at: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  subscription_status?: string;
  subscription_end_date?: string;
}

export interface Establishment {
  id: string;
  name: string;
  slug: string;
  alert_email: string;
  google_review_url: string | null;
  show_google_review_prompt: boolean;
  weekly_reports_enabled: boolean;
  user_id: string;
  created_at: string;
}

export interface Feedback {
  id: string;
  rating: 'bad' | 'okay' | 'great';
  comment?: string;
  establishment_id: string;
  created_at: string;
}

// User operations
export async function createUser(email: string, hashedPassword: string): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .insert({ email, password: hashedPassword })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error) return null;
  return data;
}

export async function findUserById(id: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data;
}

export async function updateUserSubscription(
  userId: string,
  subscriptionData: {
    stripe_customer_id?: string;
    stripe_subscription_id?: string;
    subscription_status?: string;
    subscription_end_date?: string;
  }
): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .update(subscriptionData)
    .eq('id', userId)
    .select()
    .single();

  if (error) return null;
  return data;
}

// Establishment operations
export async function createEstablishment(data: {
  name: string;
  slug: string;
  alert_email: string;
  user_id: string;
}): Promise<Establishment> {
  const { data: establishment, error } = await supabase
    .from('establishments')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return establishment;
}

export async function findEstablishmentBySlug(slug: string): Promise<Establishment | null> {
  const { data, error } = await supabase
    .from('establishments')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) return null;
  return data;
}

export async function findEstablishmentById(id: string): Promise<Establishment | null> {
  const { data, error } = await supabase
    .from('establishments')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data;
}

export async function findEstablishmentsByUserId(userId: string): Promise<Establishment[]> {
  const { data, error } = await supabase
    .from('establishments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) return [];
  return data || [];
}

export async function updateEstablishment(
  id: string,
  updates: Partial<Establishment>
): Promise<Establishment | null> {
  const { data, error } = await supabase
    .from('establishments')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return null;
  return data;
}

// Feedback operations
export async function createFeedback(data: {
  rating: 'bad' | 'okay' | 'great';
  comment?: string;
  establishment_id: string;
}): Promise<Feedback> {
  const { data: feedback, error } = await supabase
    .from('feedbacks')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return feedback;
}

export async function findFeedbacksByEstablishmentId(
  establishmentId: string,
  options?: { days?: number; rating?: string }
): Promise<Feedback[]> {
  let query = supabase
    .from('feedbacks')
    .select('*')
    .eq('establishment_id', establishmentId)
    .order('created_at', { ascending: false });

  if (options?.days) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - options.days);
    query = query.gte('created_at', cutoff.toISOString());
  }

  if (options?.rating) {
    query = query.eq('rating', options.rating);
  }

  const { data, error } = await query;

  if (error) return [];
  return data || [];
}

export async function getFeedbackStats(establishmentId: string): Promise<{
  total: number;
  happiness: number;
  issues: number;
}> {
  const feedbacks = await findFeedbacksByEstablishmentId(establishmentId);
  const total = feedbacks.length;
  const positive = feedbacks.filter(f => f.rating === 'great').length;
  const negative = feedbacks.filter(f => f.rating === 'bad').length;

  return {
    total,
    happiness: total > 0 ? Math.round((positive / total) * 100) : 0,
    issues: negative,
  };
}
