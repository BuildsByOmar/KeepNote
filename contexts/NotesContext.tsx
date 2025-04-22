import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { Alert } from "react-native";

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
  fetchNotes: () => Promise<void>;
  createNote: (title: string, content: string, categoryIds: number[]) => Promise<Note | null>;
  updateNote: (id: number, title: string, content: string, categoryIds: number[]) => Promise<boolean>;
  deleteNote: (id: number) => Promise<boolean>;
  getNote: (id: number) => Note | undefined;
  fetchCategories: () => Promise<void>;
  searchNotes: (query: string) => Note[];
  filterNotesByCategory: (categoryId: number | null) => Note[];
  filterNotesByCategories: (categoryIds: number[]) => Note[]; // Nouvelle fonction
};

// Valeurs par défaut du contexte
const NotesContext = createContext<NotesContextType>({
  notes: [],
  categories: [],
  isLoading: false,
  fetchNotes: async () => {},
  createNote: async () => null,
  updateNote: async () => false,
  deleteNote: async () => false,
  getNote: () => undefined,
  fetchCategories: async () => {},
  searchNotes: () => [],
  filterNotesByCategory: () => [],
  filterNotesByCategories: () => [], // Nouvelle fonction
});

// URL de l'API
const API_URL = "https://keep.kevindupas.com/api";

// Custom hook pour utiliser le contexte
export const useNotes = () => useContext(NotesContext);

