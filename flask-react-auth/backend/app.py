"""
Fichier principal de l'application Flask - API REST Backend
============================================================
Ce fichier est le cœur du backend. Il définit toutes les routes API
(endpoints) que le frontend React va appeler.

Architecture API REST:
- GET: Récupérer des données
- POST: Créer de nouvelles données
- PUT: Modifier des données existantes
- DELETE: Supprimer des données

Groupes de routes:
1. Authentification (/api/register, /api/login, /api/me)
2. Administration (/api/admin/users/...)
3. Posts (/api/posts/...)
4. Commentaires (/api/posts/.../comments, /api/comments/...)
5. Likes (/api/posts/.../like, /api/comments/.../like)
6. Profils utilisateurs (/api/users/.../profile, /api/profile/...)
7. Recherche (/api/posts/search)
"""

# === IMPORTS DES BIBLIOTHÈQUES ===

# Flask: Framework web pour créer l'application et gérer les routes
from flask import Flask, request, jsonify
# CORS (Cross-Origin Resource Sharing): Permet au frontend (port 3000) de communiquer avec le backend (port 5000)
# Sans CORS, les navigateurs bloquent les requêtes entre différents ports (sécurité)
from flask_cors import CORS
# Import des modèles de base de données définis dans models.py
from models import db, User, Post, Comment, Like
# Import de la configuration de l'application
from config import Config
# JWT (JSON Web Token): Bibliothèque pour créer et vérifier les tokens d'authentification
import jwt
# datetime et timedelta: Pour gérer les dates et les durées (expiration des tokens)
from datetime import datetime, timedelta
# wraps: Décorateur utilitaire pour préserver les métadonnées des fonctions décorées
from functools import wraps

# === INITIALISATION DE L'APPLICATION FLASK ===

# Création de l'instance principale de l'application Flask
# __name__ permet à Flask de savoir où chercher les ressources (templates, fichiers statiques, etc.)
app = Flask(__name__)

# Chargement de la configuration depuis la classe Config (config.py)
# Cela configure: SECRET_KEY, DATABASE_URI, JWT_EXPIRATION, etc.
app.config.from_object(Config)

# Activation de CORS pour permettre les requêtes du frontend
# Sans cette ligne, le navigateur bloquerait les appels API du frontend vers le backend
CORS(app)

# Initialisation de SQLAlchemy avec l'application Flask
# Cela lie la base de données à notre application
db.init_app(app)


# === DECORATEURS DE SÉCURITÉ ===

def token_required(f):
    """
    Décorateur pour protéger les routes qui nécessitent une authentification
    =========================================================================

    Fonctionnement:
    1. Extrait le token JWT de l'en-tête Authorization de la requête
    2. Vérifie que le token est valide et non expiré
    3. Récupère l'utilisateur correspondant dans la base de données
    4. Passe cet utilisateur à la fonction protégée

    Utilisation:
        @app.route('/api/protected')
        @token_required
        def protected_route(current_user):
            # current_user est automatiquement fourni par le décorateur
            return jsonify({'message': f'Hello {current_user.username}'})

    Codes d'erreur possibles:
    - 401: Token manquant, expiré ou invalide
    """
    @wraps(f)  # Préserve le nom et la docstring de la fonction originale
    def decorated(*args, **kwargs):
        # Récupération du token depuis l'en-tête Authorization
        # Format attendu: "Authorization: Bearer <token>"
        token = request.headers.get('Authorization')

        # Vérification 1: Le token est-il présent?
        if not token:
            return jsonify({'message': 'Token manquant'}), 401

        try:
            # Nettoyage du token: suppression du préfixe "Bearer " si présent
            # Ex: "Bearer abc123" devient "abc123"
            if token.startswith('Bearer '):
                token = token[7:]  # Enlève les 7 premiers caractères ("Bearer ")

            # Décodage du token JWT avec la clé secrète
            # jwt.decode() vérifie automatiquement:
            # - La signature (le token n'a pas été modifié)
            # - L'expiration (le token n'est pas expiré)
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])

            # Récupération de l'utilisateur depuis la base de données
            # data['user_id'] contient l'ID de l'utilisateur qui était dans le token
            current_user = User.query.get(data['user_id'])

            # Vérification 2: L'utilisateur existe-t-il encore?
            # (Il pourrait avoir été supprimé après la création du token)
            if not current_user:
                return jsonify({'message': 'Utilisateur non trouvé'}), 401

        except jwt.ExpiredSignatureError:
            # Le token a expiré (plus de 24h dans notre config)
            return jsonify({'message': 'Token expiré'}), 401
        except jwt.InvalidTokenError:
            # Le token est invalide (mauvaise signature, format incorrect, etc.)
            return jsonify({'message': 'Token invalide'}), 401

        # Si tout est OK, on appelle la fonction originale en lui passant current_user
        # current_user devient le premier paramètre de la fonction décorée
        return f(current_user, *args, **kwargs)

    return decorated


def admin_required(f):
    """
    Décorateur pour protéger les routes réservées aux administrateurs
    ==================================================================

    Ce décorateur s'utilise TOUJOURS avec @token_required:
        @app.route('/api/admin/something')
        @token_required       # Vérifie d'abord l'authentification
        @admin_required       # Puis vérifie les droits admin
        def admin_route(current_user):
            ...

    Fonctionnement:
    1. Suppose que current_user est déjà fourni par @token_required
    2. Vérifie que current_user.is_admin est True
    3. Si oui, appelle la fonction, sinon retourne 403 Forbidden

    Code d'erreur:
    - 403: L'utilisateur est connecté mais n'est pas admin
    """
    @wraps(f)
    def decorated(current_user, *args, **kwargs):
        # Vérification: L'utilisateur a-t-il les droits admin?
        if not current_user.is_admin:
            # 403 Forbidden: L'utilisateur est authentifié mais n'a pas les droits
            return jsonify({'message': 'Accès refusé - droits administrateur requis'}), 403

        # Si l'utilisateur est admin, on appelle la fonction normalement
        return f(current_user, *args, **kwargs)
    return decorated


