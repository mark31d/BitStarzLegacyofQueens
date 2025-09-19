import { useState, useEffect, useCallback } from 'react';
import TrackPlayer, { Capability, State } from 'react-native-track-player';

// Music player using react-native-track-player
export const useMusic = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const MUSIC_FILE = require('../assets/music.mp3');

  const loadMusic = useCallback(async () => {
    try {
      // Проверяем, есть ли уже треки в плеере
      const queue = await TrackPlayer.getQueue();
      if (queue.length > 0) {
        setIsLoaded(true);
        console.log('Music already loaded');
        return;
      }

      // Если треков нет, добавляем новый
      await TrackPlayer.add({
        id: 'music',
        url: MUSIC_FILE,
        title: 'Background Music',
        artist: 'Noble Queens',
        duration: 180, // 3 минуты
      });

      setIsLoaded(true);
      console.log('Music loaded successfully');
    } catch (error) {
      console.error('Error loading music:', error);
    }
  }, []);

  const toggleMusic = useCallback(async () => {
    try {
      if (!isLoaded) {
        await loadMusic();
        return;
      }

      const state = await TrackPlayer.getState();
      
      if (state === State.Playing) {
        await TrackPlayer.pause();
        setIsPlaying(false);
        console.log('Music paused');
      } else {
        await TrackPlayer.play();
        setIsPlaying(true);
        console.log('Music playing');
      }
    } catch (error) {
      console.error('Error toggling music:', error);
    }
  }, [isLoaded, loadMusic]);

  // Проверяем состояние воспроизведения при загрузке
  useEffect(() => {
    const checkPlayingState = async () => {
      try {
        const state = await TrackPlayer.getState();
        setIsPlaying(state === State.Playing);
      } catch (error) {
        console.error('Error checking playing state:', error);
      }
    };

    if (isLoaded) {
      checkPlayingState();
    }
  }, [isLoaded]);

  const stopMusic = useCallback(async () => {
    try {
      await TrackPlayer.stop();
      setIsPlaying(false);
      console.log('Music stopped');
    } catch (error) {
      console.error('Error stopping music:', error);
    }
  }, []);

  useEffect(() => {
    loadMusic();

    return () => {
      TrackPlayer.reset();
    };
  }, [loadMusic]);

  return {
    isPlaying,
    isLoaded,
    toggleMusic,
    stopMusic,
  };
};