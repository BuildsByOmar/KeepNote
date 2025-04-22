import React, { useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import NoteList from '@/components/notes/NoteList';
import { useTheme } from '@/contexts/ThemeContext';
import tw from 'twrnc';

export default function NotesScreen() {
  const { isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <View style={tw.style(`flex-1`, isDark ? 'bg-black' : 'bg-gray-100')}>
      <Stack.Screen
        options={{
          title: 'Mes Notes',
          headerStyle: {
            backgroundColor: isDark ? '#000000' : '#FFFFFF',
          },
          headerTitleStyle: {
            color: isDark ? '#FFFFFF' : '#000000',
          },
          headerShadowVisible: false,
        }}
      />

      {/* Barre de recherche */}
      <View style={tw.style(
        `mx-4 my-3 px-3 py-2 rounded-lg flex-row items-center`,
        isDark ? 'bg-gray-800' : 'bg-white'
      )}>
        <Ionicons 
          name="search-outline" 
          size={20} 
          color={isDark ? '#9CA3AF' : '#6B7280'} 
          style={tw`mr-2`}
        />
        <TextInput
          placeholder="Rechercher..."
          placeholderTextColor={isDark ? '#9CA3AF' : '#9CA3AF'}
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={tw.style(`flex-1`, isDark ? 'text-white' : 'text-gray-800')}
        />
        {searchQuery ? (
          <Ionicons 
            name="close-circle" 
            size={20} 
            color="#9CA3AF" 
            onPress={() => setSearchQuery('')}
          />
        ) : null}
      </View>

      {/* Liste des notes */}
      <NoteList searchQuery={searchQuery} />
    </View>
  );
}