# ========================================
# ROUTES D'AUTHENTIFICATION
# ========================================

@app.route('/api/register', methods=['POST'])
def register():
    """
    Route d'inscription - Crée un nouveau compte utilisateur
    =========================================================

    Méthode: POST
    URL: /api/register
    Accès: Public (pas de token requis)

    Corps de la requête (JSON):
    {
        "username": "john_doe",
        "email": "john@example.com",
        "password": "motdepasse123",
        "is_admin": false  // Optionnel, défaut = false
    }

    Réponses possibles:
    - 201 Created: Utilisateur créé avec succès
    - 400 Bad Request: Données manquantes
    - 409 Conflict: Username ou email déjà utilisé

    Processus:
    1. Récupère les données JSON envoyées par le frontend
    2. Vérifie que tous les champs obligatoires sont présents
    3. Vérifie que username et email sont uniques
    4. Crée l'utilisateur avec mot de passe hashé
    5. Sauvegarde dans la base de données
    6. Retourne les infos de l'utilisateur créé
    """
    # Récupération des données JSON envoyées dans le corps de la requête
    data = request.get_json()

    # Validation: Vérifier que toutes les données obligatoires sont présentes
    # 'not data' vérifie si data est None ou vide
    # Les autres conditions vérifient les champs spécifiques
    if not data or not data.get('username') or not data.get('email') or not data.get('password'):
        # 400 Bad Request: La requête est mal formée
        return jsonify({'message': 'Données incomplètes'}), 400

    # Vérification 1: Le username est-il déjà utilisé?
    # User.query.filter_by() cherche dans la base de données
    # .first() retourne le premier résultat ou None
    if User.query.filter_by(username=data['username']).first():
        # 409 Conflict: Le username existe déjà
        return jsonify({'message': 'Nom d\'utilisateur déjà existant'}), 409

    # Vérification 2: L'email est-il déjà utilisé?
    if User.query.filter_by(email=data['email']).first():
        # 409 Conflict: L'email existe déjà
        return jsonify({'message': 'Email déjà existant'}), 409

    # Création du nouvel utilisateur
    # On crée une instance de la classe User (définie dans models.py)
    user = User(
        username=data['username'],
        email=data['email'],
        # is_admin: Utilise la valeur fournie ou False par défaut
        # data.get('is_admin', False) retourne False si 'is_admin' n'est pas dans data
        is_admin=data.get('is_admin', False)
    )

    # Hashage et enregistrement du mot de passe de manière sécurisée
    # set_password() est une méthode définie dans User (models.py)
    # Elle utilise generate_password_hash() pour sécuriser le mot de passe
    user.set_password(data['password'])

    # Ajout de l'utilisateur à la session de base de données
    # À ce stade, l'utilisateur est en mémoire mais pas encore dans la DB
    db.session.add(user)

    # Commit: Sauvegarde définitive dans la base de données
    # C'est seulement à ce moment que l'utilisateur est vraiment créé
    # Un ID unique lui est automatiquement attribué
    db.session.commit()

    # Réponse de succès avec les données de l'utilisateur créé
    # 201 Created: La ressource a été créée avec succès
    return jsonify({
        'message': 'Utilisateur créé avec succès',
        'user': user.to_dict()  # Convertit l'objet User en dictionnaire JSON
    }), 201


@app.route('/api/login', methods=['POST'])
def login():
    """
    Route de connexion - Authentifie un utilisateur et retourne un token JWT
    =========================================================================

    Méthode: POST
    URL: /api/login
    Accès: Public

    Corps de la requête (JSON):
    {
        "username": "john_doe",
        "password": "motdepasse123"
    }

    Réponses possibles:
    - 200 OK: Connexion réussie, token JWT retourné
    - 400 Bad Request: Données manquantes
    - 401 Unauthorized: Identifiants incorrects

    Processus:
    1. Récupère username et password
    2. Cherche l'utilisateur dans la base de données
    3. Vérifie le mot de passe
    4. Crée un token JWT contenant l'ID de l'utilisateur et une date d'expiration
    5. Retourne le token au frontend pour les futures requêtes authentifiées
    """
    # Récupération des données de connexion
    data = request.get_json()

    # Validation des données
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'message': 'Données incomplètes'}), 400

    # Recherche de l'utilisateur dans la base de données par username
    user = User.query.filter_by(username=data['username']).first()

    # Vérification des identifiants:
    # 1. L'utilisateur existe-t-il? (user est None si non trouvé)
    # 2. Le mot de passe est-il correct? (check_password compare avec le hash)
    if not user or not user.check_password(data['password']):
        # 401 Unauthorized: Identifiants incorrects
        # Note: On ne dit pas si c'est le username ou le password qui est faux (sécurité)
        return jsonify({'message': 'Identifiants incorrects'}), 401

    # Création du token JWT (JSON Web Token)
    # Un JWT contient:
    # - Un payload (données encodées): ici user_id et expiration
    # - Une signature (pour vérifier qu'il n'a pas été modifié)
    token = jwt.encode({
        'user_id': user.id,  # ID de l'utilisateur (pour savoir qui est connecté)
        # Date d'expiration = maintenant + 24 heures (défini dans config.py)
        'exp': datetime.utcnow() + app.config['JWT_EXPIRATION_DELTA']
    }, app.config['SECRET_KEY'],  # Clé secrète pour signer le token
       algorithm='HS256')  # Algorithme de hashage utilisé

    # Réponse de succès avec le token et les infos utilisateur
    # Le frontend va stocker ce token et l'envoyer dans toutes les futures requêtes
    return jsonify({
        'message': 'Connexion réussie',
        'token': token,  # Token à utiliser pour les requêtes authentifiées
        'user': user.to_dict()  # Informations de l'utilisateur connecté
    }), 200


