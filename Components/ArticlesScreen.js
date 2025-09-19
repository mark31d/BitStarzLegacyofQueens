// Components/ArticlesScreen.js
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  Image, ImageBackground, Pressable, Dimensions,
  Modal, ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: W } = Dimensions.get('window');

const BR = {
  text: '#D4AF37',
  sub:  '#F5F5DC',
};

const BG_ONB   = require('../assets/onb.webp');
const CARD_BG  = require('../assets/article_container.webp');
const BOOKMARK = require('../assets/bookmark.webp');
const BOOKMARK2 = require('../assets/bookmark2.webp');

const portraits = [
  require('../assets/person1.webp'),
  require('../assets/person2.webp'),
  require('../assets/person3.webp'),
  require('../assets/person4.webp'),
  require('../assets/person5.webp'),
  require('../assets/person6.webp'),
  require('../assets/person7.webp'),
  require('../assets/person8.webp'),
  require('../assets/person9.webp'),
  require('../assets/person10.webp'),
];

const ARTICLES_META = [
  { id: 'hatshepsut',  title: 'Hatshepsut',    subtitle: '(c. 1507–1458 BCE)', img: portraits[0] },
  { id: 'nefertiti',   title: 'Nefertiti',     subtitle: '(c. 1370–1330 BCE)', img: portraits[1] },
  { id: 'cleopatra',   title: 'Cleopatra VII', subtitle: '(69–30 BCE)',        img: portraits[2] },
  { id: 'nefertari',   title: 'Nefertari',     subtitle: '(c. 1290–1255 BCE)', img: portraits[3] },
  { id: 'ahhotep',     title: 'Ahhotep I',     subtitle: '(c. 1560–1530 BCE)', img: portraits[4] },
  { id: 'sobekneferu', title: 'Sobekneferu',   subtitle: '(c. 1806–1802 BCE)', img: portraits[5] },
  { id: 'ankhesenamun',title: 'Ankhesenamun',  subtitle: '(c. 1348–1322 BCE)', img: portraits[6] },
  { id: 'tiye',        title: 'Tiye',          subtitle: '(c. 1398–1338 BCE)', img: portraits[7] },
  { id: 'merneith',    title: 'Merneith',      subtitle: '(c. 3000 BCE)',      img: portraits[8] },
  { id: 'twosret',     title: 'Twosret',       subtitle: '(c. 1191–1189 BCE)', img: portraits[9] },
];

const STORAGE_FAVS = 'nql:articleFavs';

