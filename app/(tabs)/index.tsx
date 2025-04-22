import React from 'react';
import { View, TouchableOpacity, useColorScheme } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import NoteList from '@/components/notes/NoteList';
import { Ionicons } from '@expo/vector-icons';
import tw from 'twrnc';
import { useNotes } from '@/contexts/NotesContext';

export default function NotesScreen() {
  const router = useRouter();
  const { fetchNotes } = useNotes();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  React.useEffect(() => {
    // Charger les notes au démarrage
    fetchNotes();
  }, []);

  // Bouton pour ajouter une nouvelle note
  const AddNoteButton = () => (
    <TouchableOpacity
      style={tw`bg-blue-500 w-14 h-14 rounded-full justify-center items-center shadow-md`}
      onPress={() => router.push('/notes/create')}
    >
      <Ionicons name="add" size={30} color="white" />
    </TouchableOpacity>
  );

  return (
    <View style={tw.style(`flex-1 relative`, isDark ? 'bg-black' : 'bg-gray-100')}>
      <Stack.Screen
        options={{
          title: 'Mes Notes',
          headerStyle: {
            backgroundColor: isDark ? '#000000' : '#FFFFFF',
          },
          headerTitleStyle: {
            color: isDark ? '#FFFFFF' : '#000000',
            fontWeight: 'bold',
          },
          headerShadowVisible: false,
        }}
      />

      {/* Liste des notes */}
      <NoteList />

      {/* Bouton flottant pour ajouter une note */}
      <View style={tw`absolute bottom-6 right-6`}>
        <AddNoteButton />
      </View>
    </View>
  );
}