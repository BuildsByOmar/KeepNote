/**
 * Tests unitaires pour le contexte de gestion des notes
 * Ces tests valident le fonctionnement des opérations CRUD sur les notes
 */

import React from 'react';
import { render, act, waitFor, fireEvent } from '@testing-library/react-native';
import { NotesProvider, useNotes } from '@/contexts/NotesContext';
import { AuthProvider } from '@/contexts/AuthContext';
import * as SecureStore from 'expo-secure-store';

// Mock de fetch global
global.fetch = jest.fn();

// Mock SecureStore
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(() => Promise.resolve()),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: jest.fn(),
  }),
  useSegments: () => [''],
}));

// Données fictives pour les tests
const mockNotes = [
  { id: 1, title: 'Note 1', content: 'Contenu de la note 1', categories: [] },
  { id: 2, title: 'Note 2', content: 'Contenu de la note 2', categories: [] }
];

const mockCategories = [
  { id: 1, name: 'Travail', color: '#FF0000', user_id: 1 },
  { id: 2, name: 'Personnel', color: '#00FF00', user_id: 1 }
];

// Fonction pour simuler les réponses API
const mockFetchImplementation = (url, options) => {
  if (url.includes('/api/notes') && options.method === 'GET') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockNotes)
    });
  }
  
  if (url.includes('/api/categories') && options.method === 'GET') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockCategories)
    });
  }
  
  if (url.includes('/api/notes') && options.method === 'POST') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ id: 3, ...JSON.parse(options.body) })
    });
  }
  
  if (url.includes('/api/notes/') && options.method === 'PUT') {
    const id = url.split('/').pop();
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ id, ...JSON.parse(options.body) })
    });
  }
  
  if (url.includes('/api/notes/') && options.method === 'DELETE') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });
  }
  
  // Cas par défaut
  return Promise.resolve({
    ok: false,
    json: () => Promise.resolve({ message: 'Not found' })
  });
};

// Composant de test qui utilise le hook useNotes
const TestComponent = () => {
  const { 
    notes, 
    categories, 
    isLoading, 
    fetchNotes, 
    createNote, 
    updateNote, 
    deleteNote, 
    getNote 
  } = useNotes();
  
  return (
    <div>
      <div data-testid="loading-status">{isLoading ? 'Loading' : 'Not Loading'}</div>
      <div data-testid="notes-count">{notes.length}</div>
      <div data-testid="categories-count">{categories.length}</div>
      
      <button 
        data-testid="fetch-notes-button" 
        onClick={fetchNotes}
      >
        Fetch Notes
      </button>
      
      <button 
        data-testid="create-note-button" 
        onClick={() => createNote('Nouvelle note', 'Contenu de la nouvelle note', [1])}
      >
        Create Note
      </button>
      
      <button 
        data-testid="update-note-button" 
        onClick={() => updateNote(1, 'Note mise à jour', 'Contenu mis à jour', [1, 2])}
      >
        Update Note
      </button>
      
      <button 
        data-testid="delete-note-button" 
        onClick={() => deleteNote(1)}
      >
        Delete Note
      </button>
      
      <button 
        data-testid="get-note-button" 
        onClick={() => {
          const note = getNote(1);
          document.getElementById('note-detail').textContent = note ? note.title : 'Note not found';
        }}
      >
        Get Note
      </button>
      
      <div id="note-detail" data-testid="note-detail"></div>
    </div>
  );
};

describe('NotesContext', () => {
  // Réinitialiser les mocks avant chaque test
  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockImplementation(mockFetchImplementation);
    
    // Simuler un utilisateur connecté
    SecureStore.getItemAsync.mockImplementation((key) => {
      if (key === 'userToken') return Promise.resolve('test-token');
      if (key === 'userData') return Promise.resolve(JSON.stringify({ id: 1, name: 'Test User' }));
      if (key === 'secure_note_categories_map') return Promise.resolve('{}');
      if (key === 'secure_auto_sync_setting') return Promise.resolve('true');
      return Promise.resolve(null);
    });
  });

  /**
   * Test 1: Vérifier le chargement des notes
   * Objectif: S'assurer que fetchNotes récupère et affiche correctement les notes
   */
  test('fetchNotes devrait charger et afficher les notes et catégories', async () => {
    // Configurer et rendre le composant
    const { getByTestId } = render(
      <AuthProvider>
        <NotesProvider>
          <TestComponent />
        </NotesProvider>
      </AuthProvider>
    );

    // Attendre que le composant soit chargé
    await waitFor(() => {
      expect(getByTestId('loading-status').textContent).toBe('Not Loading');
    });

    // Simuler un clic sur le bouton pour charger les notes
    await act(async () => {
      getByTestId('fetch-notes-button').click();
    });

    // Vérifier que l'API a été appelée
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/notes'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-token'
        })
      })
    );

    // Attendre que les données soient chargées
    await waitFor(() => {
      expect(getByTestId('notes-count').textContent).toBe(String(mockNotes.length));
      expect(getByTestId('categories-count').textContent).toBe(String(mockCategories.length));
    });
  });

  /**
   * Test 2: Vérifier la création d'une note
   * Objectif: S'assurer que createNote envoie correctement les données et met à jour l'état
   */
  test('createNote devrait créer une nouvelle note et mettre à jour l\'état', async () => {
    // Configurer et rendre le composant
    const { getByTestId } = render(
      <AuthProvider>
        <NotesProvider>
          <TestComponent />
        </NotesProvider>
      </AuthProvider>
    );

    // Attendre que le composant soit chargé
    await waitFor(() => {
      expect(getByTestId('loading-status').textContent).toBe('Not Loading');
    });

    // Simuler un clic sur le bouton pour créer une note
    await act(async () => {
      getByTestId('create-note-button').click();
    });

    // Vérifier que l'API a été appelée avec les bonnes données
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/notes'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        }),
        body: expect.stringContaining('Nouvelle note')
      })
    );

    // Vérifier que SecureStore a été appelé pour sauvegarder les associations
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'secure_note_categories_map',
      expect.any(String)
    );
  });

  /**
   * Test 3: Vérifier la mise à jour d'une note
   * Objectif: S'assurer que updateNote envoie correctement les données et met à jour l'état
   */
  test('updateNote devrait mettre à jour une note existante', async () => {
    // Configurer et rendre le composant
    const { getByTestId } = render(
      <AuthProvider>
        <NotesProvider>
          <TestComponent />
        </NotesProvider>
      </AuthProvider>
    );

    // Attendre que le composant soit chargé
    await waitFor(() => {
      expect(getByTestId('loading-status').textContent).toBe('Not Loading');
    });

    // Charger d'abord les notes
    await act(async () => {
      getByTestId('fetch-notes-button').click();
    });

    // Simuler un clic sur le bouton pour mettre à jour une note
    await act(async () => {
      getByTestId('update-note-button').click();
    });

    // Vérifier que l'API a été appelée avec les bonnes données
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/notes/1'),
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        }),
        body: expect.stringContaining('Note mise à jour')
      })
    );

    // Vérifier que SecureStore a été appelé pour sauvegarder les associations
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'secure_note_categories_map',
      expect.any(String)
    );
  });
});