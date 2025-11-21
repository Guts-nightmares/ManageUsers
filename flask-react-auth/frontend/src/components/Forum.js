import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { postService } from '../services/api';

function Forum() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        fetchPosts();
    }, [page]);

    const fetchPosts = async () => {
        try {
            setLoading(true);
            const response = await postService.getAllPosts(page, 10);
            setPosts(response.data.posts);
            setTotalPages(response.data.total_pages);
            setLoading(false);
        } catch (err) {
            setError('Erreur lors du chargement des posts');
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

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Forum</h2>
                {user && (
                    <Link to="/forum/new" className="btn btn-primary">
                        <i className="bi bi-plus-circle me-2"></i>
                        Nouveau post
                    </Link>
                )}
            </div>

            {error && (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            )}

            {posts.length === 0 ? (
                <div className="alert alert-info">
                    Aucun post disponible. {user && 'Soyez le premier à poster !'}
                </div>
            ) : (
                <>
                    <div className="row">
                        {posts.map(post => (
                            <div key={post.id} className="col-12 mb-3">
                                <div className="card">
                                    <div className="card-body">
                                        <div className="d-flex justify-content-between align-items-start">
                                            <div className="flex-grow-1">
                                                <h5 className="card-title">
                                                    <Link
                                                        to={`/forum/posts/${post.id}`}
                                                        className="text-decoration-none"
                                                    >
                                                        {post.title}
                                                    </Link>
                                                </h5>
                                                <p className="card-text text-muted small mb-2">
                                                    Par <strong>{post.author?.username || 'Anonyme'}</strong> • {formatDate(post.created_at)}
                                                </p>
                                                <p className="card-text">
                                                    {truncateContent(post.content)}
                                                </p>
                                            </div>
                                        </div>
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

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <nav aria-label="Navigation des posts">
                            <ul className="pagination justify-content-center mt-4">
                                <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                                    <button
                                        className="page-link"
                                        onClick={() => setPage(page - 1)}
                                        disabled={page === 1}
                                    >
                                        Précédent
                                    </button>
                                </li>
                                {[...Array(totalPages)].map((_, index) => (
                                    <li
                                        key={index + 1}
                                        className={`page-item ${page === index + 1 ? 'active' : ''}`}
                                    >
                                        <button
                                            className="page-link"
                                            onClick={() => setPage(index + 1)}
                                        >
                                            {index + 1}
                                        </button>
                                    </li>
                                ))}
                                <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                                    <button
                                        className="page-link"
                                        onClick={() => setPage(page + 1)}
                                        disabled={page === totalPages}
                                    >
                                        Suivant
                                    </button>
                                </li>
                            </ul>
                        </nav>
                    )}
                </>
            )}
        </div>
    );
}

export default Forum;