export function NotesProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { userToken } = useAuth();

  // Fonction pour récupérer les notes depuis le serveur
  const fetchNotes = async () => {
    if (!userToken) return;
    
    setIsLoading(true);
    
    try {
      // Essayer d'abord de récupérer du cache
      const cachedNotes = await AsyncStorage.getItem("notes");
      
      if (cachedNotes) {
        try {
          const parsedNotes = JSON.parse(cachedNotes);
          // Vérifier si c'est un tableau ou s'il contient une propriété data
          if (Array.isArray(parsedNotes)) {
            // S'assurer que toutes les notes ont un ID avant de les définir
            const validNotes = parsedNotes.filter(note => note && note.id);
            if (validNotes.length !== parsedNotes.length) {
              console.warn(`Filtrage de ${parsedNotes.length - validNotes.length} notes sans ID du cache`);
            }
            setNotes(validNotes);
          } else if (parsedNotes.data && Array.isArray(parsedNotes.data)) {
            console.log("Notes cachées extraites de la propriété 'data'");
            // S'assurer que toutes les notes ont un ID
            const validNotes = (parsedNotes.data as Note[]).filter(note => note && note.id);
            if (validNotes.length !== parsedNotes.data.length) {
              console.warn(`Filtrage de ${parsedNotes.data.length - validNotes.length} notes sans ID du cache`);
            }
            setNotes(validNotes);
          } else {
            console.error("Format de notes en cache invalide:", parsedNotes);
            setNotes([]);
          }
        } catch (error) {
          console.error("Erreur lors du parsing des notes en cache:", error);
          setNotes([]);
        }
      }
      
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
      
      // Vérifier si c'est un tableau ou s'il contient une propriété data
      if (Array.isArray(data)) {
        // S'assurer que toutes les notes ont un ID
        const validNotes = data.filter(note => note && note.id);
        if (validNotes.length !== data.length) {
          console.warn(`Filtrage de ${data.length - validNotes.length} notes sans ID de l'API`);
        }
        setNotes(validNotes);
        await AsyncStorage.setItem("notes", JSON.stringify(validNotes));
      } else if (data.data && Array.isArray(data.data)) {
        console.log("Notes API extraites de la propriété 'data'");
        // S'assurer que toutes les notes ont un ID
        const validNotes = (data.data as Note[]).filter(note => note && note.id);
        if (validNotes.length !== data.data.length) {
          console.warn(`Filtrage de ${data.data.length - validNotes.length} notes sans ID de l'API`);
        }
        setNotes(validNotes);
        await AsyncStorage.setItem("notes", JSON.stringify(validNotes));
      } else {
        console.error("Format de notes reçues invalide:", data);
        // Ne pas écraser les notes existantes si le format est invalide
      }
    } catch (err) {
      console.error("Erreur lors du chargement des notes:", err);
      Alert.alert("Erreur", "Impossible de charger les notes");
    } finally {
      setIsLoading(false);
    }
  };

  // Création d'une nouvelle note
  const createNote = async (title: string, content: string, categoryIds: number[] = []) => {
    if (!userToken) return null;
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/notes`, {
        method: "POST",
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
        throw new Error("Erreur lors de la création de la note");
      }
      
      const newNote = await response.json();
      console.log("Nouvelle note créée:", newNote);
      
      // Vérifier que la nouvelle note a un ID
      if (!newNote || !newNote.id) {
        console.error("La note créée n'a pas d'ID:", newNote);
        throw new Error("La note créée est invalide ou n'a pas d'ID");
      }
      
      // Si la note est dans un objet data, l'extraire
      const noteToAdd = newNote.data && newNote.data.id ? newNote.data : newNote;
      
      // Mettre à jour le state et le cache
      const updatedNotes = [...notes, noteToAdd];
      setNotes(updatedNotes);
      await AsyncStorage.setItem("notes", JSON.stringify(updatedNotes));
      
      return noteToAdd;
    } catch (err) {
      console.error("Erreur lors de la création:", err);
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
      
      const updatedNote = await response.json();
      
      // Mettre à jour le state et le cache
      const updatedNotes = notes.map(note => 
        note.id === id ? updatedNote : note
      );
      
      setNotes(updatedNotes);
      await AsyncStorage.setItem("notes", JSON.stringify(updatedNotes));
      
      return true;
    } catch (err) {
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
    const note = notes.find(note => note.id === id);
    // S'assurer que note.categories existe
    if (note && !note.categories) {
      note.categories = [];
    }
    return note;
  };

  // Récupérer les catégories depuis le serveur
  const fetchCategories = async () => {
    if (!userToken) return;
    
    setIsLoading(true);
    
    try {
      // Essayer d'abord de récupérer du cache
      const cachedCategories = await AsyncStorage.getItem("categories");
      
      if (cachedCategories) {
        try {
          const parsedCategories = JSON.parse(cachedCategories);
          // Vérifier si c'est un tableau ou s'il contient une propriété data
          if (Array.isArray(parsedCategories)) {
            setCategories(parsedCategories);
          } else if (parsedCategories.data && Array.isArray(parsedCategories.data)) {
            // Si les données sont encapsulées dans un objet avec une propriété 'data'
            console.log("Données cachées extraites de la propriété 'data'");
            setCategories(parsedCategories.data);
          } else {
            console.error("Format de catégories en cache invalide:", parsedCategories);
            setCategories([]);
          }
        } catch (error) {
          console.error("Erreur lors du parsing des catégories en cache:", error);
          setCategories([]);
        }
      }
      
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
      
      // Vérifier si c'est un tableau ou s'il contient une propriété data
      if (Array.isArray(data)) {
        setCategories(data);
        await AsyncStorage.setItem("categories", JSON.stringify(data));
      } else if (data.data && Array.isArray(data.data)) {
        // Si les données sont encapsulées dans un objet avec une propriété 'data'
        console.log("Données API extraites de la propriété 'data'");
        setCategories(data.data);
        await AsyncStorage.setItem("categories", JSON.stringify(data.data));
      } else {
        console.error("Format de catégories reçues invalide:", data);
        // Ne pas écraser les catégories existantes si le format est invalide
      }
    } catch (err) {
      console.error("Erreur:", err);
      Alert.alert("Erreur", "Impossible de charger les catégories");
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
        note.title.toLowerCase().includes(searchTerm) || 
        note.content.toLowerCase().includes(searchTerm)
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
      note.categories.some(category => category.id === categoryId)
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
      note.categories.some(category => categoryIds.includes(category.id))
    );
  };

  // Charger les notes et catégories au démarrage
  useEffect(() => {
    if (userToken) {
      fetchCategories();
      fetchNotes();
    }
  }, [userToken]);

  return (
    <NotesContext.Provider
      value={{
        notes,
        categories,
        isLoading,
        fetchNotes,
        createNote,
        updateNote,
        deleteNote,
        getNote,
        fetchCategories,
        searchNotes,
        filterNotesByCategory,
        filterNotesByCategories,
      }}
    >
      {children}
    </NotesContext.Provider>
  );
}