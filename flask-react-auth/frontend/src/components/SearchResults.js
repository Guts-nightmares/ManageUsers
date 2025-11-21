import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { searchService } from '../services/api';

function SearchResults() {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q');
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (query) {
            searchPosts();
        }
    }, [query]);

    const searchPosts = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await searchService.searchPosts(query);
            setPosts(response.data.posts);
            setLoading(false);
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la recherche');
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const truncateContent = (content, maxLength = 200) => {
        if (content.length <= maxLength) return content;
        return content.substring(0, maxLength) + '...';
    };

    const highlightText = (text, query) => {
        if (!query) return text;
        const parts = text.split(new RegExp(`(${query})`, 'gi'));
        return parts.map((part, index) =>
            part.toLowerCase() === query.toLowerCase() ?
                <mark key={index}>{part}</mark> : part
        );
    };

    if (loading) {
        return (
            <div className="container mt-5">
                <div className="text-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Recherche...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mt-4">
            <div className="mb-4">
                <h2>Résultats de recherche</h2>
                <p className="text-muted">
                    Recherche pour : <strong>"{query}"</strong> - {posts.length} résultat(s) trouvé(s)
                </p>
                <Link to="/forum" className="btn btn-link">
                    <i className="bi bi-arrow-left me-2"></i>Retour au forum
                </Link>
            </div>

            {error && (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            )}

            {posts.length === 0 ? (
                <div className="alert alert-info">
                    Aucun résultat trouvé pour "{query}". Essayez avec d'autres mots-clés.
                </div>
            ) : (
                <div className="row">
                    {posts.map(post => (
                        <div key={post.id} className="col-12 mb-3">
                            <div className="card">
                                <div className="card-body">
                                    <h5 className="card-title">
                                        <Link
                                            to={`/forum/posts/${post.id}`}
                                            className="text-decoration-none"
                                        >
                                            {highlightText(post.title, query)}
                                        </Link>
                                    </h5>
                                    <p className="card-text text-muted small mb-2">
                                        Par <strong>{post.author?.username || 'Anonyme'}</strong> • {formatDate(post.created_at)}
                                    </p>
                                    <p className="card-text">
                                        {highlightText(truncateContent(post.content), query)}
                                    </p>
                                    <div className="d-flex gap-3 mt-2">
                                        <span className="badge bg-light text-dark">
                                            <i className="bi bi-heart-fill text-danger me-1"></i>
                                            {post.likes_count || 0} likes
                                        </span>
                                        <span className="badge bg-light text-dark">
                                            <i className="bi bi-chat-fill text-primary me-1"></i>
                                            {post.comments_count || 0} commentaires
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default SearchResults;
