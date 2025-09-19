// Components/FavoritesScreen.js - Журнал заметок
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ImageBackground,
  FlatList,
  Pressable,
  StatusBar,
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
};

const BG_ONB   = require('../assets/onb.webp');
const CARD_BG  = require('../assets/article_container.webp');
const EMPTY_IMG = require('../assets/text_save.webp');

// Ключи для хранения заметок
const JOURNAL_STORAGE_KEY = 'nql:journal:entries';

// Categories for journal entries
const CATEGORIES = {
  personal: { name: 'Personal', color: '#3B82F6' },
  work: { name: 'Work', color: '#10B981' },
  travel: { name: 'Travel', color: '#F59E0B' },
  ideas: { name: 'Ideas', color: '#8B5CF6' },
  memories: { name: 'Memories', color: '#EC4899' },
  goals: { name: 'Goals', color: '#EF4444' },
};

export default function FavoritesScreen({ navigation }) {
  const [journalEntries, setJournalEntries] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  // State for new entry
  const [newEntry, setNewEntry] = useState({
    title: '',
    content: '',
    category: 'personal',
    date: new Date(),
    mood: 'happy',
    tags: [],
    image: null,
  });

  const loadJournalEntries = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(JOURNAL_STORAGE_KEY);
      if (raw) {
        const entries = JSON.parse(raw);
        setJournalEntries(entries.sort((a, b) => new Date(b.date) - new Date(a.date)));
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

  const saveJournalEntry = useCallback(async (entry) => {
    try {
      const entries = [...journalEntries];
      if (editingEntry) {
        const index = entries.findIndex(e => e.id === editingEntry.id);
        if (index !== -1) {
          entries[index] = { ...entry, id: editingEntry.id };
        }
      } else {
        entries.unshift({ ...entry, id: Date.now().toString() });
      }
      await AsyncStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(entries));
      setJournalEntries(entries);
      setShowAddModal(false);
      setEditingEntry(null);
      setNewEntry({
        title: '',
        content: '',
        category: 'personal',
        date: new Date(),
        mood: 'happy',
        tags: [],
        image: null,
      });
    } catch (error) {
      console.error('Error saving journal entry:', error);
      Alert.alert('Error', 'Failed to save journal entry');
    }
  }, [journalEntries, editingEntry]);

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
    setNewEntry(entry);
    setShowAddModal(true);
  }, []);

  // Image picker functions
  const selectImage = useCallback(() => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 800,
      maxHeight: 600,
    };

    Alert.alert(
      'Select Image',
      'Choose an option',
      [
        { text: 'Camera', onPress: () => launchCamera(options, handleImageResponse) },
        { text: 'Gallery', onPress: () => launchImageLibrary(options, handleImageResponse) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }, []);

  const handleImageResponse = useCallback((response) => {
    if (response.didCancel || response.error) {
      return;
    }
    
    if (response.assets && response.assets[0]) {
      setSelectedImage(response.assets[0]);
      setNewEntry(prev => ({ ...prev, image: response.assets[0] }));
    }
  }, []);

  // Date picker functions
  const onDateChange = useCallback((event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setNewEntry(prev => ({ ...prev, date: selectedDate }));
    }
  }, []);

  const showDatePickerModal = useCallback(() => {
    setShowDatePicker(true);
  }, []);

  // Фильтрация заметок
  const filteredEntries = useMemo(() => {
    let filtered = journalEntries;
    
    if (searchQuery) {
      filtered = filtered.filter(entry => 
        entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(entry => entry.category === selectedCategory);
    }
    
    return filtered;
  }, [journalEntries, searchQuery, selectedCategory]);

  const renderEntry = ({ item }) => {
    const category = CATEGORIES[item.category] || CATEGORIES.personal;
    const formattedDate = new Date(item.date).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    return (
      <Pressable
        onPress={() => editEntry(item)}
        style={styles.entryCard}
      >
        <ImageBackground source={CARD_BG} resizeMode="stretch" style={styles.entryCardBg}>
          {/* Header and date */}
          <View style={styles.entryHeader}>
            <View style={styles.entryTitleRow}>
              <Text style={styles.entryTitle}>{item.title}</Text>
              <Text style={styles.entryMood}>{item.mood}</Text>
            </View>
            <Text style={styles.entryDate}>{formattedDate}</Text>
          </View>

          {/* Category */}
          <View style={[styles.categoryBadge, { backgroundColor: category.color + '20' }]}>
            <Text style={[styles.categoryText, { color: category.color }]}>{category.name}</Text>
          </View>

          {/* Image */}
          {item.image && (
            <Image 
              source={{ uri: item.image.uri }} 
              style={styles.entryImage} 
              resizeMode="cover" 
            />
          )}

          {/* Content */}
          <Text style={styles.entryContent} numberOfLines={3}>
            {item.content}
          </Text>

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {item.tags.slice(0, 3).map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Action buttons */}
          <View style={styles.entryActions}>
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                deleteEntry(item.id);
              }}
              style={styles.deleteButton}
            >
              <Text style={styles.deleteButtonText}>Delete</Text>
            </Pressable>
          </View>
        </ImageBackground>
      </Pressable>
    );
  };

  return (
    <View style={styles.wrap}>
      <ImageBackground source={BG_ONB} style={styles.bg} resizeMode="cover">
        {/* Header and search */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Journal</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search entries..."
            placeholderTextColor="rgba(212, 175, 55, 0.6)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Category filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
          <Pressable
            style={[styles.categoryFilter, selectedCategory === 'all' && styles.categoryFilterActive]}
            onPress={() => setSelectedCategory('all')}
          >
            <Text style={[styles.categoryFilterText, selectedCategory === 'all' && styles.categoryFilterTextActive]}>
              All
            </Text>
          </Pressable>
          {Object.entries(CATEGORIES).map(([key, category]) => (
            <Pressable
              key={key}
              style={[styles.categoryFilter, selectedCategory === key && styles.categoryFilterActive]}
              onPress={() => setSelectedCategory(key)}
            >
              <Text style={[styles.categoryFilterText, selectedCategory === key && styles.categoryFilterTextActive]}>
                {category.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Entries list */}
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

        {/* Add button */}
        <Pressable
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Text style={styles.addButtonText}>+</Text>
        </Pressable>

        {/* Add/Edit entry modal */}
        <Modal
          visible={showAddModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => {
            setShowAddModal(false);
            setEditingEntry(null);
            setNewEntry({
              title: '',
              content: '',
              category: 'personal',
              date: new Date(),
              mood: 'happy',
              tags: [],
              image: null,
            });
          }}
        >
          <View style={styles.modalOverlay}>
            <ScrollView style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingEntry ? 'Edit Entry' : 'New Entry'}
                </Text>
                <Pressable
                  style={styles.closeButton}
                  onPress={() => {
                    setShowAddModal(false);
                    setEditingEntry(null);
                    setNewEntry({
                      title: '',
                      content: '',
                      category: 'personal',
                      date: new Date(),
                      mood: 'happy',
                      tags: [],
                      image: null,
                    });
                  }}
                >
                  <Text style={styles.closeButtonText}>×</Text>
                </Pressable>
              </View>

              <View style={styles.form}>
                {/* Mood */}
                <View style={styles.moodSection}>
                  <Text style={styles.label}>Mood:</Text>
                  <View style={styles.moodButtons}>
                    {['happy', 'sad', 'tired', 'confused', 'excited', 'angry', 'calm', 'celebrating'].map((mood) => (
                      <Pressable
                        key={mood}
                        style={[styles.moodButton, newEntry.mood === mood && styles.moodButtonActive]}
                        onPress={() => setNewEntry({ ...newEntry, mood })}
                      >
                        <Text style={styles.moodText}>{mood}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Title */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Title:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={newEntry.title}
                    onChangeText={(text) => setNewEntry({ ...newEntry, title: text })}
                    placeholder="Enter title..."
                    placeholderTextColor="rgba(212, 175, 55, 0.6)"
                  />
                </View>

                {/* Category */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Category:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.categoryButtons}>
                      {Object.entries(CATEGORIES).map(([key, category]) => (
                        <Pressable
                          key={key}
                          style={[
                            styles.categoryButton,
                            { borderColor: category.color },
                            newEntry.category === key && { backgroundColor: category.color + '20' }
                          ]}
                          onPress={() => setNewEntry({ ...newEntry, category: key })}
                        >
                          <Text style={[styles.categoryButtonText, { color: category.color }]}>
                            {category.name}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                </View>

                {/* Date */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Date:</Text>
                  <Pressable style={styles.dateButton} onPress={showDatePickerModal}>
                    <Text style={styles.dateButtonText}>
                      {newEntry.date.toLocaleDateString()}
                    </Text>
                  </Pressable>
                  {showDatePicker && (
                    <DateTimePicker
                      value={newEntry.date}
                      mode="date"
                      display="default"
                      onChange={onDateChange}
                    />
                  )}
                </View>

                {/* Image */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Image:</Text>
                  <Pressable style={styles.imageButton} onPress={selectImage}>
                    <Text style={styles.imageButtonText}>
                      {newEntry.image ? 'Change Image' : 'Select Image'}
                    </Text>
                  </Pressable>
                  {newEntry.image && (
                    <Image 
                      source={{ uri: newEntry.image.uri }} 
                      style={styles.previewImage} 
                      resizeMode="cover" 
                    />
                  )}
                </View>

                {/* Content */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Content:</Text>
                  <TextInput
                    style={[styles.textInput, styles.textArea]}
                    value={newEntry.content}
                    onChangeText={(text) => setNewEntry({ ...newEntry, content: text })}
                    placeholder="Tell about your day..."
                    placeholderTextColor="rgba(212, 175, 55, 0.6)"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>

                {/* Save button */}
                <Pressable
                  style={styles.saveButton}
                  onPress={() => saveJournalEntry(newEntry)}
                >
                  <Text style={styles.saveButtonText}>
                    {editingEntry ? 'Save Changes' : 'Create Entry'}
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </Modal>
      </ImageBackground>
    </View>
  );
}

/* ───────── styles ───────── */
const styles = StyleSheet.create({
  wrap: { flex: 1 },
  bg: { flex: 1 },

  // Заголовок и поиск
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    color: BR.text,
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: 'rgba(10, 6, 2, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.4)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: BR.text,
    fontSize: 16,
  },

  // Фильтры категорий
  categoriesScroll: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  categoryFilter: {
    backgroundColor: 'rgba(10, 6, 2, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.3)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  categoryFilterActive: {
    backgroundColor: 'rgba(220, 38, 38, 0.3)',
    borderColor: BR.accent,
  },
  categoryFilterText: {
    color: BR.sub,
    fontSize: 14,
    fontWeight: '500',
  },
  categoryFilterTextActive: {
    color: BR.text,
    fontWeight: 'bold',
  },

  // Карточки заметок
  entryCard: {
    width: W - 16,
    alignSelf: 'center',
    marginVertical: 8,
  },
  entryCardBg: {
    width: '100%',
    minHeight: 140,
    padding: 16,
    justifyContent: 'space-between',
  },
  entryHeader: {
    marginBottom: 8,
  },
  entryTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  entryTitle: {
    color: BR.text,
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  entryMood: {
    fontSize: 20,
  },
  entryDate: {
    color: BR.sub,
    fontSize: 14,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  categoryEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  entryImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
  },
  entryContent: {
    color: BR.sub,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  tag: {
    backgroundColor: 'rgba(220, 38, 38, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 4,
    marginBottom: 4,
  },
  tagText: {
    color: BR.accent,
    fontSize: 12,
  },
  entryActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  deleteButton: {
    padding: 8,
  },
  deleteButtonText: {
    fontSize: 16,
  },

  // Кнопка добавления
  addButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: BR.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BR.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
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
    maxHeight: '90%',
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
    flex: 1,
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

  // Форма
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: BR.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'rgba(10, 6, 2, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.4)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: BR.text,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },

  // Настроение
  moodSection: {
    marginBottom: 16,
  },
  moodButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  moodButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(10, 6, 2, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodButtonActive: {
    backgroundColor: 'rgba(220, 38, 38, 0.3)',
    borderColor: BR.accent,
  },
  moodText: {
    fontSize: 20,
  },

  // Категории
  categoryButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: 'rgba(10, 6, 2, 0.8)',
  },
  categoryButtonEmoji: {
    fontSize: 16,
    marginRight: 4,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Date picker
  dateButton: {
    backgroundColor: 'rgba(10, 6, 2, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.4)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dateButtonText: {
    color: BR.text,
    fontSize: 16,
  },

  // Image picker
  imageButton: {
    backgroundColor: 'rgba(10, 6, 2, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.4)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  imageButtonText: {
    color: BR.text,
    fontSize: 16,
  },
  previewImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
  },

  // Save button
  saveButton: {
    backgroundColor: BR.accent,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Пустое состояние
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 32,
  },
  emptyImg: {
    width: Math.min(W - 4, 300),
    height: (Math.min(W - 4, 300) * 3) / 4,
    marginTop: 50,
    opacity: 0.7,
  },
  emptyText: {
    color: BR.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtext: {
    color: BR.sub,
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
});
