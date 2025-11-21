/**
 * Composant principal App - Gère le routing et l'état global
 * ===========================================================
 * Ce composant est le cœur de l'application React.
 * Il gère:
 * - Le routing (navigation entre les pages)
 * - L'état de l'utilisateur connecté
 * - La persistance de la session (localStorage)
 * - L'écran de chargement initial
 */

// Import de React et des hooks nécessaires
import React, { useState, useEffect } from 'react';
// Import des composants de React Router pour la navigation
// BrowserRouter: Utilise l'API History du navigateur pour la navigation
// Routes: Container pour toutes les routes
// Route: Définit une route (URL → Composant)
// Navigate: Redirige vers une autre page
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// Import de tous les composants de l'application
import Navbar from './components/Navbar';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Admin from './components/Admin';
import Forum from './components/Forum';
import CreatePost from './components/CreatePost';
import PostDetail from './components/PostDetail';
import UserProfile from './components/UserProfile';
import SearchResults from './components/SearchResults';
import PrivateRoute from './components/PrivateRoute';

function App() {
    // === ÉTAT (STATE) DU COMPOSANT ===

    // useState: Hook React pour gérer l'état local du composant
    // user: Contient les données de l'utilisateur connecté (null si déconnecté)
    // setUser: Fonction pour modifier user
    const [user, setUser] = useState(null);

    // loading: Indique si l'application est en train de charger
    // Utilisé pour afficher un spinner pendant la vérification de la session
    const [loading, setLoading] = useState(true);

    // === EFFET DE CHARGEMENT INITIAL ===

    // useEffect: Hook React pour gérer les effets de bord
    // Ici: S'exécute UNE SEULE FOIS au montage du composant (grâce à [])
    useEffect(() => {
        // Tentative de récupération de l'utilisateur depuis localStorage
        // localStorage: Stockage persistant dans le navigateur (survit au rechargement)
        const storedUser = localStorage.getItem('user');

        // Si un utilisateur est stocké, on le parse (JSON → Objet) et on le charge
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }

        // Fin du chargement
        setLoading(false);
    }, []); // [] = Dépendances vides → S'exécute une seule fois au montage

    // === ÉCRAN DE CHARGEMENT ===

    // Si l'app est en train de charger, on affiche un spinner Bootstrap
    if (loading) {
        return (
            // Classes Bootstrap:
            // d-flex: Display flex
            // justify-content-center: Centre horizontalement
            // align-items-center: Centre verticalement
            // Style inline: height 100vh (100% de la hauteur de la fenêtre)
            <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
                {/* Spinner Bootstrap animé */}
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Chargement...</span>
                </div>
            </div>
        );
    }

    // === RENDU PRINCIPAL DE L'APPLICATION ===

    return (
        // Router: Englobe toute l'application pour activer le routing
        <Router>
            <div className="App">
                {/* Navbar: Barre de navigation toujours visible */}
                {/* Props: user (utilisateur connecté) et setUser (pour déconnexion) */}
                <Navbar user={user} setUser={setUser} />

                {/* Routes: Container pour toutes les routes de l'application */}
                <Routes>
                    {/* === ROUTE RACINE === */}
                    {/* path="/": Page d'accueil */}
                    {/* Navigate: Redirige automatiquement vers /forum */}
                    {/* replace: Remplace l'historique (ne crée pas d'entrée dans le bouton "retour") */}
                    <Route
                        path="/"
                        element={<Navigate to="/forum" replace />}
                    />

                    {/* === ROUTES D'AUTHENTIFICATION === */}

                    {/* Route Login */}
                    {/* Si user existe (connecté), redirige vers /forum */}
                    {/* Sinon, affiche la page de connexion */}
                    <Route
                        path="/login"
                        element={
                            user ? <Navigate to="/forum" replace /> : <Login setUser={setUser} />
                        }
                    />

                    {/* Route Register */}
                    {/* Même logique que Login */}
                    <Route
                        path="/register"
                        element={
                            user ? <Navigate to="/forum" replace /> : <Register />
                        }
                    />

                    {/* === ROUTES PROTÉGÉES (AUTHENTIFICATION REQUISE) === */}

                    {/* Route Dashboard */}
                    {/* PrivateRoute: Composant wrapper qui vérifie l'authentification */}
                    {/* Si non connecté, redirige vers /login */}
                    <Route
                        path="/dashboard"
                        element={
                            <PrivateRoute user={user}>
                                <Dashboard user={user} />
                            </PrivateRoute>
                        }
                    />

                    {/* Route Admin */}
                    {/* Protégée par PrivateRoute (+ vérification admin dans le composant Admin) */}
                    <Route
                        path="/admin"
                        element={
                            <PrivateRoute user={user}>
                                <Admin user={user} />
                            </PrivateRoute>
                        }
                    />

                    {/* === ROUTES DU FORUM === */}

                    {/* Forum principal - Public (pas de protection) */}
                    <Route path="/forum" element={<Forum />} />

                    {/* Création de post - Protégée (nécessite authentification) */}
                    <Route
                        path="/forum/new"
                        element={
                            <PrivateRoute user={user}>
                                <CreatePost />
                            </PrivateRoute>
                        }
                    />

                    {/* Détail d'un post - Public */}
                    {/* :postId est un paramètre dynamique (ex: /forum/posts/5) */}
                    <Route path="/forum/posts/:postId" element={<PostDetail />} />

                    {/* Résultats de recherche - Public */}
                    <Route path="/forum/search" element={<SearchResults />} />

                    {/* === ROUTES DU PROFIL === */}

                    {/* Profil utilisateur - Public */}
                    {/* :userId est un paramètre dynamique (ex: /profile/3) */}
                    <Route path="/profile/:userId" element={<UserProfile />} />

                    {/* === ROUTE PAR DÉFAUT (404) === */}
                    {/* path="*": Attrape toutes les routes non définies */}
                    {/* Redirige vers /forum */}
                    <Route path="*" element={<Navigate to="/forum" replace />} />
                </Routes>
            </div>
        </Router>
    );
}

// Export du composant pour qu'il puisse être importé dans index.js
export default App;
