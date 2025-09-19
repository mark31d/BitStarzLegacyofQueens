// Components/ArticleDetail.js
// Требуется: yarn add react-native-webview @react-native-masked-view/masked-view react-native-linear-gradient

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaskedView from '@react-native-masked-view/masked-view';
import LinearGradient from 'react-native-linear-gradient';
import { WebView } from 'react-native-webview';

const { width: W } = Dimensions.get('window');

const BR = { text: '#D4AF37', sub: '#F5F5DC' };

// фон и контейнеры
const BG_ONB   = require('../assets/onb.webp');
const CONTAINER_SETTINGS = require('../assets/container_settings.webp');
const BUTTON   = require('../assets/button.webp');
const BOOKMARK = require('../assets/bookmark.webp');
const BOOKMARK2= require('../assets/bookmark2.webp');
const BACK     = require('../assets/back.webp');
const GLITTER  = require('../assets/glitter_burst.gif');
const SUCCESS_MP3 = require('../assets/success.mp3');

// 5 артефактов × 4 части
const ART = {
  a1: [require('../assets/a1_0.webp'), require('../assets/a1_1.webp'), require('../assets/a1_2.webp'), require('../assets/a1_3.webp')],
  a2: [require('../assets/a2_0.webp'), require('../assets/a2_1.webp'), require('../assets/a2_2.webp'), require('../assets/a2_3.webp')],
  a3: [require('../assets/a3_0.webp'), require('../assets/a3_1.webp'), require('../assets/a3_2.webp'), require('../assets/a3_3.webp')],
  a4: [require('../assets/a4_0.webp'), require('../assets/a4_1.webp'), require('../assets/a4_2.webp'), require('../assets/a4_3.webp')],
  a5: [require('../assets/a5_0.webp'), require('../assets/a5_1.webp'), require('../assets/a5_2.webp'), require('../assets/a5_3.webp')],
};

