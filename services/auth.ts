import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';

import { supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

export const ensureProfileExists = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { data: existingProfile } =
    await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

  if (existingProfile) return;

  const { error } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
  
      full_name:
        user.user_metadata?.full_name || '',
  
      avatar_url:
        user.user_metadata?.avatar_url || '',
  
      email:
        user.email || '',
  
      last_processed_month:
        new Date().getMonth() + 1,
  
      last_processed_year:
        new Date().getFullYear(),
  
      reward_pending: false,
    });

    if (error) {
      console.log(
        'Profile Creation Error Full:',
        JSON.stringify(error, null, 2)
      );
      return;
    } else {
    console.log('Profile Created');
  }
};

const routeUser = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { data: profile } =
    await supabase
      .from('profiles')
      .select(
        'onboarding_completed'
      )
      .eq('id', user.id)
      .single();

  if (
    profile?.onboarding_completed
  ) {
    router.replace('/(tabs)');
  } else {
    router.replace('/user-type');
  }
};

export const signInWithGoogle = async () => {
  const { data, error } =
    await supabase.auth.signInWithOAuth({
      provider: 'google',

      options: {
        redirectTo: 'spenwyse://auth',

        skipBrowserRedirect: true,
      },
    });

  if (error || !data?.url) {
    console.log('OAuth Error:', error);

    return;
  }

  const result =
    await WebBrowser.openAuthSessionAsync(
      data.url,
      'spenwyse://auth'
    );

  if (result.type !== 'success') return;

  const url = result.url;

  // PKCE FLOW
  const code =
    url.match(/code=([^&]+)/)?.[1];

  if (code) {
    const {
      error: exchangeError,
    } =
      await supabase.auth.exchangeCodeForSession(
        code
      );

    if (exchangeError) {
      console.log(
        'Exchange Error:',
        exchangeError
      );

      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    console.log(
      'Session after exchange:',
      session ? 'EXISTS' : 'NULL'
    );

    await ensureProfileExists();

await routeUser();

    return;
  }

  // TOKEN FALLBACK FLOW
  const accessToken =
    url.match(/access_token=([^&]+)/)?.[1];

  const refreshToken =
    url.match(/refresh_token=([^&]+)/)?.[1];

  if (!accessToken || !refreshToken) {
    console.log(
      'No tokens or code found in redirect URL'
    );

    return;
  }

  const {
    error: sessionError,
  } = await supabase.auth.setSession({
    access_token: accessToken,

    refresh_token: refreshToken,
  });

  if (sessionError) {
    console.log(
      'Session Error:',
      sessionError
    );

    return;
  }

  await ensureProfileExists();

await routeUser();
};