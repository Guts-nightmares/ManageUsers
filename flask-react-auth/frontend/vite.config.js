/**
 * Fichier de configuration Vite
 * ==============================
 * Vite est un outil de build moderne pour les applications web.
 * Il remplace des outils plus anciens comme Webpack et CRA (Create React App).
 *
 * Avantages de Vite:
 * - Démarrage très rapide du serveur de développement
 * - Hot Module Replacement (HMR) ultra-rapide
 * - Build de production optimisé
 */

// Import de la fonction de configuration Vite
import { defineConfig } from 'vite'
// Import du plugin React pour Vite (permet de compiler le JSX)
import react from '@vitejs/plugin-react'

// Documentation officielle: https://vitejs.dev/config/
export default defineConfig({
  // === PLUGINS ===
  // Plugins utilisés par Vite pour étendre ses fonctionnalités
  plugins: [
    react()  // Plugin React: Compile le JSX en JavaScript et active le Fast Refresh
  ],

  // === ESBUILD ===
  // ESBuild est le compilateur ultra-rapide utilisé par Vite
  // Configuration pour gérer les fichiers .js comme du JSX
  esbuild: {
    loader: 'jsx',  // Traite les fichiers comme du JSX (permet d'écrire du JSX dans .js)
    // Expression régulière: Inclut tous les fichiers .js et .jsx dans src/
    include: /src\/.*\.jsx?$/,
    exclude: []  // N'exclut aucun fichier
  },

  // === OPTIMISATION DES DÉPENDANCES ===
  // Configuration pour l'optimisation des modules node_modules
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx'  // Traite les fichiers .js comme du JSX lors de l'optimisation
      }
    }
  },

  // === SERVEUR DE DÉVELOPPEMENT ===
  server: {
    // Port sur lequel le serveur de développement va écouter
    // L'application frontend sera accessible sur http://localhost:3000
    port: 3000,

    // Proxy: Redirige certaines requêtes vers un autre serveur
    // Très utile pour éviter les problèmes CORS en développement
    proxy: {
      // Toutes les requêtes commençant par /api seront redirigées vers le backend Flask
      '/api': {
        // URL cible du backend Flask
        // Exemple: http://localhost:3000/api/posts → http://127.0.0.1:5000/api/posts
        target: 'http://127.0.0.1:5000',

        // changeOrigin: Change l'en-tête Origin de la requête pour correspondre à la cible
        // Nécessaire pour éviter les problèmes CORS
        changeOrigin: true,

        // secure: false permet de proxifier vers des serveurs HTTPS avec certificats invalides
        // En développement, c'est OK. En production, mettez true
        secure: false,
      }
    }
  },

  // === BUILD DE PRODUCTION ===
  build: {
    // Dossier de sortie pour les fichiers buildés (HTML, CSS, JS compilés)
    outDir: 'build',

    // sourcemap: Génère des fichiers .map pour faciliter le debugging en production
    // Permet de voir le code source original dans les DevTools du navigateur
    sourcemap: true,
  }
})
