import React from 'react';
import { View, Text, TouchableOpacity, useColorScheme } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import tw from 'twrnc';

export default function TasksScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={tw.style(`flex-1`, isDark ? 'bg-black' : 'bg-gray-100')}>
      <Stack.Screen
        options={{
          title: 'Mes Tâches',
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

      {/* État vide pour les tâches */}
      <View style={tw`flex-1 justify-center items-center p-4`}>
        <Ionicons
          name="checkbox-outline"
          size={64}
          color={isDark ? '#6B7280' : '#D1D5DB'}
        />
        <Text
          style={tw.style(
            `text-lg mt-4 text-center`,
            isDark ? 'text-gray-400' : 'text-gray-500'
          )}
        >
          Vous n'avez pas encore de tâches.
          Cliquez sur un des 2 boutons et elle va se créér inch'Allah !
        </Text>
        <TouchableOpacity
          style={tw`bg-blue-600 px-6 py-3 rounded-full mt-6`}
          onPress={() => {
            // A implémenter plus tard
            alert("Je suis desoléééééé keeeevin mais je suis pas arrivé à le faire 😭 #fuckConseilDeClasse #fuckLaPéda");
          }}
        >
          <Text style={tw`text-white font-bold`}>Créer une tâche</Text>
        </TouchableOpacity>
      </View>

      {/* Bouton flottant pour ajouter une tâche */}
      <View style={tw`absolute bottom-6 right-6`}>
        <TouchableOpacity
          style={tw`bg-blue-500 w-14 h-14 rounded-full justify-center items-center shadow-md`}
          onPress={() => {
            // A implémenter plus tard
            alert("S\'ils n'auraient pas decalé la date du conseil de classe j\'aurais fais un poulet #FuckLaPéda");
          }}
        >
          <Ionicons name="add" size={30} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}