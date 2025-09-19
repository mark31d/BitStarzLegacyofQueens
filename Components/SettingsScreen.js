// Components/SettingsScreen.js
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ImageBackground,
  Pressable,
  Share,
  Vibration,
  useWindowDimensions,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMusic } from './MusicPlayer';

const BG_IMG = require('../assets/bg.webp');
const SWITCH_ON  = require('../assets/switch_on.webp');
const SWITCH_OFF = require('../assets/switch_off.webp');

const STORAGE_KEY = 'nql:settings:v1';

const COLORS = {
  gold:  '#E6B23C',
  goldLight: '#FFD36B',
  navy:  '#12385C',
  text:  '#FFFFFF',
};

const DEFAULT_SETTINGS = {
  music: true,
  sounds: true,
  vibration: true,
};

// Ключи для очистки данных (соответствуют ключам в других компонентах)
const STORAGE_KEYS = {
  pieces: 'nql:artifactPieces:v1',        // прогресс пазлов
  solved: 'nql:artifactSolved:v1',        // решенные пазлы
  favs: 'nql:articleFavs',                // избранные статьи
  answers: 'nql:articleAnswersCorrect:v1', // правильные ответы на статьи
  settings: 'nql:settings:v1',            // настройки
  onboarding: 'nql:onboarding:v1',        // флаг онбординга
};

export default function SettingsScreen() {
  const { width, height } = useWindowDimensions();
  const styles = useMemo(() => makeStyles(width, height), [width, height]);

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  
  // Управление музыкой
  const { toggleMusic, stopMusic, isPlaying, isLoaded } = useMusic();

  // load
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          setSettings({ ...DEFAULT_SETTINGS, ...parsed });
        }
      } catch {}
    })();
  }, []);

  // Синхронизация состояния музыки с настройками
  useEffect(() => {
    if (isLoaded) {
      if (settings.music && !isPlaying) {
        toggleMusic();
      } else if (!settings.music && isPlaying) {
        stopMusic();
      }
    }
  }, [settings.music, isLoaded, isPlaying, toggleMusic, stopMusic]);

  // save
  const persist = useCallback(async (next) => {
    setSettings(next);
    try { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  }, []);

  const toggle = (key) => {
    const next = { ...settings, [key]: !settings[key] };
    
    // Специальная обработка для музыки
    if (key === 'music') {
      if (next.music) {
        toggleMusic(); // Включить музыку
      } else {
        stopMusic(); // Выключить музыку
      }
    }
    
    // лёгкий тактильный отклик по желанию
    if (key !== 'vibration' && settings.vibration) Vibration.vibrate(10);
    persist(next);
  };

  const onShare = async () => {
    try {
      await Share.share({
        message:
          'Noble Queens Legacy — истории великих цариц Египта, артефакты и мини-игры. Попробуй!',
      });
    } catch {}
  };

  const onResetData = () => {
    Alert.alert(
      'Reset Data',
      'Are you sure you want to reset all data? This will clear all progress, favorites, and settings.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              // Очищаем все данные
              await Promise.all([
                AsyncStorage.removeItem(STORAGE_KEYS.pieces),    // прогресс пазлов
                AsyncStorage.removeItem(STORAGE_KEYS.solved),    // решенные пазлы
                AsyncStorage.removeItem(STORAGE_KEYS.favs),      // избранные статьи
                AsyncStorage.removeItem(STORAGE_KEYS.answers),   // правильные ответы на статьи
                AsyncStorage.removeItem(STORAGE_KEYS.settings),  // настройки
                AsyncStorage.removeItem(STORAGE_KEYS.onboarding), // флаг онбординга
              ]);
              
              // Сбрасываем настройки к значениям по умолчанию
              setSettings(DEFAULT_SETTINGS);
              
              // Останавливаем музыку
              stopMusic();
              
              Alert.alert('Success', 'All data has been reset successfully!');
            } catch (error) {
              console.error('Error resetting data:', error);
              Alert.alert('Error', 'Failed to reset data. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <ImageBackground source={BG_IMG} style={styles.bg} resizeMode="cover">
      <View style={styles.panel}>
        <Text style={styles.title}>Settings</Text>

        <Row
          label="Music"
          value={settings.music}
          onPress={() => toggle('music')}
        />
        <Row
          label="Sounds"
          value={settings.sounds}
          onPress={() => toggle('sounds')}
        />
        <Row
          label="Vibration"
          value={settings.vibration}
          onPress={() => toggle('vibration')}
        />

        <Pressable onPress={onShare} style={styles.ctaWrap}>
          <LinearGradient
            colors={['#17B8B1', '#0D7D75']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ctaFill}
          >
            <Text style={styles.ctaText}>Share App</Text>
          </LinearGradient>
        </Pressable>

        <Pressable onPress={onResetData} style={styles.resetWrap}>
          <LinearGradient
            colors={['#E74C3C', '#C0392B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.resetFill}
          >
            <Text style={styles.resetText}>Reset Data</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </ImageBackground>
  );
}

/* ───────── helpers ───────── */

function Row({ label, value, onPress }) {
  return (
    <View style={rowStyles.row}>
      <Text style={rowStyles.label}>{label}</Text>
      <Pressable onPress={onPress} hitSlop={10} style={rowStyles.toggle}>
        <Image
          source={value ? SWITCH_ON : SWITCH_OFF}
          style={rowStyles.switchImg}
          resizeMode="contain"
        />
      </Pressable>
    </View>
  );
}

/* ───────── styles ───────── */

function makeStyles(w, h) {
  const PANEL_W = Math.min(360, w - 40);

  return StyleSheet.create({
    bg: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },

    panel: {
      width: PANEL_W,
      minHeight: 440,
      paddingHorizontal: 18,
      paddingTop: 18,
      paddingBottom: 22,
      borderRadius: 22,
      backgroundColor: COLORS.navy,
      borderWidth: 3,
      borderColor: COLORS.gold,
      shadowColor: '#000',
      shadowOpacity: 0.35,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 10 },
    },

    title: {
      color: COLORS.text,
      fontSize: 26,
      fontWeight: '900',
      textAlign: 'center',
      marginBottom: 8,
    },

    ctaWrap: {
      marginTop: 20,
      height: 56,
      borderRadius: 16,
      borderWidth: 3,
      borderColor: COLORS.gold,
      overflow: 'hidden',
    },
    ctaFill: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ctaText: { color: '#fff', fontSize: 20, fontWeight: '800' },
    
    resetWrap: {
      marginTop: 20,
      height: 56,
      borderRadius: 16,
      borderWidth: 3,
      borderColor: COLORS.gold,
      overflow: 'hidden',
    },
    resetFill: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
    },
    resetText: { color: '#fff', fontSize: 20, fontWeight: '800' },
  });
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.12)',
  },
  label: { color: '#fff', fontSize: 20, fontWeight: '700', flex: 1 },
  toggle: { paddingHorizontal: 4, paddingVertical: 2 },
  switchImg: { width: 62, height: 34 },
});
