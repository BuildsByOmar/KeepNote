// Fichier pour stocker et partager des données entre les tests
import fs from 'fs';
import path from 'path';

const tokenFilePath = path.resolve(__dirname, '../.token');
const noteIdFilePath = path.resolve(__dirname, '../.noteId');

// Sauvegarde le token pour les autres tests
export function saveToken(token: string): void {
    fs.writeFileSync(tokenFilePath, token);
}

// Récupère le token sauvegardé
export function getToken(): string {
    if (!fs.existsSync(tokenFilePath)) {
        throw new Error('Le token n\'existe pas. Exécutez d\'abord le test d\'authentification.');
    }
    return fs.readFileSync(tokenFilePath, 'utf8');
}

// Sauvegarde l'ID d'une note
export function saveNoteId(id: number): void {
    fs.writeFileSync(noteIdFilePath, id.toString());
}

// Récupère l'ID de note sauvegardé
export function getNoteId(): number {
    if (!fs.existsSync(noteIdFilePath)) {
        throw new Error('L\'ID de note n\'existe pas. Exécutez d\'abord le test de récupération des notes.');
    }
    return parseInt(fs.readFileSync(noteIdFilePath, 'utf8'));
}