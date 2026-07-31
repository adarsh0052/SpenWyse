import { useEffect } from 'react';
import { router } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';


export default function Index() {
  const { session, loading } = useAuth();
  useEffect(() => {
    const checkUser = async () => {
      if (loading) return;
      if (!session) {
        router.replace('/onboarding');
        return;
      }
  
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed,reward_pending')
        .eq('id', session.user.id)
        .single(); 
      if (!profile?.onboarding_completed) {
        router.replace('/user-type');
        return;
      }
      if (profile.reward_pending) {
        router.replace('/reward');
        return;
      }
      router.replace('/(tabs)');
    };

    checkUser();
  }, [session, loading]);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0F1115', 
      }}
    >
      <ActivityIndicator size="large" color="#22C55E" />
    </View>
  );
}