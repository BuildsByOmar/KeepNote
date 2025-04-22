import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  Alert,
  ScrollView,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useNotes } from '@/contexts/NotesContext';
import { useTheme } from '@/contexts/ThemeContext';
import tw from 'twrnc';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';

export default function SettingsScreen() {
  const { signOut, user } = useAuth();
  const { 
    clearCache, 
    syncAll, 
    isSyncing, 
    lastSyncTime,
    autoSyncEnabled, 
    setAutoSyncEnabled 
  } = useNotes();
  
  const { themeMode, setThemeMode, isDark } = useTheme();
  const [isClearing, setIsClearing] = useState(false);
  const router = useRouter();

  // Fonction pour changer le thème
  const handleThemeChange = async (newTheme: 'system' | 'light' | 'dark') => {
    setThemeMode(newTheme);
  };

  // Fonction pour réinitialiser le cache local
  const handleClearCache = async () => {
    Alert.alert(
      'Confirmation',
      'Êtes-vous sûr de vouloir vider le cache ? Toutes les données non synchronisées seront perdues.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          style: 'destructive',
          onPress: async () => {
            setIsClearing(true);
            try {
              const success = await clearCache();
              if (success) {
                Alert.alert('Succès', 'Le cache a été vidé avec succès');
              } else {
                Alert.alert('Erreur', 'Un problème est survenu lors du vidage du cache');
              }
            } catch (error) {
              console.error('Erreur lors du vidage du cache:', error);
              Alert.alert('Erreur', 'Impossible de vider le cache');
            } finally {
              setIsClearing(false);
            }
          },
        },
      ]
    );
  };

  // Fonction pour synchroniser manuellement
  const handleSync = async () => {
    try {
      const success = await syncAll();
      if (success) {
        Alert.alert('Succès', 'Synchronisation réussie');
      } else {
        Alert.alert('Erreur', 'Un problème est survenu lors de la synchronisation');
      }
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
      Alert.alert('Erreur', 'Impossible de synchroniser les données');
    }
  };

 // Fonction pour se déconnecter
 const handleLogout = () => {
  Alert.alert(
    'Confirmation',
    'Êtes-vous sûr de vouloir vous déconnecter ?',
    [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnexion',
        style: 'destructive',
        onPress: async () => {
          try {
            console.log("Tentative de déconnexion...");
            await signOut();
            console.log("Déconnexion réussie");
            // Rediriger vers l'écran de connexion
            router.replace('/auth/login');
          } catch (error) {
            console.error("Erreur lors de la déconnexion:", error);
            Alert.alert("Erreur", "Un problème est survenu lors de la déconnexion");
          }
        },
      },
    ]
  );
};

// Formater la date de dernière synchronisation
const formatLastSync = () => {
  if (!lastSyncTime) return 'Jamais';
  
  // Formater la date au format local
  return lastSyncTime.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false
  }) + ' ' + lastSyncTime.toLocaleDateString();
};

