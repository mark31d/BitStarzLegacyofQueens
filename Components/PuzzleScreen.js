// Screens/PuzzleScreen.js
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Image, ImageBackground, Pressable,
  Dimensions, Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { WebView } from 'react-native-webview';

const BG = require('../assets/bg.webp');
const PUZZLE_CONTAINER = require('../assets/puzzle_container.webp'); // рама пазла
const TOP_CONTAINER    = require('../assets/container.webp');        // верхняя плашка (hint)
const CONGRATS_CONT    = require('../assets/congrats_container.webp');// верхняя плашка (congrats)
const BUTTON           = require('../assets/button.webp');
const BACK             = require('../assets/back.webp');
const COMPLETE_GIF     = require('../assets/Complete.gif');          // гифка успешной сборки
const CONGRATS_MP3     = require('../assets/congratulations.mp3');   // звук поздравления

const ART = {
  a1:[require('../assets/a1_0.webp'),require('../assets/a1_1.webp'),require('../assets/a1_2.webp'),require('../assets/a1_3.webp')],
  a2:[require('../assets/a2_0.webp'),require('../assets/a2_1.webp'),require('../assets/a2_2.webp'),require('../assets/a2_3.webp')],
  a3:[require('../assets/a3_0.webp'),require('../assets/a3_1.webp'),require('../assets/a3_2.webp'),require('../assets/a3_3.webp')],
  a4:[require('../assets/a4_0.webp'),require('../assets/a4_1.webp'),require('../assets/a4_2.webp'),require('../assets/a4_3.webp')],
  a5:[require('../assets/a5_0.webp'),require('../assets/a5_1.webp'),require('../assets/a5_2.webp'),require('../assets/a5_3.webp')],
};

const STORAGE = { pieces:'nql:artifactPieces:v1', solved:'nql:artifactSolved:v1', hint:'nql:puzzleHintSeen:v1' };

// HTML для WebView с <audio>
const makeSoundHtml = (uri) => `
<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<style>html,body{margin:0;background:transparent}</style></head>
<body>
<audio id="s" preload="auto" src="${uri}" playsinline webkit-playsinline></audio>
<script>
  const s=document.getElementById('s');
  window.__playCongrats=()=>{ try{ s.currentTime=0; s.play().catch(()=>{});}catch(e){} };
</script>
</body></html>`;

