import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Note } from '@/contexts/NotesContext';
import tw from 'twrnc';
import { useColorScheme } from 'react-native';

type NoteCardProps = {
  note: Note;
  onLongPress?: () => void;
};

export default function NoteCard({ note, onLongPress }: NoteCardProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Naviguer vers l'écran d'édition de note
  const handlePress = () => {
    router.push(`/notes/${note.id}`);
  };

  // Détermine la couleur de la bordure basée sur les catégories
  const getBorderColor = () => {
    if (note.categories && note.categories.length > 0) {
      return note.categories[0].color;
    }
    return isDark ? '#4B5563' : '#E5E7EB'; // Couleur par défaut
  };

  // Formater la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };

  return (
    <TouchableOpacity
      style={tw.style(
        `rounded-lg mb-3 p-4`,
        isDark ? 'bg-gray-800' : 'bg-white',
        { borderLeftWidth: 4, borderLeftColor: getBorderColor() }
      )}
      onPress={handlePress}
      onLongPress={onLongPress}
      delayLongPress={500}
    >
      {/* Titre de la note */}
      <Text 
        style={tw.style(
          `text-lg font-bold mb-2`,
          isDark ? 'text-white' : 'text-gray-800'
        )}
        numberOfLines={1}
      >
        {note.title || 'Sans titre'}
      </Text>

      {/* Contenu de la note (extrait) */}
      <Text 
        style={tw.style(
          `mb-3`,
          isDark ? 'text-gray-300' : 'text-gray-600'
        )}
        numberOfLines={2}
      >
        {note.content || 'Aucun contenu'}
      </Text>

      {/* Footer avec les catégories et la date */}
      <View style={tw`flex-row justify-between items-center mt-2`}>
        {/* Catégories */}
        <View style={tw`flex-row flex-wrap`}>
          {note.categories && note.categories.map((category) => (
            <View
              key={category.id}
              style={tw.style(
                `px-2 py-1 rounded-full mr-2 mb-1`,
                { backgroundColor: category.color + '40' }
              )}
            >
              <Text 
                style={tw.style(
                  `text-xs`, 
                  isDark ? 'text-white' : 'text-gray-800'
                )}
              >
                {category.name}
              </Text>
            </View>
          ))}
        </View>

        {/* Date de dernière modification */}
        <Text 
          style={tw.style(
            `text-xs`,
            isDark ? 'text-gray-400' : 'text-gray-500'
          )}
        >
          {formatDate(note.updated_at)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}