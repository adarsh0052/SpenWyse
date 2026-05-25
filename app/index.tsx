import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Redirect, Href } from 'expo-router'; // Fixes Redirect path errors
import Svg, { Path, Circle as SvgCircle, Line } from 'react-native-svg';
import Animated, { 
  useSharedValue, 
  useAnimatedProps, 
  withTiming, 
  withSequence, 
  withDelay, 
  FadeIn,
  interpolateColor
} from 'react-native-reanimated';

// Create animated component for SVG Circle
const AnimatedCircle = Animated.createAnimatedComponent(SvgCircle);

export default function Index() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withSequence(
      withDelay(500, withTiming(1, { duration: 500 })),
      withDelay(200, withTiming(2, { duration: 500 })),
      withDelay(200, withTiming(3, { duration: 500 }))
    );

    const checkAuth = async () => {
      await new Promise(resolve => setTimeout(resolve, 2500));
      setIsLoggedIn(false);
    };
    checkAuth();
  }, []);

  if (isLoggedIn === null) {
    return (
      <View style={styles.container}>
        <Svg height="200" width="100%" style={styles.topWave}>
          <Path d="M0 0 L 0 100 C 150 150, 300 50, 450 100 C 600 150, 750 50, 900 100 L 900 0 Z" fill="#166534" opacity="0.05" />
        </Svg>

        <Animated.View entering={FadeIn.duration(800)} style={styles.content}>
          <View style={styles.logoBox}><Text style={styles.logoMain}>SW</Text></View>
          <Text style={styles.brandName}>SpenWyse</Text>
          <Text style={styles.tagline}>Track Smarter. Spend Wiser.</Text>
        </Animated.View>

        <View style={styles.bottomSection}>
          <Svg height="60" width="300">
            <Line x1="40" y1="30" x2="260" y2="30" stroke="#E2E8F0" strokeWidth="2" strokeDasharray="6 6" />
            <StepCircle index={1} progress={progress} cx={40} />
            <StepCircle index={2} progress={progress} cx={150} />
            <StepCircle index={3} progress={progress} cx={260} />
          </Svg>
          <Text style={styles.footerText}>Securely Synching Data...</Text>
        </View>
      </View>
    );
  }

  // Use Href type to fix router errors
  return isLoggedIn ? <Redirect href="/tabs" /> : <Redirect href="/auth"/>;
}

const StepCircle = ({ index, progress, cx }: any) => {
  const animatedProps = useAnimatedProps(() => ({
    fill: interpolateColor(progress.value, [index - 1, index], ['#CBD5E1', '#166534'])
  }));
  return <AnimatedCircle cx={cx} cy="30" r="8" animatedProps={animatedProps} />;
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  topWave: { position: 'absolute', top: 0 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoBox: { width: 140, height: 140, borderRadius: 40, backgroundColor: '#166534', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  logoMain: { fontSize: 64, fontWeight: '800', color: '#FFFFFF' },
  brandName: { fontSize: 36, fontWeight: '800', color: '#0F172A' },
  tagline: { fontSize: 14, color: '#64748B', marginTop: 5 },
  bottomSection: { alignItems: 'center', paddingBottom: 60 },
  footerText: { fontSize: 12, color: '#94A3B8', marginTop: 10 }
});