const STORAGE      = { pieces: 'nql:artifactPieces:v1' };
const STORAGE_FAVS = 'nql:articleFavs';
const STORAGE_ANS  = 'nql:articleAnswersCorrect:v1';
const PEOPLE = [
  {
    id: 'p1',
    name: 'Hatshepsut',
    years: '(c. 1507–1458 BCE)',
    avatar: require('../assets/person1.webp'),
    body: `Hatshepsut was one of the most remarkable pharaohs of Ancient Egypt, ruling during the 18th Dynasty. She began her reign as regent for her young stepson, Thutmose III, but soon declared herself Pharaoh, adopting full royal titles and even male regalia to legitimize her position.
Her reign was marked by peace and prosperity. Instead of military campaigns, Hatshepsut focused on trade, most famously with the land of Punt. Her expedition brought back myrrh, frankincense, and exotic animals, enriching Egypt’s economy and prestige.
Hatshepsut was also a great builder. She commissioned magnificent temples, obelisks, and monuments, with her mortuary temple at Deir el-Bahri remaining one of Egypt’s greatest architectural wonders.
Despite her success, after her death, her legacy was attacked. Thutmose III attempted to erase her memory, removing her images and inscriptions. Yet her greatness survived, and today Hatshepsut is celebrated as one of Egypt’s most influential rulers.`,
    quizQ: 'Which of these was Hatshepsut most famous for?',
    options: ['Military conquest', 'Trade expeditions', 'Astronomy'],
    correct: 1,
  },
  {
    id: 'p2',
    name: 'Nefertiti',
    years: '(c. 1370–1330 BCE)',
    avatar: require('../assets/person2.webp'),
    body: `Nefertiti, the Great Royal Wife of Pharaoh Akhenaten, remains one of the most iconic figures in world history. Her name means “the beautiful one has come,” and her stunning limestone bust in Berlin has become a symbol of ancient beauty.
Nefertiti played a central role in Egypt’s radical religious revolution. Together with Akhenaten, she promoted the worship of Aten, the sun disk, and diminished the power of the traditional priesthood of Amun. This period is often called the Amarna Revolution.
Depictions of Nefertiti show her as equal to Akhenaten in both religious and political rituals, suggesting she had an unusually high level of authority for a queen. Some scholars even argue she may have ruled Egypt as Pharaoh after Akhenaten’s death.
Her final years are shrouded in mystery. No one knows where she was buried, and her mummy has never been conclusively identified. Nefertiti remains a symbol of beauty, power, and enigma.`,
    quizQ: 'What religion did Nefertiti and Akhenaten promote?',
    options: ['Worship of Aten', 'Worship of Osiris', 'Worship of Ra'],
    correct: 0,
  },
  {
    id: 'p3',
    name: 'Cleopatra VII',
    years: '(69–30 BCE)',
    avatar: require('../assets/person3.webp'),
    body: `Cleopatra VII, the last active ruler of the Ptolemaic dynasty, is one of the most famous women in history. Fluent in several languages, she was a skilled diplomat and strategist.
Cleopatra sought to preserve Egypt’s independence against the growing power of Rome. She allied herself with Julius Caesar, bearing him a son, Caesarion. After Caesar’s assassination, she formed a political and romantic partnership with Mark Antony.
Her reign was marked by political intrigue and war. Cleopatra and Antony fought against Octavian (later Augustus Caesar) but were ultimately defeated at the Battle of Actium. Facing capture, Cleopatra took her own life, famously said to be by the bite of an asp.
Cleopatra’s legacy is one of intelligence, ambition, and charisma. She remains a powerful symbol of female leadership and one of Egypt’s most enduring icons.`,
    quizQ: 'How did Cleopatra die?',
    options: ['Assassinated by Octavian', 'Suicide by snake bite', 'Killed in battle'],
    correct: 1,
  },
  {
    id: 'p4',
    name: 'Nefertari',
    years: '(c. 1290–1255 BCE)',
    avatar: require('../assets/person4.webp'),
    body: `Nefertari was the beloved Great Royal Wife of Pharaoh Ramesses II. Her name means “beautiful companion,” and she was known for her intelligence, diplomacy, and beauty.
Ramesses II built a magnificent temple for Nefertari at Abu Simbel, where statues of the queen stand nearly equal in size to those of the king — a rare honor for an Egyptian consort. The temple’s inscriptions praise her wisdom and role in state affairs.
Nefertari was also an important figure in Egypt’s international relations. Letters from her to the queens of neighboring kingdoms survive, showing her involvement in diplomacy and peace negotiations.
Her tomb in the Valley of the Queens, QV66, is one of the most beautiful in Egypt, with brilliantly preserved wall paintings that depict her journey into the afterlife.`,
    quizQ: 'Where is Nefertari’s most famous tomb located?',
    options: ['Valley of the Kings', 'Valley of the Queens', 'Saqqara'],
    correct: 1,
  },
  {
    id: 'p5',
    name: 'Ahhotep I',
    years: '(c. 1560–1530 BCE)',
    avatar: require('../assets/person5.webp'),
    body: `Ahhotep I lived during a time of turmoil, when Egypt was fighting to expel the Hyksos invaders. She was the wife of Pharaoh Seqenenre Tao and the mother of Ahmose I, who later founded the New Kingdom.
After the deaths of her husband and son Kamose, Ahhotep played a vital role in keeping Egypt united. Inscriptions describe her as one who “pacified Upper Egypt and expelled rebels.” She acted as regent until Ahmose I was old enough to rule.
Ahhotep’s burial treasures included weapons and a golden fly necklace — a military decoration for valor, suggesting she may have commanded troops or inspired them in battle.
She is remembered as a warrior queen who ensured the survival of Egypt’s independence and the rise of a new golden age.`,
    quizQ: 'Which enemy did Ahhotep help fight against?',
    options: ['Hittites', 'Hyksos', 'Persians'],
    correct: 1,
  },
  {
    id: 'p6',
    name: 'Sobekneferu',
    years: '(c. 1806–1802 BCE)',
    avatar: require('../assets/person6.webp'),
    body: `Sobekneferu was the first woman confirmed to have ruled Egypt as Pharaoh. She came to power at the end of the 12th Dynasty after the death of her brother, Amenemhat IV.
Her name means “the beauty of Sobek,” linking her to the crocodile god Sobek. She embraced both male and female regalia, blending traditional symbols of kingship with her female identity.
Sobekneferu’s reign lasted only about four years, but she left behind building projects and inscriptions that confirm her authority as Pharaoh. Her rule ended the powerful 12th Dynasty, and Egypt entered a period of decline afterward.
Though often overshadowed by later queens, Sobekneferu paved the way for future female rulers like Hatshepsut.`,
    quizQ: 'Which god’s name was part of Sobekneferu’s?',
    options: ['Sobek', 'Horus', 'Thoth'],
    correct: 0,
  },
  {
    id: 'p7',
    name: 'Ankhesenamun',
    years: '(c. 1348–1322 BCE)',
    avatar: require('../assets/person7.webp'),
    body: `Ankhesenamun was the wife of the famous boy-king Tutankhamun. She was the daughter of Akhenaten and Nefertiti, making her part of one of Egypt’s most unusual royal families.
Her life was marked by upheaval. As a child, she was married to her own father, Akhenaten, during the Amarna period. Later, she married her half-brother Tutankhamun, helping to restore the old gods after the fall of Aten worship.
After Tutankhamun’s sudden death, Ankhesenamun faced political danger. In desperation, she wrote to the Hittite king, asking him to send her a husband, a rare act that showed her fear of being forced to marry a lesser noble.
Her fate remains a mystery. Some believe she was forced to marry Ay, Tutankhamun’s successor, and may have died young.`,
    quizQ: 'Whom did Ankhesenamun write to for help after Tutankhamun’s death?',
    options: ['The Hittite king', 'The Babylonian king', 'The Persian king'],
    correct: 0,
  },
  {
    id: 'p8',
    name: 'Tiye',
    years: '(c. 1398–1338 BCE)',
    avatar: require('../assets/person8.webp'),
    body: `Queen Tiye was the Great Royal Wife of Amenhotep III and the mother of Akhenaten. Born a commoner, she rose to become one of the most influential queens of Egypt.
Tiye was deeply involved in political and religious life. Foreign rulers respected her, and correspondence survives showing she was treated as an equal in international diplomacy.
She was also an advisor to her son Akhenaten during his controversial religious reforms. Tiye likely played a role in balancing the interests of the royal family and the traditional priesthood.
Her mummy has possibly been identified in the Valley of the Kings, giving us insight into the life of one of Egypt’s most powerful royal mothers.`,
    quizQ: 'What was Queen Tiye’s background before marriage?',
    options: ['A princess', 'A commoner', 'A priestess'],
    correct: 1,
  },
  {
    id: 'p9',
    name: 'Merneith',
    years: '(c. 3000 BCE)',
    avatar: require('../assets/person9.webp'),
    body: `Merneith lived in Egypt’s First Dynasty, making her one of the earliest known queens. She may have ruled as regent for her young son, Den, and some scholars suggest she even ruled in her own right.
Her tomb at Abydos is unusually large and surrounded by subsidiary burials, similar to those of kings, which suggests her elevated status.
Though details of her reign are scarce, Merneith represents the early tradition of female leadership in Egypt, centuries before Hatshepsut or Cleopatra.
Her name appears in official king lists, further proving her importance in Egypt’s early history.`,
    quizQ: 'Where was Merneith’s tomb located?',
    options: ['Saqqara', 'Abydos', 'Giza'],
    correct: 1,
  },
  {
    id: 'p10',
    name: 'Twosret',
    years: '(c. 1191–1189 BCE)',
    avatar: require('../assets/person10.webp'),
    body: `Twosret was the last ruler of the 19th Dynasty. Originally the wife of Seti II, she became regent for his heir, Siptah. After his death, she declared herself Pharaoh.
Her reign was marked by political instability and economic troubles. Despite this, she completed a grand tomb in the Valley of the Kings (KV14), one of the largest royal tombs ever built for a woman.
After her death, Egypt fell into turmoil, and the 20th Dynasty was founded by Setnakhte. Twosret’s reign symbolized the end of an era.
Though her time as Pharaoh was short, she demonstrated once again that women could claim Egypt’s highest throne.`,
    quizQ: 'Where is Twosret’s tomb located?',
    options: ['Valley of the Kings', 'Valley of the Queens', 'Giza'],
    correct: 0,
  },
];
// «статья → какие две части даёт»
const ARTICLE_TO_PIECES = {
  p1:[{a:'a1',i:0},{a:'a1',i:1}], p2:[{a:'a1',i:2},{a:'a1',i:3}],
  p3:[{a:'a2',i:0},{a:'a2',i:1}], p4:[{a:'a2',i:2},{a:'a2',i:3}],
  p5:[{a:'a3',i:0},{a:'a3',i:1}], p6:[{a:'a3',i:2},{a:'a3',i:3}],
  p7:[{a:'a4',i:0},{a:'a4',i:1}], p8:[{a:'a4',i:2},{a:'a4',i:3}],
  p9:[{a:'a5',i:0},{a:'a5',i:1}], p10:[{a:'a5',i:2},{a:'a5',i:3}],
};
const key = (a,i)=>`${a}:${i}`;