@app.route('/api/me', methods=['GET'])
@token_required  # Cette route nécessite un token JWT valide
def get_current_user(current_user):
    """
    Route pour récupérer les informations de l'utilisateur connecté
    ================================================================

    Méthode: GET
    URL: /api/me
    Accès: Authentifié (token requis)
    En-tête requis: Authorization: Bearer <token>

    Réponse:
    - 200 OK: Retourne les infos de l'utilisateur
    - 401 Unauthorized: Token manquant/invalide/expiré

    Utilité:
    - Vérifier que le token est toujours valide
    - Récupérer les infos à jour de l'utilisateur connecté
    - Utilisé au chargement de l'application pour restaurer la session
    """
    # current_user est fourni automatiquement par le décorateur @token_required
    # Pas besoin de le chercher dans la DB, c'est déjà fait!
    return jsonify({'user': current_user.to_dict()}), 200


# ========================================
# ROUTES D'ADMINISTRATION
# ========================================

@app.route('/api/admin/users', methods=['GET'])
@token_required  # Vérifie que l'utilisateur est connecté
@admin_required  # Vérifie que l'utilisateur est admin
def get_all_users(current_user):
    """
    Route admin - Liste tous les utilisateurs
    ==========================================

    Méthode: GET
    URL: /api/admin/users
    Accès: Admin uniquement

    Réponse:
    - 200 OK: Liste de tous les utilisateurs
    - 401 Unauthorized: Token invalide
    - 403 Forbidden: Utilisateur non-admin

    Utilité: Panel d'administration pour voir tous les comptes
    """
    # Récupération de TOUS les utilisateurs de la base de données
    # User.query.all() retourne une liste de tous les objets User
    users = User.query.all()

    # Conversion de chaque utilisateur en dictionnaire et renvoi
    # [user.to_dict() for user in users] est une list comprehension
    # Équivalent à:
    # result = []
    # for user in users:
    #     result.append(user.to_dict())
    return jsonify({
        'users': [user.to_dict() for user in users]
    }), 200


@app.route('/api/admin/users/<int:user_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_user(current_user, user_id):
    """
    Route admin - Supprime un utilisateur
    ======================================

    Méthode: DELETE
    URL: /api/admin/users/<user_id>
    Accès: Admin uniquement

    Paramètre d'URL:
    - user_id: ID de l'utilisateur à supprimer

    Réponses:
    - 200 OK: Utilisateur supprimé
    - 400 Bad Request: Tentative de supprimer son propre compte
    - 404 Not Found: Utilisateur non trouvé
    - 401/403: Problèmes d'authentification/autorisation

    Sécurité: Un admin ne peut pas supprimer son propre compte
    """
    # Protection: Un admin ne peut pas se supprimer lui-même
    # Cela évite qu'il n'y ait plus d'admin du tout!
    if current_user.id == user_id:
        return jsonify({'message': 'Vous ne pouvez pas supprimer votre propre compte'}), 400

    # Recherche de l'utilisateur à supprimer
    # User.query.get() cherche par clé primaire (ID)
    user = User.query.get(user_id)

    # Vérification: L'utilisateur existe-t-il?
    if not user:
        return jsonify({'message': 'Utilisateur non trouvé'}), 404

    # Suppression de l'utilisateur
    # Grâce à cascade='all, delete-orphan' dans models.py,
    # tous les posts, comments et likes de cet utilisateur seront aussi supprimés
    db.session.delete(user)
    db.session.commit()  # Sauvegarde la suppression dans la DB

    return jsonify({'message': 'Utilisateur supprimé avec succès'}), 200


@app.route('/api/admin/users/<int:user_id>', methods=['PUT'])
@token_required
@admin_required
def update_user(current_user, user_id):
    """
    Route admin - Modifie un utilisateur
    =====================================

    Méthode: PUT
    URL: /api/admin/users/<user_id>
    Accès: Admin uniquement

    Paramètre d'URL:
    - user_id: ID de l'utilisateur à modifier

    Corps de la requête (JSON, tous optionnels):
    {
        "username": "nouveau_nom",
        "email": "nouvel_email@example.com",
        "is_admin": true,
        "password": "nouveau_mdp"
    }

    Réponses:
    - 200 OK: Utilisateur mis à jour
    - 404 Not Found: Utilisateur non trouvé
    - 409 Conflict: Username ou email déjà utilisé
    - 400 Bad Request: Tentative de modifier ses propres droits admin

    Sécurité: Un admin ne peut pas retirer ses propres droits admin
    """
    # Recherche de l'utilisateur à modifier
    user = User.query.get(user_id)
    if not user:
        return jsonify({'message': 'Utilisateur non trouvé'}), 404

    # Récupération des nouvelles données
    data = request.get_json()

    # Modification du username si fourni
    if 'username' in data:
        # Vérifier que le nouveau username n'est pas déjà pris par quelqu'un d'autre
        existing = User.query.filter_by(username=data['username']).first()
        # existing.id != user_id: On peut garder le même username qu'avant
        if existing and existing.id != user_id:
            return jsonify({'message': 'Nom d\'utilisateur déjà existant'}), 409
        user.username = data['username']

    # Modification de l'email si fourni
    if 'email' in data:
        # Même vérification que pour username
        existing = User.query.filter_by(email=data['email']).first()
        if existing and existing.id != user_id:
            return jsonify({'message': 'Email déjà existant'}), 409
        user.email = data['email']

    # Modification des droits admin si fourni
    if 'is_admin' in data:
        # Protection: Un admin ne peut pas retirer ses propres droits
        # Sinon il pourrait se bloquer lui-même!
        if current_user.id == user_id:
            return jsonify({'message': 'Vous ne pouvez pas modifier vos propres droits admin'}), 400
        user.is_admin = data['is_admin']

    # Modification du mot de passe si fourni et non vide
    if 'password' in data and data['password']:
        user.set_password(data['password'])  # Hash le nouveau mot de passe

    # Sauvegarde de toutes les modifications
    db.session.commit()

    return jsonify({
        'message': 'Utilisateur mis à jour avec succès',
        'user': user.to_dict()
    }), 200


# ========================================
# ROUTES POUR LES POSTS
# ========================================

@app.route('/api/posts', methods=['GET'])
def get_posts():
    """
    Route publique - Liste tous les posts avec pagination
    ======================================================

    Méthode: GET
    URL: /api/posts?page=1&per_page=10
    Accès: Public (pas de token requis)

    Paramètres de requête (query params):
    - page: Numéro de la page (défaut: 1)
    - per_page: Nombre de posts par page (défaut: 10)

    Réponse:
    - 200 OK: Liste des posts de la page demandée

    Exemple d'URL: /api/posts?page=2&per_page=20
    Cela retournera les posts 21 à 40

    Utilité: Afficher le forum avec pagination pour ne pas tout charger d'un coup
    """
    # Récupération des paramètres de pagination depuis l'URL
    # request.args.get('page', 1, type=int) signifie:
    # - Cherche le paramètre 'page' dans l'URL
    # - Si non trouvé, utilise 1 par défaut
    # - Convertit en type int (entier)
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)

    # Construction de la requête de base
    # Post.query.order_by(Post.created_at.desc()): Trie par date décroissante (plus récent en premier)
    posts_query = Post.query.order_by(Post.created_at.desc())

    # Calcul du nombre total de posts
    # count() retourne le nombre total de posts dans la DB
    total = posts_query.count()

    # Application de la pagination
    # .offset((page - 1) * per_page): Saute les posts des pages précédentes
    #   Ex: page 2, per_page 10 → offset(10) → saute les 10 premiers
    # .limit(per_page): Ne prend que 'per_page' posts
    #   Ex: limit(10) → prend 10 posts maximum
    posts = posts_query.offset((page - 1) * per_page).limit(per_page).all()

    # Réponse avec les posts et les métadonnées de pagination
    return jsonify({
        'posts': [post.to_dict(include_author=True, include_stats=True) for post in posts],
        'total': total,  # Nombre total de posts
        'page': page,  # Page actuelle
        'per_page': per_page,  # Posts par page
        # Calcul du nombre total de pages
        # (total + per_page - 1) // per_page est une astuce pour arrondir vers le haut
        # Ex: 25 posts, 10 par page → (25+10-1)//10 = 3 pages
        'total_pages': (total + per_page - 1) // per_page
    }), 200


