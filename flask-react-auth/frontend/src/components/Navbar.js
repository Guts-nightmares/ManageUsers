/**
 * Composant Navbar - Barre de navigation principale de l'application
 * ====================================================================
 * Ce composant affiche la barre de navigation en haut de toutes les pages.
 *
 * Fonctionnalités:
 * - Logo et lien vers l'accueil
 * - Liens de navigation (Forum, Dashboard, Admin si admin)
 * - Barre de recherche pour chercher dans le forum
 * - Menu utilisateur avec dropdown (Profil, Déconnexion)
 * - Affichage conditionnel selon l'état de connexion (user ou pas)
 * - Responsive: Menu hamburger sur mobile (grâce à Bootstrap)
 *
 * Concepts Bootstrap utilisés:
 * - navbar: Barre de navigation responsive
 * - navbar-expand-lg: Collapse le menu sur petits écrans (<= lg)
 * - dropdown: Menu déroulant pour l'utilisateur connecté
 * - Bootstrap Icons (bi): Icônes pour améliorer l'interface
 *
 * États du composant:
 * - searchQuery: Contient le texte de recherche saisi
 */

// Import de React et du hook useState
import React, { useState } from 'react';
// Import de Link (navigation sans rechargement) et useNavigate (redirection programmatique)
import { Link, useNavigate } from 'react-router-dom';
// Import du service d'authentification
import { authService } from '../services/api';

/**
 * Composant Navbar
 *
 * Props:
 *   - user: Objet utilisateur connecté ou null si déconnecté
 *     Utilisé pour afficher différents liens selon l'état de connexion
 *
 *   - setUser: Fonction pour mettre à jour l'état utilisateur dans App.js
 *     Utilisée lors de la déconnexion pour remettre user à null
 */