// обрезка контента внутри панели
const EDGE_CLIP_TOP = 28;
const EDGE_CLIP_BOTTOM = 28;
const EDGE_FADE = 12;
const clamp01 = (v) => Math.max(0, Math.min(1, v));

// HTML для WebView с <audio>
const makeSoundHtml = (uri) => `
<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<style>html,body{margin:0;background:transparent}</style></head>
<body>
<audio id="s" preload="auto" src="${uri}"></audio>
<script>
  const s=document.getElementById('s');
  window.__playSuccess=()=>{ try{ s.currentTime=0; s.play().catch(()=>{});}catch(e){} };
</script>
</body></html>`;

// ─── вспом. компоненты ───
function PieceUnlocked({ img, showBurst }) {
  return (
    <View style={styles.pieceWrap}>
      <Image source={img} style={styles.piece} resizeMode="contain" />
      {showBurst && (
        <Image source={GLITTER} style={styles.glitter} resizeMode="contain" pointerEvents="none" />
      )}
    </View>
  );
}

export default function ArticleDetail({ route }) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const webRef = useRef(null);

  const { article } = route.params || {};
  const person = useMemo(() => {
    const idMap = {
      hatshepsut:'p1', nefertiti:'p2', cleopatra:'p3', nefertari:'p4', ahhotep:'p5',
      sobekneferu:'p6', ankhesenamun:'p7', tiye:'p8', merneith:'p9', twosret:'p10',
    };
    const personId = idMap[article?.id] || 'p1';
    return PEOPLE.find(p => p.id === personId) || PEOPLE[0];
  }, [article]);

  const [pieceA, pieceB] = ARTICLE_TO_PIECES[person.id] || ARTICLE_TO_PIECES.p1;

  const [answered, setAnswered]   = useState(null);
  const [pieces, setPieces]       = useState(new Set());
  const [favs, setFavs]           = useState(new Set());
  const [answeredCorrect, setAnsweredCorrect] = useState(new Set());

  const [showRewardPieceA, setShowRewardPieceA] = useState(false);
  const [burstVisible, setBurstVisible] = useState(false);

  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const cooldownActive = cooldownUntil > Date.now();

  // подготовка html для WebView с локальным URI
  const successUri = useMemo(() => Image.resolveAssetSource(SUCCESS_MP3).uri, []);
  const soundHtml  = useMemo(() => makeSoundHtml(successUri), [successUri]);

  useEffect(() => {
    let t;
    if (cooldownActive) {
      const tick = () => {
        const left = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));
        setRemaining(left);
        if (left === 0) { setCooldownUntil(0); setAnswered(null); }
      };
      tick(); t = setInterval(tick, 500);
    }
    return () => t && clearInterval(t);
  }, [cooldownActive, cooldownUntil]);

  // загрузка прогресса/избранного/ответов
  useEffect(() => {
    (async () => {
      try {
        const [pRaw, fRaw, aRaw] = await Promise.all([
          AsyncStorage.getItem(STORAGE.pieces),
          AsyncStorage.getItem(STORAGE_FAVS),
          AsyncStorage.getItem(STORAGE_ANS),
        ]);
        if (pRaw) setPieces(new Set(JSON.parse(pRaw)));
        if (fRaw) setFavs(new Set(JSON.parse(fRaw)));
        if (aRaw) {
          const set = new Set(JSON.parse(aRaw));
          setAnsweredCorrect(set);
          if (article?.id && set.has(article.id)) {
            setAnswered(person.correct);
          }
        }
      } catch {}
    })();
  }, [article?.id, person.correct]);

  const saveFavs = useCallback(async (next) => {
    setFavs(next);
    try { await AsyncStorage.setItem(STORAGE_FAVS, JSON.stringify([...next])); } catch {}
  }, []);
  const savePieces = useCallback(async (next) => {
    setPieces(next);
    try { await AsyncStorage.setItem(STORAGE.pieces, JSON.stringify([...next])); } catch {}
  }, []);
  const saveAnswers = useCallback(async (next) => {
    setAnsweredCorrect(next);
    try { await AsyncStorage.setItem(STORAGE_ANS, JSON.stringify([...next])); } catch {}
  }, []);

  const toggleFav = () => {
    const next = new Set(favs);
    next.has(article?.id) ? next.delete(article?.id) : next.add(article?.id);
    saveFavs(next);
  };

  const hasA = pieces.has(key(pieceA.a, pieceA.i));
  const hasB = pieces.has(key(pieceB.a, pieceB.i));

  const onInnerScroll = () => {};

  const playSuccessFeedback = () => {
    // звук из скрытого WebView
    webRef.current?.injectJavaScript('window.__playSuccess && window.__playSuccess(); true;');
    // визуал
    setBurstVisible(true);
    setTimeout(() => setBurstVisible(false), 1500);
  };

  const onAnswer = (i) => {
    if (cooldownActive || answered !== null) return;
    setAnswered(i);
    if (i === person.correct) {
      playSuccessFeedback();

      const ansNext = new Set(answeredCorrect);
      if (article?.id) ansNext.add(article.id);
      saveAnswers(ansNext);

      const nextPieces = new Set(pieces);
      nextPieces.add(key(pieceA.a, pieceA.i));
      nextPieces.add(key(pieceB.a, pieceB.i));
      savePieces(nextPieces);

      setShowRewardPieceA(true);
    } else {
      setCooldownUntil(Date.now() + 60_000);
    }
  };

  const artImgA = ART[pieceA.a][pieceA.i];
  const artImgB = ART[pieceB.a][pieceB.i];
  const isFav = favs.has(article?.id);

  // размеры синей панели
  const PANEL_SRC = Image.resolveAssetSource(CONTAINER_SETTINGS);
  const PANEL_AR  = PANEL_SRC.width / PANEL_SRC.height;
  const PANEL_HEIGHT = (W - 16) / PANEL_AR * 0.9;

  const top0  = clamp01(EDGE_CLIP_TOP / PANEL_HEIGHT);
  const top1  = clamp01((EDGE_CLIP_TOP + EDGE_FADE) / PANEL_HEIGHT);
  const bot1  = clamp01(1 - (EDGE_CLIP_BOTTOM + EDGE_FADE) / PANEL_HEIGHT);
  const bot0  = clamp01(1 - EDGE_CLIP_BOTTOM / PANEL_HEIGHT);

  const showPieceA = hasA || showRewardPieceA;
  const showPieceB = hasB || showRewardPieceA;
  const alreadyCorrect = article?.id ? answeredCorrect.has(article.id) : false;

  return (
    <View style={styles.wrap}>
      <ImageBackground source={BG_ONB} style={styles.bg} resizeMode="cover">
        {/* скрытый WebView для success.mp3 */}
        <WebView
          ref={webRef}
          source={{ html: soundHtml }}
          originWhitelist={['*']}
          style={{ width: 0, height: 0, opacity: 0, position:'absolute' }}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          allowFileAccess
          allowFileAccessFromFileURLs
          allowUniversalAccessFromFileURLs
        />

        <View style={{ paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 12) }}>
          {/* Back */}
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Image source={BACK} style={styles.backImg} resizeMode="contain" />
          </Pressable>

          {/* Скролл всего экрана */}
          <ScrollView contentContainerStyle={styles.screenInner} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.headerCard}>
              <ImageBackground
                source={require('../assets/article_container.webp')}
                resizeMode="stretch"
                style={styles.headerBg}
              >
                <Pressable onPress={toggleFav} hitSlop={10} style={styles.bookmarkBox}>
                  <Image source={isFav ? BOOKMARK2 : BOOKMARK} style={styles.bookmarkImg} resizeMode="contain" />
                </Pressable>
                <View style={styles.headerContent}>
                  <Image source={person.avatar} style={styles.avatar} resizeMode="contain" />
                  <View style={styles.textContainer}>
                    <Text style={styles.title}>{person.name}</Text>
                    <Text style={styles.years}>{person.years}</Text>
                  </View>
                </View>
              </ImageBackground>
            </View>

            {/* Контент-панель с маской краёв */}
            <View style={styles.contentPanel}>
              <ImageBackground source={CONTAINER_SETTINGS} resizeMode="stretch" style={[styles.contentBg, { height: PANEL_HEIGHT }]}>
                <MaskedView
                  style={StyleSheet.absoluteFill}
                  maskElement={
                    <LinearGradient
                      style={StyleSheet.absoluteFill}
                      colors={['transparent','black','black','transparent']}
                      locations={[top0, top1, bot1, bot0]}
                    />
                  }
                >
                  <ScrollView
                    style={StyleSheet.absoluteFill}
                    contentContainerStyle={styles.scrollInner}
                    showsVerticalScrollIndicator={false}
                    nestedScrollEnabled
                    bounces={false}
                    alwaysBounceVertical={false}
                    overScrollMode="never"
                    contentInsetAdjustmentBehavior="never"
                    {...(Platform.OS === 'android' ? { fadingEdgeLength: 24 } : {})}
                    onScroll={onInnerScroll}
                    scrollEventThrottle={64}
                  >
                    {person.body.split('\n').map((p, i) => (
                      <Text key={i} style={styles.p}>{p.trim()}</Text>
                    ))}

                    {showPieceA && (
                      <>
                        <Text style={styles.unlockTxt}>You’ve unlocked a piece of an ancient{'\n'}artifact.</Text>
                        <PieceUnlocked img={artImgA} showBurst={burstVisible} />
                      </>
                    )}

                    <Text style={styles.question}>{person.quizQ}</Text>

                    <View style={styles.answersRow}>
                      {person.options.map((opt, i) => {
                        const pressed = answered !== null || alreadyCorrect;
                        const wrong = !alreadyCorrect && pressed && i === answered && i !== person.correct;
                        const good  = (alreadyCorrect && i === person.correct) || (pressed && i === person.correct);
                        return (
                          <Pressable
                            key={i}
                            onPress={() => onAnswer(i)}
                            disabled={cooldownActive || pressed}
                            style={[styles.answerBtn, (cooldownActive || pressed) && { opacity: 0.85 }]}
                          >
                            <ImageBackground source={BUTTON} resizeMode="stretch" style={styles.buttonBg}>
                              <Text style={[styles.answerTxt, good && styles.answerCorrect, wrong && styles.answerWrong]}>
                                {opt}
                              </Text>
                            </ImageBackground>
                          </Pressable>
                        );
                      })}
                    </View>

                    {cooldownActive && (
                      <Text style={styles.cooldown}>
                        Try again in {String(Math.floor(remaining/60)).padStart(2,'0')}:{String(remaining%60).padStart(2,'0')}
                      </Text>
                    )}

                    {showPieceB && (
                      <>
                        <Text style={[styles.unlockTxt, { marginTop: 14 }]}>
                          You’ve unlocked a piece of an ancient{'\n'}artifact.
                        </Text>
                        <PieceUnlocked img={artImgB} showBurst={false} />
                      </>
                    )}
                  </ScrollView>
                </MaskedView>
              </ImageBackground>
            </View>
          </ScrollView>
        </View>
      </ImageBackground>
    </View>
  );
}

