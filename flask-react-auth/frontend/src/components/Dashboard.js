/**
 * Composant Dashboard - Page d'accueil après connexion
 * =====================================================
 * Ce composant affiche le tableau de bord de l'utilisateur connecté.
 *
 * Fonctionnalités:
 * - Affiche un message de bienvenue personnalisé
 * - Affiche les informations du compte (username, email, rôle, date d'inscription)
 * - Affiche un lien vers le panel admin si l'utilisateur est admin
 * - Permet de se déconnecter
 *
 * Composant simple (pas de chargement de données depuis l'API):
 * - Pas de useEffect car toutes les données viennent des props
 * - Pas de state pour les données utilisateur (reçues via props)
 */

// Import de React (nécessaire pour JSX, même si on ne le voit pas utilisé explicitement)
import React from 'react';
// Import de useNavigate pour la navigation programmatique
import { useNavigate } from 'react-router-dom';
// Import du service d'authentification pour la déconnexion
import { authService } from '../services/api';

/**
 * Composant Dashboard
 *
 * Props:
 *   - user: Objet contenant les données de l'utilisateur connecté
 *     Structure:
 *     {
 *       id: number,
 *       username: string,
 *       email: string,
 *       is_admin: boolean,
 *       created_at: string (ISO date)
 *     }
 */
function Dashboard({ user }) {
    // navigate: Fonction pour rediriger vers d'autres pages
    const navigate = useNavigate();

    /**
     * handleLogout - Gère la déconnexion de l'utilisateur
     * ====================================================
     *
     * Processus:
     * 1. Appelle authService.logout() qui supprime token et user du localStorage
     * 2. Redirige vers la page de login
     *
     * Note: Pas besoin de setUser(null) car la redirection va recharger l'app
     * Le composant App détectera l'absence de token et affichera la page login
     */
    const handleLogout = () => {
        // Supprime token et user du localStorage
        authService.logout();
        // Redirige vers la page de connexion
        navigate('/login');
    };

    // === RENDU JSX ===

    return (
        // Container Bootstrap avec marge en haut
        <div className="container mt-5">
            <div className="row">
                {/* col-md-8: Occupe 8 colonnes sur 12 (66%) sur écrans moyens */}
                {/* mx-auto: Margin automatique à gauche et droite (centre le contenu) */}
                <div className="col-md-8 mx-auto">
                    {/* Carte avec ombre */}
                    <div className="card shadow">
                        <div className="card-body">
                            {/* Titre de la page */}
                            {/* mb-4: Margin-bottom de 4 unités */}
                            <h2 className="card-title mb-4">Tableau de bord</h2>

                            {/* === BOÎTE DE BIENVENUE === */}
                            {/* alert-success: Boîte Bootstrap verte pour les messages positifs */}
                            <div className="alert alert-success" role="alert">
                                {/* Titre de l'alerte */}
                                {/* alert-heading: Style Bootstrap pour les titres dans les alertes */}
                                <h4 className="alert-heading">Bienvenue, {user?.username} !</h4>

                                {/* Séparateur horizontal */}
                                <hr />

                                {/* Message de confirmation */}
                                {/* mb-0: Margin-bottom de 0 (pas d'espace en bas) */}
                                <p className="mb-0">Vous êtes connecté avec succès.</p>
                            </div>

                            {/* === CARTE DES INFORMATIONS DU COMPTE === */}
                            {/* mb-3: Margin-bottom de 3 unités (espace avant le bouton déconnexion) */}
                            <div className="card mb-3">
                                {/* En-tête de la carte */}
                                <div className="card-header">
                                    <strong>Informations du compte</strong>
                                </div>

                                {/* Liste des informations */}
                                {/* list-group: Composant Bootstrap pour afficher des listes */}
                                {/* list-group-flush: Supprime les bordures sur les côtés */}
                                <ul className="list-group list-group-flush">
                                    {/* === NOM D'UTILISATEUR === */}
                                    {/* list-group-item: Élément de liste Bootstrap */}
                                    <li className="list-group-item">
                                        <strong>Nom d'utilisateur:</strong> {user?.username}
                                        {/* user?.username: Optional chaining */}
                                        {/* Si user est null/undefined, retourne undefined au lieu de planter */}
                                    </li>

                                    {/* === EMAIL === */}
                                    <li className="list-group-item">
                                        <strong>Email:</strong> {user?.email}
                                    </li>

                                    {/* === RÔLE (ADMIN OU UTILISATEUR) === */}
                                    <li className="list-group-item">
                                        <strong>Rôle:</strong>{' '}
                                        {/* {' '}: Espace en JSX (équivalent de &nbsp; en HTML) */}

                                        {/* Badge Bootstrap pour afficher le rôle */}
                                        {/* Opérateur ternaire: condition ? siVrai : siFaux */}
                                        {/* Si is_admin est true, badge rouge "Administrateur" */}
                                        {/* Si is_admin est false, badge bleu "Utilisateur" */}
                                        <span className={`badge ${user?.is_admin ? 'bg-danger' : 'bg-primary'}`}>
                                            {/* Template literal avec classes conditionnelles */}
                                            {/* bg-danger: Fond rouge (Bootstrap) */}
                                            {/* bg-primary: Fond bleu (Bootstrap) */}
                                            {user?.is_admin ? 'Administrateur' : 'Utilisateur'}
                                        </span>
                                    </li>

                                    {/* === DATE D'INSCRIPTION === */}
                                    <li className="list-group-item">
                                        <strong>Membre depuis:</strong>{' '}
                                        {/* Conversion de la date ISO en format français */}
                                        {/* new Date(): Crée un objet Date JavaScript */}
                                        {/* .toLocaleDateString('fr-FR'): Convertit en format français (JJ/MM/AAAA) */}
                                        {/* Opérateur ternaire: Si created_at existe, convertit, sinon affiche "N/A" */}
                                        {user?.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : 'N/A'}
                                    </li>
                                </ul>
                            </div>

                            {/* === BOUTON ADMIN (AFFICHÉ SEULEMENT SI ADMIN) === */}
                            {/* Rendu conditionnel avec && */}
                            {/* user?.is_admin && <div> : Affiche le div seulement si is_admin est true */}
                            {user?.is_admin && (
                                // alert-info: Boîte Bootstrap bleue pour les informations
                                <div className="alert alert-info" role="alert">
                                    <strong>Accès Admin:</strong> Vous avez accès au{' '}

                                    {/* Bouton pour accéder au panel admin */}
                                    {/* btn-sm: Bouton petit (small) */}
                                    {/* ms-2: Margin-start de 2 unités (marge à gauche) */}
                                    <button
                                        className="btn btn-sm btn-info ms-2"
                                        onClick={() => navigate('/admin')}
                                    >
                                        {/* Arrow function: () => navigate('/admin') */}
                                        {/* Appelée quand on clique le bouton */}
                                        Panneau d'administration
                                    </button>
                                </div>
                            )}

                            {/* === BOUTON DE DÉCONNEXION === */}
                            {/* btn-danger: Bouton rouge Bootstrap (pour actions destructives) */}
                            {/* w-100: Width 100% (bouton occupe toute la largeur) */}
                            <button className="btn btn-danger w-100" onClick={handleLogout}>
                                Se déconnecter
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Export du composant
export default Dashboard;