export default function ArticlesScreen() {
  const navigation = useNavigation();
  const [favs, setFavs] = useState(new Set());
  const [showSavedModal, setShowSavedModal] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_FAVS);
        if (raw) setFavs(new Set(JSON.parse(raw)));
      } catch {}
    })();
  }, []);

  const saveFavs = useCallback(async (next) => {
    setFavs(next);
    try { await AsyncStorage.setItem(STORAGE_FAVS, JSON.stringify([...next])); } catch {}
  }, []);

  const toggleFav = (id) => {
    const next = new Set(favs);
    next.has(id) ? next.delete(id) : next.add(id);
    saveFavs(next);
  };

  const data = useMemo(() => ARTICLES_META.map(x => ({ ...x, isFav: favs.has(x.id) })), [favs]);
  const savedData = useMemo(() => data.filter(x => x.isFav), [data]);

  return (
    <View style={styles.wrap}>
      <ImageBackground source={BG_ONB} style={styles.bg} resizeMode="cover">
        {/* Кнопка для показа сохраненных */}
        <Pressable 
          style={styles.savedButton}
          onPress={() => setShowSavedModal(true)}
        >
          <Text style={styles.savedButtonText}>
            Saved Articles ({savedData.length})
          </Text>
        </Pressable>

        <FlatList
          data={data}
          keyExtractor={(it) => it.id}
          contentContainerStyle={{ paddingBottom: 120, paddingTop: 8 }}
          renderItem={({ item }) => (
            <Pressable 
              style={styles.cardWrap} 
              onPress={() => {
                navigation.navigate('ArticleDetail', { article: item });
              }}
            >
              <ImageBackground source={CARD_BG} resizeMode="stretch" style={styles.cardBg}>
                {/* Букмарк: правый верх ВНУТРИ контейнера */}
                <Pressable
                  onPress={(e) => { e.stopPropagation(); toggleFav(item.id); }}
                  hitSlop={10}
                  style={styles.bookmarkBox}
                >
                  <Image
                    source={item.isFav ? BOOKMARK2 : BOOKMARK}
                    style={styles.bookmarkImg}
                    resizeMode="contain"
                  />
                </Pressable>

                {/* Контент — с запасом справа, чтобы не перекрывался букмарком */}
                <View style={styles.row}>
                  <Image source={item.img} style={styles.portrait} resizeMode="contain" />
                  <View style={styles.textContainer}>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.subtitle}>{item.subtitle}</Text>
                  </View>
                </View>
              </ImageBackground>
            </Pressable>
          )}
        />

        {/* Модальное окно с сохраненными */}
        <Modal
          visible={showSavedModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowSavedModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Saved Articles</Text>
                <Pressable 
                  style={styles.closeButton}
                  onPress={() => setShowSavedModal(false)}
                >
                  <Text style={styles.closeButtonText}>×</Text>
                </Pressable>
              </View>
              
              <ScrollView style={styles.modalScroll}>
                {savedData.length > 0 ? (
                  savedData.map((item) => (
                    <Pressable
                      key={item.id}
                      style={styles.savedItem}
                      onPress={() => {
                        setShowSavedModal(false);
                        navigation.navigate('ArticleDetail', { article: item });
                      }}
                    >
                      <Image source={item.img} style={styles.savedItemImage} resizeMode="contain" />
                      <View style={styles.savedItemText}>
                        <Text style={styles.savedItemTitle}>{item.title}</Text>
                        <Text style={styles.savedItemSubtitle}>{item.subtitle}</Text>
                      </View>
                    </Pressable>
                  ))
                ) : (
                  <View style={styles.emptySaved}>
                    <Text style={styles.emptySavedText}>No saved articles</Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </ImageBackground>
    </View>
  );
}

/* ───────── styles ───────── */
const SIDE_PAD   = 8;     // небольшой отступ карточек от краёв экрана
const CARD_H     = 176;
const PORTRAIT_W = 100;
const BM_W       = 26;    // размер bookmark.webp (подгони при необходимости)
const BM_H       = 34;
const RESERVE_R  = BM_W + 40; // запас справа под иконку, чтобы текст не наезжал

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  bg: { flex: 1 },

  cardWrap: {
    width: W - SIDE_PAD * 2,
    alignSelf: 'center',
    marginVertical: 10,
  },
  cardBg: {
    width: '100%',
    height: CARD_H,
    
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Контент по центру, но с правым внутренним отступом (резерв под букмарк)
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '92%',
    alignSelf: 'center',
    gap: 16,
    paddingLeft: 40,    // увеличиваем отступ слева для сдвига правее
    paddingRight: RESERVE_R,
  },

  portrait: { width: PORTRAIT_W, height: PORTRAIT_W , right:-15,},

  textContainer: { alignItems: 'center', justifyContent: 'center' },
  title:    { color: BR.text, fontSize: 24, fontWeight: '800', textAlign: 'center' },
  subtitle: { color: BR.sub,  fontSize: 16, marginTop: 6, textAlign: 'center' },

  // Букмарк внутри рамки
  bookmarkBox: {
    position: 'absolute',
    top: 26,     // выровнять по макету
    right: 43,
    width: BM_W,
    height: BM_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookmarkImg: { width: BM_W, height: BM_H },

  // Кнопка сохраненных
  savedButton: {
    backgroundColor: 'rgba(220, 38, 38, 0.8)',
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(220, 38, 38, 0.6)',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  savedButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Модальное окно
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: W - 32,
    maxHeight: '80%',
    backgroundColor: 'rgba(10, 6, 2, 0.95)',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(220, 38, 38, 0.4)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(220, 38, 38, 0.3)',
  },
  modalTitle: {
    color: BR.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(220, 38, 38, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalScroll: {
    maxHeight: 400,
  },
  savedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(220, 38, 38, 0.2)',
  },
  savedItemImage: {
    width: 60,
    height: 60,
    marginRight: 16,
  },
  savedItemText: {
    flex: 1,
  },
  savedItemTitle: {
    color: BR.text,
    fontSize: 16,
    fontWeight: '600',
  },
  savedItemSubtitle: {
    color: BR.sub,
    fontSize: 14,
    marginTop: 4,
  },
  emptySaved: {
    padding: 40,
    alignItems: 'center',
  },
  emptySavedText: {
    color: BR.sub,
    fontSize: 16,
    textAlign: 'center',
  },
});