@app.route('/api/posts/<int:post_id>', methods=['GET'])
def get_post(post_id):
    """
    Route publique - Récupère un post spécifique par son ID
    ========================================================

    Méthode: GET
    URL: /api/posts/<post_id>
    Accès: Public

    Paramètre d'URL:
    - post_id: ID du post à récupérer

    Réponses:
    - 200 OK: Post trouvé et retourné
    - 404 Not Found: Post non trouvé

    Utilité: Afficher un post en détail avec ses commentaires
    """
    # Recherche du post par ID
    post = Post.query.get(post_id)

    # Vérification: Le post existe-t-il?
    if not post:
        return jsonify({'message': 'Post non trouvé'}), 404

    # Retourne le post avec toutes ses informations
    return jsonify({'post': post.to_dict(include_author=True, include_stats=True)}), 200


@app.route('/api/posts', methods=['POST'])
@token_required
def create_post(current_user):
    """
    Route protégée - Crée un nouveau post
    ======================================

    Méthode: POST
    URL: /api/posts
    Accès: Authentifié

    Corps de la requête (JSON):
    {
        "title": "Titre du post",
        "content": "Contenu du post..."
    }

    Réponses:
    - 201 Created: Post créé avec succès
    - 400 Bad Request: Données manquantes
    - 401 Unauthorized: Token invalide

    Processus:
    1. Vérifie que title et content sont fournis
    2. Crée le post lié à l'utilisateur connecté (current_user)
    3. Sauvegarde dans la DB
    4. Retourne le post créé avec son ID
    """
    # Récupération des données du nouveau post
    data = request.get_json()

    # Validation: Titre et contenu obligatoires
    if not data or not data.get('title') or not data.get('content'):
        return jsonify({'message': 'Titre et contenu requis'}), 400

    # Création du nouveau post
    # user_id = current_user.id lie automatiquement le post à l'auteur
    post = Post(
        title=data['title'],
        content=data['content'],
        user_id=current_user.id  # L'auteur est l'utilisateur connecté
    )

    # Sauvegarde dans la base de données
    db.session.add(post)
    db.session.commit()

    # 201 Created: La ressource a été créée avec succès
    return jsonify({
        'message': 'Post créé avec succès',
        'post': post.to_dict(include_author=True, include_stats=True)
    }), 201


