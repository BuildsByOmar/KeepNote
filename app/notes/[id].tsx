import React, { useState, useEffect } from 'react';
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  Text, 
  ScrollView, 
  useColorScheme,
  ActivityIndicator,
  Alert,
  Animated
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useNotes } from '@/contexts/NotesContext';
import tw from 'twrnc';

export default function NoteDetailScreen() {
  const { id, edit } = useLocalSearchParams();
  const noteId = Number(id);
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [originalTitle, setOriginalTitle] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [originalCategories, setOriginalCategories] = useState<number[]>([]);
  const [isEditing, setIsEditing] = useState(edit === 'true');
  const { getNote, updateNote, deleteNote, categories, isLoading } = useNotes();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const fadeAnim = useState(new Animated.Value(0))[0];

  // Animation de fondu lors du passage en mode édition/lecture
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true
    }).start();
    
    return () => {
      fadeAnim.setValue(0);
    };
  }, [isEditing]);

  // Charger les données de la note à l'ouverture
  useEffect(() => {
    const note = getNote(noteId);
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setOriginalTitle(note.title);
      setOriginalContent(note.content);
      const categoryIds = note.categories && Array.isArray(note.categories) 
        ? note.categories.map(cat => cat.id) 
        : [];
      setSelectedCategories(categoryIds);
      setOriginalCategories(categoryIds);
    } else {
      Alert.alert('Erreur', 'Note introuvable');
      router.back();
    }
  }, [noteId]);
  
  // Gérer la sélection/désélection des catégories
  const toggleCategory = (categoryId: number) => {
    if (selectedCategories.includes(categoryId)) {
      setSelectedCategories(selectedCategories.filter(id => id !== categoryId));
    } else {
      setSelectedCategories([...selectedCategories, categoryId]);
    }
  };

  // Enregistrer les modifications
  const handleSave = async () => {
    if (!title.trim() && !content.trim()) {
      Alert.alert('Erreur', 'Veuillez ajouter un titre ou du contenu à votre note');
      return;
    }

    try {
      const success = await updateNote(noteId, title, content, selectedCategories);
      if (success) {
        // Mettre à jour les valeurs originales
        setOriginalTitle(title);
        setOriginalContent(content);
        setOriginalCategories([...selectedCategories]);
        setIsEditing(false); // Retour au mode lecture
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour la note');
    }
  };

  // Annuler les modifications
  const handleCancel = () => {
    if (
      title !== originalTitle || 
      content !== originalContent || 
      JSON.stringify(selectedCategories) !== JSON.stringify(originalCategories)
    ) {
      Alert.alert(
        'Annuler les modifications',
        'Êtes-vous sûr de vouloir annuler ? Toutes les modifications seront perdues.',
        [
          { text: 'Continuer l\'édition', style: 'cancel' },
          { 
            text: 'Annuler les modifications', 
            style: 'destructive',
            onPress: () => {
              // Restaurer l'état original
              setTitle(originalTitle);
              setContent(originalContent);
              setSelectedCategories(originalCategories);
              setIsEditing(false); // Retour au mode lecture
            }
          }
        ]
      );
    } else {
      setIsEditing(false); // Retour au mode lecture sans alerte si rien n'a changé
    }
  };

  // Supprimer la note
  const handleDelete = () => {
    Alert.alert(
      'Confirmation',
      'Êtes-vous sûr de vouloir supprimer cette note ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: async () => {
            const success = await deleteNote(noteId);
            if (success) {
              router.back();
            }
          }
        }
      ]
    );
  };

  // Obtenir le nom d'une catégorie à partir de son ID
  const getCategoryName = (categoryId: number) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : '';
  };

  // Obtenir la couleur d'une catégorie à partir de son ID
  const getCategoryColor = (categoryId: number) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.color : '#6B7280';
  };

  return (
    <View style={tw.style(`flex-1`, isDark ? 'bg-black' : 'bg-white')}>
      <Stack.Screen
        options={{
          title: isEditing ? 'Modifier la note' : 'Détails de la note',
          headerStyle: {
            backgroundColor: isDark ? '#000000' : '#FFFFFF',
          },
          headerTitleStyle: {
            color: isDark ? '#FFFFFF' : '#000000',
          },
          headerLeft: () => (
            <TouchableOpacity onPress={() => {
              if (isEditing) {
                handleCancel();
              } else {
                router.back();
              }
            }}>
              <Ionicons 
                name="arrow-back" 
                size={24} 
                color={isDark ? '#FFFFFF' : '#000000'} 
              />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={tw`flex-row`}>
              {isEditing ? (
                // Boutons pour le mode édition
                <View style={tw`flex-row`}>
                  <TouchableOpacity 
                    onPress={handleCancel} 
                    style={tw`mr-4 rounded-full p-2 bg-red-500 bg-opacity-20`}
                  >
                    <Ionicons name="close" size={20} color="#EF4444" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={handleSave} 
                    disabled={isLoading}
                    style={tw`rounded-full p-2 bg-blue-500 bg-opacity-20`}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#2563EB" />
                    ) : (
                      <Ionicons name="checkmark" size={20} color="#2563EB" />
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                // Boutons pour le mode lecture
                <View style={tw`flex-row`}>
                  <TouchableOpacity 
                    onPress={handleDelete} 
                    style={tw`mr-4 rounded-full p-2 bg-red-500 bg-opacity-20`}
                  >
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => setIsEditing(true)}
                    style={tw`rounded-full p-2 bg-blue-500 bg-opacity-20`}
                  >
                    <Ionicons name="create-outline" size={20} color="#2563EB" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ),
        }}
      />

      <ScrollView style={tw`flex-1 px-5 py-3`}>
        <Animated.View style={{ opacity: fadeAnim }}>
          {isEditing ? (
            // Mode édition
            <>
              {/* Titre de la note */}
              <TextInput
                style={tw.style(
                  `text-2xl font-bold mb-5 px-3 py-3`,
                  isDark ? 'text-white' : 'text-black',
                  isDark ? 'bg-gray-900' : 'bg-gray-100',
                  'rounded-xl'
                )}
                placeholder="Titre"
                placeholderTextColor={isDark ? '#9CA3AF' : '#9CA3AF'}
                value={title}
                onChangeText={setTitle}
              />

              {/* Contenu de la note */}
              <TextInput
                style={tw.style(
                  `text-base mb-5 px-3 py-3 min-h-40`,
                  isDark ? 'text-white' : 'text-black',
                  isDark ? 'bg-gray-900' : 'bg-gray-100',
                  'rounded-xl'
                )}
                placeholder="Contenu de la note..."
                placeholderTextColor={isDark ? '#9CA3AF' : '#9CA3AF'}
                multiline
                textAlignVertical="top"
                value={content}
                onChangeText={setContent}
              />

              {/* Sélection des catégories */}
              <Text style={tw.style(`font-bold mb-3 text-lg`, isDark ? 'text-white' : 'text-black')}>
                Catégories
              </Text>
              <View style={tw`flex-row flex-wrap mb-6`}>
                {categories && Array.isArray(categories) && categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={tw.style(
                      `m-1 px-4 py-2 rounded-full shadow-sm`,
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
                        `text-sm font-medium`,
                        selectedCategories.includes(category.id)
                          ? 'text-white'
                          : isDark
                          ? 'text-white'
                          : 'text-gray-800'
                      )}
                    >
                      {selectedCategories.includes(category.id) && (
                        <Ionicons name="checkmark" size={14} color="white" />
                      )}
                      {' '}{category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Zone des boutons */}
              <View style={tw`flex-row justify-between mt-6 mb-10`}>
                <TouchableOpacity
                  style={tw.style(
                    `flex-1 mr-2 py-3 rounded-xl shadow-sm`,
                    isDark ? 'bg-gray-800' : 'bg-gray-200'
                  )}
                  onPress={handleCancel}
                >
                  <Text style={tw.style(
                    `text-center font-bold`,
                    isDark ? 'text-white' : 'text-gray-800'
                  )}>
                    Annuler
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={tw.style(
                    `flex-1 ml-2 py-3 rounded-xl shadow-sm`,
                    isLoading 
                      ? isDark ? 'bg-blue-800' : 'bg-blue-300'
                      : isDark ? 'bg-blue-700' : 'bg-blue-500'
                  )}
                  onPress={handleSave}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={tw`text-center text-white font-bold`}>
                      Enregistrer
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          ) : (
            // Mode lecture - design amélioré
            <>
              {/* Date de modification */}
              <View style={tw`mb-4 flex-row justify-between items-center`}>
                <Text style={tw.style(
                  `text-sm`,
                  isDark ? 'text-gray-400' : 'text-gray-500'
                )}>
                  Dernière modification
                </Text>
                <View style={tw.style(
                  `px-3 py-1 rounded-full`,
                  isDark ? 'bg-gray-800' : 'bg-gray-200'
                )}>
                  <Text style={tw.style(
                    `text-xs`,
                    isDark ? 'text-gray-300' : 'text-gray-600'
                  )}>
                    Aujourd'hui
                  </Text>
                </View>
              </View>

              {/* Titre de la note (mode lecture) */}
              <Text
                style={tw.style(
                  `text-2xl font-bold mb-5`,
                  isDark ? 'text-white' : 'text-black'
                )}
              >
                {title}
              </Text>

              {/* Catégories */}
              {selectedCategories.length > 0 && (
                <View style={tw`flex-row flex-wrap mb-5`}>
                  {selectedCategories.map(categoryId => (
                    <View
                      key={categoryId}
                      style={tw.style(
                        `mr-2 mb-2 px-3 py-1 rounded-full`,
                        { backgroundColor: getCategoryColor(categoryId) }
                      )}
                    >
                      <Text style={tw`text-xs font-medium text-white`}>
                        {getCategoryName(categoryId)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Contenu de la note (mode lecture) */}
              <Text
                style={tw.style(
                  `text-base leading-6 mb-8`,
                  isDark ? 'text-gray-300' : 'text-gray-800'
                )}
              >
                {content}
              </Text>

              {/* Boutons d'actions */}
              <View style={tw`flex-row justify-center space-x-3 mt-8 mb-10`}>
                {/* Bouton de suppression */}
                <TouchableOpacity
                  style={tw.style(
                    `flex-row items-center px-5 py-3 rounded-full shadow-md`,
                    isDark ? 'bg-red-900' : 'bg-red-500'
                  )}
                  onPress={handleDelete}
                >
                  <Ionicons name="trash-outline" size={20} color="white" style={tw`mr-2`} />
                  <Text style={tw`text-white font-bold`}>
                    Supprimer
                  </Text>
                </TouchableOpacity>
                
                {/* Bouton de modification */}
                <TouchableOpacity
                  style={tw.style(
                    `flex-row items-center px-5 py-3 rounded-full shadow-md`,
                    isDark ? 'bg-blue-600' : 'bg-blue-500'
                  )}
                  onPress={() => setIsEditing(true)}
                >
                  <Ionicons name="create-outline" size={20} color="white" style={tw`mr-2`} />
                  <Text style={tw`text-white font-bold`}>
                    Modifier
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}