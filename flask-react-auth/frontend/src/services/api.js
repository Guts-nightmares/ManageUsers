/**
 * Service API - Gère toutes les communications avec le backend
 * =============================================================
 * Ce fichier centralise toutes les requêtes HTTP vers l'API Flask.
 *
 * Architecture:
 * - Utilise Axios (bibliothèque HTTP populaire)
 * - Intercepteurs pour ajouter automatiquement le token JWT
 * - Gestion centralisée des erreurs d'authentification
 * - Organisation par domaine (auth, admin, posts, comments, etc.)
 *
 * Avantages:
 * - Code DRY (Don't Repeat Yourself)
 * - Facile à maintenir et tester
 * - Gestion cohérente des erreurs
 */

// Import d'Axios (bibliothèque pour faire des requêtes HTTP)
import axios from 'axios';

// URL de base de l'API backend
// '/api' sera automatiquement proxifié vers http://localhost:5000/api grâce à vite.config.js
const API_URL = '/api';

// === CRÉATION DE L'INSTANCE AXIOS ===

// Création d'une instance Axios personnalisée avec configuration par défaut
const api = axios.create({
    baseURL: API_URL,  // Toutes les requêtes commenceront par /api
    headers: {
        'Content-Type': 'application/json'  // Type de contenu par défaut: JSON
    }
});

// === INTERCEPTEUR DE REQUÊTES ===
// Un intercepteur s'exécute AVANT chaque requête
// Utile pour ajouter automatiquement le token d'authentification

api.interceptors.request.use(
    // Fonction appelée avant chaque requête
    (config) => {
        // Récupération du token JWT depuis localStorage
        const token = localStorage.getItem('token');

        // Si un token existe, on l'ajoute dans l'en-tête Authorization
        // Format: "Bearer <token>" (standard pour JWT)
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Retourne la config modifiée (requête peut continuer)
        return config;
    },
    // Fonction appelée en cas d'erreur lors de la configuration de la requête
    (error) => {
        // Rejette la promesse avec l'erreur
        return Promise.reject(error);
    }
);

// === INTERCEPTEUR DE RÉPONSES ===
// Un intercepteur s'exécute APRÈS chaque réponse
// Utile pour gérer les erreurs d'authentification de manière centralisée

api.interceptors.response.use(
    // Fonction appelée si la requête réussit (status 2xx)
    // On retourne simplement la réponse sans modification
    (response) => response,

    // Fonction appelée si la requête échoue (status 4xx, 5xx)
    (error) => {
        // Vérification: Est-ce une erreur 401 Unauthorized?
        // 401 = Token expiré ou invalide
        if (error.response && error.response.status === 401) {
            // Déconnexion automatique:
            // 1. Supprimer le token du localStorage
            localStorage.removeItem('token');
            // 2. Supprimer les infos utilisateur du localStorage
            localStorage.removeItem('user');
            // 3. Rediriger vers la page de login
            window.location.href = '/login';
        }

        // Rejette la promesse avec l'erreur (pour que les composants puissent la gérer)
        return Promise.reject(error);
    }
);

// ===================================================
// SERVICES ORGANISÉS PAR DOMAINE FONCTIONNEL
// ===================================================

/**
 * Service d'authentification
 * Gère l'inscription, la connexion et la récupération du profil
 */
export const authService = {
    // Inscription d'un nouvel utilisateur
    // userData: { username, email, password }
    register: (userData) => api.post('/register', userData),

    // Connexion d'un utilisateur
    // credentials: { username, password }
    login: (credentials) => api.post('/login', credentials),

    // Récupération des infos de l'utilisateur connecté
    // Utilise le token dans l'en-tête (ajouté automatiquement par l'intercepteur)
    getCurrentUser: () => api.get('/me'),

    // Déconnexion (côté client uniquement)
    // Supprime le token et les infos user du localStorage
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }
};

/**
 * Service d'administration
 * Routes réservées aux administrateurs
 */
