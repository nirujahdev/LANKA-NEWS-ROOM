import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Check if onboarding is complete
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Wait a bit for trigger to create profile
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, language, city')
          .eq('id', user.id)
          .single();

        const { data: prefs } = await supabase
          .from('user_preferences')
          .select('favourite_topics')
          .eq('user_id', user.id)
          .single();

        const isOnboardingComplete = 
          profile?.name && 
          profile?.language && 
          profile?.city && 
          prefs?.favourite_topics?.length === 3;

        if (!isOnboardingComplete) {
          return NextResponse.redirect(new URL('/onboarding', requestUrl.origin));
        }
      }
    }
  }

  return NextResponse.redirect(new URL('/', requestUrl.origin));
}

