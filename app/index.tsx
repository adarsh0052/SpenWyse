import { useEffect } from 'react';
import { router } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function Index() {
  const { session, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!session) {
      router.replace('/auth');
      return;
    }

    const isOnboarded = session.user.user_metadata?.onboarded;
    router.replace(isOnboarded ? '/(tabs)' : '/user-type');

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