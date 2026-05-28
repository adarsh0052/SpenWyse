import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';
import { supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
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

  const result = await WebBrowser.openAuthSessionAsync(
    data.url,
    'spenwyse://auth'
  );

  if (result.type !== 'success') return;

  const url = result.url;

  // PKCE flow → exchange the code for a session
  const code = url.match(/code=([^&]+)/)?.[1];

  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.log('Exchange Error:', exchangeError);
      return;
    }

    
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Session after exchange:', session ? 'EXISTS' : 'NULL');

    router.replace('/user-type');
    return;
  }

  
  const accessToken = url.match(/access_token=([^&]+)/)?.[1];
  const refreshToken = url.match(/refresh_token=([^&]+)/)?.[1];

  if (!accessToken || !refreshToken) {
    console.log('No tokens or code found in redirect URL');
    return;
  }

  const { error: sessionError } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (sessionError) {
    console.log('Session Error:', sessionError);
    return;
  }

  router.replace('/user-type');
};