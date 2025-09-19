// Components/ArtifactsScreen.js
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ImageBackground,
  ScrollView,
  Pressable,
  Modal,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: W } = Dimensions.get('window');

const BG   = require('../assets/bg.webp');
const LOCK = require('../assets/lock.webp');
const PUZZLE_CONTAINER = require('../assets/puzzle_container.webp');
const CONTAINER = require('../assets/container.webp'); // модальный контейнер
const BUTTON    = require('../assets/button.webp');    // кнопка в модалке

const ART = {
  a1:[require('../assets/a1_0.webp'),require('../assets/a1_1.webp'),require('../assets/a1_2.webp'),require('../assets/a1_3.webp')],
  a2:[require('../assets/a2_0.webp'),require('../assets/a2_1.webp'),require('../assets/a2_2.webp'),require('../assets/a2_3.webp')],
  a3:[require('../assets/a3_0.webp'),require('../assets/a3_1.webp'),require('../assets/a3_2.webp'),require('../assets/a3_3.webp')],
  a4:[require('../assets/a4_0.webp'),require('../assets/a4_1.webp'),require('../assets/a4_2.webp'),require('../assets/a4_3.webp')],
  a5:[require('../assets/a5_0.webp'),require('../assets/a5_1.webp'),require('../assets/a5_2.webp'),require('../assets/a5_3.webp')],
};

const STORAGE = { pieces:'nql:artifactPieces:v1', solved:'nql:artifactSolved:v1' };

// проценты «внутреннего окна» от краёв картинки PUZZLE_CONTAINER
const WELL_TOP    = '15%';
const WELL_BOTTOM = '16%';
const WELL_LEFT   = '13%';
const WELL_RIGHT  = '13%';

const allKeysFor = (aKey) => [0,1,2,3].map(i => `${aKey}:${i}`);

