import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { profileService } from '../services/api';

function UserProfile() {
    const { userId } = useParams();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editMode, setEditMode] = useState(false);
    const [passwordMode, setPasswordMode] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        email: ''
    });
    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: ''
    });
    const [successMessage, setSuccessMessage] = useState('');
    const [updateError, setUpdateError] = useState('');

    const currentUser = JSON.parse(localStorage.getItem('user'));
    const isOwnProfile = currentUser && currentUser.id === parseInt(userId);

    useEffect(() => {
        fetchProfile();
    }, [userId]);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const response = await profileService.getUserProfile(userId);
            setProfile(response.data);
            setFormData({
                username: response.data.user.username,
                email: response.data.user.email
            });
            setLoading(false);
        } catch (err) {
            setError('Erreur lors du chargement du profil');
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handlePasswordChange = (e) => {
        setPasswordData({
            ...passwordData,
            [e.target.name]: e.target.value
        });
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setUpdateError('');
        setSuccessMessage('');

        try {
            const response = await profileService.updateProfile(formData);
            setProfile({
                ...profile,
                user: response.data.user
            });
            // Mettre à jour le localStorage
            localStorage.setItem('user', JSON.stringify(response.data.user));
            setSuccessMessage('Profil mis à jour avec succès');
            setEditMode(false);
        } catch (err) {
            setUpdateError(err.response?.data?.message || 'Erreur lors de la mise à jour du profil');
        }
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        setUpdateError('');
        setSuccessMessage('');

        if (passwordData.new_password !== passwordData.confirm_password) {
            setUpdateError('Les mots de passe ne correspondent pas');
            return;
        }

        if (passwordData.new_password.length < 6) {
            setUpdateError('Le nouveau mot de passe doit contenir au moins 6 caractères');
            return;
        }

        try {
            await profileService.updatePassword({
                current_password: passwordData.current_password,
                new_password: passwordData.new_password
            });
            setSuccessMessage('Mot de passe mis à jour avec succès');
            setPasswordMode(false);
            setPasswordData({
                current_password: '',
                new_password: '',
                confirm_password: ''
            });
        } catch (err) {
            setUpdateError(err.response?.data?.message || 'Erreur lors de la mise à jour du mot de passe');
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="container mt-5">
                <div className="text-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Chargement...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mt-4">
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="container mt-4">
            <div className="row">
                {/* Profil utilisateur */}
                <div className="col-md-4">
                    <div className="card mb-4">
                        <div className="card-body text-center">
                            <div className="mb-3">
                                <i className="bi bi-person-circle" style={{ fontSize: '5rem', color: '#6c757d' }}></i>
                            </div>
                            <h3>{profile.user.username}</h3>
                            <p className="text-muted">{profile.user.email}</p>
                            <span className={`badge ${profile.user.is_admin ? 'bg-danger' : 'bg-primary'}`}>
                                {profile.user.is_admin ? 'Administrateur' : 'Utilisateur'}
                            </span>
                            <p className="text-muted small mt-3">
                                Membre depuis le {formatDate(profile.user.created_at)}
                            </p>

                            {isOwnProfile && !editMode && !passwordMode && (
                                <div className="d-grid gap-2 mt-3">
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={() => setEditMode(true)}
                                    >
                                        <i className="bi bi-pencil me-2"></i>
                                        Modifier le profil
                                    </button>
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => setPasswordMode(true)}
                                    >
                                        <i className="bi bi-key me-2"></i>
                                        Changer le mot de passe
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Statistiques */}
                    <div className="card">
                        <div className="card-header">
                            <h5 className="mb-0">Statistiques</h5>
                        </div>
                        <div className="card-body">
                            <div className="d-flex justify-content-between mb-2">
                                <span><i className="bi bi-file-post me-2"></i>Posts</span>
                                <strong>{profile.stats.total_posts}</strong>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                                <span><i className="bi bi-chat me-2"></i>Commentaires</span>
                                <strong>{profile.stats.total_comments}</strong>
                            </div>
                            <div className="d-flex justify-content-between">
                                <span><i className="bi bi-heart me-2"></i>Likes donnés</span>
                                <strong>{profile.stats.total_likes}</strong>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contenu principal */}
                <div className="col-md-8">
                    {successMessage && (
                        <div className="alert alert-success alert-dismissible fade show" role="alert">
                            {successMessage}
                            <button type="button" className="btn-close" onClick={() => setSuccessMessage('')}></button>
                        </div>
                    )}

                    {updateError && (
                        <div className="alert alert-danger alert-dismissible fade show" role="alert">
                            {updateError}
                            <button type="button" className="btn-close" onClick={() => setUpdateError('')}></button>
                        </div>
                    )}

                    {/* Mode édition du profil */}
                    {editMode && (
                        <div className="card mb-4">
                            <div className="card-header">
                                <h5 className="mb-0">Modifier le profil</h5>
                            </div>
                            <div className="card-body">
                                <form onSubmit={handleUpdateProfile}>
                                    <div className="mb-3">
                                        <label htmlFor="username" className="form-label">Nom d'utilisateur</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="username"
                                            name="username"
                                            value={formData.username}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="email" className="form-label">Email</label>
                                        <input
                                            type="email"
                                            className="form-control"
                                            id="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="d-flex gap-2">
                                        <button type="submit" className="btn btn-primary">
                                            Enregistrer
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={() => {
                                                setEditMode(false);
                                                setFormData({
                                                    username: profile.user.username,
                                                    email: profile.user.email
                                                });
                                            }}
                                        >
                                            Annuler
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Mode changement de mot de passe */}
                    {passwordMode && (
                        <div className="card mb-4">
                            <div className="card-header">
                                <h5 className="mb-0">Changer le mot de passe</h5>
                            </div>
                            <div className="card-body">
                                <form onSubmit={handleUpdatePassword}>
                                    <div className="mb-3">
                                        <label htmlFor="current_password" className="form-label">Mot de passe actuel</label>
                                        <input
                                            type="password"
                                            className="form-control"
                                            id="current_password"
                                            name="current_password"
                                            value={passwordData.current_password}
                                            onChange={handlePasswordChange}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="new_password" className="form-label">Nouveau mot de passe</label>
                                        <input
                                            type="password"
                                            className="form-control"
                                            id="new_password"
                                            name="new_password"
                                            value={passwordData.new_password}
                                            onChange={handlePasswordChange}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="confirm_password" className="form-label">Confirmer le nouveau mot de passe</label>
                                        <input
                                            type="password"
                                            className="form-control"
                                            id="confirm_password"
                                            name="confirm_password"
                                            value={passwordData.confirm_password}
                                            onChange={handlePasswordChange}
                                            required
                                        />
                                    </div>
                                    <div className="d-flex gap-2">
                                        <button type="submit" className="btn btn-primary">
                                            Mettre à jour le mot de passe
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={() => {
                                                setPasswordMode(false);
                                                setPasswordData({
                                                    current_password: '',
                                                    new_password: '',
                                                    confirm_password: ''
                                                });
                                            }}
                                        >
                                            Annuler
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Posts récents */}
                    {!editMode && !passwordMode && (
                        <div className="card">
                            <div className="card-header">
                                <h5 className="mb-0">Posts récents</h5>
                            </div>
                            <div className="card-body">
                                {profile.recent_posts.length === 0 ? (
                                    <p className="text-muted">Aucun post pour le moment.</p>
                                ) : (
                                    <div className="list-group">
                                        {profile.recent_posts.map(post => (
                                            <Link
                                                key={post.id}
                                                to={`/forum/posts/${post.id}`}
                                                className="list-group-item list-group-item-action"
                                            >
                                                <div className="d-flex w-100 justify-content-between">
                                                    <h6 className="mb-1">{post.title}</h6>
                                                    <small className="text-muted">
                                                        {formatDate(post.created_at)}
                                                    </small>
                                                </div>
                                                <div className="d-flex gap-3 mt-2">
                                                    <small className="text-muted">
                                                        <i className="bi bi-heart me-1"></i>
                                                        {post.likes_count || 0}
                                                    </small>
                                                    <small className="text-muted">
                                                        <i className="bi bi-chat me-1"></i>
                                                        {post.comments_count || 0}
                                                    </small>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default UserProfile;
