/**
 * Composant PrivateRoute - Protège les routes qui nécessitent une authentification
 * =================================================================================
 * Ce composant est un "wrapper" (enveloppe) qui vérifie si un utilisateur est
 * connecté avant d'afficher une page.
 *
 * Fonctionnement:
 * - Si l'utilisateur est connecté (user existe): Affiche la page demandée (children)
 * - Si l'utilisateur n'est PAS connecté (user est null): Redirige vers /login
 *
 * Utilisation dans App.js:
 * <Route path="/dashboard" element={
 *   <PrivateRoute user={user}>
 *     <Dashboard user={user} />
 *   </PrivateRoute>
 * } />
 *
 * Concept React: Composition
 * - children est un prop spécial qui contient le contenu entre les balises
 * - <PrivateRoute>...</PrivateRoute> → les ... deviennent le prop children
 * - Cela permet de réutiliser PrivateRoute pour protéger n'importe quelle page
 *
 * Sécurité:
 * - Cette protection est côté client (peut être contournée dans le code)
 * - Le backend DOIT aussi vérifier avec le décorateur @token_required
 * - La protection côté client améliore seulement l'UX (évite les erreurs 401)
 */

// Import de React pour JSX
import React from 'react';
// Import de Navigate pour rediriger vers une autre page
import { Navigate } from 'react-router-dom';

/**
 * Composant PrivateRoute
 *
 * Props:
 *   - children: Contenu à afficher si l'utilisateur est authentifié
 *     C'est le composant "protégé" (Dashboard, Admin, CreatePost, etc.)
 *
 *   - user: Objet utilisateur connecté ou null si non connecté
 *     Vient du state global dans App.js
 *
 * Retour:
 *   - Si user existe: Retourne children (affiche la page protégée)
 *   - Si user est null: Retourne <Navigate to="/login" /> (redirige)
 */
function PrivateRoute({ children, user }) {
    // Vérification: L'utilisateur est-il connecté?
    // !user: true si user est null ou undefined
    if (!user) {
        // CAS 1: Utilisateur NON connecté
        // Redirection vers la page de login
        // replace: Remplace l'entrée actuelle dans l'historique
        //   Cela empêche l'utilisateur de revenir en arrière vers la page protégée
        //   avec le bouton "précédent" du navigateur
        return <Navigate to="/login" replace />;
    }

    // CAS 2: Utilisateur connecté
    // Affiche le contenu protégé (children)
    // children peut être <Dashboard />, <Admin />, etc.
    // selon ce qui a été passé entre <PrivateRoute>...</PrivateRoute>
    return children;
}

// Export du composant
export default PrivateRoute;
