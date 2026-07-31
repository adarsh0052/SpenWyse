import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  Dimensions, 
  Animated, 
  ViewToken, 
  Image, 
  Platform 
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  image: any;
}

const SLIDES: OnboardingSlide[] = [
  {
    id: '1',
    title: 'Master your finances with confidence',
    description: 'Take charge of your spending and make smarter decisions with every rupee.',
    image: require('../assets/images/money.png'),
  },
  {
    id: '2',
    title: 'See exactly where your money flows',
    description: 'Monitor every transaction effortlessly with detailed categories and reports.',
    image: require('../assets/images/see.png'),
  },
  {
    id: '3',
    title: 'Stay prepared for what’s ahead',
    description: 'Create personalized budgets and stay in control of your financial goals.',
    image: require('../assets/images/prepared.png'),
  },
];

export default function Onboarding() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef<FlatList>(null);
  const router = useRouter();
  const { session } = useAuth();

  useEffect(() => {
    if (session) {
      router.replace('/');
    }
  }, [session]);
  
  const viewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        
        <FlatList
          data={SLIDES}
          renderItem={({ item }) => (
            <View style={styles.slide}>
              <View style={styles.illustrationContainer}>
                <Image 
                  source={item.image} 
                  style={styles.image} 
                  resizeMode="contain"
                />
              </View>
              
              <View style={styles.textContainer}>
                <Text style={styles.heading}>{item.title}</Text>
                <Text style={styles.subHeading}>{item.description}</Text>
              </View>
            </View>
          )}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          bounces={false}
          keyExtractor={(item) => item.id}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          onViewableItemsChanged={viewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          ref={slidesRef}
        />

        <View style={styles.pagination}>
          {SLIDES.map((_, i) => {
            const dotWidth = scrollX.interpolate({
              inputRange: [(i - 1) * width, i * width, (i + 1) * width],
              outputRange: [8, 24, 8],
              extrapolate: 'clamp',
            });
            
            const opacity = scrollX.interpolate({
              inputRange: [(i - 1) * width, i * width, (i + 1) * width],
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });

            return (
              <Animated.View 
                style={[styles.dot, { width: dotWidth, opacity, backgroundColor: '#166534' }]} 
                key={i} 
              />
            );
          })}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.button} 
            onPress={() => router.push('/auth')}
          >
            <Text style={styles.buttonText}>Get Started</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC", 
  },
  slide: {
    width,
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  illustrationContainer: {
    height: height * 0.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20
  },
  image: {
    width: width * 0.85,
    height: height * 0.4,
  },
  textContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  heading: {
    color: "#0F172A", 
    fontSize: 34,
    fontFamily: 'Jakarta-ExtraBold',
    textAlign: 'center',
    letterSpacing: -1.2,
    lineHeight: 40,
    marginBottom: 16,
  },
  subHeading: {
    color: "#64748B", 
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  pagination: {
    flexDirection: 'row',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  footer: {
    paddingHorizontal: 30,
    paddingBottom: 30,
  },
  button: {
    backgroundColor: "#166534", 
    paddingVertical: 20,
    borderRadius: 18,
    marginBottom: 16,
    shadowColor: "#166534",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 2,
  },
  buttonText: {
    textAlign: "center",
    color: "#FFFFFF",
    fontFamily: 'Jakarta-Bold',
    fontSize: 18,
  },
  secondaryButton: {
    paddingVertical: 10,
  },
  secondaryButtonText: {
    textAlign: "center",
    color: "#64748B",
    fontFamily: 'Inter-Bold',
    fontSize: 15,
  },
});