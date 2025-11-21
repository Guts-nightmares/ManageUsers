/**
 * Composant Admin - Panel d'administration pour gérer les utilisateurs
 * ======================================================================
 * Ce composant affiche un tableau de tous les utilisateurs avec possibilité de:
 * - Visualiser tous les utilisateurs
 * - Modifier les informations d'un utilisateur (édition inline)
 * - Supprimer un utilisateur
 * - Changer le rôle admin d'un utilisateur
 *
 * Concepts React avancés utilisés:
 * - useEffect: Pour charger les données au montage du composant
 * - État complexe: Gestion de l'édition inline avec editingUser
 * - Rendu conditionnel: Affichage différent selon si on édite ou non
 * - Confirmation utilisateur: window.confirm() avant suppression
 *
 * Sécurité:
 * - Vérifie que l'utilisateur est admin avant de charger
 * - L'admin ne peut pas se supprimer lui-même
 * - Le backend vérifie aussi les droits (double vérification)
 */

// Import de React et des hooks nécessaires
import React, { useState, useEffect } from 'react';
// Import de useNavigate pour la redirection
import { useNavigate } from 'react-router-dom';
// Import du service admin qui gère les appels API
import { adminService } from '../services/api';

/**
 * Composant Admin
 *
 * Props:
 *   - user: Objet contenant les données de l'utilisateur connecté
 *     Utilisé pour vérifier s'il est admin et empêcher qu'il se supprime lui-même
 */
