// Components/FavoritesScreen.js - Журнал заметок (улучшенный UI без контейнеров-картинок)
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ImageBackground,
  FlatList,
  Pressable,
  Dimensions,
  TextInput,
  Modal,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';

const { width: W } = Dimensions.get('window');

const BR = {
  text: '#D4AF37',
  sub:  '#F5F5DC',
  accent: '#DC2626',
  glass: 'rgba(13, 19, 33, 0.55)',
  glassStrong: 'rgba(10, 12, 20, 0.72)',
  stroke: 'rgba(212, 175, 55, 0.22)',
  strokeStrong: 'rgba(212, 175, 55, 0.35)',
};

const BG_ONB   = require('../assets/onb.webp');
const EMPTY_IMG = require('../assets/text_save.webp');

// Ключи для хранения заметок
const JOURNAL_STORAGE_KEY = 'nql:journal:entries';

// Категории
const CATEGORIES = {
  personal: { name: 'Personal', color: '#3B82F6' },
  work: { name: 'Work', color: '#10B981' },
  travel: { name: 'Travel', color: '#F59E0B' },
  ideas: { name: 'Ideas', color: '#8B5CF6' },
  memories: { name: 'Memories', color: '#EC4899' },
  goals: { name: 'Goals', color: '#EF4444' },
};

// Настроения (эмодзи сегменты)
const MOODS = ['🙂','😔','🥱','😕','🤩','😡','😌','🎉'];
const MOOD_MAP = {
  happy:'🙂', sad:'😔', tired:'🥱', confused:'😕', excited:'🤩', angry:'😡', calm:'😌', celebrating:'🎉'
};