export default function ArtifactsScreen({ navigation }) {
  const [pieces, setPieces] = useState(new Set());
  const [solved, setSolved] = useState(new Set());
  const [modal, setModal] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const rawP = await AsyncStorage.getItem(STORAGE.pieces);
        const rawS = await AsyncStorage.getItem(STORAGE.solved);
        if (rawP) setPieces(new Set(JSON.parse(rawP)));
        if (rawS) setSolved(new Set(JSON.parse(rawS)));
      } catch {}
    })();
  }, []);

  const hasAny = pieces.size > 0;

  const rotations = useMemo(() => {
    const r = {};
    Object.keys(ART).forEach(a => { r[a] = [0,1,2,3].map(() => [0,90,180,270][Math.floor(Math.random()*4)]) });
    return r;
  }, []);

  const onPressArtifact = (aKey) => {
    const have = allKeysFor(aKey).filter(k => pieces.has(k)).length;
    if (have < 4) {
      setModal(
        'To start assembling the puzzle, you need to collect all the artifact pieces.\nRead every article and answer the questions correctly to unlock them.'
      );
      return;
    }
    navigation.navigate('Puzzle', { aKey });
  };

  // аспект картинки контейнера, чтобы не "прыгал" размер
  const C_SRC = Image.resolveAssetSource(PUZZLE_CONTAINER);
  const CONTAINER_AR = C_SRC.width / C_SRC.height;

  // размеры модального контейнера по ассету
  const MOD_SRC = Image.resolveAssetSource(CONTAINER);
  const MOD_AR  = MOD_SRC.width / MOD_SRC.height;
  const MOD_W   = Math.min(W * 0.94, 640); // шире модалки
  const MOD_H   = MOD_W / MOD_AR;

  return (
    <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 28 }}>
        {!hasAny ? (
          <View style={styles.lockWrap}>
            <Image source={LOCK} style={{ width:96, height:96, marginBottom:10 }} />
            <Text style={styles.lockTitle}>Artifacts are locked</Text>
            <Text style={styles.lockText}>Read the stories and answer quiz questions to unlock pieces.</Text>
          </View>
        ) : (
          Object.keys(ART).map((aKey) => {
            const imgs = ART[aKey];
            const haveKeys  = allKeysFor(aKey).map(k => pieces.has(k));
            const haveCount = haveKeys.filter(Boolean).length;
            const isSolved  = solved.has(aKey);

            return (
              <Pressable key={aKey} onPress={() => onPressArtifact(aKey)} style={styles.card}>
                {/* картинка контейнера */}
                <ImageBackground
                  source={PUZZLE_CONTAINER}
                  resizeMode="stretch"
                  style={[styles.container, { aspectRatio: CONTAINER_AR }]}
                >
                  {/* внутреннее окно, куда кладём сетку */}
                  <View
                    style={[
                      styles.well,
                      { top: WELL_TOP, bottom: WELL_BOTTOM, left: WELL_LEFT, right: WELL_RIGHT },
                    ]}
                  >
                    <View style={styles.grid}>
                      {(isSolved ? imgs : imgs).map((src, i) => {
                        if (!isSolved && !haveKeys[i]) {
                          return <View key={i} style={[styles.cell, styles.cellEmpty]} />;
                        }
                        const deg = isSolved ? 0 : rotations[aKey][i];
                        return (
                          <Image
                            key={i}
                            source={src}
                            style={[styles.cell, { transform:[{ rotate:`${deg}deg` }] }]}
                            resizeMode="cover"
                          />
                        );
                      })}
                    </View>

                    {/* если нет ни одной части — замок по центру */}
                    {haveCount === 0 && (
                      <View style={styles.lockCenter}>
                        <Image source={LOCK} style={{ width:80, height:80 }} resizeMode="contain" />
                      </View>
                    )}
                  </View>
                </ImageBackground>

                <View style={{ alignItems:'center', marginTop: 10 }}>
                  <Text style={styles.caption}>{isSolved ? 'Completed' : `Pieces: ${haveCount}/4`}</Text>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      {/* модалка с широкой рамкой-картинкой */}
      <Modal visible={!!modal} transparent animationType="fade" onRequestClose={()=>setModal(null)}>
        <View style={styles.modalBackdrop}>
          <ImageBackground
            source={CONTAINER}
            resizeMode="stretch"
            style={[styles.modalCard, { width: MOD_W, height: MOD_H }]}
          >
            <View style={styles.modalInner}>
              <Text style={styles.modalText}>{modal}</Text>
              <Pressable onPress={()=>setModal(null)} style={{ marginTop: 14 }}>
                <ImageBackground source={BUTTON} resizeMode="stretch" style={styles.modalBtn}>
                  <Text style={styles.modalBtnTxt}>Got It</Text>
                </ImageBackground>
              </Pressable>
            </View>
          </ImageBackground>
        </View>
      </Modal>
    </ImageBackground>
  );
}

/* ───────── styles ───────── */
const styles = StyleSheet.create({
  bg:{ flex:1 },

  /** карточка списка */
  card:{ marginBottom:22 },

  /** картинка контейнера */
  container:{
    width: '100%',
    borderRadius: 18,
    overflow: 'hidden',
  },

  /** внутреннее окно */
  well:{
    position: 'absolute',
    overflow: 'hidden', // обрезаем части по окну
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /** сетка 2×2 */
  grid:{
    width:'100%',
    height:'100%',
    flexDirection:'row',
    flexWrap:'wrap',
    maxWidth:160,
    maxHeight:160,
    alignSelf:'center',
  },
  cell:{ width:'50%', height:'50%', overflow:'hidden' },
  cellEmpty:{ backgroundColor:'rgba(0,0,0,0.10)' },

  /** замок в центре окна */
  lockCenter:{ ...StyleSheet.absoluteFillObject, alignItems:'center', justifyContent:'center' },

  caption:{ color:'#0F2F4F', fontWeight:'800' },

  /** пустое состояние */
  lockWrap:{ marginTop:40, marginHorizontal:6, borderWidth:3, borderColor:'#E6B23C', borderRadius:20, backgroundColor:'#F1C24E', padding:16, alignItems:'center' },
  lockTitle:{ fontSize:18, fontWeight:'900', color:'#0F2F4F', marginBottom:6 },
  lockText:{ textAlign:'center', color:'#0F2F4F', opacity:0.9 },

  /** модалка */
  modalBackdrop:{ flex:1, backgroundColor:'rgba(0,0,0,0.45)', alignItems:'center', justifyContent:'center', padding:18 },
  modalCard:{ alignItems:'center', justifyContent:'center' },
  modalInner:{ width:'86%', alignItems:'center' }, // безопасные поля для текста
  modalText:{ color:'#fff', textAlign:'center', fontSize:16, lineHeight:22, fontWeight:'700' },
  modalBtn:{ height:48, alignItems:'center', justifyContent:'center', paddingHorizontal:22 },
  modalBtnTxt:{ color:'#fff', fontSize:16, fontWeight:'800' },
});