/* ───────── styles ───────── */
const SIDE_PAD = 8, CARD_H = 176, PORTRAIT_W = 100, BM_W = 26, BM_H = 34, RESERVE_R = BM_W + 40;

const styles = StyleSheet.create({
  wrap:{ flex:1 }, bg:{ flex:1 }, screenInner:{ paddingBottom:90 },

  headerCard:{ width: W - SIDE_PAD * 2, alignSelf:'center', marginVertical:10 },
  headerBg:{ width:'100%', height:CARD_H, justifyContent:'center', alignItems:'center' },
  bookmarkBox:{ position:'absolute', top:26, right:43, width:BM_W, height:BM_H, alignItems:'center', justifyContent:'center' },
  bookmarkImg:{ width:BM_W, height:BM_H },
  headerContent:{ flexDirection:'row', alignItems:'center', justifyContent:'center', width:'92%', alignSelf:'center', gap:16, paddingLeft:40, paddingRight:RESERVE_R },
  avatar:{ width:PORTRAIT_W, height:PORTRAIT_W, right:-12 },
  textContainer:{ alignItems:'center', justifyContent:'center' },
  title:{ color:BR.text, fontSize:24, fontWeight:'800', textAlign:'center' },
  years:{ color:BR.sub, fontSize:16, marginTop:6, textAlign:'center' },

  contentPanel:{ width: W - SIDE_PAD * 2, alignSelf:'center', marginTop:12, marginBottom:8 },
  contentBg:{ width:'100%', borderRadius:24, overflow:'hidden' },

  scrollInner:{ paddingHorizontal:24, paddingTop:20, paddingBottom:200 },
  p:{ color:BR.sub, fontSize:16.5, lineHeight:24, marginBottom:10, padding:10 },

  unlockTxt:{ color:BR.text, textAlign:'center', fontSize:18, fontWeight:'700', marginTop:6, marginBottom:8 },

  pieceWrap:{ width:160, height:130, alignSelf:'center', marginBottom:8, alignItems:'center', justifyContent:'center', position:'relative', overflow:'visible' },
  piece:{ width:160, height:130 },
  glitter:{
    position:'absolute', left:'50%', top:'50%',
    width:320, height:260, marginLeft:-160, marginTop:-130, zIndex:2, opacity:1,
  },

  question:{ color:BR.text, textAlign:'center', fontSize:16, fontWeight:'800', marginTop:10, marginBottom:10 },
  answersRow:{ flexDirection:'row', gap:8, justifyContent:'space-between' },
  answerBtn:{ flex:1, height:60, borderRadius:14, overflow:'hidden' },
  buttonBg:{ flex:1, alignItems:'center', justifyContent:'center' },
  answerTxt:{ color:BR.text, fontSize:14, fontWeight:'800', textAlign:'center', paddingHorizontal:4 },
  answerCorrect:{ color:'#0DB06B' },
  answerWrong:{ color:'#E53935' },

  cooldown:{ color:'#FFD36B', textAlign:'center', fontWeight:'800', marginTop:8 },

  backBtn:{ position:'absolute', bottom:18, width:44, height:44, alignItems:'center', justifyContent:'center', zIndex:10 },
  backImg:{ width:44, height:44 },
});