export default function FavoritesScreen() {
  // Все хуки должны быть в начале функции
  const [journalEntries, setJournalEntries] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filterMood, setFilterMood] = useState('any');
  const [sortBy, setSortBy] = useState('date_desc');
  const [rangeFrom, setRangeFrom] = useState(null);
  const [rangeTo, setRangeTo] = useState(null);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [newEntry, setNewEntry] = useState({
    title: '',
    content: '',
    category: 'personal',
    date: new Date(),
    time: new Date(),
    mood: 'happy',
    tags: [],
    image: null,
  });
  const [tagDraft, setTagDraft] = useState('');

  // Все хуки должны быть в начале
  const loadJournalEntries = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(JOURNAL_STORAGE_KEY);
      if (raw) {
        const entries = JSON.parse(raw);
        setJournalEntries(entries.sort((a, b) => new Date(b.date || b.time) - new Date(a.date || a.time)));
      }
    } catch (error) {
      console.error('Error loading journal entries:', error);
    }
  }, []);

  useEffect(() => {
    loadJournalEntries();
  }, [loadJournalEntries]);

  useFocusEffect(
    useCallback(() => {
      loadJournalEntries();
    }, [loadJournalEntries])
  );

  // Фильтрация/сортировка
  const filteredEntries = useMemo(() => {
    let list = journalEntries.slice();

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(entry =>
        entry.title?.toLowerCase().includes(q) ||
        entry.content?.toLowerCase().includes(q) ||
        (entry.tags || []).some(t => t.toLowerCase().includes(q))
      );
    }
    if (selectedCategory !== 'all') {
      list = list.filter(e => e.category === selectedCategory);
    }
    if (filterMood !== 'any') {
      // filterMood — это эмодзи; у записей mood — ключ. Сопоставим через MOOD_MAP
      list = list.filter(e => MOOD_MAP[e.mood] === filterMood);
    }
    if (rangeFrom) {
      list = list.filter(e => new Date(e.date || e.time) >= rangeFrom);
    }
    if (rangeTo) {
      list = list.filter(e => new Date(e.date || e.time) <= rangeTo);
    }

    // сортировка
    if (sortBy === 'date_desc') {
      list.sort((a, b) => new Date(b.date || b.time) - new Date(a.date || a.time));
    } else if (sortBy === 'date_asc') {
      list.sort((a, b) => new Date(a.date || a.time) - new Date(b.date || b.time));
    } else if (sortBy === 'title') {
      list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    }

    return list;
  }, [journalEntries, searchQuery, selectedCategory, filterMood, rangeFrom, rangeTo, sortBy]);

  const resetNewEntry = useCallback(() => {
    setEditingEntry(null);
    setSelectedImage(null);
    setTagDraft('');
    setNewEntry({
      title: '',
      content: '',
      category: 'personal',
      date: new Date(),
      time: new Date(),
      mood: 'happy',
      tags: [],
      image: null,
    });
  }, []);

  const saveJournalEntry = useCallback(async (entry) => {
    try {
      const entries = [...journalEntries];

      // слепим финальную дату с временем
      const d = new Date(entry.date);
      const t = new Date(entry.time);
      d.setHours(t.getHours(), t.getMinutes(), 0, 0);
      const finalEntry = { ...entry, date: d.toISOString() };

      if (editingEntry) {
        const index = entries.findIndex(e => e.id === editingEntry.id);
        if (index !== -1) entries[index] = { ...finalEntry, id: editingEntry.id };
      } else {
        entries.unshift({ ...finalEntry, id: Date.now().toString() });
      }
      await AsyncStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(entries));
      setJournalEntries(entries);
      setShowAddModal(false);
      resetNewEntry();
    } catch (error) {
      console.error('Error saving journal entry:', error);
      Alert.alert('Error', 'Failed to save journal entry');
    }
  }, [journalEntries, editingEntry, resetNewEntry]);

  const deleteEntry = useCallback(async (id) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const entries = journalEntries.filter(e => e.id !== id);
              await AsyncStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(entries));
              setJournalEntries(entries);
            } catch (error) {
              console.error('Error deleting entry:', error);
              Alert.alert('Error', 'Failed to delete entry');
            }
          }
        }
      ]
    );
  }, [journalEntries]);

  const editEntry = useCallback((entry) => {
    setEditingEntry(entry);
    setSelectedImage(entry.image || null);
    setNewEntry({
      title: entry.title,
      content: entry.content,
      category: entry.category,
      date: new Date(entry.date),
      time: new Date(entry.date),
      mood: entry.mood || 'happy',
      tags: entry.tags || [],
      image: entry.image || null,
    });
    setShowAddModal(true);
  }, []);

  // Image picker
  const selectImage = useCallback(() => {
    const options = { mediaType: 'photo', quality: 0.85, maxWidth: 1200, maxHeight: 1200 };
    Alert.alert('Add Image', 'Choose an option', [
      { text: 'Camera', onPress: () => launchCamera(options, handleImageResponse) },
      { text: 'Gallery', onPress: () => launchImageLibrary(options, handleImageResponse) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, []);

  const handleImageResponse = useCallback((response) => {
    if (response?.assets?.[0]) {
      setSelectedImage(response.assets[0]);
      setNewEntry(prev => ({ ...prev, image: response.assets[0] }));
    }
  }, []);

  // Date range filters
  const onFromChange = useCallback((e, d) => {
    setShowFromPicker(false);
    if (d) setRangeFrom(new Date(d.setHours(0,0,0,0)));
  }, []);
  const onToChange = useCallback((e, d) => {
    setShowToPicker(false);
    if (d) setRangeTo(new Date(d.setHours(23,59,59,999)));
  }, []);

  const clearRange = useCallback(() => { setRangeFrom(null); setRangeTo(null); }, []);

  // Date/time in modal
  const onDateChange = useCallback((e, d) => {
    if (Platform.OS !== 'ios') setShowDatePicker(false);
    if (d) setNewEntry(prev => ({ ...prev, date: d }));
  }, []);
  const onTimeChange = useCallback((e, d) => {
    if (Platform.OS !== 'ios') setShowTimePicker(false);
    if (d) setNewEntry(prev => ({ ...prev, time: d }));
  }, []);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Tags
  const addTag = useCallback(() => {
    const t = tagDraft.trim().replace(/^#/, '');
    if (!t) return;
    if (newEntry.tags.includes(t)) { setTagDraft(''); return; }
    setNewEntry(prev => ({ ...prev, tags: [...prev.tags, t] }));
    setTagDraft('');
  }, [tagDraft, newEntry.tags]);

  const removeTag = useCallback((tag) => {
    setNewEntry(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  }, []);

  // Карточка записи (без картинок-контейнеров)
  const renderEntry = ({ item }) => {
    const category = CATEGORIES[item.category] || CATEGORIES.personal;
    const dateObj = new Date(item.date);
    const dateStr = dateObj.toLocaleDateString(undefined, { day:'2-digit', month:'short', year:'numeric' });
    const timeStr = dateObj.toLocaleTimeString(undefined, { hour:'2-digit', minute:'2-digit' });

    return (
      <Pressable onPress={() => editEntry(item)} style={styles.entryCard}>
        <View style={[styles.entrySurface, shadow(8)]}>
          {/* Левая цветная полоса категории */}
          <View style={[styles.entryAccent, { backgroundColor: category.color }]} />
          <View style={styles.entryBody}>
            <View style={styles.entryHeadRow}>
              <Text numberOfLines={1} style={styles.entryTitle}>{item.title || 'Untitled'}</Text>
              <Text style={styles.entryMood}>{MOOD_MAP[item.mood || 'happy']}</Text>
            </View>

            <Text style={styles.entryDate}>{dateStr} • {timeStr}</Text>

            {item.image && (
              <Image source={{ uri: item.image.uri }} style={styles.entryImage} resizeMode="cover" />
            )}

            {!!item.content && (
              <Text numberOfLines={3} style={styles.entryContent}>{item.content}</Text>
            )}

            {/* Теги */}
            {item.tags?.length > 0 && (
              <View style={styles.tagsRow}>
                {item.tags.slice(0,4).map((t, idx) => (
                  <View key={idx} style={styles.tagPill}>
                    <Text style={styles.tagPillText}>#{t}</Text>
                  </View>
                ))}
                {item.tags.length > 4 && (
                  <View style={[styles.tagPill, { backgroundColor:'transparent', borderStyle:'dashed' }]}>
                    <Text style={styles.tagPillText}>+{item.tags.length - 4}</Text>
                  </View>
                )}
              </View>
            )}

            <View style={styles.entryActions}>
              <Pressable onPress={() => editEntry(item)} style={[styles.ghostBtn, { marginRight: 6 }]}>
                <Text style={styles.ghostBtnTxt}>Edit</Text>
              </Pressable>
              <Pressable onPress={() => deleteEntry(item.id)} style={styles.dangerBtn}>
                <Text style={styles.dangerBtnTxt}>Delete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.wrap}>
      <ImageBackground source={BG_ONB} style={styles.bg} resizeMode="cover">
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >

        {/* Верхняя панель: заголовок + поиск */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Journal</Text>
          <View style={[styles.searchRow, shadow(4)]}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search entries, tags..."
              placeholderTextColor="rgba(212, 175, 55, 0.6)"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {!!searchQuery && (
              <Pressable onPress={() => setSearchQuery('')} style={styles.clearBtn}>
                <Text style={styles.clearBtnTxt}>×</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Фильтры: Категории (чипы) */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          <Chip
            label="All"
            active={selectedCategory==='all'}
            onPress={() => setSelectedCategory('all')}
          />
          {Object.entries(CATEGORIES).map(([key, cat]) => (
            <Chip
              key={key}
              label={cat.name}
              active={selectedCategory===key}
              color={cat.color}
              onPress={() => setSelectedCategory(key)}
            />
          ))}
        </ScrollView>

        {/* Панель фильтров: Mood + Date range + Sort */}
        <View style={styles.filtersCard}>
          {/* Mood */}
          <View style={styles.filterBlock}>
            <Text style={styles.filterLabel}>Mood</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.moodRow}>
              <Chip label="Any" active={filterMood==='any'} onPress={() => setFilterMood('any')} />
              {MOODS.map(m => (
                <Pressable
                  key={m}
                  onPress={() => setFilterMood(m)}
                  style={[styles.moodChip, filterMood===m && styles.moodChipActive]}
                >
                  <Text style={styles.moodChipTxt}>{m}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Date range */}
          <View style={[styles.filterBlock, { marginTop: 8 }]}>
            <Text style={styles.filterLabel}>Date range</Text>
            <View style={styles.rangeRow}>
              <Pressable style={styles.rangeBtn} onPress={() => setShowFromPicker(true)}>
                <Text style={styles.rangeBtnTxt}>{rangeFrom ? rangeFrom.toLocaleDateString() : 'From'}</Text>
              </Pressable>
              <Pressable style={styles.rangeBtn} onPress={() => setShowToPicker(true)}>
                <Text style={styles.rangeBtnTxt}>{rangeTo ? rangeTo.toLocaleDateString() : 'To'}</Text>
              </Pressable>
              {(rangeFrom || rangeTo) && (
                <Pressable style={styles.rangeClear} onPress={clearRange}>
                  <Text style={styles.rangeClearTxt}>Clear</Text>
                </Pressable>
              )}
            </View>
          </View>

          {/* Sort */}
          <View style={[styles.filterBlock, { marginTop: 8 }]}>
            <Text style={styles.filterLabel}>Sort by</Text>
            <View style={styles.sortRow}>
              <Segmented
                options={[
                  { key:'date_desc', label:'Newest' },
                  { key:'date_asc',  label:'Oldest' },
                  { key:'title',     label:'Title'  },
                ]}
                value={sortBy}
                onChange={setSortBy}
              />
            </View>
          </View>
        </View>

        {/* Пикеры диапазона дат */}
        {showFromPicker && (
          <DateTimePicker value={rangeFrom || new Date()} mode="date" onChange={onFromChange} />
        )}
        {showToPicker && (
          <DateTimePicker value={rangeTo || new Date()} mode="date" onChange={onToChange} />
        )}

        {/* Список */}
        <FlatList
          data={filteredEntries}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 120, paddingTop: 8 }}
          renderItem={renderEntry}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Image source={EMPTY_IMG} style={styles.emptyImg} resizeMode="contain" />
              <Text style={styles.emptyText}>No entries yet</Text>
              <Text style={styles.emptySubtext}>Tap + to add your first entry</Text>
            </View>
          }
        />

        {/* Кнопка добавления */}
        <Pressable style={[styles.addButton, shadow(10)]} onPress={() => setShowAddModal(true)}>
          <Text style={styles.addButtonText}>+</Text>
        </Pressable>

        {/* Модалка добавления/редакции — собственные контейнеры, без картинок */}
        <Modal
          visible={showAddModal}
          animationType="fade"
          transparent
          onRequestClose={() => { setShowAddModal(false); resetNewEntry(); }}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.sheet, shadow(16)]}>
              {/* Заголовок */}
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>{editingEntry ? 'Edit Entry' : 'New Entry'}</Text>
                <Pressable
                  onPress={() => { setShowAddModal(false); resetNewEntry(); }}
                  style={styles.sheetClose}
                >
                  <Text style={styles.sheetCloseTxt}>×</Text>
                </Pressable>
              </View>

              <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 22 }}>
                {/* Mood */}
                <View style={styles.fieldBlock}>
                  <Text style={styles.label}>Mood</Text>
                  <View style={styles.moodRow}>
                    {Object.entries(MOOD_MAP).map(([key, emoji]) => (
                      <Pressable
                        key={key}
                        onPress={() => setNewEntry(prev => ({ ...prev, mood: key }))}
                        style={[styles.moodPick, newEntry.mood===key && styles.moodPickActive]}
                      >
                        <Text style={styles.moodPickTxt}>{emoji}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Title */}
                <View style={styles.fieldBlock}>
                  <Text style={styles.label}>Title</Text>
                  <TextInput
                    style={styles.input}
                    value={newEntry.title}
                    onChangeText={(text) => setNewEntry(prev => ({ ...prev, title: text }))}
                    placeholder="Enter title..."
                    placeholderTextColor="rgba(212, 175, 55, 0.6)"
                  />
                </View>

                {/* Category */}
                <View style={styles.fieldBlock}>
                  <Text style={styles.label}>Category</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
                    {Object.entries(CATEGORIES).map(([key, cat]) => (
                      <Pressable
                        key={key}
                        onPress={() => setNewEntry(prev => ({ ...prev, category: key }))}
                        style={[
                          styles.catChip,
                          { borderColor: cat.color },
                          newEntry.category===key && { backgroundColor: cat.color+'22' },
                        ]}
                      >
                        <View style={[styles.catDot, { backgroundColor: cat.color }]} />
                        <Text style={[styles.catChipTxt, { color: cat.color }]}>{cat.name}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>

                {/* Date & Time (собственные кнопки → системные пикеры) */}
                <View style={styles.fieldBlock}>
                  <Text style={styles.label}>Date & Time</Text>
                  <View style={styles.dtRow}>
                    <Pressable style={styles.dtBtn} onPress={() => setShowDatePicker(true)}>
                      <Text style={styles.dtBtnTxt}>{newEntry.date.toLocaleDateString()}</Text>
                    </Pressable>
                    <Pressable style={styles.dtBtn} onPress={() => setShowTimePicker(true)}>
                      <Text style={styles.dtBtnTxt}>
                        {newEntry.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </Pressable>
                  </View>

                  {showDatePicker && (
                    <DateTimePicker value={newEntry.date} mode="date" display="default" onChange={onDateChange} />
                  )}
                  {showTimePicker && (
                    <DateTimePicker value={newEntry.time} mode="time" display="default" onChange={onTimeChange} />
                  )}
                </View>

                {/* Image */}
                <View style={styles.fieldBlock}>
                  <Text style={styles.label}>Image</Text>
                  <View style={styles.row}>
                    <Pressable style={styles.actionBtn} onPress={selectImage}>
                      <Text style={styles.actionBtnTxt}>{newEntry.image ? 'Change Image' : 'Select Image'}</Text>
                    </Pressable>
                    {newEntry.image && (
                      <Pressable
                        style={[styles.actionBtn, { backgroundColor:'transparent', borderStyle:'dashed' }]}
                        onPress={() => { setSelectedImage(null); setNewEntry(prev => ({ ...prev, image: null })); }}
                      >
                        <Text style={styles.actionBtnTxt}>Remove</Text>
                      </Pressable>
                    )}
                  </View>
                  {newEntry.image && (
                    <Image source={{ uri: newEntry.image.uri }} style={styles.previewImage} resizeMode="cover" />
                  )}
                </View>

                {/* Content */}
                <View style={styles.fieldBlock}>
                  <Text style={styles.label}>Content</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={newEntry.content}
                    onChangeText={(text) => setNewEntry(prev => ({ ...prev, content: text }))}
                    placeholder="Tell about your day..."
                    placeholderTextColor="rgba(212, 175, 55, 0.6)"
                    multiline
                    numberOfLines={5}
                    textAlignVertical="top"
                  />
                </View>

                {/* Tags */}
                <View style={styles.fieldBlock}>
                  <Text style={styles.label}>Tags</Text>
                  <View style={styles.tagInputRow}>
                    <TextInput
                      style={[styles.input, { flex: 1, marginRight: 8 }]}
                      value={tagDraft}
                      onChangeText={setTagDraft}
                      placeholder="Add a tag and press +"
                      placeholderTextColor="rgba(212, 175, 55, 0.6)"
                      onSubmitEditing={addTag}
                    />
                    <Pressable style={styles.addTagBtn} onPress={addTag}>
                      <Text style={styles.addTagBtnTxt}>+</Text>
                    </Pressable>
                  </View>
                  {newEntry.tags.length > 0 && (
                    <View style={styles.tagsRow}>
                      {newEntry.tags.map((t) => (
                        <Pressable key={t} onPress={() => removeTag(t)} style={styles.tagPillRem}>
                          <Text style={styles.tagPillText}>#{t}  ×</Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>

                {/* Save */}
                <Pressable style={[styles.saveButton, shadow(6)]} onPress={() => saveJournalEntry(newEntry)}>
                  <Text style={styles.saveButtonText}>{editingEntry ? 'Save Changes' : 'Create Entry'}</Text>
                </Pressable>
              </ScrollView>
            </View>
          </View>
        </Modal>
        </ScrollView>
      </ImageBackground>
    </View>
  );
}

/* ───────── вспомогательные компоненты ───────── */
function Chip({ label, active, onPress, color }) {
  return (
    <Pressable onPress={onPress} style={[
      styles.chip,
      active && { backgroundColor: (color ? color+'22' : 'rgba(220,38,38,0.25)'), borderColor: color || BR.accent }
    ]}>
      <Text style={[
        styles.chipTxt,
        active && { color: color || BR.text, fontWeight:'700' }
      ]}>
        {label}
      </Text>
    </Pressable>
  );
}

function Segmented({ options, value, onChange }) {
  return (
    <View style={styles.segmented}>
      {options.map(opt => {
        const active = opt.key === value;
        return (
          <Pressable
            key={opt.key}
            onPress={() => onChange(opt.key)}
            style={[styles.segment, active && styles.segmentActive]}
          >
            <Text style={[styles.segmentTxt, active && styles.segmentTxtActive]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ───────── стили ───────── */
const shadow = (elev=6) => Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: elev,
    shadowOffset: { width: 0, height: Math.ceil(elev/2) },
  },
  android: { elevation: elev }
});

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  bg: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 20 },

  header:{ paddingHorizontal:16, paddingTop:18, paddingBottom:8 },
  headerTitle:{
    color: BR.text, fontSize: 28, fontWeight:'900', textAlign:'center', marginBottom: 14,
  },
  searchRow:{
    flexDirection:'row',
    alignItems:'center',
    backgroundColor: BR.glass,
    borderWidth: 1, borderColor: BR.stroke,
    borderRadius: 14,
    paddingLeft: 12,
  },
  searchInput:{
    flex:1,
    color: BR.text,
    fontSize:16,
    paddingVertical: 10,
  },
  clearBtn:{
    width:36,height:36,borderRadius:9,alignItems:'center',justifyContent:'center',
    margin:6, backgroundColor:'rgba(255,255,255,0.08)',
    borderWidth:1, borderColor:BR.stroke,
  },
  clearBtnTxt:{ color:'#fff', fontSize:18, fontWeight:'900' },

  chipsRow:{ paddingHorizontal:12, paddingBottom:8 },
  chip:{
    marginRight:8,
    backgroundColor: BR.glass,
    borderWidth:1,borderColor:BR.stroke,
    paddingHorizontal:12,paddingVertical:8,borderRadius:16,
  },
  chipTxt:{ color:BR.sub, fontSize:14, fontWeight:'600' },

  filtersCard:{
    marginHorizontal:12, marginBottom:8,
    backgroundColor: BR.glassStrong,
    borderWidth:1, borderColor: BR.strokeStrong,
    borderRadius: 16,
    padding: 12,
    ...shadow(4),
  },
  filterBlock:{},
  filterLabel:{ color:BR.text, fontWeight:'800', marginBottom:6 },
  moodRow:{ flexDirection:'row', alignItems:'center' },

  moodChip:{
    width:40,height:40, borderRadius:12, alignItems:'center', justifyContent:'center',
    backgroundColor: BR.glass, borderWidth:1, borderColor: BR.stroke, marginRight:6
  },
  moodChipActive:{ backgroundColor:'rgba(220,38,38,0.25)', borderColor:BR.accent },
  moodChipTxt:{ fontSize:20 },

  rangeRow:{ flexDirection:'row', alignItems:'center' },
  rangeBtn:{
    flex:1, marginRight:8,
    backgroundColor: BR.glass,
    borderWidth:1, borderColor: BR.stroke,
    borderRadius:12, paddingHorizontal:12, paddingVertical:10,
  },
  rangeBtnTxt:{ color:BR.text, fontWeight:'700' },
  rangeClear:{
    paddingHorizontal:12, paddingVertical:10, borderRadius:12,
    borderWidth:1, borderColor:BR.stroke, backgroundColor:'rgba(255,255,255,0.06)'
  },
  rangeClearTxt:{ color:'#fff' },

  sortRow:{},
  segmented:{
    flexDirection:'row',
    backgroundColor: BR.glass,
    borderWidth:1, borderColor: BR.stroke,
    borderRadius: 12, overflow:'hidden'
  },
  segment:{
    paddingVertical:8,paddingHorizontal:12, flex:1, alignItems:'center'
  },
  segmentActive:{ backgroundColor:'rgba(220,38,38,0.25)' },
  segmentTxt:{ color:BR.sub, fontWeight:'700' },
  segmentTxtActive:{ color:BR.text },

  // Карточки
  entryCard:{ width: W-16, alignSelf:'center', marginVertical:8 },
  entrySurface:{
    flexDirection:'row',
    backgroundColor: 'rgba(14,18,30,0.78)',
    borderWidth:1, borderColor:'rgba(255,255,255,0.06)',
    borderRadius: 16,
    overflow:'hidden',
  },
  entryAccent:{ width:6 },
  entryBody:{ flex:1, padding:12 },
  entryHeadRow:{ flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  entryTitle:{ color:BR.text, fontSize:18, fontWeight:'900', flex:1, marginRight:8 },
  entryMood:{ fontSize:20 },
  entryDate:{ color:BR.sub, opacity:0.9, marginTop:2, marginBottom:8 },
  entryImage:{ width:'100%', height:140, borderRadius:10, marginBottom:8 },
  entryContent:{ color:BR.sub, lineHeight:20, marginBottom:8 },

  tagsRow:{ flexDirection:'row', flexWrap:'wrap', marginBottom:8 },
  tagPill:{
    borderWidth:1, borderColor:'rgba(220,38,38,0.35)',
    backgroundColor:'rgba(220,38,38,0.15)',
    paddingHorizontal:10, paddingVertical:4, borderRadius:12, marginRight:6, marginBottom:6
  },
  tagPillRem:{
    borderWidth:1, borderColor:'rgba(220,38,38,0.35)',
    backgroundColor:'rgba(220,38,38,0.08)',
    paddingHorizontal:10, paddingVertical:4, borderRadius:12, marginRight:6, marginBottom:6
  },
  tagPillText:{ color:BR.accent, fontWeight:'700', fontSize:12 },

  entryActions:{ flexDirection:'row', justifyContent:'flex-end' },
  ghostBtn:{
    borderWidth:1, borderColor:BR.stroke,
    backgroundColor:'transparent', paddingHorizontal:12, paddingVertical:8, borderRadius:10
  },
  ghostBtnTxt:{ color:BR.text, fontWeight:'800' },
  dangerBtn:{
    marginLeft:6, backgroundColor:'rgba(220,38,38,0.9)',
    paddingHorizontal:14, paddingVertical:8, borderRadius:10
  },
  dangerBtnTxt:{ color:'#fff', fontWeight:'900' },

  // Пустое состояние
  emptyWrap:{ flex:1, alignItems:'center', justifyContent:'center', paddingHorizontal:16, paddingTop:32 },
  emptyImg:{ width: Math.min(W-4, 300), height: (Math.min(W-4,300)*3)/4, marginTop:50, opacity:0.7 },
  emptyText:{ color:BR.text, fontSize:20, fontWeight:'bold', marginTop:20, textAlign:'center' },
  emptySubtext:{ color:BR.sub, fontSize:16, marginTop:8, textAlign:'center' },

  // FAB
  addButton:{
    position:'absolute', bottom: 85, right: 20,
    width:60, height:60, borderRadius:30,
    backgroundColor: BR.accent, alignItems:'center', justifyContent:'center'
  },
  addButtonText:{ color:'#fff', fontSize:28, fontWeight:'900', marginTop:-2 },
  saveButton:{ 
    backgroundColor: BR.accent, 
    paddingVertical: 12, 
    paddingHorizontal: 24, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginTop: 16 
  },
  saveButtonText:{ color:'#fff', fontSize:16, fontWeight:'700', textAlign:'center' },

  // Sheet-модалка
  modalOverlay:{ flex:1, backgroundColor:'rgba(0,0,0,0.55)', justifyContent:'flex-end' },
  sheet:{
    maxHeight:'88%',
    backgroundColor:'rgba(11,15,25,0.96)',
    borderTopLeftRadius:22, borderTopRightRadius:22,
    borderWidth:1, borderColor:'rgba(255,255,255,0.06)',
  },
  sheetHeader:{
    paddingHorizontal:16, paddingTop:12, paddingBottom:8, alignItems:'center'
  },
  sheetTitle:{ color:BR.text, fontSize:18, fontWeight:'900' },
  sheetClose:{
    position:'absolute', right:10, top:10,
    width:36,height:36,borderRadius:12,alignItems:'center',justifyContent:'center',
    backgroundColor:'rgba(255,255,255,0.06)', borderWidth:1, borderColor:BR.stroke
  },
  sheetCloseTxt:{ color:'#fff', fontSize:20, fontWeight:'900', marginTop:-2 },

  // Поля
  fieldBlock:{ marginBottom:14 },
  label:{ color:BR.text, fontSize:15, fontWeight:'800', marginBottom:8 },
  input:{
    backgroundColor:'rgba(14,18,30,0.85)',
    borderWidth:1, borderColor:'rgba(255,255,255,0.07)',
    borderRadius:12, paddingHorizontal:14, paddingVertical:12, color:BR.text, fontSize:16
  },
  textArea:{ height:120 },

  categoryRow:{ alignItems:'center' },
  catChip:{
    flexDirection:'row', alignItems:'center',
    borderWidth:1, paddingHorizontal:12, paddingVertical:8,
    borderRadius:16, marginRight:8, backgroundColor:'rgba(14,18,30,0.85)'
  },
  catDot:{ width:8, height:8, borderRadius:4, marginRight:6 },
  catChipTxt:{ fontWeight:'800' },

  dtRow:{ flexDirection:'row' },
  dtBtn:{
    flex:1, backgroundColor:'rgba(14,18,30,0.85)',
    borderWidth:1, borderColor:'rgba(255,255,255,0.07)',
    borderRadius:12, paddingHorizontal:14, paddingVertical:12, marginRight:8
  },
  dtBtnTxt:{ color:BR.text, fontWeight:'800' },

  row:{ flexDirection:'row', alignItems:'center' },
  actionBtn:{
    backgroundColor:'rgba(14,18,30,0.85)',
    borderWidth:1, borderColor:'rgba(255,255,255,0.07)',
    borderRadius:12, paddingHorizontal:14, paddingVertical:12, marginRight:8
  },
  actionBtnTxt:{ color:BR.text, fontWeight:'800' },

  tagInputRow:{ flexDirection:'row', alignItems:'center' },
  addTagBtn:{
    width:44, height:44, borderRadius:12, alignItems:'center', justifyContent:'center',
    backgroundColor:'rgba(220,38,38,0.9)'
  },
  addTagBtnTxt:{ color:'#fff', fontWeight:'900', fontSize:22 },
});