@app.route('/api/posts/<int:post_id>', methods=['PUT'])
@token_required
def update_post(current_user, post_id):
    """
    Route protégée - Modifie un post existant
    ==========================================

    Méthode: PUT
    URL: /api/posts/<post_id>
    Accès: Authentifié (propriétaire du post OU admin)

    Paramètre d'URL:
    - post_id: ID du post à modifier

    Corps de la requête (JSON, tous optionnels):
    {
        "title": "Nouveau titre",
        "content": "Nouveau contenu"
    }

    Réponses:
    - 200 OK: Post modifié
    - 404 Not Found: Post non trouvé
    - 403 Forbidden: Pas les droits pour modifier ce post
    - 401 Unauthorized: Token invalide

    Sécurité: Seul l'auteur du post ou un admin peut le modifier
    """
    # Recherche du post à modifier
    post = Post.query.get(post_id)
    if not post:
        return jsonify({'message': 'Post non trouvé'}), 404

    # Vérification des droits: Est-ce l'auteur OU un admin?
    # post.user_id != current_user.id: Pas l'auteur
    # and not current_user.is_admin: ET pas admin
    if post.user_id != current_user.id and not current_user.is_admin:
        return jsonify({'message': 'Accès refusé'}), 403

    # Récupération des nouvelles données
    data = request.get_json()

    # Modification du titre si fourni
    if 'title' in data:
        post.title = data['title']

    # Modification du contenu si fourni
    if 'content' in data:
        post.content = data['content']

    # Mise à jour de la date de modification
    # updated_at s'actualise automatiquement grâce à onupdate dans models.py
    # Mais on peut aussi le forcer manuellement
    post.updated_at = datetime.utcnow()

    # Sauvegarde des modifications
    db.session.commit()

    return jsonify({
        'message': 'Post mis à jour avec succès',
        'post': post.to_dict(include_author=True, include_stats=True)
    }), 200


@app.route('/api/posts/<int:post_id>', methods=['DELETE'])
@token_required
def delete_post(current_user, post_id):
    """
    Route protégée - Supprime un post
    ==================================

    Méthode: DELETE
    URL: /api/posts/<post_id>
    Accès: Authentifié (propriétaire du post OU admin)

    Paramètre d'URL:
    - post_id: ID du post à supprimer

    Réponses:
    - 200 OK: Post supprimé
    - 404 Not Found: Post non trouvé
    - 403 Forbidden: Pas les droits pour supprimer ce post

    Sécurité: Seul l'auteur du post ou un admin peut le supprimer
    Cascade: Tous les commentaires et likes du post sont aussi supprimés
    """
    # Recherche du post à supprimer
    post = Post.query.get(post_id)
    if not post:
        return jsonify({'message': 'Post non trouvé'}), 404

    # Vérification des droits
    if post.user_id != current_user.id and not current_user.is_admin:
        return jsonify({'message': 'Accès refusé'}), 403

    # Suppression du post
    # Grâce à cascade dans models.py, les comments et likes sont aussi supprimés
    db.session.delete(post)
    db.session.commit()

    return jsonify({'message': 'Post supprimé avec succès'}), 200


# ========================================
# ROUTES POUR LES COMMENTAIRES
# ========================================

@app.route('/api/posts/<int:post_id>/comments', methods=['GET'])
def get_comments(post_id):
    """
    Route publique - Liste tous les commentaires d'un post
    =======================================================

    Méthode: GET
    URL: /api/posts/<post_id>/comments
    Accès: Public

    Paramètre d'URL:
    - post_id: ID du post dont on veut les commentaires

    Réponses:
    - 200 OK: Liste des commentaires
    - 404 Not Found: Post non trouvé

    Tri: Les commentaires sont triés par date croissante (plus ancien en premier)
    """
    # Vérification que le post existe
    post = Post.query.get(post_id)
    if not post:
        return jsonify({'message': 'Post non trouvé'}), 404

    # Récupération de tous les commentaires du post
    # filter_by(post_id=post_id): Ne prend que les commentaires de ce post
    # order_by(Comment.created_at.asc()): Trie par date croissante (ASC = ascending)
    comments = Comment.query.filter_by(post_id=post_id).order_by(Comment.created_at.asc()).all()

    return jsonify({
        'comments': [comment.to_dict(include_author=True, include_stats=True) for comment in comments]
    }), 200


@app.route('/api/posts/<int:post_id>/comments', methods=['POST'])
@token_required
def create_comment(current_user, post_id):
    """
    Route protégée - Crée un commentaire sur un post
    =================================================

    Méthode: POST
    URL: /api/posts/<post_id>/comments
    Accès: Authentifié

    Paramètre d'URL:
    - post_id: ID du post à commenter

    Corps de la requête (JSON):
    {
        "content": "Mon commentaire..."
    }

    Réponses:
    - 201 Created: Commentaire créé
    - 400 Bad Request: Contenu manquant
    - 404 Not Found: Post non trouvé
    """
    # Vérification que le post existe
    post = Post.query.get(post_id)
    if not post:
        return jsonify({'message': 'Post non trouvé'}), 404

    # Récupération du contenu du commentaire
    data = request.get_json()
    if not data or not data.get('content'):
        return jsonify({'message': 'Contenu requis'}), 400

    # Création du commentaire
    comment = Comment(
        content=data['content'],
        user_id=current_user.id,  # Auteur = utilisateur connecté
        post_id=post_id  # Lié au post spécifié
    )

    # Sauvegarde dans la DB
    db.session.add(comment)
    db.session.commit()

    return jsonify({
        'message': 'Commentaire créé avec succès',
        'comment': comment.to_dict(include_author=True, include_stats=True)
    }), 201


@app.route('/api/comments/<int:comment_id>', methods=['PUT'])
@token_required
def update_comment(current_user, comment_id):
    """
    Route protégée - Modifie un commentaire
    ========================================

    Méthode: PUT
    URL: /api/comments/<comment_id>
    Accès: Authentifié (propriétaire OU admin)

    Sécurité: Seul l'auteur du commentaire ou un admin peut le modifier
    """
    # Recherche du commentaire
    comment = Comment.query.get(comment_id)
    if not comment:
        return jsonify({'message': 'Commentaire non trouvé'}), 404

    # Vérification des droits
    if comment.user_id != current_user.id and not current_user.is_admin:
        return jsonify({'message': 'Accès refusé'}), 403

    # Récupération du nouveau contenu
    data = request.get_json()
    if not data or not data.get('content'):
        return jsonify({'message': 'Contenu requis'}), 400

    # Modification
    comment.content = data['content']
    comment.updated_at = datetime.utcnow()
    db.session.commit()

    return jsonify({
        'message': 'Commentaire mis à jour avec succès',
        'comment': comment.to_dict(include_author=True, include_stats=True)
    }), 200


