import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

/**
 * Utilitaires de sécurité pour l'application KeepNote
 * Ces fonctions fournissent les mécanismes de base pour sécuriser les données
 */

// Fonction pour sanitiser une entrée textuelle
export const sanitizeText = (text: string, maxLength = 1000): string => {
  if (!text) return '';
  return text.trim().substring(0, maxLength);
};

// Échapper le HTML pour éviter les attaques XSS
export const escapeHtml = (text: string): string => {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

// Valider un ID (pour prévenir les injections)
export const isValidId = (id: any): boolean => {
  return typeof id === 'number' && !isNaN(id) && id > 0;
};

// Valider un email
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(sanitizeText(email));
};

// Valider un mot de passe (règles basiques)
export const isValidPassword = (password: string): boolean => {
  return typeof password === 'string' && password.length >= 6;
};

// Générer un hash SHA-256 (utile pour les comparaisons sécurisées)
export const generateHash = async (text: string): Promise<string> => {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    text
  );
};

// Stocker une donnée sensible de manière sécurisée
export const secureStore = {
  // Enregistrer une valeur
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error(`Erreur lors du stockage sécurisé de ${key}:`, error);
      throw new Error('Impossible de stocker la donnée de manière sécurisée');
    }
  },
  
  // Récupérer une valeur
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error(`Erreur lors de la récupération sécurisée de ${key}:`, error);
      return null;
    }
  },
  
  // Supprimer une valeur
  removeItem: async (key: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error(`Erreur lors de la suppression sécurisée de ${key}:`, error);
    }
  }
};

// Classe pour gérer les tentatives infructueuses (protection contre les attaques par force brute)
export class RateLimiter {
  private static attempts: Record<string, number> = {};
  private static timestamps: Record<string, number> = {};
  
  // Vérifier si une action est autorisée
  static checkLimit(action: string, maxAttempts: number, timeWindowMs: number): boolean {
    const now = Date.now();
    const lastAttempt = this.timestamps[action] || 0;
    const attemptCount = this.attempts[action] || 0;
    
    // Réinitialiser le compteur si en dehors de la fenêtre de temps
    if (now - lastAttempt > timeWindowMs) {
      this.attempts[action] = 1;
      this.timestamps[action] = now;
      return true;
    }
    
    // Vérifier si le nombre maximum de tentatives est atteint
    if (attemptCount >= maxAttempts) {
      return false;
    }
    
    // Incrémenter le compteur
    this.attempts[action] = attemptCount + 1;
    this.timestamps[action] = now;
    return true;
  }
  
  // Réinitialiser le compteur pour une action
  static resetAttempts(action: string): void {
    delete this.attempts[action];
    delete this.timestamps[action];
  }
}