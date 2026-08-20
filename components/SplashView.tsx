import { useEffect } from 'react';
import { Image, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { LinearGradient } from '@/components/ui/LinearGradient';

export function SplashView() {
  const spin = useSharedValue(0);
  const bar = useSharedValue(0);

  useEffect(() => {
    spin.value = withRepeat(withTiming(1, { duration: 2200, easing: Easing.linear }), -1);
    bar.value = withRepeat(
      withTiming(1, { duration: 1250, easing: Easing.bezier(0.65, 0, 0.35, 1) }),
      -1
    );
  }, [spin, bar]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value * 360}deg` }],
  }));

  const barStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -118 + bar.value * 336 }],
  }));

  return (
    <View className="flex-1 items-center justify-center gap-6 bg-app-bg">
      <View className="h-[132px] w-[132px] items-center justify-center">
        <View className="absolute inset-0 rounded-full border border-app-border" />
        <View className="absolute inset-[18px] rounded-full border border-app-border" />

        <Animated.View
          className="absolute -inset-3.5 items-center justify-center overflow-hidden rounded-full"
          style={ringStyle}>
          <LinearGradient
            colors={['transparent', 'transparent', '#4bdd2c', '#dbea18']}
            locations={[0, 0.62, 0.82, 0.97]}
            className="h-full w-full"
          />
          <View className="absolute inset-0.5 rounded-full bg-app-bg" />
        </Animated.View>

        <Image
          source={require('@/assets/icon.png')}
          className="h-[66px] w-[66px]"
          resizeMode="contain"
        />
      </View>

      <View className="items-center gap-2">
        <Text className="text-[26px] font-bold tracking-tight text-brand-green">skoleom</Text>
        <Text className="text-[9.5px] font-bold uppercase tracking-[3px] text-app-fg-3">
          Watch. Click. Buy.®
        </Text>
      </View>

      <View className="absolute bottom-[78px] h-[2.5px] w-[118px] overflow-hidden rounded-full bg-app-border">
        <Animated.View className="h-full w-[44%] rounded-full bg-brand-green" style={barStyle} />
      </View>
    </View>
  );
}