@app.route('/api/comments/<int:comment_id>', methods=['DELETE'])
@token_required
def delete_comment(current_user, comment_id):
    """
    Route protégée - Supprime un commentaire
    =========================================

    Méthode: DELETE
    URL: /api/comments/<comment_id>
    Accès: Authentifié (propriétaire OU admin)

    Sécurité: Seul l'auteur du commentaire ou un admin peut le supprimer
    Cascade: Tous les likes du commentaire sont aussi supprimés
    """
    # Recherche du commentaire
    comment = Comment.query.get(comment_id)
    if not comment:
        return jsonify({'message': 'Commentaire non trouvé'}), 404

    # Vérification des droits
    if comment.user_id != current_user.id and not current_user.is_admin:
        return jsonify({'message': 'Accès refusé'}), 403

    # Suppression
    db.session.delete(comment)
    db.session.commit()

    return jsonify({'message': 'Commentaire supprimé avec succès'}), 200


# ========================================
# ROUTES POUR LES LIKES
# ========================================

@app.route('/api/posts/<int:post_id>/like', methods=['POST'])
@token_required
def toggle_post_like(current_user, post_id):
    """
    Route protégée - Toggle like sur un post (like/unlike)
    =======================================================

    Méthode: POST
    URL: /api/posts/<post_id>/like
    Accès: Authentifié

    Comportement:
    - Si l'utilisateur n'a pas encore liké: Ajoute un like
    - Si l'utilisateur a déjà liké: Retire le like

    Réponses:
    - 200 OK: Like retiré
    - 201 Created: Like ajouté
    - 404 Not Found: Post non trouvé

    Utilité: Bouton "J'aime" qui change d'état à chaque clic
    """
    # Vérification que le post existe
    post = Post.query.get(post_id)
    if not post:
        return jsonify({'message': 'Post non trouvé'}), 404

    # Vérifier si l'utilisateur a déjà liké ce post
    # filter_by avec comment_id=None pour ne chercher que les likes de post (pas de commentaire)
    existing_like = Like.query.filter_by(user_id=current_user.id, post_id=post_id, comment_id=None).first()

    if existing_like:
        # CAS 1: L'utilisateur a déjà liké → UNLIKE (retirer le like)
        db.session.delete(existing_like)
        db.session.commit()
        return jsonify({
            'message': 'Like retiré',
            'liked': False,  # Pour que le frontend sache qu'il faut désactiver le bouton
            # Recalcul du nombre de likes après suppression
            'likes_count': len([like for like in post.likes if like.comment_id is None])
        }), 200
    else:
        # CAS 2: L'utilisateur n'a pas encore liké → LIKE (ajouter un like)
        like = Like(user_id=current_user.id, post_id=post_id)
        db.session.add(like)
        db.session.commit()
        return jsonify({
            'message': 'Post liké',
            'liked': True,  # Pour que le frontend sache qu'il faut activer le bouton
            # Recalcul du nombre de likes après ajout
            'likes_count': len([like for like in post.likes if like.comment_id is None])
        }), 201


@app.route('/api/comments/<int:comment_id>/like', methods=['POST'])
@token_required
def toggle_comment_like(current_user, comment_id):
    """
    Route protégée - Toggle like sur un commentaire
    ================================================

    Même fonctionnement que toggle_post_like mais pour les commentaires
    """
    # Vérification que le commentaire existe
    comment = Comment.query.get(comment_id)
    if not comment:
        return jsonify({'message': 'Commentaire non trouvé'}), 404

    # Vérifier si déjà liké
    # Ici post_id=None car c'est un like sur un commentaire
    existing_like = Like.query.filter_by(user_id=current_user.id, comment_id=comment_id, post_id=None).first()

    if existing_like:
        # Unlike
        db.session.delete(existing_like)
        db.session.commit()
        return jsonify({
            'message': 'Like retiré',
            'liked': False,
            'likes_count': len([like for like in comment.likes if like.post_id is None])
        }), 200
    else:
        # Like
        like = Like(user_id=current_user.id, comment_id=comment_id)
        db.session.add(like)
        db.session.commit()
        return jsonify({
            'message': 'Commentaire liké',
            'liked': True,
            'likes_count': len([like for like in comment.likes if like.post_id is None])
        }), 201


@app.route('/api/posts/<int:post_id>/likes', methods=['GET'])
def get_post_likes(post_id):
    """
    Route publique - Liste tous les likes d'un post avec les utilisateurs
    ======================================================================

    Méthode: GET
    URL: /api/posts/<post_id>/likes
    Accès: Public

    Utilité: Afficher "Aimé par John, Sarah et 5 autres personnes"
    """
    # Vérification que le post existe
    post = Post.query.get(post_id)
    if not post:
        return jsonify({'message': 'Post non trouvé'}), 404

    # Récupération de tous les likes du post
    likes = Like.query.filter_by(post_id=post_id, comment_id=None).all()

    # Pour chaque like, on inclut les infos de l'utilisateur qui a liké
    return jsonify({
        'likes': [{
            'id': like.id,
            'user': {
                'id': like.user.id,
                'username': like.user.username
            },
            'created_at': like.created_at.isoformat()
        } for like in likes],
        'total': len(likes)
    }), 200


