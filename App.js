// App.js — Single Stack (no tab bar)
import 'react-native-gesture-handler';
import React, { useEffect, useRef, useState } from 'react';
import { StatusBar, Image, View, Pressable, StyleSheet, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer, DefaultTheme, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import TrackPlayer, { Capability } from 'react-native-track-player';

// --- СКРИНЫ ---
import Loader             from './Components/Loader';
import Onboarding         from './Components/Onboarding';

import ArticlesScreen     from './Components/ArticlesScreen';
import ArticleDetail      from './Components/ArticleDetail';
import FavoritesScreen    from './Components/FavoritesScreen';
import ArtifactsScreen    from './Components/ArtifactsScreen';
import PuzzleScreen       from './Components/PuzzleScreen';
import SettingsScreen     from './Components/SettingsScreen';

// Кастомный оверлей-таббар
import CustomTabBar       from './Components/CustomTabBar';

const RootStack = createNativeStackNavigator();
const ONBOARD_KEY = 'nql:seenOnboarding';

// ассеты иконок таббара (4 шт.)
const icArticles  = require('./assets/ic_tab1.webp');
const icFavs      = require('./assets/ic_tab2.webp');
const icArtifacts = require('./assets/ic_tab3.webp');
const icSettings  = require('./assets/ic_tab4.webp');

// какие роуты показывают таббар
const TAB_ROUTES = ['Articles', 'Favorites', 'Artifacts', 'Settings'];

export default function App() {
  const [booting, setBooting] = useState(true);
  const [seenOnboarding, setSeenOnboarding] = useState(null); // null = не проверено

  // навигационный ref, чтобы управлять таббаром извне экранов
  const navRef = useNavigationContainerRef();
  const [currentRoute, setCurrentRoute] = useState(null);

  // имитация загрузки + чтение флага онбординга + запуск музыки
  useEffect(() => {
    (async () => {
      try {
        // Читаем настройки онбординга
        const v = await AsyncStorage.getItem('nql:onboarding:v1');
        console.log('Onboarding status from storage:', v);
        const hasSeenOnboarding = v === '1';
        setSeenOnboarding(hasSeenOnboarding);
      } catch (error) {
        console.log('Error reading onboarding status:', error);
        setSeenOnboarding(false);
      }
      
      // Запуск фоновой музыки
      try {
        await TrackPlayer.setupPlayer();
        await TrackPlayer.add({
          id: 'background-music',
          url: require('./assets/music.mp3'),
          title: 'Background Music',
          artist: 'Noble Queens',
          duration: 180,
        });
        await TrackPlayer.updateOptions({
          capabilities: [
            Capability.Play,
            Capability.Pause,
            Capability.Stop,
          ],
          compactCapabilities: [
            Capability.Play,
            Capability.Pause,
          ],
        });
        await TrackPlayer.play();
        console.log('Background music started');
      } catch (error) {
        console.error('Error starting background music:', error);
      }
      
      // Минимальная задержка для показа лоадера
      setTimeout(() => {
        console.log('Booting finished, forcing onboarding');
        setBooting(false);
      }, 1000);
      
      /* Временно закомментировано для тестирования
      try {
        const v = await AsyncStorage.getItem(ONBOARD_KEY);
        console.log('Onboarding status from storage:', v);
        const hasSeenOnboarding = v === '1';
        setSeenOnboarding(hasSeenOnboarding);
        
        // Минимальная задержка для показа лоадера
        setTimeout(() => {
          console.log('Booting finished, hasSeenOnboarding:', hasSeenOnboarding);
          setBooting(false);
        }, 1000);
      } catch (error) {
        console.log('Error reading onboarding status:', error);
        setSeenOnboarding(false);
        setTimeout(() => {
          console.log('Booting finished after error');
          setBooting(false);
        }, 1000);
      }
      */
    })();
  }, []);

  const finishOnboarding = async () => {
    try { await AsyncStorage.setItem(ONBOARD_KEY, '1'); } catch {}
    setSeenOnboarding(true);
  };

  // Показываем лоадер пока загружается
  if (booting) {
    console.log('Showing loader');
    return (
      <SafeAreaProvider style={{ backgroundColor: '#0A0602' }}>
        <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />
        <Loader delay={15000} />
      </SafeAreaProvider>
    );
  }
  
  // Показываем онбординг если не пройден или статус не определен
  if (seenOnboarding !== true) {
    console.log('Showing onboarding, seenOnboarding:', seenOnboarding);
    return (
      <SafeAreaProvider style={{ backgroundColor: '#0A0602' }}>
        <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />
        <Onboarding onFinish={finishOnboarding} />
      </SafeAreaProvider>
    );
  }
  
  console.log('Showing main app, seenOnboarding:', seenOnboarding);

  // Тёмная «золотая» тема под макеты
  const theme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: '#0A0602',
      card:       '#0A0602',
      text:       '#FFFFFF',
      border:     'rgba(255,255,255,0.08)',
      primary:    '#E6B23C',
    },
  };

  // обновляем текущее имя роута
  const onReady = () => {
    const r = navRef.getCurrentRoute();
    setCurrentRoute(r?.name ?? null);
  };
  const onStateChange = () => {
    const r = navRef.getCurrentRoute();
    const routeName = r?.name ?? null;
    console.log('Current route changed to:', routeName);
    setCurrentRoute(routeName);
  };

  // Показываем tab bar на всех экранах
  const showTabBar = true;
  const activeIndex = Math.max(0, TAB_ROUTES.indexOf(currentRoute ?? 'Articles'));

  return (
    <SafeAreaProvider style={{ backgroundColor: '#0A0602' }}>
      <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />
      {seenOnboarding === true ? (
        <NavigationContainer theme={theme} ref={navRef} onReady={onReady} onStateChange={onStateChange}>
          <RootStack.Navigator 
            initialRouteName="Articles"
            screenOptions={{ headerShown: false, orientation: 'portrait' }}
          >
            {/* Разделы */}
            <RootStack.Screen name="Articles"       component={ArticlesScreen} />
            <RootStack.Screen name="ArticleDetail"  component={ArticleDetail} />
            <RootStack.Screen name="Favorites"      component={FavoritesScreen} />
            <RootStack.Screen name="Artifacts"      component={ArtifactsScreen} />
            <RootStack.Screen name="Puzzle"         component={PuzzleScreen} />
            <RootStack.Screen name="Settings"       component={SettingsScreen} />
          </RootStack.Navigator>

          {/* Абсолютный оверлей-таббар: рисуем на всех экранах */}
          {showTabBar && (
            <View style={{ transform: [{ scale: 0.8 }] }}>
              <CustomTabBar
                tabs={[
                  { key: 'Articles',  icon: icArticles  },
                  { key: 'Favorites', icon: icFavs      },
                  { key: 'Artifacts', icon: icArtifacts },
                  { key: 'Settings',  icon: icSettings  },
                ]}
                active={activeIndex}
                onPress={(key) => navRef.navigate(key)}
              />
            </View>
          )}
        </NavigationContainer>
      ) : null}
    </SafeAreaProvider>
  );
}