function Navbar({ user, setUser }) {
    // navigate: Fonction pour rediriger vers d'autres pages
    const navigate = useNavigate();

    // searchQuery: Contient le texte saisi dans la barre de recherche
    // Initialement vide, mis à jour à chaque frappe
    const [searchQuery, setSearchQuery] = useState('');

    // === FONCTIONS DE GESTION DES ÉVÉNEMENTS ===

    /**
     * handleLogout - Gère la déconnexion de l'utilisateur
     * ====================================================
     *
     * Processus:
     * 1. Supprime token et user du localStorage (via authService.logout())
     * 2. Remet user à null dans App.js (via setUser(null))
     * 3. Redirige vers la page de login
     *
     * Pourquoi setUser(null) en plus de authService.logout()?
     * - authService.logout() nettoie seulement le localStorage
     * - setUser(null) met à jour le state React pour re-render l'interface
     * - Les deux sont nécessaires pour une déconnexion complète
     */
    const handleLogout = () => {
        // Supprime token et user du localStorage
        authService.logout();

        // Met à jour le state global dans App.js
        // Déclenche un re-render qui affichera la navbar "déconnecté"
        setUser(null);

        // Redirige vers la page de login
        navigate('/login');
    };

    /**
     * handleSearch - Gère la soumission de la recherche
     * ==================================================
     *
     * Paramètre:
     *   - e: Événement du formulaire
     *
     * Processus:
     * 1. Empêche le rechargement de la page (e.preventDefault)
     * 2. Vérifie que la requête n'est pas vide
     * 3. Redirige vers /forum/search avec le paramètre de requête q
     * 4. Réinitialise le champ de recherche
     *
     * encodeURIComponent() expliqué:
     * - Encode les caractères spéciaux pour l'URL
     * - Exemple: "test & example" → "test%20%26%20example"
     * - Nécessaire car les espaces et caractères spéciaux ne sont pas autorisés dans les URLs
     */
    const handleSearch = (e) => {
        // Empêche le comportement par défaut du formulaire (rechargement de page)
        e.preventDefault();

        // Vérification: La recherche n'est-elle pas vide?
        // trim(): Supprime les espaces au début et à la fin
        // "  hello  ".trim() → "hello"
        // Permet d'éviter les recherches avec seulement des espaces
        if (searchQuery.trim()) {
            // Redirection vers la page de résultats de recherche
            // Paramètre de requête: q=...
            // encodeURIComponent: Encode les caractères spéciaux pour l'URL
            navigate(`/forum/search?q=${encodeURIComponent(searchQuery.trim())}`);

            // Réinitialise le champ de recherche après soumission
            setSearchQuery('');
        }
    };

    // === RENDU JSX ===

    return (
        // Navbar Bootstrap
        // navbar: Classe de base pour une navbar
        // navbar-expand-lg: Expand (déploie) le menu sur écrans >= large, collapse sur petits écrans
        // navbar-dark: Thème sombre (texte blanc)
        // bg-dark: Fond noir Bootstrap
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
            {/* container-fluid: Container Bootstrap qui prend toute la largeur */}
            <div className="container-fluid">
                {/* === LOGO / BRAND === */}
                {/* Link vers la page d'accueil */}
                <Link className="navbar-brand" to="/">
                    {/* Icône Bootstrap Icons */}
                    {/* bi-chat-dots-fill: Icône de bulle de chat remplie */}
                    {/* me-2: Margin-end de 2 unités (marge à droite) */}
                    <i className="bi bi-chat-dots-fill me-2"></i>
                    Flask React Forum
                </Link>

                {/* === BOUTON HAMBURGER (MOBILE) === */}
                {/* Bouton pour toggler (afficher/cacher) le menu sur petits écrans */}
                {/* navbar-toggler: Classe Bootstrap pour le bouton hamburger */}
                {/* data-bs-toggle="collapse": Attribut Bootstrap pour activer le collapse */}
                {/* data-bs-target="#navbarNav": Cible l'élément avec l'id "navbarNav" */}
                <button
                    className="navbar-toggler"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#navbarNav"
                >
                    {/* Icône hamburger (3 barres horizontales) */}
                    <span className="navbar-toggler-icon"></span>
                </button>

                {/* === CONTENU DE LA NAVBAR (COLLAPSIBLE SUR MOBILE) === */}
                {/* collapse navbar-collapse: Classes Bootstrap pour le menu collapsible */}
                {/* id="navbarNav": ID ciblé par le bouton hamburger */}
                <div className="collapse navbar-collapse" id="navbarNav">
                    {/* === LIENS DE NAVIGATION (GAUCHE) === */}
                    {/* navbar-nav: Liste Bootstrap pour les liens de navigation */}
                    {/* me-auto: Margin-end automatique (pousse le contenu suivant vers la droite) */}
                    <ul className="navbar-nav me-auto">
                        {/* Lien Forum (toujours visible) */}
                        <li className="nav-item">
                            <Link className="nav-link" to="/forum">
                                {/* Icône de maison */}
                                <i className="bi bi-house-door me-1"></i>
                                Forum
                            </Link>
                        </li>

                        {/* === LIENS CONDITIONNELS (SI CONNECTÉ) === */}
                        {/* Rendu conditionnel: Affiche seulement si user existe */}
                        {user ? (
                            // Fragment React (<></>) pour grouper plusieurs éléments sans ajouter de div
                            // Permet de retourner plusieurs <li> sans wrapper
                            <>
                                {/* Lien Dashboard (visible si connecté) */}
                                <li className="nav-item">
                                    <Link className="nav-link" to="/dashboard">
                                        {/* Icône de tableau de bord */}
                                        <i className="bi bi-speedometer2 me-1"></i>
                                        Tableau de bord
                                    </Link>
                                </li>

                                {/* Lien Administration (visible si connecté ET admin) */}
                                {/* Double rendu conditionnel imbriqué */}
                                {user.is_admin && (
                                    <li className="nav-item">
                                        <Link className="nav-link" to="/admin">
                                            {/* Icône de bouclier (sécurité) */}
                                            <i className="bi bi-shield-lock me-1"></i>
                                            Administration
                                        </Link>
                                    </li>
                                )}
                            </>
                        ) : null}
                        {/* : null → Si user n'existe pas, n'affiche rien */}
                    </ul>

                    {/* === BARRE DE RECHERCHE === */}
                    {/* d-flex: Display flex (layout flexbox) */}
                    {/* me-3: Margin-end de 3 unités (espace avant les liens à droite) */}
                    <form className="d-flex me-3" onSubmit={handleSearch}>
                        {/* Champ de saisie de recherche */}
                        <input
                            className="form-control form-control-sm me-2"  // form-control-sm: Version small
                            type="search"  // Type search: Ajoute un bouton X pour effacer (certains navigateurs)
                            placeholder="Rechercher dans le forum..."
                            value={searchQuery}  // Valeur contrôlée par React
                            onChange={(e) => setSearchQuery(e.target.value)}  // Met à jour à chaque frappe
                            style={{ width: '250px' }}  // Largeur fixe en pixels
                        />

                        {/* Bouton de soumission */}
                        {/* btn-outline-light: Bouton avec bordure blanche (thème navbar dark) */}
                        {/* btn-sm: Bouton small (petite taille) */}
                        <button className="btn btn-outline-light btn-sm" type="submit">
                            {/* Icône de loupe (recherche) */}
                            <i className="bi bi-search"></i>
                        </button>
                    </form>

                    {/* === LIENS UTILISATEUR (DROITE) === */}
                    <ul className="navbar-nav">
                        {/* Rendu conditionnel: Différent si connecté ou non */}
                        {user ? (
                            // CAS 1: UTILISATEUR CONNECTÉ - Menu dropdown avec profil
                            <>
                                {/* Menu déroulant Bootstrap */}
                                {/* dropdown: Conteneur du menu déroulant */}
                                <li className="nav-item dropdown">
                                    {/* Lien qui déclenche le dropdown */}
                                    {/* dropdown-toggle: Ajoute une flèche vers le bas */}
                                    {/* data-bs-toggle="dropdown": Active le comportement dropdown Bootstrap */}
                                    <a
                                        className="nav-link dropdown-toggle"
                                        href="#"  // # car c'est un toggle, pas un vrai lien
                                        id="navbarDropdown"  // ID pour l'accessibilité
                                        role="button"  // Rôle ARIA pour l'accessibilité
                                        data-bs-toggle="dropdown"  // Active le dropdown Bootstrap
                                        aria-expanded="false"  // État du dropdown (fermé par défaut)
                                    >
                                        {/* Icône de personne */}
                                        <i className="bi bi-person-circle me-1"></i>
                                        {/* Affiche le username de l'utilisateur connecté */}
                                        {user.username}
                                    </a>

                                    {/* Contenu du menu déroulant */}
                                    {/* dropdown-menu: Style Bootstrap pour le menu */}
                                    {/* dropdown-menu-end: Aligne le menu à droite */}
                                    <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdown">
                                        {/* Item: Mon profil */}
                                        <li>
                                            {/* Lien vers la page profil de l'utilisateur */}
                                            {/* Template literal avec user.id pour l'URL dynamique */}
                                            <Link className="dropdown-item" to={`/profile/${user.id}`}>
                                                {/* Icône de personne */}
                                                <i className="bi bi-person me-2"></i>
                                                Mon profil
                                            </Link>
                                        </li>

                                        {/* Séparateur horizontal */}
                                        <li><hr className="dropdown-divider" /></li>

                                        {/* Item: Déconnexion */}
                                        <li>
                                            {/* Bouton (pas Link) car c'est une action, pas une navigation */}
                                            {/* dropdown-item: Classe Bootstrap pour les items de dropdown */}
                                            <button className="dropdown-item" onClick={handleLogout}>
                                                {/* Icône de sortie (flèche vers la droite) */}
                                                <i className="bi bi-box-arrow-right me-2"></i>
                                                Déconnexion
                                            </button>
                                        </li>
                                    </ul>
                                </li>
                            </>
                        ) : (
                            // CAS 2: UTILISATEUR NON CONNECTÉ - Liens Connexion et Inscription
                            <>
                                {/* Lien Connexion */}
                                <li className="nav-item">
                                    <Link className="nav-link" to="/login">
                                        {/* Icône de connexion (flèche vers la droite dans un carré) */}
                                        <i className="bi bi-box-arrow-in-right me-1"></i>
                                        Connexion
                                    </Link>
                                </li>

                                {/* Lien Inscription */}
                                <li className="nav-item">
                                    <Link className="nav-link" to="/register">
                                        {/* Icône d'ajout d'utilisateur (personne avec +) */}
                                        <i className="bi bi-person-plus me-1"></i>
                                        Inscription
                                    </Link>
                                </li>
                            </>
                        )}
                    </ul>
                </div>
            </div>
        </nav>
    );
}

// Export du composant
export default Navbar;