@app.route('/api/comments/<int:comment_id>/likes', methods=['GET'])
def get_comment_likes(comment_id):
    """
    Route publique - Liste tous les likes d'un commentaire
    =======================================================

    Même fonctionnement que get_post_likes mais pour les commentaires
    """
    # Vérification que le commentaire existe
    comment = Comment.query.get(comment_id)
    if not comment:
        return jsonify({'message': 'Commentaire non trouvé'}), 404

    # Récupération des likes
    likes = Like.query.filter_by(comment_id=comment_id, post_id=None).all()

    return jsonify({
        'likes': [{
            'id': like.id,
            'user': {
                'id': like.user.id,
                'username': like.user.username
            },
            'created_at': like.created_at.isoformat()
        } for like in likes],
        'total': len(likes)
    }), 200


@app.route('/api/posts/<int:post_id>/user-liked', methods=['GET'])
@token_required
def check_user_liked_post(current_user, post_id):
    """
    Route protégée - Vérifie si l'utilisateur actuel a liké un post
    ================================================================

    Utilité: Savoir si le bouton "J'aime" doit être affiché comme actif ou inactif
    """
    # Vérification que le post existe
    post = Post.query.get(post_id)
    if not post:
        return jsonify({'message': 'Post non trouvé'}), 404

    # Chercher si un like existe pour cet utilisateur sur ce post
    # .first() is not None: Convertit en booléen (True si trouvé, False sinon)
    liked = Like.query.filter_by(user_id=current_user.id, post_id=post_id, comment_id=None).first() is not None

    return jsonify({'liked': liked}), 200


@app.route('/api/comments/<int:comment_id>/user-liked', methods=['GET'])
@token_required
def check_user_liked_comment(current_user, comment_id):
    """
    Route protégée - Vérifie si l'utilisateur actuel a liké un commentaire
    =======================================================================

    Même fonctionnement que check_user_liked_post mais pour les commentaires
    """
    # Vérification que le commentaire existe
    comment = Comment.query.get(comment_id)
    if not comment:
        return jsonify({'message': 'Commentaire non trouvé'}), 404

    # Vérifier si l'utilisateur a liké ce commentaire
    liked = Like.query.filter_by(user_id=current_user.id, comment_id=comment_id, post_id=None).first() is not None

    return jsonify({'liked': liked}), 200


# ========================================
# ROUTES POUR LE PROFIL UTILISATEUR
# ========================================

@app.route('/api/users/<int:user_id>/profile', methods=['GET'])
def get_user_profile(user_id):
    """
    Route publique - Récupère le profil public d'un utilisateur
    ============================================================

    Méthode: GET
    URL: /api/users/<user_id>/profile
    Accès: Public

    Retourne:
    - Informations de l'utilisateur
    - Ses 10 posts les plus récents
    - Statistiques (nombre de posts, comments, likes)

    Utilité: Page de profil public d'un utilisateur
    """
    # Recherche de l'utilisateur
    user = User.query.get(user_id)
    if not user:
        return jsonify({'message': 'Utilisateur non trouvé'}), 404

    # Récupération des 10 posts les plus récents de l'utilisateur
    # limit(10): Ne prend que les 10 premiers résultats
    posts = Post.query.filter_by(user_id=user_id).order_by(Post.created_at.desc()).limit(10).all()

    # Calcul des statistiques de l'utilisateur
    # count(): Compte le nombre total sans tout charger en mémoire (plus efficace)
    total_posts = Post.query.filter_by(user_id=user_id).count()
    total_comments = Comment.query.filter_by(user_id=user_id).count()
    total_likes = Like.query.filter_by(user_id=user_id).count()

    return jsonify({
        'user': user.to_dict(),
        'recent_posts': [post.to_dict(include_author=False, include_stats=True) for post in posts],
        'stats': {
            'total_posts': total_posts,
            'total_comments': total_comments,
            'total_likes': total_likes
        }
    }), 200


@app.route('/api/profile', methods=['PUT'])
@token_required
def update_own_profile(current_user):
    """
    Route protégée - Modifie le profil de l'utilisateur connecté
    =============================================================

    Méthode: PUT
    URL: /api/profile
    Accès: Authentifié

    Corps de la requête (JSON, tous optionnels):
    {
        "username": "nouveau_nom",
        "email": "nouvel_email@example.com"
    }

    Réponses:
    - 200 OK: Profil mis à jour
    - 409 Conflict: Username ou email déjà utilisé

    Note: Un utilisateur normal ne peut pas changer ses droits admin ici
    (seul un admin peut le faire via /api/admin/users/<id>)
    """
    # Récupération des nouvelles données
    data = request.get_json()

    # Modification du username si fourni
    if 'username' in data:
        # Vérifier que le nouveau username n'est pas déjà pris
        existing = User.query.filter_by(username=data['username']).first()
        if existing and existing.id != current_user.id:
            return jsonify({'message': 'Nom d\'utilisateur déjà existant'}), 409
        current_user.username = data['username']

    # Modification de l'email si fourni
    if 'email' in data:
        # Vérifier que le nouvel email n'est pas déjà pris
        existing = User.query.filter_by(email=data['email']).first()
        if existing and existing.id != current_user.id:
            return jsonify({'message': 'Email déjà existant'}), 409
        current_user.email = data['email']

    # Sauvegarde des modifications
    db.session.commit()

    return jsonify({
        'message': 'Profil mis à jour avec succès',
        'user': current_user.to_dict()
    }), 200