return (
  <View style={tw.style(`flex-1`, isDark ? 'bg-black' : 'bg-gray-100')}>
    <Stack.Screen
      options={{
        title: 'Paramètres',
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

    <ScrollView>
      {/* Section Profil */}
      <View
        style={tw.style(
          `m-4 p-4 rounded-lg shadow-sm`,
          isDark ? 'bg-gray-800' : 'bg-white'
        )}
      >
        <Text
          style={tw.style(
            `text-lg font-bold mb-2`,
            isDark ? 'text-white' : 'text-gray-800'
          )}
        >
          Profil
        </Text>

        <View style={tw`flex-row items-center py-2`}>
          <View
            style={tw`w-10 h-10 rounded-full bg-blue-500 justify-center items-center mr-3`}
          >
            <Text style={tw`text-white font-bold text-lg`}>
              {user?.name?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
          <View style={tw`flex-1`}>
            <Text
              style={tw.style(
                `font-bold`,
                isDark ? 'text-white' : 'text-gray-800'
              )}
            >
              {user?.name || 'Utilisateur'}
            </Text>
            <Text
              style={tw.style(
                `text-sm`,
                isDark ? 'text-gray-400' : 'text-gray-600'
              )}
            >
              {user?.email || 'email@exemple.com'}
            </Text>
          </View>
        </View>
      </View>

      {/* Section Apparence */}
      <View
        style={tw.style(
          `m-4 p-4 rounded-lg shadow-sm`,
          isDark ? 'bg-gray-800' : 'bg-white'
        )}
      >
        <Text
          style={tw.style(
            `text-lg font-bold mb-2`,
            isDark ? 'text-white' : 'text-gray-800'
          )}
        >
          Apparence
        </Text>

        {/* Choix du thème */}
        <Text style={tw.style(`mb-2 text-base`, isDark ? 'text-white' : 'text-gray-800')}>
          Thème
        </Text>
        
        <View style={tw`flex-row justify-between mb-2`}>
          <TouchableOpacity
            style={tw.style(
              `flex-1 py-2 px-3 rounded-lg mr-2`,
              themeMode === 'system' 
                ? isDark ? 'bg-blue-700' : 'bg-blue-500' 
                : isDark ? 'bg-gray-700' : 'bg-gray-200'
            )}
            onPress={() => handleThemeChange('system')}
          >
            <Text 
              style={tw.style(
                `text-center`,
                themeMode === 'system' ? 'text-white' : isDark ? 'text-gray-300' : 'text-gray-700'
              )}
            >
              Système
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={tw.style(
              `flex-1 py-2 px-3 rounded-lg mr-2`,
              themeMode === 'light' 
                ? isDark ? 'bg-blue-700' : 'bg-blue-500' 
                : isDark ? 'bg-gray-700' : 'bg-gray-200'
            )}
            onPress={() => handleThemeChange('light')}
          >
            <Text 
              style={tw.style(
                `text-center`,
                themeMode === 'light' ? 'text-white' : isDark ? 'text-gray-300' : 'text-gray-700'
              )}
            >
              Clair
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={tw.style(
              `flex-1 py-2 px-3 rounded-lg`,
              themeMode === 'dark' 
                ? isDark ? 'bg-blue-700' : 'bg-blue-500' 
                : isDark ? 'bg-gray-700' : 'bg-gray-200'
            )}
            onPress={() => handleThemeChange('dark')}
          >
            <Text 
              style={tw.style(
                `text-center`,
                themeMode === 'dark' ? 'text-white' : isDark ? 'text-gray-300' : 'text-gray-700'
              )}
            >
              Sombre
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Section Synchronisation */}
      <View
        style={tw.style(
          `m-4 p-4 rounded-lg shadow-sm`,
          isDark ? 'bg-gray-800' : 'bg-white'
        )}
      >
        <Text
          style={tw.style(
            `text-lg font-bold mb-2`,
            isDark ? 'text-white' : 'text-gray-800'
          )}
        >
          Synchronisation
        </Text>

        <View style={tw`flex-row justify-between items-center py-2`}>
          <View>
            <Text
              style={tw.style(
                `text-base`,
                isDark ? 'text-white' : 'text-gray-800'
              )}
            >
              Synchronisation auto
            </Text>
            <Text
              style={tw.style(
                `text-xs mt-1`,
                isDark ? 'text-gray-400' : 'text-gray-500'
              )}
            >
              Actualise automatiquement les données toutes les minutes
            </Text>
          </View>
          <Switch
            value={autoSyncEnabled}
            onValueChange={(value) => {
              setAutoSyncEnabled(value);
              Alert.alert(
                value ? 'Synchronisation activée' : 'Synchronisation désactivée',
                value 
                  ? 'Les données seront actualisées automatiquement.' 
                  : 'Les données ne seront actualisées que manuellement.'
              );
            }}
            trackColor={{ false: '#767577', true: '#3B82F6' }}
            thumbColor={autoSyncEnabled ? '#FFFFFF' : '#f4f3f4'}
          />
        </View>

        {/* Dernière synchronisation */}
        <View style={tw`flex-row justify-between items-center py-2`}>
          <Text
            style={tw.style(
              `text-base`,
              isDark ? 'text-white' : 'text-gray-800'
            )}
          >
            Dernière synchronisation
          </Text>
          <Text
            style={tw.style(
              `text-sm font-medium`,
              isDark ? 'text-gray-300' : 'text-gray-600'
            )}
          >
            {formatLastSync()}
          </Text>
        </View>

        {/* Boutons de synchronisation */}
        <View style={tw`flex-row mt-2`}>
          <TouchableOpacity
            style={tw.style(
              `flex-1 bg-blue-500 rounded-lg py-2 px-4 mr-2`,
              isSyncing ? 'opacity-70' : ''
            )}
            onPress={handleSync}
            disabled={isSyncing}
          >
            <Text style={tw`text-white text-center font-bold`}>
              {isSyncing ? 'Synchronisation...' : 'Synchroniser maintenant'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={tw.style(
              `flex-1 bg-red-500 rounded-lg py-2 px-4`,
              isClearing ? 'opacity-70' : ''
            )}
            onPress={handleClearCache}
            disabled={isClearing}
          >
            <Text style={tw`text-white text-center font-bold`}>
              {isClearing ? 'Nettoyage...' : 'Vider le cache'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Section Déconnexion */}
      <TouchableOpacity
        style={tw.style(
          `m-4 p-4 rounded-lg flex-row items-center justify-center shadow-sm`,
          'bg-red-500'
        )}
        onPress={handleLogout}
      >
        <Ionicons name="log-out-outline" size={20} color="white" />
        <Text style={tw`text-white font-bold ml-2`}>Déconnexion</Text>
      </TouchableOpacity>

      {/* Version de l'application */}
      <Text
        style={tw.style(
          `text-center py-4`,
          isDark ? 'text-gray-500' : 'text-gray-400'
        )}
      >
        KeepNote
      </Text>
    </ScrollView>
  </View>
);
}