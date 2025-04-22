# KeepNote - Application Mobile de Gestion de Notes

## Description
KeepNote est une application mobile développée avec React Native et Expo, inspirée de Google Keep. Elle permet aux utilisateurs de créer, organiser et gérer leurs notes et tâches, avec une interface intuitive et des fonctionnalités de personnalisation.

## Fonctionnalités Principales

### Gestion des Notes
- Création, lecture, modification et suppression de notes
- Recherche textuelle dans les notes
- Organisation par catégories avec code couleur
- Interface utilisateur intuitive et responsive

### Authentification et Sécurité
- Authentification par token JWT
- Connexion via email/mot de passe ou scan de QR code
- Stockage sécurisé des données sensibles
- Protection contre les attaques courantes (XSS, CSRF, injections)

### Interface Utilisateur
- Thème personnalisable (clair/sombre/système)
- Filtrage par catégories
- Affichage en liste avec design cards
- Indicateurs multicolores pour notes avec plusieurs catégories

### Synchronisation
- Synchronisation automatique en arrière-plan (toutes les 60 secondes)
- Synchronisation manuelle à la demande
- Gestion robuste des erreurs de synchronisation
- Mode hors ligne pour l'accès aux notes sans connexion

## Structure du Projet

```
/projet-keepnote
├── /app                  # Pages principales de l'application (Expo Router)
│   ├── index.tsx         # Écran principal avec liste des notes
│   ├── settings.tsx      # Paramètres de l'application
│   ├── /notes            # Gestion des notes
│   │   ├── [id].tsx      # Détail et édition d'une note
│   │   └── create.tsx    # Création d'une nouvelle note
│   └── /(auth)           # Routes d'authentification
│       ├── login.tsx     # Écran de connexion
│       └── qr-scan.tsx   # Scan de QR code pour connexion
├── /components           # Composants réutilisables
│   └── /notes            # Composants liés aux notes
│       └── NoteList.tsx  # Liste des notes avec filtres
├── /contexts             # Gestionnaires d'état (Context API)
│   ├── AuthContext.tsx   # Gestion de l'authentification
│   ├── NotesContext.tsx  # Gestion des notes et catégories
│   └── ThemeContext.tsx  # Gestion du thème de l'application
└── /utils                # Utilitaires
    └── SecurityUtils.ts  # Fonctions de sécurité
```

## Technologies Utilisées

- **Frontend** : React Native, Expo, Expo Router
- **État** : React Context API
- **Styling** : Tailwind CSS (via twrnc)
- **Authentification** : JWT (JSON Web Tokens)
- **Stockage local** : AsyncStorage, SecureStore
- **Sécurité** : Validation des entrées, protection XSS, stockage sécurisé

## Améliorations Récentes

### Version 2.0 (Avril 2025)

1. **Amélioration de l'interface utilisateur**
   - Design épuré et moderne
   - Animations de transition
   - Indicateurs multicolores pour notes avec plusieurs catégories

2. **Gestion du thème**
   - Système personnalisable (clair/sombre/système)
   - Persistance des préférences via SecureStore
   - Application cohérente dans toute l'application

3. **Optimisation des performances**
   - Réduction des re-rendus inutiles
   - Mise en cache des données
   - Temps de chargement amélioré

4. **Sécurité renforcée**
   - Migration d'AsyncStorage vers SecureStore pour les données sensibles
   - Validation des entrées utilisateur
   - Protection contre les attaques XSS et par force brute

### Version 1.5 (Février 2025)

1. **Synchronisation automatique**
   - Synchronisation périodique toutes les 60 secondes
   - Option de désactivation par l'utilisateur
   - Gestion des conflits améliorée

2. **Gestion des catégories**
   - Stockage local des associations note-catégories
   - Solution robuste pour l'erreur "item.id is undefined"
   - Interface de sélection des catégories améliorée

3. **Navigation avancée**
   - Navigation directe entre création, consultation et édition
   - Boutons de retour intelligents
   - Historique de navigation préservé

## Installation et Configuration

### Prérequis
- Node.js 16+
- npm ou yarn
- Expo CLI
- Compte Expo pour les builds

### Installation
1. Cloner le dépôt
   ```bash
   git clone https://github.com/yourusername/keepnote.git
   cd keepnote
   ```

2. Installer les dépendances
   ```bash
   npm install
   # ou
   yarn install
   ```

3. Démarrer le serveur de développement
   ```bash
   npx expo start
   ```

4. Scanner le QR code avec l'application Expo Go sur votre appareil

### Configuration de l'API
L'application est configurée pour communiquer avec l'API à l'adresse suivante :
```
https://keep.kevindupas.com/api
```

## Bonnes Pratiques de Sécurité

L'application implémente plusieurs mesures de sécurité conformes aux recommandations OWASP Mobile Top 10 :

1. **Stockage sécurisé des données**
   - Utilisation d'Expo SecureStore pour les tokens et données sensibles
   - Aucune donnée critique n'est stockée dans AsyncStorage non chiffré

2. **Authentification sécurisée**
   - Tokens JWT avec expiration
   - Protection contre les tentatives multiples de connexion
   - Déconnexion complète (suppression des tokens et données)

3. **Validation des entrées**
   - Sanitisation des entrées utilisateur
   - Validation des formats (email, ID numériques, etc.)
   - Protection contre les injections et attaques XSS

4. **Gestion sécurisée des erreurs**
   - Messages d'erreur génériques sans information sensible
   - Gestion des erreurs d'API sans exposition de détails techniques
   - Logging minimal des informations sensibles

## Licence
Ce projet est sous licence MIT.

## Auteur
 BuildsByOmar - Développement principal

## Remerciements
- Google Keep pour l'inspiration
- L'équipe Expo pour les excellents outils
- L'équipe React Native pour le framework
