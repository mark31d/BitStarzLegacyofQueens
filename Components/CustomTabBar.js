// Components/CustomTabBar.js
import React, { useEffect, useMemo, useRef } from 'react';
import {
  View,
  Image,
  Pressable,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: W } = Dimensions.get('window');

/**
 * props:
 * - tabs: [{ key: 'Articles', icon: require('...') }, ...] // 0..4 элементов
 * - active: number (0..tabs.length-1)
 * - onPress: (key: string) => void
 */
export default function CustomTabBar({ tabs = [], active = 0, onPress }) {
  const insets = useSafeAreaInsets();

  // безопасная копия
  const TABS = Array.isArray(tabs) ? tabs : [];
  const N    = TABS.length;

  const SIDE  = 12;
  const BAR_W = W - 16;
  const tabW  = useMemo(() => (BAR_W - SIDE * 2) / Math.max(1, N), [BAR_W, N]);

  // анимация рамки активной вкладки
  const pos = useRef(new Animated.Value(Math.min(active, Math.max(0, N - 1)))).current;
  const scale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.parallel([
      Animated.spring(pos, {
        toValue: Math.min(active, Math.max(0, N - 1)),
        useNativeDriver: true,
        tension: 200,
        friction: 20,
      }),
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.15,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(glowOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
  }, [active, N, pos, scale, glowOpacity]);

  // фолбэки для interpolate, когда вкладок ещё нет
  const inputRange  = N >= 2 ? TABS.map((_, i) => i) : [0, 1];
  const outputRange = N >= 2 ? TABS.map((_, i) => SIDE + i * tabW + tabW / 2 - 38) : [SIDE + tabW / 2 - 38, SIDE + tabW / 2 - 38];

  const translateX = pos.interpolate({ inputRange, outputRange });

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 6) }]}
    >
      {/* Основной фон таб бара */}
      <View style={[styles.bg, { width: BAR_W, paddingHorizontal: SIDE }]}>
        {/* Внутренняя тень */}
        <View style={styles.innerShadow} />
        
        {/* Рамка активной иконки */}
        <Animated.View
          pointerEvents="none"
          style={[styles.selectorSlot, { transform: [{ translateX }] }]}
        >
          <Animated.View style={[styles.selectorBg, { transform: [{ scale }] }]}>
            {/* Основной градиент через несколько слоев */}
            <View style={styles.selectorGradient1} />
            <View style={styles.selectorGradient2} />
            <View style={styles.selectorGradient3} />
            
            {/* Свечение */}
            <Animated.View style={[styles.selectorGlow, { opacity: glowOpacity }]} />
          </Animated.View>
        </Animated.View>

        {/* Кнопки-иконки */}
        {TABS.map((t, index) => {
          const focused = index === active;
          
          return (
            <Pressable
              key={t.key ?? String(index)}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              onPress={() => onPress?.(t.key)}
              style={[styles.tab, { width: tabW }]}
              android_ripple={
                Platform.OS === 'android'
                  ? { color: 'rgba(220, 38, 38, 0.2)', borderless: true, radius: 28 }
                  : undefined
              }
            >
              <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
                <Image
                  source={t.icon}
                  style={[styles.icon, !focused && styles.iconOff]}
                  resizeMode="contain"
                />
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    alignItems: 'center',
  },
  bg: {
    height: 92,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 46,
    backgroundColor: 'rgba(10, 6, 2, 0.95)',
    borderWidth: 2,
    borderColor: 'rgba(220, 38, 38, 0.4)',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  innerShadow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderTopLeftRadius: 46,
    borderTopRightRadius: 46,
  },
  tab: {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  iconContainer: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  iconContainerActive: {
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 8,
  },
  icon: { 
    width: 44, 
    height: 44,
  },
  iconOff: { 
    opacity: 0.55 
  },
  selectorSlot: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0, right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    width: 76,
    height: 76,
  },
  selectorBg: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Создаем градиент через несколько слоев
  selectorGradient1: {
    position: 'absolute',
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#DC2626',
  },
  selectorGradient2: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#B91C1C',
    top: 3,
    left: 3,
  },
  selectorGradient3: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#991B1B',
    top: 6,
    left: 6,
  },
  selectorGlow: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(220, 38, 38, 0.3)',
    top: -7,
    left: -7,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 25,
    elevation: 15,
  },
});
