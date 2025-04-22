import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  Text, 
  ScrollView, 
  useColorScheme,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useNotes } from '@/contexts/NotesContext';
import tw from 'twrnc';

export default function CreateNoteScreen() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const { createNote, categories, isLoading } = useNotes();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Gérer la sélection/désélection des catégories
  const toggleCategory = (categoryId: number) => {
    if (selectedCategories.includes(categoryId)) {
      setSelectedCategories(selectedCategories.filter(id => id !== categoryId));
    } else {
      setSelectedCategories([...selectedCategories, categoryId]);
    }
  };

  // Enregistrer la note
  const handleSave = async () => {
    if (!title.trim() && !content.trim()) {
      Alert.alert('Erreur', 'Veuillez ajouter un titre ou du contenu à votre note');
      return;
    }

    try {
      const note = await createNote(title, content, selectedCategories);
      if (note) {
        router.back(); // Retourner à la liste des notes après création
      }
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      Alert.alert('Erreur', 'Impossible de créer la note');
    }
  };

  // Gérer l'annulation
  const handleCancel = () => {
    if (title.trim() || content.trim() || selectedCategories.length > 0) {
      Alert.alert(
        'Annuler la création',
        'Êtes-vous sûr de vouloir annuler? Les modifications ne seront pas enregistrées.',
        [
          { text: 'Continuer l\'édition', style: 'cancel' },
          { 
            text: 'Annuler', 
            style: 'destructive',
            onPress: () => router.back()
          }
        ]
      );
    } else {
      // Si rien n'a été saisi, retour direct
      router.back();
    }
  };

  return (
    <View style={tw.style(`flex-1`, isDark ? 'bg-black' : 'bg-white')}>
      <Stack.Screen
        options={{
          title: 'Nouvelle Note',
          headerStyle: {
            backgroundColor: isDark ? '#000000' : '#FFFFFF',
          },
          headerTitleStyle: {
            color: isDark ? '#FFFFFF' : '#000000',
          },
          headerLeft: () => (
            <TouchableOpacity 
              onPress={handleCancel}
              style={tw`px-2`}
            >
              <Text style={tw`font-bold text-red-500`}>
                Annuler
              </Text>
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity 
              onPress={handleSave} 
              disabled={isLoading}
              style={tw`bg-blue-500 px-4 py-2 rounded-lg`}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={tw`text-white font-bold`}>
                  Enregistrer
                </Text>
              )}
            </TouchableOpacity>
          ),
        }}
      />
  
      <ScrollView style={tw`flex-1 p-4`}>
        {/* Titre de la note */}
        <TextInput
          style={tw.style(
            `text-xl font-bold mb-4 px-2 py-3`,
            isDark ? 'text-white' : 'text-black',
            isDark ? 'bg-gray-900' : 'bg-gray-100',
            'rounded-lg'
          )}
          placeholder="Titre"
          placeholderTextColor={isDark ? '#9CA3AF' : '#9CA3AF'}
          value={title}
          onChangeText={setTitle}
        />
  
        {/* Contenu de la note */}
        <TextInput
          style={tw.style(
            `text-base mb-4 px-2 py-3 min-h-40`,
            isDark ? 'text-white' : 'text-black',
            isDark ? 'bg-gray-900' : 'bg-gray-100',
            'rounded-lg'
          )}
          placeholder="Contenu de la note..."
          placeholderTextColor={isDark ? '#9CA3AF' : '#9CA3AF'}
          multiline
          textAlignVertical="top"
          value={content}
          onChangeText={setContent}
        />
  
        {/* Sélection des catégories */}
        <Text style={tw.style(`font-bold mb-2`, isDark ? 'text-white' : 'text-black')}>
          Catégories:
        </Text>
        <View style={tw`flex-row flex-wrap mb-6`}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={tw.style(
                `m-1 px-3 py-2 rounded-full`,
                selectedCategories.includes(category.id)
                  ? { backgroundColor: category.color }
                  : isDark
                  ? 'bg-gray-800 border border-gray-700'
                  : 'bg-gray-200 border border-gray-300'
              )}
              onPress={() => toggleCategory(category.id)}
            >
              <Text
                style={tw.style(
                  `text-sm`,
                  selectedCategories.includes(category.id)
                    ? 'text-white'
                    : isDark
                    ? 'text-white'
                    : 'text-gray-800'
                )}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
  
        {/* Boutons d'action en bas de l'écran */}
        <View style={tw`flex-row items-center justify-between my-6`}>
          <TouchableOpacity
            style={tw.style(
              `w-5/12 py-3 rounded-lg flex items-center justify-center`,
              isDark ? 'bg-red-800' : 'bg-red-500'
            )}
            onPress={handleCancel}
          >
            <Text style={tw`text-white font-bold`}>
              Annuler
            </Text>
          </TouchableOpacity>
  
          <TouchableOpacity
            style={tw.style(
              `w-5/12 py-3 rounded-lg flex items-center justify-center`,
              isLoading ? 'bg-blue-300' : 'bg-blue-500'
            )}
            onPress={handleSave}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={tw`text-white font-bold`}>
                Enregistrer
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}