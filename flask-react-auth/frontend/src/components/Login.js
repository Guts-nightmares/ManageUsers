/**
 * Composant Login - Gère la page de connexion utilisateur
 * ========================================================
 * Ce composant affiche un formulaire permettant aux utilisateurs de se connecter.
 *
 * Fonctionnalités:
 * - Formulaire de connexion avec username et password
 * - Validation côté client avant l'envoi
 * - Gestion des erreurs avec affichage de messages
 * - Stockage du token JWT et des infos utilisateur dans localStorage
 * - Redirection automatique après connexion réussie
 * - Indicateur de chargement pendant la requête
 */

// Import de React et du hook useState pour gérer l'état local
import React, { useState } from 'react';
// Import des hooks de React Router pour la navigation
// useNavigate: Fonction pour naviguer entre les pages
// Link: Composant pour créer des liens cliquables
import { useNavigate, Link } from 'react-router-dom';
// Import du service d'authentification qui gère les appels API
import { authService } from '../services/api';

// Définition du composant Login
// Props:
//   - setUser: Fonction fournie par le composant parent (App.js) pour mettre à jour l'utilisateur connecté
function Login({ setUser }) {
    // === GESTION DE L'ÉTAT (STATE) ===

    // formData: Objet contenant les données du formulaire (username et password)
    // useState: Hook React qui crée une variable d'état
    // Principe: Quand l'état change, React re-rend (raffraîchit) le composant automatiquement
    const [formData, setFormData] = useState({
        username: '',  // Nom d'utilisateur saisi (vide au début)
        password: ''   // Mot de passe saisi (vide au début)
    });

    // error: Chaîne de caractères pour stocker les messages d'erreur
    // Initialement vide (''), sera rempli en cas d'erreur
    const [error, setError] = useState('');

    // loading: Booléen pour savoir si une requête est en cours
    // Utilisé pour:
    // - Désactiver le bouton pendant le chargement (évite les doubles clics)
    // - Afficher "Connexion..." au lieu de "Se connecter"
    const [loading, setLoading] = useState(false);

    // navigate: Fonction pour naviguer vers d'autres pages
    // Exemple: navigate('/dashboard') redirige vers /dashboard
    const navigate = useNavigate();

    // === FONCTIONS DE GESTION DES ÉVÉNEMENTS ===

    /**
     * handleChange - Gère les changements dans les champs du formulaire
     * ==================================================================
     *
     * Cette fonction est appelée à chaque fois qu'on tape dans un champ (username ou password)
     *
     * Paramètre:
     *   - e (event): Événement déclenché par le navigateur quand on modifie un input
     *
     * Principe du spread operator (...):
     * ...formData copie toutes les propriétés existantes de formData
     * [e.target.name]: e.target.value ajoute/modifie seulement le champ concerné
     *
     * Exemple:
     * Si formData = { username: 'john', password: '' }
     * Et qu'on tape 'x' dans le champ password
     * Alors nouveau formData = { username: 'john', password: 'x' }
     */
    const handleChange = (e) => {
        // setFormData met à jour l'état formData
        setFormData({
            ...formData,  // Copie toutes les propriétés actuelles (spread operator)
            // [e.target.name]: Utilise le nom du champ comme clé (username ou password)
            // e.target.value: Nouvelle valeur saisie dans le champ
            [e.target.name]: e.target.value
        });
    };

    /**
     * handleSubmit - Gère la soumission du formulaire de connexion
     * =============================================================
     *
     * Cette fonction s'exécute quand on clique sur le bouton "Se connecter"
     *
     * Processus:
     * 1. Empêche le rechargement de la page (comportement par défaut du formulaire)
     * 2. Réinitialise les erreurs précédentes
     * 3. Active l'indicateur de chargement
     * 4. Envoie une requête de connexion au backend
     * 5. Si succès: Stocke le token et redirige vers /dashboard
     * 6. Si échec: Affiche un message d'erreur
     * 7. Dans tous les cas: Désactive l'indicateur de chargement
     *
     * async/await expliqué:
     * - async: Indique que la fonction contient du code asynchrone
     * - await: Attend la réponse avant de continuer (pause l'exécution)
     * - Sans await, le code continuerait sans attendre la réponse du serveur
     */
    const handleSubmit = async (e) => {
        // e.preventDefault(): Empêche le comportement par défaut du formulaire
        // Par défaut, un formulaire recharge la page lors de la soumission
        // On ne veut pas ça dans une Single Page Application (SPA)
        e.preventDefault();

        // Réinitialise le message d'erreur (efface les erreurs précédentes)
        setError('');

        // Active l'indicateur de chargement
        // Le bouton va afficher "Connexion..." et être désactivé
        setLoading(true);

        // try/catch: Bloc pour gérer les erreurs
        // try: Essaie d'exécuter le code
        // catch: Si une erreur se produit, exécute ce bloc
        // finally: S'exécute dans tous les cas (succès ou échec)
        try {
            // Appel API vers le backend pour se connecter
            // await: Attend la réponse du serveur avant de continuer
            // authService.login() envoie une requête POST /api/login avec username et password
            const response = await authService.login(formData);

            // Si on arrive ici, la connexion a réussi (pas d'erreur 401)

            // Stockage du token JWT dans localStorage du navigateur
            // localStorage: Stockage persistant (survit au rechargement de la page)
            // response.data.token: Token JWT renvoyé par le backend
            localStorage.setItem('token', response.data.token);

            // Stockage des informations utilisateur dans localStorage
            // JSON.stringify(): Convertit l'objet JavaScript en texte JSON
            // Nécessaire car localStorage ne peut stocker que du texte
            localStorage.setItem('user', JSON.stringify(response.data.user));

            // Met à jour l'état global de l'utilisateur dans App.js
            // Cela déclenche un re-render de App et affiche la navbar avec le nom d'utilisateur
            setUser(response.data.user);

            // Redirection vers la page dashboard après connexion réussie
            navigate('/dashboard');

        } catch (err) {
            // Ce bloc s'exécute si la requête échoue (ex: 401 Unauthorized)

            // Optional chaining (?.) expliqué:
            // err.response?.data?.message vérifie chaque propriété avant d'accéder à la suivante
            // Si err.response est undefined, retourne undefined au lieu de planter
            // || 'Erreur de connexion': Si undefined, utilise ce message par défaut

            // Exemples:
            // - Backend renvoie un message: err.response.data.message = "Identifiants incorrects"
            // - Pas de connexion internet: err.response est undefined → "Erreur de connexion"
            setError(err.response?.data?.message || 'Erreur de connexion');

        } finally {
            // finally: S'exécute TOUJOURS, que la connexion réussisse ou échoue
            // Désactive l'indicateur de chargement
            // Le bouton redevient cliquable et affiche "Se connecter"
            setLoading(false);
        }
    };

    // === RENDU JSX (INTERFACE UTILISATEUR) ===

    /**
     * JSX expliqué:
     * - JSX = JavaScript XML (mélange de HTML et JavaScript)
     * - Permet d'écrire du "HTML" dans du JavaScript
     * - React le convertit en vraies instructions JavaScript
     * - {} permet d'insérer du JavaScript dans le JSX
     */
    return (
        // Container Bootstrap: Centre le contenu avec des marges
        // mt-5: Margin-top de 5 unités (marge en haut)
        <div className="container mt-5">
            {/* row justify-content-center: Ligne Bootstrap qui centre son contenu */}
            <div className="row justify-content-center">
                {/* col-md-6: Occupe 6 colonnes sur 12 (50%) sur écrans moyens */}
                {/* col-lg-4: Occupe 4 colonnes sur 12 (33%) sur grands écrans */}
                {/* Cela rend le formulaire responsive (s'adapte à la taille de l'écran) */}
                <div className="col-md-6 col-lg-4">
                    {/* Card Bootstrap: Boîte avec bordures et ombre */}
                    {/* shadow: Ajoute une ombre portée pour un effet de profondeur */}
                    <div className="card shadow">
                        <div className="card-body">
                            {/* Titre principal du formulaire */}
                            {/* text-center: Centre le texte */}
                            {/* mb-4: Margin-bottom de 4 unités (espace en bas) */}
                            <h2 className="card-title text-center mb-4">Connexion</h2>

                            {/* AFFICHAGE CONDITIONNEL DES ERREURS */}
                            {/* && = opérateur logique ET en JavaScript */}
                            {/* Si error est non vide (truthy), affiche le div d'erreur */}
                            {/* Si error est vide (falsy), n'affiche rien */}
                            {/* Principe: true && <div> affiche le div, false && <div> n'affiche rien */}
                            {error && (
                                // alert alert-danger: Boîte d'alerte Bootstrap en rouge
                                // role="alert": Attribut d'accessibilité pour les lecteurs d'écran
                                <div className="alert alert-danger" role="alert">
                                    {/* Affiche le message d'erreur */}
                                    {error}
                                </div>
                            )}

                            {/* FORMULAIRE DE CONNEXION */}
                            {/* onSubmit: Événement déclenché quand on soumet le formulaire */}
                            {/* Appelle handleSubmit quand on clique sur le bouton ou appuie sur Entrée */}
                            <form onSubmit={handleSubmit}>
                                {/* CHAMP USERNAME */}
                                {/* mb-3: Margin-bottom de 3 unités (espace entre les champs) */}
                                <div className="mb-3">
                                    {/* Label (étiquette) du champ */}
                                    {/* htmlFor: Lie le label au champ (quand on clique le label, le champ se focus) */}
                                    {/* En HTML normal c'est "for", mais en JSX c'est "htmlFor" car "for" est un mot réservé */}
                                    <label htmlFor="username" className="form-label">
                                        Nom d'utilisateur
                                    </label>
                                    {/* Champ de saisie texte */}
                                    <input
                                        type="text"  // Type de champ: texte simple
                                        className="form-control"  // Classe Bootstrap pour le style
                                        id="username"  // ID du champ (correspond au htmlFor du label)
                                        name="username"  // Nom du champ (utilisé dans handleChange)
                                        value={formData.username}  // Valeur affichée = state formData.username
                                        onChange={handleChange}  // Fonction appelée à chaque frappe
                                        required  // HTML5: Champ obligatoire (validation navigateur)
                                    />
                                </div>

                                {/* CHAMP PASSWORD */}
                                {/* Structure identique au champ username */}
                                <div className="mb-3">
                                    <label htmlFor="password" className="form-label">
                                        Mot de passe
                                    </label>
                                    <input
                                        type="password"  // Type password: Affiche des points au lieu du texte
                                        className="form-control"
                                        id="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                {/* BOUTON DE SOUMISSION */}
                                <button
                                    type="submit"  // Type submit: Soumet le formulaire (déclenche onSubmit)
                                    className="btn btn-primary w-100"  // btn-primary: Bouton bleu Bootstrap, w-100: width 100%
                                    disabled={loading}  // Désactivé pendant le chargement (évite double-clic)
                                >
                                    {/* AFFICHAGE CONDITIONNEL DU TEXTE DU BOUTON */}
                                    {/* Opérateur ternaire: condition ? siVrai : siFaux */}
                                    {/* Si loading est true, affiche "Connexion..." */}
                                    {/* Si loading est false, affiche "Se connecter" */}
                                    {loading ? 'Connexion...' : 'Se connecter'}
                                </button>
                            </form>

                            {/* LIEN VERS LA PAGE D'INSCRIPTION */}
                            {/* text-center: Centre le texte */}
                            {/* mt-3: Margin-top de 3 unités (espace en haut) */}
                            <div className="text-center mt-3">
                                {/* Link: Composant React Router pour la navigation sans rechargement */}
                                {/* to="/register": URL de destination */}
                                {/* Contrairement à <a href>, Link ne recharge pas la page */}
                                <Link to="/register">Pas de compte ? S'inscrire</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Export du composant pour pouvoir l'importer dans d'autres fichiers
// export default: Export par défaut (un seul par fichier)
// Permet d'importer avec: import Login from './Login'
export default Login;
