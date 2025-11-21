import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { postService } from '../services/api';

function CreatePost() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: '',
        content: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.title.trim() || !formData.content.trim()) {
            setError('Le titre et le contenu sont requis');
            return;
        }

        if (formData.title.length < 5) {
            setError('Le titre doit contenir au moins 5 caractères');
            return;
        }

        if (formData.content.length < 10) {
            setError('Le contenu doit contenir au moins 10 caractères');
            return;
        }

        try {
            setLoading(true);
            const response = await postService.createPost(formData);
            navigate(`/forum/posts/${response.data.post.id}`);
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la création du post');
            setLoading(false);
        }
    };

    return (
        <div className="container mt-4">
            <div className="row justify-content-center">
                <div className="col-md-8">
                    <div className="card shadow">
                        <div className="card-body">
                            <h2 className="card-title mb-4">Créer un nouveau post</h2>

                            {error && (
                                <div className="alert alert-danger" role="alert">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label htmlFor="title" className="form-label">
                                        Titre <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="title"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        placeholder="Entrez le titre de votre post"
                                        maxLength="200"
                                        required
                                    />
                                    <div className="form-text">
                                        {formData.title.length}/200 caractères
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="content" className="form-label">
                                        Contenu <span className="text-danger">*</span>
                                    </label>
                                    <textarea
                                        className="form-control"
                                        id="content"
                                        name="content"
                                        value={formData.content}
                                        onChange={handleChange}
                                        placeholder="Écrivez le contenu de votre post..."
                                        rows="10"
                                        required
                                    />
                                    <div className="form-text">
                                        {formData.content.length} caractères
                                    </div>
                                </div>

                                <div className="d-flex gap-2">
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                Publication...
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi bi-send me-2"></i>
                                                Publier
                                            </>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => navigate('/forum')}
                                        disabled={loading}
                                    >
                                        Annuler
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CreatePost;
