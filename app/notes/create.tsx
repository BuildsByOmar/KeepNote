import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  Text, 
  ScrollView, 
  ActivityIndicator,
  Alert
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useNotes } from '@/contexts/NotesContext';
import { useTheme } from '@/contexts/ThemeContext';
import tw from 'twrnc';

export default function CreateNoteScreen() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const { createNote, categories, isLoading } = useNotes();
  const { isDark } = useTheme();
  const router = useRouter();

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
        // Attendre un peu avant de naviguer en arrière
        setTimeout(() => {
          router.back(); // Retourner à la liste des notes après création
        }, 300);
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
    <View style={tw.style(`flex-1`, isDark ? 'bg-black' : 'bg-gray-100')}>
      <Stack.Screen
        options={{
          title: 'Nouvelle Note',
          headerStyle: {
            backgroundColor: isDark ? '#10B981' : '#10B981', // Vert pour la création
          },
          headerTitleStyle: {
            color: 'white',
            fontWeight: 'bold',
          },
          headerLeft: () => (
            <View style={tw`flex-row items-center`}>
              {/* Bouton pour revenir à la liste */}
              <TouchableOpacity 
                onPress={() => router.push('/')} 
                style={tw`mr-2`}
              >
                <Ionicons name="albums-outline" size={22} color="white" />
              </TouchableOpacity>
              
              {/* Séparateur */}
              <Text style={tw`text-white mx-1`}>|</Text>
              
              {/* Bouton d'annulation */}
              <TouchableOpacity onPress={handleCancel}>
                <Ionicons name="close-outline" size={24} color="white" />
              </TouchableOpacity>
            </View>
          ),
          headerRight: () => (
            <TouchableOpacity 
              onPress={handleSave} 
              disabled={isLoading}
              style={tw`px-2`}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="checkmark" size={24} color="white" />
              )}
            </TouchableOpacity>
          ),
        }}
      />
  
      <ScrollView style={tw`flex-1 p-4`}>
        {/* Bandeau "CRÉATION" */}
        <View style={tw`bg-green-600 rounded-lg py-2 px-4 mb-4 flex-row items-center justify-center`}>
          <Ionicons name="add-circle" size={18} color="white" style={tw`mr-2`} />
          <Text style={tw`text-white font-bold text-center`}>CRÉATION DE NOTE</Text>
        </View>

        {/* Titre de la note */}
        <TextInput
          style={tw.style(
            `text-xl font-bold mb-4 px-4 py-3`,
            isDark ? 'text-white' : 'text-black',
            isDark ? 'bg-gray-900' : 'bg-white',
            'rounded-lg shadow-sm'
          )}
          placeholder="Titre"
          placeholderTextColor={isDark ? '#9CA3AF' : '#9CA3AF'}
          value={title}
          onChangeText={setTitle}
        />
  
        {/* Contenu de la note */}
        <TextInput
          style={tw.style(
            `text-base mb-4 px-4 py-3 min-h-40`,
            isDark ? 'text-white' : 'text-black',
            isDark ? 'bg-gray-900' : 'bg-white',
            'rounded-lg shadow-sm'
          )}
          placeholder="Contenu de la note..."
          placeholderTextColor={isDark ? '#9CA3AF' : '#9CA3AF'}
          multiline
          textAlignVertical="top"
          value={content}
          onChangeText={setContent}
        />
  
        {/* Sélection des catégories */}
        <Text style={tw.style(`font-bold mb-2 ml-1`, isDark ? 'text-white' : 'text-gray-700')}>
          Catégories:
        </Text>
        <View style={tw`flex-row flex-wrap mb-6`}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={tw.style(
                `m-1 px-3 py-2 rounded-full shadow-sm`,
                selectedCategories.includes(category.id)
                  ? { backgroundColor: category.color }
                  : isDark
                  ? 'bg-gray-800 border border-gray-700'
                  : 'bg-white border border-gray-300'
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
                {selectedCategories.includes(category.id) && (
                  <Ionicons name="checkmark" size={14} color="white" style={tw`mr-1`} />)}
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
    
          {/* Boutons d'action en bas de l'écran */}
          <View style={tw`flex-row items-center justify-between my-6`}>
            <TouchableOpacity
              style={tw.style(
                `w-5/12 py-3 rounded-lg flex items-center justify-center shadow-sm`,
                isDark ? 'bg-gray-800' : 'bg-white'
              )}
              onPress={handleCancel}
            >
              <Text style={tw.style(
                `font-bold`,
                isDark ? 'text-white' : 'text-gray-800'
              )}>
                Annuler
              </Text>
            </TouchableOpacity>
    
            <TouchableOpacity
              style={tw.style(
                `w-5/12 py-3 rounded-lg flex items-center justify-center shadow-sm`,
                isLoading ? 'bg-green-400' : 'bg-green-600'
              )}
              onPress={handleSave}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={tw`text-white font-bold`}>
                  Créer
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }