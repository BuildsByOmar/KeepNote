import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

// URL de base de l'API
const API_URL = "https://keep.kevindupas.com/api";

// Intercepteur pour gérer les erreurs liées au token
const handleTokenErrors = async (response: Response) => {
  if (response.status === 401) {
    // Token expiré ou invalide
    console.log("Token expiré ou invalide, déconnexion nécessaire");
    await SecureStore.deleteItemAsync("userToken");
    await SecureStore.deleteItemAsync("userData");
    
    // Déclencher un événement pour la déconnexion de l'utilisateur
    document.dispatchEvent(new CustomEvent('auth:token-expired'));
  }
  
  return response;
};

// Méthode pour récupérer le token d'authentification de manière sécurisée
const getAuthToken = async (): Promise<string | null> => {
  const token = await SecureStore.getItemAsync("userToken");
  
  // Vérifier si le token a expiré
  const expiryStr = await SecureStore.getItemAsync("tokenExpiry");
  if (token && expiryStr) {
    const expiry = parseInt(expiryStr, 10);
    const now = new Date().getTime();
    
    if (now > expiry) {
      // Token expiré, on le supprime
      await SecureStore.deleteItemAsync("userToken");
      await SecureStore.deleteItemAsync("userData");
      await SecureStore.deleteItemAsync("tokenExpiry");
      return null;
    }
  }
  
  return token;
};

// Fonction pour sanitiser les entrées utilisateur
const sanitizeInput = (input: string): string => {
  if (!input) return '';
  return input.trim();
};

// Fonction pour valider un ID numérique
const isValidId = (id: any): boolean => {
  return typeof id === 'number' && !isNaN(id) && id > 0;
};

// Méthodes d'API avec gestion du token et sécurité
export const apiService = {
  // GET avec authentification
  async get(endpoint: string, requireAuth: boolean = true) {
    const headers: Record<string, string> = {
      "Accept": "application/json",
      "Content-Type": "application/json",
    };

    if (requireAuth) {
      const token = await getAuthToken();
      if (!token) {
        throw new Error("Session expirée, veuillez vous reconnecter");
      }
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "GET",
        headers,
      });

      // Gestion des erreurs de token
      await handleTokenErrors(response);

      if (!response.ok) {
        this.handleApiError(response.status);
      }

      return await response.json();
    } catch (error) {
      console.error("Erreur API GET:", endpoint);
      throw new Error("Impossible de communiquer avec le serveur");
    }
  },

  // POST avec authentification
  async post(endpoint: string, data: any, requireAuth: boolean = true) {
    const headers: Record<string, string> = {
      "Accept": "application/json",
      "Content-Type": "application/json",
    };

    if (requireAuth) {
      const token = await getAuthToken();
      if (!token) {
        throw new Error("Session expirée, veuillez vous reconnecter");
      }
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Sanitiser les données sensibles
    const sanitizedData = this.sanitizeRequestData(data);

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers,
        body: JSON.stringify(sanitizedData),
      });

      // Gestion des erreurs de token
      await handleTokenErrors(response);

      if (!response.ok) {
        this.handleApiError(response.status);
      }

      return await response.json();
    } catch (error) {
      console.error("Erreur API POST:", endpoint);
      throw new Error("Impossible de communiquer avec le serveur");
    }
  },

  // PUT avec authentification
  async put(endpoint: string, data: any) {
    const token = await getAuthToken();
    if (!token) {
      throw new Error("Session expirée, veuillez vous reconnecter");
    }

    const headers: Record<string, string> = {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    };

    // Sanitiser les données sensibles
    const sanitizedData = this.sanitizeRequestData(data);

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(sanitizedData),
      });

      // Gestion des erreurs de token
      await handleTokenErrors(response);

      if (!response.ok) {
        this.handleApiError(response.status);
      }

      return await response.json();
    } catch (error) {
      console.error("Erreur API PUT:", endpoint);
      throw new Error("Impossible de communiquer avec le serveur");
    }
  },

  // DELETE avec authentification
  async delete(endpoint: string) {
    const token = await getAuthToken();
    if (!token) {
      throw new Error("Session expirée, veuillez vous reconnecter");
    }

    const headers: Record<string, string> = {
      "Accept": "application/json",
      "Authorization": `Bearer ${token}`
    };

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "DELETE",
        headers,
      });

      // Gestion des erreurs de token
      await handleTokenErrors(response);

      if (!response.ok) {
        this.handleApiError(response.status);
      }

      return await response.json();
    } catch (error) {
      console.error("Erreur API DELETE:", endpoint);
      throw new Error("Impossible de communiquer avec le serveur");
    }
  },

  // Méthode pour gérer les erreurs API sans exposer de détails sensibles
  handleApiError(status: number) {
    switch (status) {
      case 400:
        throw new Error("Requête invalide");
      case 401:
        throw new Error("Session expirée, veuillez vous reconnecter");
      case 403:
        throw new Error("Accès non autorisé");
      case 404:
        throw new Error("Ressource introuvable");
      case 422:
        throw new Error("Données invalides");
      case 429:
        throw new Error("Trop de requêtes, veuillez réessayer plus tard");
      case 500:
      case 502:
      case 503:
        throw new Error("Erreur serveur, veuillez réessayer plus tard");
      default:
        throw new Error("Une erreur est survenue");
    }
  },

  // Sanitiser les données de requête pour éviter les injections
  sanitizeRequestData(data: any) {
    if (!data) return {};
    
    // Cas d'un objet
    if (typeof data === 'object' && data !== null) {
      const result: Record<string, any> = {};
      
      for (const [key, value] of Object.entries(data)) {
        // Récursion pour les objets imbriqués
        if (typeof value === 'object' && value !== null) {
          result[key] = this.sanitizeRequestData(value);
        } 
        // Sanitiser les chaînes de caractères
        else if (typeof value === 'string') {
          result[key] = sanitizeInput(value);
        } 
        // Vérifier les ID numériques
        else if (key.includes('id') && typeof value === 'number') {
          result[key] = isValidId(value) ? value : null;
        }
        // Copier les autres types tels quels
        else {
          result[key] = value;
        }
      }
      
      return result;
    }
    
    // Cas d'une chaîne de caractères
    if (typeof data === 'string') {
      return sanitizeInput(data);
    }
    
    // Autres types passent sans modification
    return data;
  },

  // Méthode pour générer un hash SHA-256 (utile pour sécuriser des données)
  async generateHash(text: string): Promise<string> {
    return await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      text
    );
  }
};

// Écouteur d'événement pour la gestion des token expirés
export const setupTokenExpirationListener = (onTokenExpired: () => void) => {
  const handleTokenExpired = () => {
    onTokenExpired();
  };

  document.addEventListener('auth:token-expired', handleTokenExpired);

  // Fonction de nettoyage
  return () => {
    document.removeEventListener('auth:token-expired', handleTokenExpired);
  };
};