@app.route('/api/profile/password', methods=['PUT'])
@token_required
def update_password(current_user):
    """
    Route protégée - Change le mot de passe de l'utilisateur connecté
    ==================================================================

    Méthode: PUT
    URL: /api/profile/password
    Accès: Authentifié

    Corps de la requête (JSON):
    {
        "current_password": "ancien_mdp",
        "new_password": "nouveau_mdp"
    }

    Réponses:
    - 200 OK: Mot de passe changé
    - 400 Bad Request: Nouveau mot de passe trop court
    - 401 Unauthorized: Ancien mot de passe incorrect

    Sécurité:
    - Demande l'ancien mot de passe pour confirmation
    - Nouveau mot de passe doit faire au moins 6 caractères
    """
    # Récupération des données
    data = request.get_json()

    # Validation: Les deux mots de passe sont-ils fournis?
    if not data or not data.get('current_password') or not data.get('new_password'):
        return jsonify({'message': 'Mot de passe actuel et nouveau mot de passe requis'}), 400

    # Vérification de sécurité: L'ancien mot de passe est-il correct?
    if not current_user.check_password(data['current_password']):
        return jsonify({'message': 'Mot de passe actuel incorrect'}), 401

    # Validation du nouveau mot de passe: Au moins 6 caractères
    if len(data['new_password']) < 6:
        return jsonify({'message': 'Le nouveau mot de passe doit contenir au moins 6 caractères'}), 400

    # Mise à jour du mot de passe (hashé automatiquement par set_password)
    current_user.set_password(data['new_password'])
    db.session.commit()

    return jsonify({'message': 'Mot de passe mis à jour avec succès'}), 200


# ========================================
# ROUTES DE RECHERCHE
# ========================================

@app.route('/api/posts/search', methods=['GET'])
def search_posts():
    """
    Route publique - Recherche des posts par titre ou contenu
    ==========================================================

    Méthode: GET
    URL: /api/posts/search?q=mot_recherche
    Accès: Public

    Paramètre de requête:
    - q: Terme de recherche (minimum 2 caractères)

    Réponse:
    - 200 OK: Liste des posts correspondants (max 50)
    - 400 Bad Request: Terme de recherche trop court

    Fonctionnement:
    - Recherche dans le titre ET le contenu des posts
    - Insensible à la casse (majuscules/minuscules)
    - Recherche partielle (ex: "react" trouve "React.js" et "réaction")
    """
    # Récupération du terme de recherche depuis l'URL
    # Ex: /api/posts/search?q=python → query = "python"
    query = request.args.get('q', '')

    # Validation: Le terme de recherche doit faire au moins 2 caractères
    if not query or len(query) < 2:
        return jsonify({'message': 'La recherche doit contenir au moins 2 caractères'}), 400

    # Construction du pattern de recherche SQL
    # f'%{query}%' signifie: Chercher le mot n'importe où dans le texte
    # Ex: query="python" → pattern="%python%"
    # Cela trouvera: "Python", "python3", "apprendre python", etc.
    search_pattern = f'%{query}%'

    # Requête de recherche dans la base de données
    # db.or_(): Opérateur OU (cherche dans title OU content)
    # .ilike(): Recherche insensible à la casse (i = insensitive)
    # .limit(50): Ne retourne que les 50 premiers résultats (évite surcharge)
    posts = Post.query.filter(
        db.or_(
            Post.title.ilike(search_pattern),    # Cherche dans le titre
            Post.content.ilike(search_pattern)   # OU dans le contenu
        )
    ).order_by(Post.created_at.desc()).limit(50).all()

    return jsonify({
        'posts': [post.to_dict(include_author=True, include_stats=True) for post in posts],
        'total': len(posts),  # Nombre de résultats trouvés
        'query': query        # Terme de recherche utilisé (pour affichage)
    }), 200


# ========================================
# INITIALISATION DE LA BASE DE DONNÉES
# ========================================

@app.before_request
def create_tables():
    """
    Hook exécuté AVANT chaque requête
    ==================================

    Fonctionnement:
    1. Vérifie si les tables ont déjà été créées
    2. Si non, crée toutes les tables de la base de données
    3. Si la DB est vide, crée un compte admin par défaut

    Utilité:
    - Création automatique de la DB au premier lancement
    - Pas besoin de scripts d'initialisation séparés
    - Pratique pour le développement

    Note: En production, on utiliserait plutôt des migrations (ex: Alembic)
    """
    # Vérifier si on a déjà créé les tables
    # hasattr() vérifie si l'objet 'app' a l'attribut 'tables_created'
    # Au premier lancement, cet attribut n'existe pas → on crée les tables
    if not hasattr(app, 'tables_created'):
        # app.app_context(): Contexte nécessaire pour les opérations sur la DB
        with app.app_context():
            # Création de TOUTES les tables définies dans models.py
            # db.create_all() lit les modèles (User, Post, Comment, Like)
            # et crée les tables SQL correspondantes si elles n'existent pas
            db.create_all()

            # Si aucun utilisateur n'existe, créer un admin par défaut
            # Cela permet de se connecter dès le premier lancement
            if User.query.count() == 0:
                admin = User(
                    username='admin',
                    email='admin@example.com',
                    is_admin=True
                )
                # Mot de passe par défaut: admin123
                # IMPORTANT: En production, il faudrait changer ce mot de passe!
                admin.set_password('admin123')
                db.session.add(admin)
                db.session.commit()
                # Message dans la console du serveur
                print('Utilisateur admin créé: admin/admin123')

        # Marquer que les tables ont été créées
        # Cela évite de recréer les tables à chaque requête
        app.tables_created = True


# ========================================
# POINT D'ENTRÉE DE L'APPLICATION
# ========================================

if __name__ == '__main__':
    """
    Point d'entrée principal du serveur Flask
    ==========================================

    Cette partie s'exécute seulement si on lance directement ce fichier:
        python app.py

    Options de lancement:
    - debug=True: Active le mode debug
        * Recharge automatiquement le serveur quand on modifie le code
        * Affiche des messages d'erreur détaillés
        * ATTENTION: Ne JAMAIS utiliser debug=True en production!
    - port=5000: Le serveur écoute sur le port 5000
        * Le frontend React devra appeler http://localhost:5000/api/...
    """
    app.run(debug=True, port=5000)
