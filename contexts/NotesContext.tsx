import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, ReactNode, useState, useEffect, useRef } from "react";
import { useAuth } from "./AuthContext";
import { Alert } from "react-native";
import * as Application from 'expo-application';

// Définition des types
export type Category = {
  id: number;
  name: string;
  color: string;
  user_id: number;
};

export type Note = {
  id: number;
  title: string;
  content: string;
  user_id: number;
  created_at: string;
  updated_at: string;
  categories: Category[]; // Une note peut avoir plusieurs catégories
};

type NotesContextType = {
  notes: Note[];
  categories: Category[];
  isLoading: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  autoSyncEnabled: boolean;
  setAutoSyncEnabled: (enabled: boolean) => void;
  fetchNotes: () => Promise<void>;
  createNote: (title: string, content: string, categoryIds: number[]) => Promise<Note | null>;
  updateNote: (id: number, title: string, content: string, categoryIds: number[]) => Promise<boolean>;
  deleteNote: (id: number) => Promise<boolean>;
  getNote: (id: number) => Note | undefined;
  fetchCategories: () => Promise<void>;
  searchNotes: (query: string) => Note[];
  filterNotesByCategory: (categoryId: number | null) => Note[];
  filterNotesByCategories: (categoryIds: number[]) => Note[];
  clearCache: () => Promise<boolean>;
  syncAll: () => Promise<boolean>;
};

// URL de l'API
const API_URL = "https://keep.kevindupas.com/api";

// Valeurs par défaut du contexte
const NotesContext = createContext<NotesContextType>({
  notes: [],
  categories: [],
  isLoading: false,
  isSyncing: false,
  lastSyncTime: null,
  autoSyncEnabled: true,
  setAutoSyncEnabled: () => {},
  fetchNotes: async () => {},
  createNote: async () => null,
  updateNote: async () => false,
  deleteNote: async () => false,
  getNote: () => undefined,
  fetchCategories: async () => {},
  searchNotes: () => [],
  filterNotesByCategory: () => [],
  filterNotesByCategories: () => [],
  clearCache: async () => false,
  syncAll: async () => false,
});

// Custom hook pour utiliser le contexte
export const useNotes = () => useContext(NotesContext);

// Variable pour stocker les associations note-catégories
let noteCategories: Record<number, number[]> = {};

