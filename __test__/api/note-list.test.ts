// Test de récupération d'une note spécifique par ID
import { getToken, getNoteId } from '../utils/api-utils';
// Ajouter node-fetch pour les environnements Node.js
import fetch from 'node-fetch';

describe('API Note by ID', () => {
    test('récupération d\'une note spécifique par ID', async () => {
        try {
            // Récupérer le token et l'ID de note depuis les tests précédents
            const authToken = getToken();
            const noteId = getNoteId();

            console.log('Token utilisé:', authToken);
            console.log('ID de note utilisé:', noteId);

            // Appel API pour récupérer une note spécifique
            const response = await fetch(`https://keep.kevindupas.com/api/notes/${noteId}`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Accept': 'application/json'
                }
            });

            // Afficher le statut de la réponse
            console.log('Statut de la réponse:', response.status);

            // Vérifier que la requête a réussi
            expect(response.ok).toBe(true);

            // Récupérer le texte brut puis le parser
            const rawText = await response.text();
            console.log('Réponse brute:', rawText);

            // Parser le JSON manuellement
            const responseData = JSON.parse(rawText);

            // Vérifier la structure de la réponse
            expect(responseData).toBeDefined();

            // La réponse peut être directement la note ou un objet contenant une propriété 'data'
            const note = responseData.data || responseData;

            // Vérifier la structure de la note
            expect(note).toBeDefined();
            expect(note.id).toBe(noteId);
            expect(note.title).toBeDefined();
            expect(note.content).toBeDefined();

            // Afficher la note pour démo
            console.log('Note récupérée par ID:', note);
        } catch (error) {
            console.error('Erreur lors du test:', error);
            throw error;
        }
    }, 15000);
});