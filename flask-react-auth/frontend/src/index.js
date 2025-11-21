/**
 * Point d'entrée principal de l'application React
 * ================================================
 * Ce fichier est le premier fichier JavaScript exécuté par le navigateur.
 * Il "monte" (render) l'application React dans le DOM HTML.
 *
 * Flux d'exécution:
 * 1. Le navigateur charge index.html
 * 2. index.html charge ce fichier index.js
 * 3. Ce fichier crée la racine React et rend le composant App
 * 4. React prend le contrôle et gère toute l'interface
 */

// Import de React (bibliothèque principale pour créer des interfaces utilisateur)
import React from 'react';
// Import de ReactDOM (bibliothèque pour interagir avec le DOM du navigateur)
// createRoot est la nouvelle API React 18 pour le rendu (remplace render)
import ReactDOM from 'react-dom/client';
// Import du composant principal App (défini dans App.js)
import App from './App';
// Import des styles Bootstrap (framework CSS pour un design responsive)
// Bootstrap fournit des classes CSS prêtes à l'emploi (btn, container, navbar, etc.)
import 'bootstrap/dist/css/bootstrap.min.css';

// Création de la racine React
// document.getElementById('root') trouve l'élément HTML avec l'id "root" dans index.html
// C'est dans cet élément que toute l'application React sera injectée
const root = ReactDOM.createRoot(document.getElementById('root'));

// Rendu (affichage) de l'application React dans la racine
root.render(
  // React.StrictMode: Mode strict de React (aide au développement)
  // En mode strict, React effectue des vérifications supplémentaires:
  // - Détecte les effets de bord dans les composants
  // - Avertit sur l'utilisation d'APIs dépréciées
  // - Détecte les anti-patterns potentiels
  // Note: StrictMode ne s'exécute qu'en développement, pas en production
  <React.StrictMode>
    {/* Composant principal de l'application */}
    <App />
  </React.StrictMode>
);