export default function PuzzleScreen({ route }) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const webRef = useRef(null);

  const { aKey = 'a1' } = route.params || {};
  const imgs = ART[aKey];

  const [solvedSet, setSolvedSet] = useState(new Set());
  const [hintSeen, setHintSeen]   = useState(false);
  const [done, setDone]           = useState(false);
  const [showCompleteGif, setShowCompleteGif] = useState(false);
  const [rot, setRot]             = useState([0,0,0,0].map(()=>[0,90,180,270][Math.floor(Math.random()*4)]));

  // готовность WebView (чтобы не промахнуться с инъекцией)
  const [webReady, setWebReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const rawS = await AsyncStorage.getItem(STORAGE.solved);
        if (rawS) setSolvedSet(new Set(JSON.parse(rawS)));
        const hs = await AsyncStorage.getItem(STORAGE.hint);
        setHintSeen(hs === '1');
      } catch {}
    })();
  }, []);

  // фиксация факта сборки
  useEffect(() => {
    const ok = rot.every(d => (d % 360) === 0);
    if (ok && !done) {
      setDone(true);
      const next = new Set(solvedSet); next.add(aKey);
      setSolvedSet(next);
      AsyncStorage.setItem(STORAGE.solved, JSON.stringify([...next])).catch(()=>{});
    }
  }, [rot, done, aKey, solvedSet]);

  const rotate = (i) => {
    if (done) return;
    setRot(prev => { const n=[...prev]; n[i]=(n[i]+90)%360; return n; });
  };

  // ——— размеры рамы пазла (больше)
  const { width: W } = Dimensions.get('window');
  const RC = Image.resolveAssetSource(PUZZLE_CONTAINER);
  const R_AR = RC.width / RC.height;

  const CONT_W = Math.min(W * 0.98, 720);
  const CONT_H = CONT_W / R_AR;

  // внутреннее окно рамы (проценты подобраны под ассет)
  const INNER_L = 0.118, INNER_R = 0.118, INNER_T = 0.185, INNER_B = 0.165;
  const GRID_W  = CONT_W * (1 - INNER_L - INNER_R);
  const GRID_H  = CONT_H * (1 - INNER_T - INNER_B);
  const GRID_SZ = Math.min(GRID_W, GRID_H);
  const GUTTER  = 6;

  const gridStyle = useMemo(() => ({
    position: 'absolute',
    left: CONT_W * INNER_L + (GRID_W - GRID_SZ) / 2,
    top:  CONT_H * INNER_T + (GRID_H - GRID_SZ) / 2,
    width: GRID_SZ,
    height: GRID_SZ,
    padding: GUTTER / 2,
  }), [CONT_W, CONT_H, GRID_W, GRID_H, GRID_SZ]);

  // верхние плашки
  const TH = Image.resolveAssetSource(TOP_CONTAINER);
  const TOP_AR = TH.width / TH.height;
  const TOP_W  = Math.min(W * 0.86, 520);
  const TOP_H  = TOP_W / TOP_AR;

  const CC = Image.resolveAssetSource(CONGRATS_CONT);
  const CG_AR = CC.width / CC.height;
  const CG_W  = Math.min(W * 0.92, 560);
  const CG_H  = CG_W / CG_AR;

  const toastY = useMemo(() => new Animated.Value(-CG_H - 40), [CG_H]);
  useEffect(() => {
    if (!done) return;
    Animated.sequence([
      Animated.timing(toastY, { toValue: 0, duration: 280, useNativeDriver: true }),
      Animated.delay(2500),
      Animated.timing(toastY, { toValue: -CG_H - 40, duration: 240, useNativeDriver: true }),
    ]).start();
  }, [done, CG_H, toastY]);

  // ——— звук поздравления + гифка при done = true
  const congratsUri = useMemo(() => Image.resolveAssetSource(CONGRATS_MP3).uri, []);
  const soundHtml   = useMemo(() => makeSoundHtml(congratsUri), [congratsUri]);

  useEffect(() => {
    if (!done || !webReady) return;
    // проигрываем звук
    webRef.current?.injectJavaScript('window.__playCongrats && window.__playCongrats(); true;');
    // показываем гифку на 3 секунды
    setShowCompleteGif(true);
    const t = setTimeout(() => setShowCompleteGif(false), 3000);
    return () => clearTimeout(t);
  }, [done, webReady]);

  return (
    <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
      {/* скрытый WebView со звуком congratulations.mp3 */}
      <WebView
        ref={webRef}
        source={{ html: soundHtml }}
        originWhitelist={['*']}
        style={styles.audioWV}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        allowFileAccess
        allowFileAccessFromFileURLs
        allowUniversalAccessFromFileURLs
        onLoadEnd={() => setWebReady(true)}
      />

      {/* HINT */}
      {!hintSeen && (
        <View style={[styles.topWrap, { paddingTop: insets.top + 8 }]}>
          <ImageBackground
            source={TOP_CONTAINER}
            resizeMode="stretch"
            style={[styles.topIB, { width: TOP_W, height: TOP_H }]}
          >
            <Text style={styles.topText}>
              Tap an artifact piece to rotate it by 90°.{'\n'}
              You can rotate as many times as you like.
            </Text>
            <Pressable
              onPress={() => { setHintSeen(true); AsyncStorage.setItem(STORAGE.hint, '1').catch(()=>{}); }}
              style={{ marginTop: 10, alignSelf: 'center' }}
            >
              <ImageBackground source={BUTTON} resizeMode="stretch" style={styles.topBtn}>
                <Text style={styles.topBtnTxt}>Got It</Text>
              </ImageBackground>
            </Pressable>
          </ImageBackground>
        </View>
      )}

      {/* CONGRATS тост */}
      {done && (
        <Animated.View
          pointerEvents="none"
          style={[styles.topWrap, { paddingTop: insets.top + 8, transform: [{ translateY: toastY }] }]}
        >
          <ImageBackground
            source={CONGRATS_CONT}
            resizeMode="stretch"
            style={[styles.topIB, { width: CG_W, height: CG_H, paddingTop: 12, paddingBottom: 10 }]}
          >
            <Text style={[styles.topText, { marginBottom: 0 }]}>
              Congratulations!{'\n'}You've completed the artifact!
            </Text>
          </ImageBackground>
        </Animated.View>
      )}

      {/* Гифка успешной сборки */}
      {showCompleteGif && (
        <View style={styles.completeGifWrap}>
          <Image source={COMPLETE_GIF} style={styles.completeGif} resizeMode="contain" />
        </View>
      )}

      {/* Назад */}
      <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Image source={BACK} style={styles.backImg} resizeMode="contain" />
      </Pressable>

      {/* Поле пазла */}
      <View style={[styles.boardWrap, { paddingBottom: insets.bottom + 8 }]}>
        <ImageBackground
          source={PUZZLE_CONTAINER}
          resizeMode="stretch"
          style={[styles.frameIB, { width: CONT_W, height: CONT_H }]}
        >
          <View style={[styles.grid, gridStyle]}>
            {imgs.map((src, i) => (
              <Pressable
                key={i}
                onPress={() => rotate(i)}
                disabled={done}
                style={[styles.cellPress, { padding: GUTTER / 2 }]}
              >
                <Image
                  source={src}
                  resizeMode="cover"
                  style={[styles.cellImg, { transform:[{ rotate:`${rot[i]}deg` }] }]}
                />
              </Pressable>
            ))}
          </View>
        </ImageBackground>
      </View>
    </ImageBackground>
  );
}

/* ───────── styles ───────── */
const styles = StyleSheet.create({
  bg:{ flex:1 },

  audioWV:{
    position:'absolute',
    width:1,
    height:1,
    opacity:0,
    zIndex:-1,
    pointerEvents:'none',
  },

  boardWrap:{ flex:1, justifyContent:'center', alignItems:'center', paddingHorizontal:8 , top:-170, },

  frameIB:{ justifyContent:'center', alignItems:'center', overflow:'hidden' },

  grid:{ flexDirection:'row', flexWrap:'wrap', borderRadius:10, overflow:'hidden', backgroundColor:'transparent' },
  cellPress:{ width:'50%', height:'50%' },
  cellImg:{ width:'100%', height:'100%' },

  // верхние плашки
  topWrap:{ position:'absolute', left:0, right:0, top:0, alignItems:'center', zIndex:10 },
  topIB:{ justifyContent:'center', paddingHorizontal:18, paddingTop:16, paddingBottom:12 },
  topText:{ color:'#fff', textAlign:'center', fontWeight:'800' },
  topBtn:{ height:40, alignItems:'center', justifyContent:'center', paddingHorizontal:22 },
  topBtnTxt:{ color:'#fff', fontWeight:'800' },

  // кнопка "назад"
  backBtn:{ position:'absolute', bottom:18, width:44, height:44, alignItems:'center', justifyContent:'center', zIndex:15 },
  backImg:{ width:44, height:44 },

  // гифка успешной сборки
  completeGifWrap:{ position:'absolute', top:0, left:0, right:0, bottom:0, alignItems:'center', justifyContent:'center', zIndex:20 },
  completeGif:{ width:350, height:350 },
});
