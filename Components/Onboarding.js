// Components/Onboarding.js
import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  ImageBackground,
  StyleSheet,
  FlatList,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

// фон для всех экранов
const BG_IMG     = require('../assets/onb.webp');

// ассистенты по порядку слайдов: assistant1.webp ... assistant4.webp
const ASSISTANTS = [
  require('../assets/assistant1.webp'),
  require('../assets/assistant2.webp'),
  require('../assets/assistant3.webp'),
  require('../assets/assistant4.webp'),
];

// контейнер и кнопка (растягиваем)
const PANEL_IMG  = require('../assets/container.webp');
const BUTTON_IMG = require('../assets/button.webp');

const COLORS = { text: '#FFFFFF', sub: 'rgba(255,255,255,0.92)' };

const SLIDES = [
  {
    id: 'welcome',
    title: 'Welcome to the Noble\nQueens Legacy',
    body:
      'Step into the world of the Queens. Discover their legacy, wisdom, and treasures in an engaging new way.',
    btn: 'Got It',
  },
  {
    id: 'stories',
    title: 'Historical Stories',
    body:
      'Read carefully crafted articles about the most powerful women of Ancient Egypt — from Cleopatra to Hatshepsut.',
    btn: 'Got It',
  },
  {
    id: 'quizzes',
    title: 'Quizzes',
    body:
      'Test your knowledge after each story with short quizzes. Learn, play, and see how much you remember.',
    btn: 'Got It',
  },
  {
    id: 'achievements',
    title: 'Interactive Achievements',
    body:
      'Collect artifact pieces by reading and playing. Rotate and solve puzzle fragments to unlock shining golden treasures.',
    btn: 'Start',
  },
];

export default function Onboarding({ onFinish }) {
  const listRef = useRef(null);
  const [index, setIndex] = useState(0);
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(width, height, insets.bottom), [width, height, insets.bottom]);

  const goNext = async () => {
    if (index >= SLIDES.length - 1) {
      // Сохраняем флаг о том, что онбординг был просмотрен
      try {
        await AsyncStorage.setItem('nql:onboarding:v1', '1');
        console.log('Onboarding completed and saved');
      } catch (error) {
        console.error('Error saving onboarding status:', error);
      }
      onFinish?.();
    } else {
      listRef.current?.scrollToIndex({ index: index + 1, animated: true });
      setIndex((i) => i + 1);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['left','right']}>
      <ImageBackground source={BG_IMG} style={styles.bg} resizeMode="cover">
        <FlatList
          ref={listRef}
          data={SLIDES}
          keyExtractor={(it) => it.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const i = Math.round(e.nativeEvent.contentOffset.x / width);
            if (i !== index) setIndex(i);
          }}
          renderItem={({ item, index: i }) => {
            const heroSrc = ASSISTANTS[i] || ASSISTANTS[0];
            return (
              <View style={[styles.page, { width }]}>
                {/* рамка-контейнер */}
                <ImageBackground
                  source={PANEL_IMG}
                  style={styles.panel}
                  resizeMode="stretch"
                  imageStyle={styles.panelImg}
                >
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.body}>{item.body}</Text>
                </ImageBackground>

                {/* ассистент */}
                <Image source={heroSrc} style={styles.hero} resizeMode="contain" />

                {/* кнопка */}
                <Pressable onPress={goNext} style={styles.btnWrap}>
                  <ImageBackground
                    source={BUTTON_IMG}
                    style={styles.btnBg}
                    imageStyle={styles.btnImg}
                    resizeMode="stretch"
                  >
                    <Text style={styles.btnTxt}>{item.btn}</Text>
                  </ImageBackground>
                </Pressable>
              </View>
            );
          }}
        />

        {/* индикаторы убраны */}
      </ImageBackground>
    </SafeAreaView>
  );
}

/* ───────── styles ───────── */
function makeStyles(w, h, bottom) {
  const isTall = h >= 800;
  const PANEL_W = Math.min(560, w - 28);

  return StyleSheet.create({
    root: { flex: 1, backgroundColor: '#000' },
    bg:   { flex: 1 },

    page: { flex: 1, alignItems: 'center', justifyContent: 'flex-start' },

    panel: {
      width: PANEL_W,
      minHeight: 160,
      marginTop: isTall ? 78 : 56,
      paddingHorizontal: 22,
      paddingVertical: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    panelImg: { borderRadius: 20 },

    title: {
      color: COLORS.text,
      fontSize: 26,
      fontWeight: '800',
      textAlign: 'center',
      marginBottom: 8,
    },
    body: { color: COLORS.sub, fontSize: 16, lineHeight: 22, textAlign: 'center' },

    hero: {
      position: 'absolute',
      bottom: (bottom || 16) + 60,
      width: w * 0.86,
      height: h * (isTall ? 0.55 : 0.50),
      alignSelf: 'center',
    },

    btnWrap: {
      position: 'absolute',
      bottom: (bottom || 16) + 36,
      width: Math.min(360, w - 48),
      height: 64,
    },
    btnBg: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    btnImg: { borderRadius: 18 },
    btnTxt: { color: '#fff', fontSize: 22, fontWeight: '800' },

  });
}