export function NotesProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(true);
  const { userToken } = useAuth();
  
  // Référence pour le timer de synchronisation automatique
  const syncTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Charger les préférences de synchronisation automatique
  useEffect(() => {
    const loadSyncPreferences = async () => {
      try {
        const syncPref = await AsyncStorage.getItem('autoSyncEnabled');
        if (syncPref !== null) {
          setAutoSyncEnabled(syncPref === 'true');
        }
      } catch (error) {
        console.error("Erreur lors du chargement des préférences de synchronisation:", error);
      }
    };

    loadSyncPreferences();
  }, []);

  // Charger les associations note-catégories au démarrage
  useEffect(() => {
    const loadNoteCategories = async () => {
      try {
        const storedAssociations = await AsyncStorage.getItem("note-categories");
        if (storedAssociations) {
          noteCategories = JSON.parse(storedAssociations);
          console.log("Associations note-catégories chargées:", Object.keys(noteCategories).length);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des associations note-catégories:", error);
      }
    };

    loadNoteCategories();
  }, []);

  // Configurer la synchronisation automatique
  useEffect(() => {
    if (userToken && autoSyncEnabled) {
      // Nettoyer tout timer existant
      if (syncTimerRef.current) {
        clearInterval(syncTimerRef.current);
      }

      // Démarrer un nouveau timer pour la synchronisation
      syncTimerRef.current = setInterval(() => {
        syncAll();
      }, 60000); // Synchroniser toutes les 60 secondes

      // Synchroniser immédiatement au démarrage
      syncAll();

      return () => {
        if (syncTimerRef.current) {
          clearInterval(syncTimerRef.current);
        }
      };
    } else if (syncTimerRef.current) {
      // Si la synchronisation est désactivée, arrêter le timer
      clearInterval(syncTimerRef.current);
      syncTimerRef.current = null;
    }
  }, [userToken, autoSyncEnabled]);

  // Fonction pour mettre à jour la préférence de synchronisation
  const updateAutoSyncPreference = async (enabled: boolean) => {
    setAutoSyncEnabled(enabled);
    try {
      await AsyncStorage.setItem('autoSyncEnabled', enabled.toString());
    } catch (error) {
      console.error("Erreur lors de l'enregistrement des préférences de synchronisation:", error);
    }
  };

  // Fonction pour synchroniser toutes les données
  const syncAll = async (): Promise<boolean> => {
    if (!userToken || isSyncing) return false;

    setIsSyncing(true);
    try {
      await fetchCategories();
      await fetchNotes();
      setLastSyncTime(new Date());
      return true;
    } catch (error) {
      console.error("Erreur lors de la synchronisation complète:", error);
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  // Fonction pour vider le cache
  const clearCache = async (): Promise<boolean> => {
    try {
      await AsyncStorage.removeItem("notes");
      await AsyncStorage.removeItem("categories");
      await AsyncStorage.removeItem("note-categories");
      noteCategories = {};
      setNotes([]);
      setCategories([]);
      
      // Recharger les données depuis l'API
      await syncAll();
      return true;
    } catch (error) {
      console.error("Erreur lors du vidage du cache:", error);
      return false;
    }
  };

  // Fonction pour récupérer les notes depuis le serveur
  const fetchNotes = async () => {
    if (!userToken) return;
    
    setIsLoading(true);
    
    try {
      // Garder une copie des notes actuelles pour préserver les catégories
      const currentNotes = [...notes];
      const noteIdToCategoriesMap = new Map();
      
      // Créer une map des catégories de chaque note
      currentNotes.forEach(note => {
        if (note.id && note.categories && note.categories.length > 0) {
          noteIdToCategoriesMap.set(note.id, note.categories);
        }
      });
      
      console.log("Préservation des catégories pour", noteIdToCategoriesMap.size, "notes");
      
      // Récupérer les nouvelles données de l'API
      const response = await fetch(`${API_URL}/notes`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
          Accept: "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des notes");
      }
      
      const data = await response.json();
      console.log("Données brutes reçues de l'API:", data);
      
      let newNotes: Note[] = [];
      
      // Extraire les notes selon le format de réponse
      if (Array.isArray(data)) {
        newNotes = data.filter(note => note && note.id);
      } else if (data.data && Array.isArray(data.data)) {
        newNotes = (data.data as Note[]).filter(note => note && note.id);
      } else {
        console.error("Format de notes reçues invalide:", data);
        setIsLoading(false);
        return;
      }
      
      // CRUCIAL: Préserver les catégories des notes
      newNotes = newNotes.map(note => {
        // Si la note n'a pas de catégories ou a un tableau vide
        if (!note.categories || note.categories.length === 0) {
          // Vérifier si nous avons des catégories préservées pour cette note
          if (noteIdToCategoriesMap.has(note.id)) {
            return {
              ...note,
              categories: noteIdToCategoriesMap.get(note.id)
            };
          }
          
          // Vérifier si nous avons des catégories stockées pour cette note
          if (noteCategories[note.id]) {
            const storedCategoryIds = noteCategories[note.id];
            const storedCategories = categories
              .filter(cat => storedCategoryIds.includes(cat.id))
              .map(cat => ({
                id: cat.id,
                name: cat.name,
                color: cat.color,
                user_id: cat.user_id
              }));
              
            return {
              ...note,
              categories: storedCategories
            };
          }
        }
        // S'assurer que categories est au moins un tableau vide
        if (!note.categories) {
          return { ...note, categories: [] };
        }
        return note;
      });
      
      console.log("Notes après préservation des catégories:", newNotes.length);
      
      // Mettre à jour le state et le cache
      setNotes(newNotes);
      await AsyncStorage.setItem("notes", JSON.stringify(newNotes));
    } catch (err) {
      console.error("Erreur lors du chargement des notes:", err);
      // Ne pas afficher d'alerte si c'est une synchronisation en arrière-plan
      if (isLoading) {
        Alert.alert("Erreur", "Impossible de charger les notes");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Création d'une nouvelle note
  const createNote = async (title: string, content: string, categoryIds: number[] = []) => {
    if (!userToken) return null;
    
    setIsLoading(true);
    
    try {
      // Log pour déboguer
      console.log("Création de note avec catégories:", categoryIds);
      
      // Corps de la requête
      const requestBody = {
        title,
        content,
        category_ids: categoryIds,
      };
      
      console.log("Corps de la requête:", JSON.stringify(requestBody));
      
      const response = await fetch(`${API_URL}/notes`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${userToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(requestBody),
      });
      
      // Vérifier le statut de la réponse
      console.log("Statut de la réponse:", response.status);
      
      if (!response.ok) {
        throw new Error("Erreur lors de la création de la note");
      }
      
      // Récupérer la réponse
      const responseData = await response.json();
      console.log("Réponse API création:", responseData);
      
      // Extraire la note selon le format retourné
      let noteToAdd;
      
      if (responseData.data) {
        // Format { data: { note } }
        noteToAdd = responseData.data;
      } else {
        // Format direct
        noteToAdd = responseData;
      }
      
      // Vérifier que la note a un ID
      if (!noteToAdd || typeof noteToAdd.id === 'undefined') {
        console.error("Note créée sans ID:", noteToAdd);
        throw new Error("La note créée est invalide");
      }
      
      // IMPORTANT: S'assurer que la note a un tableau categories
      if (!noteToAdd.categories) {
        noteToAdd.categories = [];
      }
      
      // CRUCIAL: Si des catégories ont été sélectionnées, les ajouter 
      // manuellement car l'API ne les retourne pas immédiatement
      if (categoryIds.length > 0) {
        // Trouver les objets catégories complets à partir des IDs
        const selectedCategories = categories
          .filter(cat => categoryIds.includes(cat.id))
          .map(cat => ({
            id: cat.id,
            name: cat.name,
            color: cat.color,
            user_id: cat.user_id
          }));
          
        console.log("Catégories manuellement attachées:", selectedCategories);
        noteToAdd.categories = selectedCategories;
        
        // Stocker l'association note-catégories
        noteCategories[noteToAdd.id] = categoryIds;
        await AsyncStorage.setItem("note-categories", JSON.stringify(noteCategories));
      }
      
      console.log("Note finalisée pour ajout:", noteToAdd);
      
      // Mettre à jour l'état et le cache en ÉVITANT de modifier les notes déjà existantes
      // On utilise une nouvelle référence pour être sûr de déclencher la mise à jour de l'interface
      const updatedNotes = [...notes, noteToAdd];
      
      // Sauvegarder dans AsyncStorage AVANT de mettre à jour l'état React
      await AsyncStorage.setItem("notes", JSON.stringify(updatedNotes));
      
      // Maintenant mettre à jour l'état
      setNotes(updatedNotes);
      
      return noteToAdd;
    } catch (err) {
      console.error("Erreur détaillée lors de la création:", err);
      Alert.alert("Erreur", "Impossible de créer la note");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Mise à jour d'une note existante
  const updateNote = async (id: number, title: string, content: string, categoryIds: number[] = []) => {
    if (!userToken) return false;
    
    setIsLoading(true);
    
    try {
      // Log pour déboguer
      console.log("Mise à jour de note ID:", id, "avec catégories:", categoryIds);
      
      const response = await fetch(`${API_URL}/notes/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${userToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          title,
          content,
          category_ids: categoryIds,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour de la note");
      }
      
      // Récupérer la réponse
      const responseData = await response.json();
      console.log("Réponse API mise à jour:", responseData);
      
      // Extraire la note selon le format retourné
      let updatedNote;
      
      if (responseData.data) {
        // Format { data: { note } }
        updatedNote = responseData.data;
      } else {
        // Format direct
        updatedNote = responseData;
      }
      
      // Vérifier que la note a un ID
      if (!updatedNote || typeof updatedNote.id === 'undefined') {
        console.error("Note mise à jour sans ID:", updatedNote);
        throw new Error("La note mise à jour est invalide");
      }
      
      // IMPORTANT: S'assurer que la note a un tableau categories initialisé
      if (!updatedNote.categories) {
        updatedNote.categories = [];
      }
      
      // CRUCIAL: Attacher manuellement les catégories sélectionnées à la note mise à jour
      if (categoryIds.length > 0) {
        // Trouver les objets catégories complets à partir des IDs
        const selectedCategories = categories
          .filter(cat => categoryIds.includes(cat.id))
          .map(cat => ({
            id: cat.id,
            name: cat.name,
            color: cat.color,
            user_id: cat.user_id
          }));
          
        console.log("Catégories attachées manuellement après mise à jour:", selectedCategories);
        updatedNote.categories = selectedCategories;
        
        // Mettre à jour l'association note-catégories
        noteCategories[id] = categoryIds;
        await AsyncStorage.setItem("note-categories", JSON.stringify(noteCategories));
      } else {
        // Si aucune catégorie n'est sélectionnée, s'assurer que le tableau est vide
        updatedNote.categories = [];
        // Supprimer l'association si elle existe
        if (noteCategories[id]) {
          delete noteCategories[id];
          await AsyncStorage.setItem("note-categories", JSON.stringify(noteCategories));
        }
      }
      
      console.log("Note finalisée après mise à jour:", updatedNote);
      
      // Mettre à jour l'état en modifiant uniquement la note concernée
      const updatedNotes = notes.map(note => 
        note.id === id ? updatedNote : note
      );
      
      // D'abord sauvegarder dans AsyncStorage
      await AsyncStorage.setItem("notes", JSON.stringify(updatedNotes));
      
      // Puis mettre à jour l'état React
      setNotes(updatedNotes);
      
      return true;
    } catch (err) {
      console.error("Erreur détaillée lors de la mise à jour:", err);
      Alert.alert("Erreur", "Impossible de mettre à jour la note");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Suppression d'une note
  const deleteNote = async (id: number) => {
    if (!userToken) return false;
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/notes/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${userToken}`,
          Accept: "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error("Erreur lors de la suppression");
      }
      
      // Mettre à jour le state et le cache
      const updatedNotes = notes.filter(note => note.id !== id);
      setNotes(updatedNotes);
      await AsyncStorage.setItem("notes", JSON.stringify(updatedNotes));
      
      // Supprimer également l'association note-catégories si elle existe
      if (noteCategories[id]) {
        delete noteCategories[id];
        await AsyncStorage.setItem("note-categories", JSON.stringify(noteCategories));
      }
      
      return true;
    } catch (err) {
      Alert.alert("Erreur", "Impossible de supprimer la note");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Récupérer une note spécifique par ID
  const getNote = (id: number) => {
    // Vérifier si notes est un tableau
    if (!Array.isArray(notes)) {
      console.error("Notes n'est pas un tableau dans getNote");
      return undefined;
    }
    
    // Chercher la note par ID
    const note = notes.find(note => note && note.id === id);
    
    // Si note non trouvée
    if (!note) {
      console.warn(`Note avec ID ${id} non trouvée`);
      return undefined;
    }
    
    // Créer une copie pour éviter de modifier l'état directement
    const noteCopy = { ...note };
    
    // S'assurer que categories est un tableau
    if (!noteCopy.categories) {
      noteCopy.categories = [];
      
      // Vérifier si nous avons des catégories stockées pour cette note
      if (noteCategories[id]) {
        const storedCategoryIds = noteCategories[id];
        const storedCategories = categories
          .filter(cat => storedCategoryIds.includes(cat.id))
          .map(cat => ({
            id: cat.id,
            name: cat.name,
            color: cat.color,
            user_id: cat.user_id
          }));
          
        noteCopy.categories = storedCategories;
      }
    }
    
    return noteCopy;
  };

  // Récupérer les catégories depuis le serveur
  const fetchCategories = async () => {
    if (!userToken) return;
    
    setIsLoading(true);
    
    try {
      // Récupérer les nouvelles données
      const response = await fetch(`${API_URL}/categories`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
          Accept: "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des catégories");
      }
      
      const data = await response.json();
      console.log("Réponse API catégories:", data);
      
      // Vérifier si c'est un tableau ou s'il contient une propriété data
      if (Array.isArray(data)) {
        setCategories(data);
        await AsyncStorage.setItem("categories", JSON.stringify(data));
      } else if (data.data && Array.isArray(data.data)) {
        // Si les données sont encapsulées dans un objet avec une propriété 'data'
        console.log("Données API catégories extraites de la propriété 'data'");
        setCategories(data.data);
        await AsyncStorage.setItem("categories", JSON.stringify(data.data));
      } else {
        console.error("Format de catégories reçues invalide:", data);
        // Ne pas écraser les catégories existantes si le format est invalide
      }
    } catch (err) {
      console.error("Erreur:", err);
      // Ne pas afficher d'alerte si c'est une synchronisation en arrière-plan
      if (isLoading) {
        Alert.alert("Erreur", "Impossible de charger les catégories");
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Recherche de notes par texte
  const searchNotes = (query: string): Note[] => {
    if (!query.trim()) return notes;
    
    // Vérifier que notes est bien un tableau
    if (!Array.isArray(notes)) {
      console.error("Notes n'est pas un tableau dans searchNotes:", notes);
      return [];
    }
    
    const searchTerm = query.toLowerCase().trim();
    return notes.filter(
      note => 
        (note.title && note.title.toLowerCase().includes(searchTerm)) || 
        (note.content && note.content.toLowerCase().includes(searchTerm))
    );
  };

  // Filtrage des notes par catégorie
  const filterNotesByCategory = (categoryId: number | null): Note[] => {
    if (categoryId === null) return notes;
    
    // Vérifier que notes est bien un tableau
    if (!Array.isArray(notes)) {
      console.error("Notes n'est pas un tableau dans filterNotesByCategory:", notes);
      return [];
    }
    
    return notes.filter(note => 
      note.categories && Array.isArray(note.categories) &&
      note.categories.some(category => category && category.id === categoryId)
    );
  };

  // Filtrage des notes par plusieurs catégories
  const filterNotesByCategories = (categoryIds: number[]): Note[] => {
    if (!categoryIds.length) return notes;
    
    // Vérifier que notes est bien un tableau
    if (!Array.isArray(notes)) {
      console.error("Notes n'est pas un tableau dans filterNotesByCategories:", notes);
      return [];
    }
    
    return notes.filter(note => 
      note.categories && Array.isArray(note.categories) &&
      note.categories.some(category => 
        category && categoryIds.includes(category.id)
      )
    );
  };

  // Surveiller les changements d'état de l'application
  useEffect(() => {
    if (userToken) {
      // Charger les données au démarrage
      syncAll();
    }
  }, [userToken]);

  return (
    <NotesContext.Provider
      value={{
        notes,
        categories,
        isLoading,
        isSyncing,
        lastSyncTime,
        autoSyncEnabled,
        setAutoSyncEnabled: updateAutoSyncPreference,
        fetchNotes,
        createNote,
        updateNote,
        deleteNote,
        getNote,
        fetchCategories,
        searchNotes,
        filterNotesByCategory,
        filterNotesByCategories,
        clearCache,
        syncAll,
      }}
    >
      {children}
    </NotesContext.Provider>
  );
}