function Admin({ user }) {
    // === GESTION DE L'ÉTAT ===

    // users: Tableau de tous les utilisateurs chargés depuis le backend
    // Initialement vide [], sera rempli par fetchUsers()
    const [users, setUsers] = useState([]);

    // loading: Indique si les données sont en cours de chargement
    // true au départ, false une fois les données chargées
    const [loading, setLoading] = useState(true);

    // error: Message d'erreur s'il y a un problème lors du chargement
    // Vide par défaut, rempli en cas d'erreur
    const [error, setError] = useState('');

    // editingUser: Objet contenant les données de l'utilisateur en cours d'édition
    // null si aucun utilisateur n'est en édition
    // Structure quand non-null:
    // {
    //   id: number,
    //   username: string,
    //   email: string,
    //   is_admin: boolean
    // }
    const [editingUser, setEditingUser] = useState(null);

    // navigate: Fonction pour rediriger vers d'autres pages
    const navigate = useNavigate();

    // === EFFET DE MONTAGE (LIFECYCLE) ===

    /**
     * useEffect - S'exécute après le premier rendu du composant
     * ==========================================================
     *
     * Dépendances: [user, navigate]
     * - Se ré-exécute si user ou navigate change
     * - En pratique, ils ne changent jamais, donc s'exécute une seule fois
     *
     * Processus:
     * 1. Vérifie si l'utilisateur est admin
     * 2. Si non-admin: Redirige vers /dashboard (pas autorisé)
     * 3. Si admin: Charge la liste des utilisateurs
     *
     * Pourquoi cette vérification?
     * - Sécurité côté client (l'utilisateur ne devrait pas voir cette page)
     * - Le backend vérifie aussi (sécurité côté serveur, plus importante)
     */
    useEffect(() => {
        // Vérification: L'utilisateur est-il admin?
        // user?.is_admin: Optional chaining, retourne undefined si user est null
        // !user?.is_admin: true si user est null OU si is_admin est false
        if (!user?.is_admin) {
            // Non-admin: Redirection vers le dashboard
            navigate('/dashboard');
            return;  // Arrête l'exécution du useEffect
        }

        // Si on arrive ici, l'utilisateur est admin
        // Chargement de la liste des utilisateurs
        fetchUsers();
    }, [user, navigate]);  // Dépendances: ré-exécute si user ou navigate change

    // === FONCTIONS DE GESTION DES DONNÉES ===

    /**
     * fetchUsers - Récupère la liste de tous les utilisateurs depuis le backend
     * ===========================================================================
     *
     * Fonction asynchrone qui:
     * 1. Active l'indicateur de chargement
     * 2. Appelle l'API GET /api/admin/users
     * 3. Stocke les utilisateurs dans le state
     * 4. Gère les erreurs éventuelles
     * 5. Désactive l'indicateur de chargement
     *
     * Cette fonction est appelée:
     * - Au montage du composant (dans useEffect)
     * - Pourrait être rappelée après une action (refresh manuel)
     */
    const fetchUsers = async () => {
        try {
            // Active le spinner de chargement
            setLoading(true);

            // Appel API: GET /api/admin/users
            // await: Attend la réponse du serveur
            const response = await adminService.getAllUsers();

            // Stocke les utilisateurs dans le state
            // response.data.users: Tableau des utilisateurs
            setUsers(response.data.users);

            // Efface les erreurs précédentes (si la requête réussit)
            setError('');

        } catch (err) {
            // En cas d'erreur (401, 403, 500, erreur réseau, etc.)
            // Affiche un message d'erreur
            setError(err.response?.data?.message || 'Erreur lors du chargement des utilisateurs');

        } finally {
            // finally: S'exécute toujours, succès ou échec
            // Désactive le spinner de chargement
            setLoading(false);
        }
    };

    // === FONCTIONS DE GESTION DES ACTIONS ===

    /**
     * handleDelete - Supprime un utilisateur
     * =======================================
     *
     * Paramètre:
     *   - userId: ID de l'utilisateur à supprimer
     *
     * Processus:
     * 1. Demande confirmation avec window.confirm()
     * 2. Si confirmé: Appelle DELETE /api/admin/users/:userId
     * 3. Met à jour la liste locale (filtre l'utilisateur supprimé)
     * 4. Affiche une erreur si la suppression échoue
     *
     * Sécurité:
     * - Le backend empêche un admin de se supprimer lui-même
     * - Mais on pourrait ajouter cette vérification côté client aussi
     */
    const handleDelete = async (userId) => {
        // window.confirm(): Boîte de dialogue native du navigateur
        // Retourne true si l'utilisateur clique "OK", false si "Annuler"
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
            return;  // L'utilisateur a annulé, on arrête
        }

        try {
            // Appel API: DELETE /api/admin/users/:userId
            await adminService.deleteUser(userId);

            // Mise à jour locale de la liste (sans recharger depuis le serveur)
            // filter(): Crée un nouveau tableau sans l'utilisateur supprimé
            // u => u.id !== userId: Garde tous les utilisateurs SAUF celui avec cet ID
            setUsers(users.filter(u => u.id !== userId));

        } catch (err) {
            // En cas d'erreur, affiche une alerte
            // alert(): Boîte de dialogue native (plus simple que gérer un state d'erreur)
            alert(err.response?.data?.message || 'Erreur lors de la suppression');
        }
    };

    /**
     * handleEdit - Active le mode édition pour un utilisateur
     * ========================================================
     *
     * Paramètre:
     *   - user: Objet utilisateur complet
     *
     * Fonctionnement:
     * - Copie les données de l'utilisateur dans editingUser
     * - Déclenche le re-render avec des champs d'édition au lieu du texte
     * - L'utilisateur peut modifier username, email, is_admin
     *
     * Note: On copie l'objet au lieu de passer la référence
     * Pourquoi? Pour ne pas modifier directement l'objet dans users[]
     */
    const handleEdit = (user) => {
        // Copie les données de l'utilisateur dans editingUser
        // On crée un NOUVEL objet (pas de référence à l'original)
        setEditingUser({
            id: user.id,
            username: user.username,
            email: user.email,
            is_admin: user.is_admin
        });
    };

    /**
     * handleCancelEdit - Annule l'édition en cours
     * =============================================
     *
     * Remet editingUser à null
     * Déclenche le re-render qui affiche à nouveau le texte au lieu des champs
     */
    const handleCancelEdit = () => {
        setEditingUser(null);
    };

    /**
     * handleSaveEdit - Sauvegarde les modifications d'un utilisateur
     * ===============================================================
     *
     * Processus:
     * 1. Envoie PUT /api/admin/users/:id avec les nouvelles données
     * 2. Met à jour la liste locale avec les données renvoyées par le serveur
     * 3. Quitte le mode édition
     * 4. Affiche une erreur en cas de problème
     *
     * Pourquoi mettre à jour avec response.data.user?
     * - Le serveur peut faire des transformations (trim, lowercase, etc.)
     * - Garantit la cohérence entre client et serveur
     */
    const handleSaveEdit = async () => {
        try {
            // Appel API: PUT /api/admin/users/:id
            const response = await adminService.updateUser(editingUser.id, {
                username: editingUser.username,
                email: editingUser.email,
                is_admin: editingUser.is_admin
            });

            // Mise à jour de la liste locale
            // map(): Crée un nouveau tableau
            // Pour chaque utilisateur:
            // - Si c'est celui qu'on a édité, le remplace par les nouvelles données
            // - Sinon, le garde tel quel
            setUsers(users.map(u =>
                u.id === editingUser.id ? response.data.user : u
            ));

            // Quitte le mode édition
            setEditingUser(null);

        } catch (err) {
            // Affiche une alerte en cas d'erreur
            alert(err.response?.data?.message || 'Erreur lors de la mise à jour');
        }
    };

    /**
     * handleEditChange - Gère les changements dans les champs d'édition
     * ==================================================================
     *
     * Paramètres:
     *   - field: Nom du champ à modifier ('username', 'email', ou 'is_admin')
     *   - value: Nouvelle valeur
     *
     * Fonctionnement:
     * - Met à jour seulement le champ spécifié dans editingUser
     * - Garde les autres champs inchangés (grâce au spread operator)
     *
     * Pourquoi une fonction séparée au lieu de handleChange comme dans Login?
     * - Ici on modifie editingUser, pas formData
     * - On ne peut pas utiliser e.target.name directement dans un select
     */
    const handleEditChange = (field, value) => {
        setEditingUser({
            ...editingUser,  // Copie toutes les propriétés actuelles
            [field]: value   // Met à jour seulement le champ spécifié
        });
    };

    // === AFFICHAGE CONDITIONNEL: CHARGEMENT ===

    /**
     * Pendant le chargement initial, on affiche un spinner
     * au lieu du tableau vide
     *
     * Améliore l'UX en indiquant clairement que les données se chargent
     */
    if (loading) {
        return (
            // Centrage vertical et horizontal avec Bootstrap
            <div className="container mt-5 text-center">
                {/* Spinner Bootstrap animé */}
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Chargement...</span>
                </div>
            </div>
        );
    }

    // === RENDU PRINCIPAL (UNE FOIS LES DONNÉES CHARGÉES) ===

    return (
        <div className="container mt-5">
            <div className="row">
                <div className="col-12">
                    {/* === EN-TÊTE AVEC BOUTON RETOUR === */}
                    {/* d-flex: Display flex (layout flexbox) */}
                    {/* justify-content-between: Espace entre titre et bouton */}
                    {/* align-items-center: Aligne verticalement au centre */}
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h2>Panneau d'administration</h2>

                        {/* Bouton pour retourner au dashboard */}
                        <button
                            className="btn btn-secondary"
                            onClick={() => navigate('/dashboard')}
                        >
                            Retour au tableau de bord
                        </button>
                    </div>

                    {/* === AFFICHAGE DES ERREURS === */}
                    {/* Rendu conditionnel: Affiche seulement si error n'est pas vide */}
                    {error && (
                        <div className="alert alert-danger" role="alert">
                            {error}
                        </div>
                    )}

                    {/* === TABLEAU DES UTILISATEURS === */}
                    <div className="card shadow">
                        {/* En-tête de la carte */}
                        <div className="card-header bg-primary text-white">
                            {/* Affiche le nombre total d'utilisateurs */}
                            <h5 className="mb-0">Gestion des utilisateurs ({users.length})</h5>
                        </div>

                        {/* Corps de la carte (sans padding pour que le tableau touche les bords) */}
                        <div className="card-body p-0">
                            {/* table-responsive: Permet le scroll horizontal sur petits écrans */}
                            <div className="table-responsive">
                                {/* Tableau Bootstrap */}
                                {/* table-striped: Lignes alternées (gris/blanc) */}
                                {/* table-hover: Effet hover sur les lignes */}
                                {/* mb-0: Pas de marge en bas */}
                                <table className="table table-striped table-hover mb-0">
                                    {/* === EN-TÊTE DU TABLEAU === */}
                                    <thead className="table-light">
                                        <tr>
                                            <th>ID</th>
                                            <th>Nom d'utilisateur</th>
                                            <th>Email</th>
                                            <th>Rôle</th>
                                            <th>Date de création</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>

                                    {/* === CORPS DU TABLEAU === */}
                                    <tbody>
                                        {/* Boucle sur tous les utilisateurs avec map() */}
                                        {/* map(): Transforme chaque utilisateur en ligne de tableau */}
                                        {/* key={u.id}: Attribut obligatoire React pour les listes */}
                                        {/*   Permet à React de tracker quelle ligne a changé */}
                                        {users.map(u => (
                                            <tr key={u.id}>
                                                {/* === COLONNE ID === */}
                                                {/* Simple affichage de l'ID */}
                                                <td>{u.id}</td>

                                                {/* === COLONNE USERNAME === */}
                                                {/* Affichage conditionnel: */}
                                                {/* - Si on édite cet utilisateur: Affiche un input */}
                                                {/* - Sinon: Affiche le texte simple */}
                                                <td>
                                                    {editingUser?.id === u.id ? (
                                                        // MODE ÉDITION: Champ de saisie
                                                        <input
                                                            type="text"
                                                            className="form-control form-control-sm"
                                                            value={editingUser.username}
                                                            onChange={(e) => handleEditChange('username', e.target.value)}
                                                        />
                                                    ) : (
                                                        // MODE NORMAL: Texte simple
                                                        u.username
                                                    )}
                                                </td>

                                                {/* === COLONNE EMAIL === */}
                                                {/* Même principe que username */}
                                                <td>
                                                    {editingUser?.id === u.id ? (
                                                        // MODE ÉDITION
                                                        <input
                                                            type="email"
                                                            className="form-control form-control-sm"
                                                            value={editingUser.email}
                                                            onChange={(e) => handleEditChange('email', e.target.value)}
                                                        />
                                                    ) : (
                                                        // MODE NORMAL
                                                        u.email
                                                    )}
                                                </td>

                                                {/* === COLONNE RÔLE === */}
                                                <td>
                                                    {editingUser?.id === u.id ? (
                                                        // MODE ÉDITION: Menu déroulant (select)
                                                        // e.target.value === 'true': Convertit le string en booléen
                                                        // Dans les select, value est toujours un string
                                                        <select
                                                            className="form-select form-select-sm"
                                                            value={editingUser.is_admin ? 'true' : 'false'}
                                                            onChange={(e) => handleEditChange('is_admin', e.target.value === 'true')}
                                                        >
                                                            <option value="false">Utilisateur</option>
                                                            <option value="true">Admin</option>
                                                        </select>
                                                    ) : (
                                                        // MODE NORMAL: Badge coloré
                                                        <span className={`badge ${u.is_admin ? 'bg-danger' : 'bg-primary'}`}>
                                                            {u.is_admin ? 'Admin' : 'Utilisateur'}
                                                        </span>
                                                    )}
                                                </td>

                                                {/* === COLONNE DATE DE CRÉATION === */}
                                                {/* Conversion de la date ISO en format français */}
                                                <td>
                                                    {new Date(u.created_at).toLocaleDateString('fr-FR')}
                                                </td>

                                                {/* === COLONNE ACTIONS === */}
                                                <td>
                                                    {editingUser?.id === u.id ? (
                                                        // MODE ÉDITION: Boutons Sauvegarder/Annuler
                                                        // btn-group: Groupe les boutons ensemble
                                                        <div className="btn-group btn-group-sm">
                                                            {/* Bouton Sauvegarder */}
                                                            <button
                                                                className="btn btn-success"
                                                                onClick={handleSaveEdit}
                                                            >
                                                                Sauvegarder
                                                            </button>

                                                            {/* Bouton Annuler */}
                                                            <button
                                                                className="btn btn-secondary"
                                                                onClick={handleCancelEdit}
                                                            >
                                                                Annuler
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        // MODE NORMAL: Boutons Modifier/Supprimer
                                                        <div className="btn-group btn-group-sm">
                                                            {/* Bouton Modifier */}
                                                            {/* Désactivé si c'est l'admin connecté */}
                                                            {/* On ne peut pas modifier son propre compte ici */}
                                                            <button
                                                                className="btn btn-warning"
                                                                onClick={() => handleEdit(u)}
                                                                disabled={u.id === user.id}
                                                            >
                                                                Modifier
                                                            </button>

                                                            {/* Bouton Supprimer */}
                                                            {/* Désactivé si c'est l'admin connecté */}
                                                            {/* Un admin ne peut pas se supprimer lui-même */}
                                                            <button
                                                                className="btn btn-danger"
                                                                onClick={() => handleDelete(u.id)}
                                                                disabled={u.id === user.id}
                                                            >
                                                                Supprimer
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Export du composant
export default Admin;
