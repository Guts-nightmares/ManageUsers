import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { postService, commentService, likeService } from '../services/api';

function PostDetail() {
    const { postId } = useParams();
    const navigate = useNavigate();
    const [post, setPost] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [commentError, setCommentError] = useState('');
    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(0);
    const [editingComment, setEditingComment] = useState(null);
    const [editCommentContent, setEditCommentContent] = useState('');

    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        fetchPostAndComments();
    }, [postId]);

    const fetchPostAndComments = async () => {
        try {
            setLoading(true);
            const [postRes, commentsRes] = await Promise.all([
                postService.getPost(postId),
                commentService.getComments(postId)
            ]);

            setPost(postRes.data.post);
            setComments(commentsRes.data.comments);
            setLikesCount(postRes.data.post.likes_count || 0);

            // Vérifier si l'utilisateur a liké le post
            if (user) {
                try {
                    const likedRes = await likeService.checkUserLikedPost(postId);
                    setIsLiked(likedRes.data.liked);
                } catch (err) {
                    // Ignore si non authentifié
                }
            }

            setLoading(false);
        } catch (err) {
            setError('Erreur lors du chargement du post');
            setLoading(false);
        }
    };

    const handleLike = async () => {
        if (!user) {
            navigate('/login');
            return;
        }

        try {
            const response = await likeService.togglePostLike(postId);
            setIsLiked(response.data.liked);
            setLikesCount(response.data.likes_count);
        } catch (err) {
            console.error('Erreur lors du like:', err);
        }
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();

        if (!user) {
            navigate('/login');
            return;
        }

        if (!newComment.trim()) {
            setCommentError('Le commentaire ne peut pas être vide');
            return;
        }

        try {
            setCommentError('');
            const response = await commentService.createComment(postId, { content: newComment });
            setComments([...comments, response.data.comment]);
            setNewComment('');
            // Mettre à jour le nombre de commentaires
            setPost({...post, comments_count: (post.comments_count || 0) + 1});
        } catch (err) {
            setCommentError(err.response?.data?.message || 'Erreur lors de l\'ajout du commentaire');
        }
    };

    const handleCommentLike = async (commentId, index) => {
        if (!user) {
            navigate('/login');
            return;
        }

        try {
            const response = await likeService.toggleCommentLike(commentId);
            const updatedComments = [...comments];
            updatedComments[index].likes_count = response.data.likes_count;
            setComments(updatedComments);
        } catch (err) {
            console.error('Erreur lors du like du commentaire:', err);
        }
    };

    const handleDeletePost = async () => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce post ?')) {
            return;
        }

        try {
            await postService.deletePost(postId);
            navigate('/forum');
        } catch (err) {
            setError('Erreur lors de la suppression du post');
        }
    };

    const handleEditComment = (comment) => {
        setEditingComment(comment.id);
        setEditCommentContent(comment.content);
    };

    const handleUpdateComment = async (commentId) => {
        try {
            const response = await commentService.updateComment(commentId, { content: editCommentContent });
            const updatedComments = comments.map(c =>
                c.id === commentId ? response.data.comment : c
            );
            setComments(updatedComments);
            setEditingComment(null);
            setEditCommentContent('');
        } catch (err) {
            setCommentError('Erreur lors de la modification du commentaire');
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce commentaire ?')) {
            return;
        }

        try {
            await commentService.deleteComment(commentId);
            setComments(comments.filter(c => c.id !== commentId));
            setPost({...post, comments_count: (post.comments_count || 1) - 1});
        } catch (err) {
            setCommentError('Erreur lors de la suppression du commentaire');
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

    if (error && !post) {
        return (
            <div className="container mt-4">
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
                <Link to="/forum" className="btn btn-secondary">Retour au forum</Link>
            </div>
        );
    }

    const canEditPost = user && (user.id === post.user_id || user.is_admin);

    return (
        <div className="container mt-4">
            <Link to="/forum" className="btn btn-link mb-3">
                <i className="bi bi-arrow-left me-2"></i>Retour au forum
            </Link>

            {/* Post principal */}
            <div className="card mb-4">
                <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                        <div>
                            <h2 className="card-title">{post.title}</h2>
                            <p className="text-muted small">
                                Par <Link to={`/profile/${post.user_id}`}><strong>{post.author?.username || 'Anonyme'}</strong></Link> • {formatDate(post.created_at)}
                                {post.updated_at !== post.created_at && (
                                    <span className="ms-2">(modifié le {formatDate(post.updated_at)})</span>
                                )}
                            </p>
                        </div>
                        {canEditPost && (
                            <div className="btn-group">
                                <button
                                    className="btn btn-sm btn-danger"
                                    onClick={handleDeletePost}
                                >
                                    <i className="bi bi-trash"></i>
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="card-text" style={{ whiteSpace: 'pre-wrap' }}>
                        {post.content}
                    </div>

                    <hr />

                    <div className="d-flex gap-3 align-items-center">
                        <button
                            className={`btn btn-sm ${isLiked ? 'btn-danger' : 'btn-outline-danger'}`}
                            onClick={handleLike}
                        >
                            <i className={`bi bi-heart${isLiked ? '-fill' : ''} me-1`}></i>
                            {likesCount} {likesCount > 1 ? 'likes' : 'like'}
                        </button>
                        <span className="text-muted">
                            <i className="bi bi-chat-fill me-1"></i>
                            {comments.length} {comments.length > 1 ? 'commentaires' : 'commentaire'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Section commentaires */}
            <div className="card">
                <div className="card-header">
                    <h4>Commentaires ({comments.length})</h4>
                </div>
                <div className="card-body">
                    {/* Formulaire de nouveau commentaire */}
                    {user ? (
                        <form onSubmit={handleCommentSubmit} className="mb-4">
                            {commentError && (
                                <div className="alert alert-danger" role="alert">
                                    {commentError}
                                </div>
                            )}
                            <div className="mb-3">
                                <textarea
                                    className="form-control"
                                    rows="3"
                                    placeholder="Ajouter un commentaire..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                />
                            </div>
                            <button type="submit" className="btn btn-primary btn-sm">
                                <i className="bi bi-send me-2"></i>
                                Commenter
                            </button>
                        </form>
                    ) : (
                        <div className="alert alert-info">
                            <Link to="/login">Connectez-vous</Link> pour commenter
                        </div>
                    )}

                    {/* Liste des commentaires */}
                    {comments.length === 0 ? (
                        <p className="text-muted">Aucun commentaire pour le moment.</p>
                    ) : (
                        <div className="comments-list">
                            {comments.map((comment, index) => {
                                const canEditComment = user && (user.id === comment.user_id || user.is_admin);
                                const isEditing = editingComment === comment.id;

                                return (
                                    <div key={comment.id} className="border-bottom pb-3 mb-3">
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                            <div>
                                                <strong>
                                                    <Link to={`/profile/${comment.user_id}`}>
                                                        {comment.author?.username || 'Anonyme'}
                                                    </Link>
                                                </strong>
                                                <span className="text-muted small ms-2">
                                                    {formatDate(comment.created_at)}
                                                    {comment.updated_at !== comment.created_at && ' (modifié)'}
                                                </span>
                                            </div>
                                            {canEditComment && !isEditing && (
                                                <div className="btn-group btn-group-sm">
                                                    <button
                                                        className="btn btn-sm btn-outline-warning"
                                                        onClick={() => handleEditComment(comment)}
                                                    >
                                                        <i className="bi bi-pencil"></i>
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-outline-danger"
                                                        onClick={() => handleDeleteComment(comment.id)}
                                                    >
                                                        <i className="bi bi-trash"></i>
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {isEditing ? (
                                            <div>
                                                <textarea
                                                    className="form-control form-control-sm mb-2"
                                                    value={editCommentContent}
                                                    onChange={(e) => setEditCommentContent(e.target.value)}
                                                    rows="3"
                                                />
                                                <div className="btn-group btn-group-sm">
                                                    <button
                                                        className="btn btn-success"
                                                        onClick={() => handleUpdateComment(comment.id)}
                                                    >
                                                        Enregistrer
                                                    </button>
                                                    <button
                                                        className="btn btn-secondary"
                                                        onClick={() => {
                                                            setEditingComment(null);
                                                            setEditCommentContent('');
                                                        }}
                                                    >
                                                        Annuler
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <p className="mb-2" style={{ whiteSpace: 'pre-wrap' }}>
                                                    {comment.content}
                                                </p>
                                                <button
                                                    className="btn btn-sm btn-outline-secondary"
                                                    onClick={() => handleCommentLike(comment.id, index)}
                                                >
                                                    <i className="bi bi-heart me-1"></i>
                                                    {comment.likes_count || 0}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default PostDetail;
