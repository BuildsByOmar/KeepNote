import React, { useState, useEffect } from 'react';
import { 
  View, 
  FlatList, 
  RefreshControl, 
  Text, 
  TouchableOpacity, 
  Alert,
  TextInput,
  useColorScheme,
  Animated,
  Pressable
} from 'react-native';
import { useNotes } from '@/contexts/NotesContext';
import NoteCard from './NoteCard';
import { Ionicons } from '@expo/vector-icons';
import tw from 'twrnc';
import { useRouter } from 'expo-router';

// Composant pour le filtre par catégorie
const CategoryFilter = ({ 
  selectedCategoryIds, 
  onCategoriesChange 
}: { 
  selectedCategoryIds: number[], 
  onCategoriesChange: (ids: number[]) => void 
}) => {
  const { categories } = useNotes();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Gérer la sélection de catégorie
  const handleCategoryPress = (categoryId: number | null) => {
    // Cas spécial pour "Toutes" (-1)
    if (categoryId === null) {
      onCategoriesChange([]);
      return;
    }
    
    // Si la catégorie est déjà sélectionnée, la retirer
    if (selectedCategoryIds.includes(categoryId)) {
      const newSelectedCategories = selectedCategoryIds.filter(id => id !== categoryId);
      onCategoriesChange(newSelectedCategories);
    } else {
      // Sinon, l'ajouter aux catégories sélectionnées
      const newSelectedCategories = [...selectedCategoryIds, categoryId];
      onCategoriesChange(newSelectedCategories);
    }
  };

  return (
    <View style={tw`mb-3`}>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={[{ id: -1, name: 'Toutes', color: '#6B7280', user_id: 0 }, ...categories]}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={tw.style(
              `px-3 py-2 rounded-full mr-2`,
              selectedCategoryIds.includes(item.id) || (item.id === -1 && selectedCategoryIds.length === 0)
                ? { backgroundColor: item.color } 
                : isDark 
                  ? 'bg-gray-700' 
                  : 'bg-gray-200'
            )}
            onPress={() => handleCategoryPress(item.id === -1 ? null : item.id)}
          >
            <Text
              style={tw.style(
                `text-sm`,
                selectedCategoryIds.includes(item.id) || (item.id === -1 && selectedCategoryIds.length === 0)
                  ? 'text-white'
                  : isDark
                    ? 'text-white'
                    : 'text-gray-800'
              )}
            >
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

// Composant de carte de note amélioré avec options
const EnhancedNoteCard = ({ 
  note, 
  onDelete, 
  onEdit 
}: { 
  note: { 
    id: number; 
    title: string; 
    content: string; 
    categories: { id: number; name: string; color: string }[] 
  }; 
  onDelete: () => void; 
  onEdit: () => void; 
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [showOptions, setShowOptions] = useState(false);
  
  // Détermine la couleur de la carte en fonction des catégories
  const getCardColor = () => {
    if (note.categories && note.categories.length > 0) {
      return { 
        borderLeftColor: note.categories[0].color,
        borderLeftWidth: 4
      };
    }
    return {};
  };

  return (
    <Pressable
      style={tw.style(
        `mb-3 rounded-lg shadow-sm overflow-hidden`,
        isDark ? 'bg-gray-800' : 'bg-white',
        getCardColor()
      )}
      onPress={onEdit}
      onLongPress={() => setShowOptions(!showOptions)}
    >
      <View style={tw`p-4`}>
        {/* En-tête avec titre et options */}
        <View style={tw`flex-row justify-between items-center mb-2`}>
          <Text 
            style={tw.style(
              `text-lg font-bold`,
              isDark ? 'text-white' : 'text-gray-800'
            )}
            numberOfLines={1}
          >
            {note.title || 'Sans titre'}
          </Text>
          
          {/* Options toujours visibles avec design plus esthétique */}
          <View style={tw`flex-row`}>
            <TouchableOpacity
              style={tw.style(
                `rounded-full p-2 mr-1`,
                isDark ? 'bg-blue-900 bg-opacity-30' : 'bg-blue-100'
              )}
              onPress={onEdit}
            >
              <Ionicons name="create-outline" size={16} color={isDark ? "#60A5FA" : "#3B82F6"} />
            </TouchableOpacity>
            <TouchableOpacity
              style={tw.style(
                `rounded-full p-2`,
                isDark ? 'bg-red-900 bg-opacity-30' : 'bg-red-100'
              )}
              onPress={onDelete}
            >
              <Ionicons name="trash-outline" size={16} color={isDark ? "#F87171" : "#EF4444"} />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Contenu tronqué */}
        <Text 
          style={tw.style(
            `mb-3`,
            isDark ? 'text-gray-300' : 'text-gray-600'
          )}
          numberOfLines={2}
        >
          {note.content || 'Aucun contenu'}
        </Text>
        
        {/* Catégories en pastilles */}
        {note.categories && note.categories.length > 0 ? (
          <View style={tw`flex-row flex-wrap`}>
            {note.categories.map((category: { id: number; name: string; color: string }) => (
              <View 
                key={category.id}
                style={tw.style(
                  `mr-1 mb-1 px-2 py-1 rounded-full`,
                  { backgroundColor: category.color }
                )}
              >
                <Text style={tw`text-xs text-white`}>
                  {category.name}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </Pressable>
  );
};

export default function NoteList() {
  const { notes, isLoading, fetchNotes, deleteNote, searchNotes } = useNotes();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [filteredNotes, setFilteredNotes] = useState(notes);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Fonction pour filtrer les notes selon les catégories sélectionnées
  const filterByCategories = (notesList: any[], categoryIds: number[]) => {
    if (!categoryIds.length) return notesList;
    
    return notesList.filter(note =>
      note.categories && Array.isArray(note.categories) &&
      note.categories.some((category: any) => categoryIds.includes(category.id))
    );
  };

  // Fonction pour filtrer les notes par recherche textuelle
  const filterBySearchQuery = (notesList: any[], query: string) => {
    if (!query.trim()) return notesList;
    
    const searchTerm = query.toLowerCase().trim();
    return notesList.filter(note =>
      note.title.toLowerCase().includes(searchTerm) ||
      note.content.toLowerCase().includes(searchTerm)
    );
  };

  // Mettre à jour les filtres
  useEffect(() => {
    let result = [...notes];
    
    // Appliquer filtre par catégories
    if (selectedCategoryIds.length > 0) {
      result = filterByCategories(result, selectedCategoryIds);
    }
    
    // Appliquer filtre par recherche textuelle
    if (searchQuery.trim()) {
      result = filterBySearchQuery(result, searchQuery);
    }
    
    setFilteredNotes(result);
  }, [notes, searchQuery, selectedCategoryIds]);

  // Confirmer et supprimer une note
  const handleDeleteNote = (noteId: number) => {
    Alert.alert(
      'Confirmation',
      'Êtes-vous sûr de vouloir supprimer cette note ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: async () => {
            await deleteNote(noteId);
          }
        }
      ]
    );
  };

  // Naviguer vers l'écran d'édition
  const handleEditNote = (noteId: number) => {
    router.push(`/notes/${noteId}`);
  };

  // Si aucune note, afficher un message
  if (filteredNotes.length === 0) {
    return (
      <View style={tw.style(`flex-1`, isDark ? 'bg-black' : 'bg-gray-100')}>
        {/* Barre de recherche */}
        <View style={tw.style(
          `flex-row items-center mx-4 my-3 px-3 py-2 rounded-lg`,
          isDark ? 'bg-gray-800' : 'bg-white'
        )}>
          <Ionicons 
            name="search-outline" 
            size={20} 
            color={isDark ? '#9CA3AF' : '#6B7280'} 
            style={tw`mr-2`}
          />
          <TextInput
            style={tw.style(`flex-1`, isDark ? 'text-white' : 'text-gray-800')}
            placeholder="Rechercher..."
            placeholderTextColor={isDark ? '#9CA3AF' : '#9CA3AF'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filtre par catégorie */}
        <CategoryFilter 
          selectedCategoryIds={selectedCategoryIds}
          onCategoriesChange={setSelectedCategoryIds}
        />
        
        {/* Message aucune note */}
        <View style={tw`flex-1 justify-center items-center p-4`}>
          <Ionicons 
            name="document-text-outline" 
            size={64} 
            color={isDark ? '#6B7280' : '#D1D5DB'} 
          />
          <Text style={tw.style(`text-lg mt-4 text-center`, isDark ? 'text-gray-400' : 'text-gray-500')}>
            {searchQuery.trim() || selectedCategoryIds.length > 0
              ? 'Aucune note ne correspond à votre recherche'
              : 'Aucune note pour le moment. Créez votre première note !'}
          </Text>
          <TouchableOpacity
            style={tw`bg-blue-600 px-6 py-3 rounded-full mt-6`}
            onPress={() => router.push('/notes/create')}
          >
            <Text style={tw`text-white font-bold`}>Créer une note</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={tw.style(`flex-1 relative`, isDark ? 'bg-black' : 'bg-gray-100')}>
      {/* Barre de recherche */}
      <View style={tw.style(
        `flex-row items-center mx-4 my-3 px-3 py-2 rounded-lg`,
        isDark ? 'bg-gray-800' : 'bg-white'
      )}>
        <Ionicons 
          name="search-outline" 
          size={20} 
          color={isDark ? '#9CA3AF' : '#6B7280'} 
          style={tw`mr-2`}
        />
        <TextInput
          style={tw.style(`flex-1`, isDark ? 'text-white' : 'text-gray-800')}
          placeholder="Rechercher..."
          placeholderTextColor={isDark ? '#9CA3AF' : '#9CA3AF'}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filtre par catégorie */}
      <CategoryFilter 
        selectedCategoryIds={selectedCategoryIds}
        onCategoriesChange={setSelectedCategoryIds}
      />

      {/* Liste des notes avec le nouveau composant amélioré */}
      <FlatList
        data={filteredNotes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <EnhancedNoteCard 
            note={item}
            onDelete={() => handleDeleteNote(item.id)} 
            onEdit={() => handleEditNote(item.id)}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={fetchNotes}
            colors={['#2563EB']}
            tintColor={isDark ? '#FFFFFF' : '#2563EB'}
          />
        }
        contentContainerStyle={tw`px-4 py-2 pb-20`} // Ajout de padding en bas pour éviter que le bouton + ne cache du contenu
      />

      {/* Bouton flottant pour ajouter une note */}
      <View style={tw`absolute bottom-6 right-6`}>
        <TouchableOpacity
          style={tw.style(
            `bg-blue-500 w-14 h-14 rounded-full justify-center items-center shadow-md`,
            isDark ? 'bg-blue-600' : 'bg-blue-500'
          )}
          onPress={() => router.push('/notes/create')}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={30} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}