export const adminService = {
    // Récupération de tous les utilisateurs
    getAllUsers: () => api.get('/admin/users'),

    // Suppression d'un utilisateur par ID
    deleteUser: (userId) => api.delete(`/admin/users/${userId}`),

    // Mise à jour d'un utilisateur
    // userData peut contenir: username, email, password, is_admin
    updateUser: (userId, userData) => api.put(`/admin/users/${userId}`, userData)
};

/**
 * Service des posts
 * CRUD complet pour les publications du forum
 */
export const postService = {
    // Récupération de tous les posts avec pagination
    // page: Numéro de page (défaut: 1)
    // perPage: Nombre de posts par page (défaut: 10)
    getAllPosts: (page = 1, perPage = 10) => api.get(`/posts?page=${page}&per_page=${perPage}`),

    // Récupération d'un post spécifique par ID
    getPost: (postId) => api.get(`/posts/${postId}`),

    // Création d'un nouveau post
    // postData: { title, content }
    createPost: (postData) => api.post('/posts', postData),

    // Mise à jour d'un post existant
    // postData peut contenir: title, content
    updatePost: (postId, postData) => api.put(`/posts/${postId}`, postData),

    // Suppression d'un post
    deletePost: (postId) => api.delete(`/posts/${postId}`)
};

/**
 * Service des commentaires
 * CRUD pour les commentaires sur les posts
 */
export const commentService = {
    // Récupération de tous les commentaires d'un post
    getComments: (postId) => api.get(`/posts/${postId}/comments`),

    // Création d'un commentaire sur un post
    // commentData: { content }
    createComment: (postId, commentData) => api.post(`/posts/${postId}/comments`, commentData),

    // Mise à jour d'un commentaire
    // commentData: { content }
    updateComment: (commentId, commentData) => api.put(`/comments/${commentId}`, commentData),

    // Suppression d'un commentaire
    deleteComment: (commentId) => api.delete(`/comments/${commentId}`)
};

/**
 * Service des likes
 * Gestion des "J'aime" sur posts et commentaires
 */
export const likeService = {
    // Toggle like sur un post (ajoute si pas encore liké, retire sinon)
    togglePostLike: (postId) => api.post(`/posts/${postId}/like`),

    // Toggle like sur un commentaire
    toggleCommentLike: (commentId) => api.post(`/comments/${commentId}/like`),

    // Récupération de tous les likes d'un post avec les utilisateurs
    getPostLikes: (postId) => api.get(`/posts/${postId}/likes`),

    // Récupération de tous les likes d'un commentaire
    getCommentLikes: (commentId) => api.get(`/comments/${commentId}/likes`),

    // Vérification: L'utilisateur actuel a-t-il liké ce post?
    checkUserLikedPost: (postId) => api.get(`/posts/${postId}/user-liked`),

    // Vérification: L'utilisateur actuel a-t-il liké ce commentaire?
    checkUserLikedComment: (commentId) => api.get(`/comments/${commentId}/user-liked`)
};

/**
 * Service de profil
 * Gestion du profil utilisateur
 */
export const profileService = {
    // Récupération du profil public d'un utilisateur (avec stats)
    getUserProfile: (userId) => api.get(`/users/${userId}/profile`),

    // Mise à jour du profil de l'utilisateur connecté
    // profileData peut contenir: username, email
    updateProfile: (profileData) => api.put('/profile', profileData),

    // Changement de mot de passe
    // passwordData: { current_password, new_password }
    updatePassword: (passwordData) => api.put('/profile/password', passwordData)
};

/**
 * Service de recherche
 * Recherche de posts par mots-clés
 */
export const searchService = {
    // Recherche de posts par titre ou contenu
    // query: Terme de recherche
    // encodeURIComponent: Encode les caractères spéciaux pour l'URL (ex: espaces → %20)
    searchPosts: (query) => api.get(`/posts/search?q=${encodeURIComponent(query)}`)
};

// Export par défaut de l'instance Axios (pour des requêtes personnalisées si besoin)
export default api;
