/**
 * Composant Register - Gère la page d'inscription des nouveaux utilisateurs
 * =========================================================================
 * Ce composant affiche un formulaire d'inscription pour créer un nouveau compte.
 *
 * Fonctionnalités:
 * - Formulaire d'inscription avec username, email, password et confirmation
 * - Validation côté client avant l'envoi (longueur du mot de passe, correspondance)
 * - Gestion des erreurs avec messages explicites
 * - Redirection vers la page de login après inscription réussie
 * - Affichage d'un indicateur de chargement pendant la requête
 *
 * Différences avec Login:
 * - Plus de champs (email, confirmation de mot de passe)
 * - Validations supplémentaires (correspondance des mots de passe)
 * - Ne stocke pas le token (redirige vers login au lieu de dashboard)
 */

// Import de React et du hook useState pour gérer l'état local
import React, { useState } from 'react';
// Import des hooks de React Router pour la navigation
import { useNavigate, Link } from 'react-router-dom';
// Import du service d'authentification qui gère les appels API
import { authService } from '../services/api';

// Définition du composant Register
// Pas de props nécessaires contrairement à Login (pas besoin de setUser car on ne connecte pas directement)
function Register() {
    // === GESTION DE L'ÉTAT (STATE) ===

    // formData: Objet contenant les données du formulaire d'inscription
    // Plus de champs que Login: username, email, password ET confirmPassword
    const [formData, setFormData] = useState({
        username: '',         // Nom d'utilisateur désiré (vide au début)
        email: '',           // Adresse email (vide au début)
        password: '',        // Mot de passe choisi (vide au début)
        confirmPassword: ''  // Confirmation du mot de passe (doit correspondre à password)
    });

    // error: Stocke les messages d'erreur
    // Peut contenir:
    // - "Les mots de passe ne correspondent pas" (validation côté client)
    // - "Le mot de passe doit contenir au moins 6 caractères" (validation côté client)
    // - Message d'erreur du backend (ex: "Email déjà existant")
    const [error, setError] = useState('');

    // loading: Indique si une requête est en cours
    // true pendant l'appel API, false sinon
    const [loading, setLoading] = useState(false);

    // navigate: Fonction pour naviguer vers d'autres pages
    const navigate = useNavigate();

    // === FONCTIONS DE GESTION DES ÉVÉNEMENTS ===

    /**
     * handleChange - Gère les changements dans les champs du formulaire
     * ==================================================================
     * Même principe que dans Login.js mais pour 4 champs au lieu de 2
     *
     * Le spread operator (...formData) est crucial ici car on a plusieurs champs.
     * Sans lui, mettre à jour un champ effacerait les autres.
     */
    const handleChange = (e) => {
        setFormData({
            ...formData,  // Garde les valeurs actuelles des autres champs
            [e.target.name]: e.target.value  // Met à jour seulement le champ modifié
        });
    };

    /**
     * handleSubmit - Gère la soumission du formulaire d'inscription
     * ==============================================================
     *
     * Processus en 3 phases:
     *
     * PHASE 1: Validations côté client (avant l'envoi au serveur)
     * - Vérifier que password === confirmPassword
     * - Vérifier que password.length >= 6
     * - Si échec: Afficher l'erreur et arrêter
     *
     * PHASE 2: Envoi au backend
     * - Appeler authService.register() avec les données
     * - Attendre la réponse
     *
     * PHASE 3: Traitement de la réponse
     * - Si succès: Rediriger vers /login avec un message de succès
     * - Si échec: Afficher l'erreur du backend
     *
     * Pourquoi ne pas se connecter automatiquement après l'inscription?
     * - Meilleure UX: Permet à l'utilisateur de confirmer ses identifiants
     * - Sécurité: Force la vérification du mot de passe
     * - Flexibilité: Permet d'ajouter une vérification email future
     */
    const handleSubmit = async (e) => {
        // Empêche le rechargement de la page (comportement par défaut des formulaires HTML)
        e.preventDefault();

        // Réinitialise les erreurs précédentes
        setError('');

        // === VALIDATION 1: Correspondance des mots de passe ===
        // Compare les deux champs de mot de passe
        // !== signifie "pas strictement égal" (vérifie valeur ET type)
        if (formData.password !== formData.confirmPassword) {
            setError('Les mots de passe ne correspondent pas');
            return;  // Arrête l'exécution, ne va pas plus loin
        }

        // === VALIDATION 2: Longueur minimale du mot de passe ===
        // Sécurité: Un mot de passe trop court est facile à deviner
        if (formData.password.length < 6) {
            setError('Le mot de passe doit contenir au moins 6 caractères');
            return;  // Arrête l'exécution
        }

        // Si on arrive ici, toutes les validations côté client sont passées

        // Active l'indicateur de chargement
        setLoading(true);

        try {
            // Appel API pour créer le compte
            // On n'envoie PAS confirmPassword au backend (inutile, déjà vérifié côté client)
            await authService.register({
                username: formData.username,
                email: formData.email,
                password: formData.password  // Seulement le password, pas confirmPassword
            });

            // Si on arrive ici, l'inscription a réussi (pas d'erreur 409 Conflict)

            // Redirection vers la page de login avec un message de succès
            // state: Permet de passer des données à la page de destination
            // La page Login pourra afficher ce message
            navigate('/login', {
                state: { message: 'Inscription réussie ! Vous pouvez maintenant vous connecter.' }
            });

        } catch (err) {
            // Ce bloc s'exécute si la requête échoue
            // Exemples d'erreurs possibles:
            // - 409 Conflict: "Username déjà existant"
            // - 409 Conflict: "Email déjà existant"
            // - 400 Bad Request: "Données incomplètes"
            // - Erreur réseau: Pas de connexion internet

            // Optional chaining (?.) pour éviter les erreurs si err.response n'existe pas
            setError(err.response?.data?.message || 'Erreur lors de l\'inscription');

        } finally {
            // Désactive l'indicateur de chargement
            // S'exécute que l'inscription réussisse ou échoue
            setLoading(false);
        }
    };

    // === RENDU JSX (INTERFACE UTILISATEUR) ===

    return (
        // Container Bootstrap avec marge en haut
        <div className="container mt-5">
            {/* Centre le contenu horizontalement */}
            <div className="row justify-content-center">
                {/* col-md-6: 50% de la largeur sur écrans moyens */}
                {/* col-lg-5: 42% de la largeur sur grands écrans */}
                {/* Un peu plus large que Login car on a plus de champs */}
                <div className="col-md-6 col-lg-5">
                    {/* Carte avec ombre */}
                    <div className="card shadow">
                        <div className="card-body">
                            {/* Titre du formulaire */}
                            <h2 className="card-title text-center mb-4">Inscription</h2>

                            {/* AFFICHAGE CONDITIONNEL DES ERREURS */}
                            {/* Si error contient du texte, affiche la boîte d'alerte rouge */}
                            {error && (
                                <div className="alert alert-danger" role="alert">
                                    {error}
                                </div>
                            )}

                            {/* FORMULAIRE D'INSCRIPTION */}
                            {/* onSubmit: Appelle handleSubmit quand on soumet le formulaire */}
                            <form onSubmit={handleSubmit}>
                                {/* === CHAMP USERNAME === */}
                                <div className="mb-3">
                                    <label htmlFor="username" className="form-label">
                                        Nom d'utilisateur
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="username"
                                        name="username"  // Utilisé par handleChange pour savoir quel champ modifier
                                        value={formData.username}  // Valeur contrôlée par React (state)
                                        onChange={handleChange}  // Appelé à chaque frappe de touche
                                        required  // HTML5: Validation navigateur - champ obligatoire
                                        minLength="3"  // HTML5: Validation navigateur - minimum 3 caractères
                                    />
                                </div>

                                {/* === CHAMP EMAIL === */}
                                <div className="mb-3">
                                    <label htmlFor="email" className="form-label">
                                        Email
                                    </label>
                                    <input
                                        type="email"  // Type email: Validation automatique du format email par le navigateur
                                        className="form-control"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                {/* === CHAMP PASSWORD === */}
                                <div className="mb-3">
                                    <label htmlFor="password" className="form-label">
                                        Mot de passe
                                    </label>
                                    <input
                                        type="password"  // Type password: Masque le texte avec des points
                                        className="form-control"
                                        id="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        minLength="6"  // HTML5: Minimum 6 caractères (doublon de notre validation mais pour UX)
                                    />
                                </div>

                                {/* === CHAMP CONFIRMATION PASSWORD === */}
                                {/* Ce champ est unique au formulaire d'inscription */}
                                {/* Permet de s'assurer que l'utilisateur n'a pas fait de faute de frappe */}
                                <div className="mb-3">
                                    <label htmlFor="confirmPassword" className="form-label">
                                        Confirmer le mot de passe
                                    </label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        id="confirmPassword"
                                        name="confirmPassword"  // Nom différent de "password"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                {/* === BOUTON DE SOUMISSION === */}
                                <button
                                    type="submit"
                                    className="btn btn-primary w-100"  // w-100: Largeur 100%
                                    disabled={loading}  // Désactivé pendant le chargement
                                >
                                    {/* Affichage conditionnel: "Inscription..." pendant le chargement, "S'inscrire" sinon */}
                                    {loading ? 'Inscription...' : 'S\'inscrire'}
                                </button>
                            </form>

                            {/* === LIEN VERS LA PAGE DE CONNEXION === */}
                            {/* Pour les utilisateurs qui ont déjà un compte */}
                            <div className="text-center mt-3">
                                {/* Link: Navigation React Router sans rechargement */}
                                <Link to="/login">Déjà un compte ? Se connecter</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Export du composant pour l'importer dans App.js
export default Register;
