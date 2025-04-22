import React, { useState, useEffect } from 'react';
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  Text, 
  ScrollView, 
  ActivityIndicator,
  Alert,
  Animated
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useNotes } from '@/contexts/NotesContext';
import { useTheme } from '@/contexts/ThemeContext';
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
  const { isDark } = useTheme();
  const router = useRouter();
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
      console.log("Sauvegarde avec catégories:", selectedCategories);
      
      const success = await updateNote(noteId, title, content, selectedCategories);
      if (success) {
        // Mettre à jour les valeurs originales sans attendre un re-render
        setOriginalTitle(title);
        setOriginalContent(content);
        setOriginalCategories([...selectedCategories]);
        
        // Ajouter un petit délai pour garantir que l'état est bien mis à jour
        setTimeout(() => {
          setIsEditing(false); // Retour au mode lecture
        }, 300);
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

  // Obtenir un titre formaté pour l'affichage dans la barre de navigation
  const getFormattedTitle = () => {
    if (!title) return 'Sans titre';
    // Limiter la longueur du titre pour l'affichage dans la barre de navigation
    return title.length > 20 ? title.substring(0, 20) + '...' : title;
  };

  return (
    <View style={tw.style(`flex-1`, isDark ? 'bg-black' : 'bg-gray-100')}>
      <Stack.Screen
        options={{
          // Afficher le titre de la note en mode lecture, sinon "Modifier la note"
          title: isEditing ? 'Modifier la note' : getFormattedTitle(),
          headerStyle: {
            backgroundColor: isEditing 
              ? '#3B82F6' // Bleu pour le mode édition
              : (isDark ? '#000000' : '#FFFFFF'),
          },
          headerTitleStyle: {
            color: isEditing 
              ? 'white' 
              : (isDark ? '#FFFFFF' : '#000000'),
            fontWeight: isEditing ? 'bold' : 'normal',
          },
          headerLeft: () => (
            <View style={tw`flex-row items-center`}>
              {/* Bouton pour revenir à la liste */}
              <TouchableOpacity 
                onPress={() => router.push('/')} 
                style={tw`mr-2`}
              >
                <Ionicons 
                  name="albums-outline" 
                  size={22} 
                  color={isEditing ? 'white' : (isDark ? '#FFFFFF' : '#000000')} 
                />
              </TouchableOpacity>
              
              {/* Séparateur */}
              <Text style={tw`text-gray-400 mx-1`}>|</Text>
              
              {/* Bouton retour/annuler */}
              <TouchableOpacity 
                onPress={() => {
                  if (isEditing) {
                    handleCancel();
                  } else {
                    router.back();
                  }
                }}
              >
                <Ionicons 
                  name={isEditing ? "close-outline" : "arrow-back"} 
                  size={24} 
                  color={isEditing ? 'white' : (isDark ? '#FFFFFF' : '#000000')} 
                />
              </TouchableOpacity>
            </View>
          ),
          headerRight: () => (
            <View style={tw`flex-row`}>
              {isEditing ? (
                // Bouton pour le mode édition
                <TouchableOpacity 
                  onPress={handleSave} 
                  disabled={isLoading}
                  style={tw`rounded-full p-2 ${isEditing ? '' : 'bg-blue-500 bg-opacity-20'}`}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color={isEditing ? "white" : "#2563EB"} />
                  ) : (
                    <Ionicons 
                      name="checkmark" 
                      size={24} 
                      color={isEditing ? "white" : "#2563EB"} 
                    />
                  )}
                </TouchableOpacity>
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
            // Mode édition - Design amélioré
            <>
              {/* Bannière "MODIFICATION" */}
              <View style={tw`bg-blue-600 rounded-lg py-2 px-4 mb-4 flex-row items-center justify-center shadow-sm`}>
                <Ionicons name="create" size={18} color="white" style={tw`mr-2`} />
                <Text style={tw`text-white font-bold text-center`}>MODIFICATION DE NOTE</Text>
              </View>

              {/* Titre de la note */}
              <TextInput
                style={tw.style(
                  `text-2xl font-bold mb-5 px-4 py-3`,
                  isDark ? 'text-white' : 'text-black',
                  isDark ? 'bg-gray-900' : 'bg-white',
                  'rounded-xl shadow-sm border-l-4 border-blue-500'
                )}
                placeholder="Titre"
                placeholderTextColor={isDark ? '#9CA3AF' : '#9CA3AF'}
                value={title}
                onChangeText={setTitle}
              />

              {/* Contenu de la note */}
              <TextInput
                style={tw.style(
                  `text-base mb-5 px-4 py-3 min-h-40`,
                  isDark ? 'text-white' : 'text-black',
                  isDark ? 'bg-gray-900' : 'bg-white',
                  'rounded-xl shadow-sm border-l-4 border-blue-500'
                )}
                placeholder="Contenu de la note..."
                placeholderTextColor={isDark ? '#9CA3AF' : '#9CA3AF'}
                multiline
                textAlignVertical="top"
                value={content}
                onChangeText={setContent}
              />

              {/* Sélection des catégories */}
              <Text style={tw.style(`font-bold mb-3 text-lg ml-1`, isDark ? 'text-white' : 'text-gray-800')}>
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
                        : 'bg-white border border-gray-300'
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
                        <Ionicons name="checkmark" size={14} color={selectedCategories.includes(category.id) ? "white" : "#3B82F6"} />
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
                    isDark ? 'bg-gray-800' : 'bg-white'
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
                      ? 'bg-blue-400'
                      : 'bg-blue-600'
                  )}
                  onPress={handleSave}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={tw`text-center text-white font-bold`}>
                      Enregistrer les modifications
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          ) : (
            // Mode lecture - design amélioré
            <>
              {/* Carte d'information */}
              <View style={tw`bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden mb-5`}>
                {/* Bandeau supérieur avec date et catégories */}
                <View style={tw`p-4 border-b border-gray-200 dark:border-gray-700 flex-row justify-between items-center`}>
                  {/* Date de modification */}
                  <View style={tw`flex-row items-center`}>
                    <Ionicons name="time-outline" size={16} color={isDark ? "#9CA3AF" : "#6B7280"} style={tw`mr-1`} />
                    <Text style={tw.style(
                      `text-sm`,
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    )}>
                      Dernière modification:
                    </Text>
                    <View style={tw.style(
                      `ml-2 px-3 py-1 rounded-full`,
                      isDark ? 'bg-gray-700' : 'bg-gray-100'
                    )}>
                      <Text style={tw.style(
                        `text-xs font-medium`,
                        isDark ? 'text-gray-300' : 'text-gray-600'
                      )}>
                        Aujourd'hui
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Contenu principal */}
                <View style={tw`p-4`}>
                  {/* Titre de la note */}
                  <Text
                    style={tw.style(
                      `text-2xl font-bold mb-4`,
                      isDark ? 'text-white' : 'text-gray-900'
                    )}
                  >
                    {title || 'Sans titre'}
                  </Text>

                  {/* Catégories */}
                  {selectedCategories.length > 0 && (
                    <View style={tw`flex-row flex-wrap mb-4`}>
                      {selectedCategories.map(categoryId => (
                        <View
                          key={categoryId}
                          style={tw.style(
                            `mr-2 mb-2 px-3 py-1 rounded-full flex-row items-center`,
                            { backgroundColor: getCategoryColor(categoryId) }
                          )}
                        >
                          <Ionicons name="pricetag" size={12} color="white" style={tw`mr-1 opacity-70`} />
                          <Text style={tw`text-xs font-medium text-white`}>
                            {getCategoryName(categoryId)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Ligne séparatrice */}
                  <View style={tw`border-b border-gray-200 dark:border-gray-700 my-2`} />

                  {/* Contenu de la note */}
                  <Text
                    style={tw.style(
                      `text-base leading-relaxed my-4`,
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    )}
                  >
                    {content || 'Aucun contenu'}
                  </Text>
                </View>
              </View>

              {/* Boutons d'actions */}
              <View style={tw`flex-row justify-center space-x-4 mt-6 mb-10`}>
                {/* Bouton de suppression */}
                <TouchableOpacity
                  style={tw.style(
                    `flex-row items-center px-5 py-3 rounded-full shadow-md`,
                    isDark ? 'bg-red-800' : 'bg-red-500'
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
                    isDark ? 'bg-blue-700' : 'bg-blue-500'
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