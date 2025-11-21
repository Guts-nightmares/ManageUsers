"""
Fichier des modèles de base de données (ORM)
============================================
Ce fichier définit la structure de toutes les tables de la base de données
en utilisant SQLAlchemy (ORM = Object Relational Mapping).

ORM expliqué: Au lieu d'écrire du SQL brut, on définit des classes Python
qui représentent des tables. SQLAlchemy se charge de la conversion.

Tables définies:
- User: Utilisateurs de l'application
- Post: Publications/Articles du forum
- Comment: Commentaires sur les posts
- Like: J'aime sur les posts et commentaires
"""

# Import de SQLAlchemy pour gérer la base de données avec des objets Python
from flask_sqlalchemy import SQLAlchemy
# Import des fonctions de sécurité pour hasher et vérifier les mots de passe
from werkzeug.security import generate_password_hash, check_password_hash
# Import de datetime pour gérer les dates et heures de création/modification
from datetime import datetime

# Initialisation de l'objet SQLAlchemy qui servira à interagir avec la base de données
# Cet objet 'db' sera utilisé dans app.py pour créer les tables et faire des requêtes
db = SQLAlchemy()


class User(db.Model):
    """
    Modèle User - Représente un utilisateur de l'application
    =========================================================
    Cette classe définit la table 'users' dans la base de données.
    Chaque instance de cette classe = 1 ligne dans la table = 1 utilisateur

    Attributs principaux:
    - id: Identifiant unique (clé primaire)
    - username: Nom d'utilisateur (unique)
    - email: Adresse email (unique)
    - password_hash: Mot de passe hashé (sécurisé)
    - is_admin: Indique si l'utilisateur est administrateur
    - created_at: Date de création du compte

    Relations avec autres tables:
    - posts: Liste des posts créés par cet utilisateur
    - comments: Liste des commentaires créés par cet utilisateur
    - likes: Liste des likes donnés par cet utilisateur
    """

    # __tablename__: Nom explicite de la table dans la base de données
    __tablename__ = 'users'

    # === COLONNES DE LA TABLE ===

    # id: Colonne d'identifiant unique pour chaque utilisateur
    # - db.Integer: Type de données = nombre entier
    # - primary_key=True: C'est la clé primaire (identifiant unique, auto-incrémenté)
    id = db.Column(db.Integer, primary_key=True)

    # username: Nom d'utilisateur pour se connecter
    # - db.String(80): Chaîne de caractères de max 80 caractères
    # - unique=True: Deux utilisateurs ne peuvent pas avoir le même username
    # - nullable=False: Ce champ est obligatoire (ne peut pas être vide)
    username = db.Column(db.String(80), unique=True, nullable=False)

    # email: Adresse email de l'utilisateur
    # - db.String(120): Chaîne de max 120 caractères
    # - unique=True: Deux utilisateurs ne peuvent pas avoir le même email
    # - nullable=False: Ce champ est obligatoire
    email = db.Column(db.String(120), unique=True, nullable=False)

    # password_hash: Mot de passe hashé (JAMAIS stocké en clair pour la sécurité!)
    # - db.String(255): Chaîne de max 255 caractères (un hash est long)
    # - nullable=False: Obligatoire (on ne peut pas créer un compte sans mot de passe)
    # Important: On ne stocke JAMAIS le mot de passe en clair, toujours hashé!
    password_hash = db.Column(db.String(255), nullable=False)

    # is_admin: Booléen indiquant si l'utilisateur a les droits administrateur
    # - db.Boolean: Type booléen (True ou False)
    # - default=False: Par défaut, un nouvel utilisateur n'est PAS admin
    is_admin = db.Column(db.Boolean, default=False)

    # created_at: Date et heure de création du compte utilisateur
    # - db.DateTime: Type date + heure
    # - default=datetime.utcnow: Automatiquement rempli avec la date/heure actuelle (UTC)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # === RELATIONS AVEC D'AUTRES TABLES ===

    # Relation One-to-Many: Un utilisateur peut avoir plusieurs posts
    # - 'Post': Nom de la classe liée (modèle Post défini plus bas)
    # - backref='author': Crée un attribut virtuel 'author' sur Post pour accéder à l'utilisateur
    #   Exemple: mon_post.author renvoie l'utilisateur qui a créé ce post
    # - lazy=True: Les posts ne sont chargés que quand on y accède (optimisation mémoire)
    # - cascade='all, delete-orphan': Si on supprime un utilisateur, tous ses posts sont aussi supprimés
    posts = db.relationship('Post', backref='author', lazy=True, cascade='all, delete-orphan')

    # Relation One-to-Many: Un utilisateur peut avoir plusieurs commentaires
    # Même principe que pour posts
    comments = db.relationship('Comment', backref='author', lazy=True, cascade='all, delete-orphan')

    # Relation One-to-Many: Un utilisateur peut avoir plusieurs likes
    # Même principe que pour posts
    likes = db.relationship('Like', backref='user', lazy=True, cascade='all, delete-orphan')

    # === MÉTHODES DE LA CLASSE ===

    def set_password(self, password):
        """
        Hache et enregistre un mot de passe de manière sécurisée

        Paramètre:
            password (str): Mot de passe en clair fourni par l'utilisateur

        Fonctionnement:
        1. Prend le mot de passe en clair (ex: "monMotDePasse123")
        2. Le transforme en hash illisible (ex: "pbkdf2:sha256:260000$...")
        3. Stocke ce hash dans password_hash

        Pourquoi hasher? Pour la sécurité! Si quelqu'un accède à la base de données,
        il ne peut pas lire les mots de passe car ils sont hashés (irréversible).
        """
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """
        Vérifie si le mot de passe fourni correspond au hash enregistré

        Paramètre:
            password (str): Mot de passe en clair à vérifier

        Retour:
            bool: True si le mot de passe est correct, False sinon

        Fonctionnement:
        1. Prend le mot de passe fourni par l'utilisateur lors de la connexion
        2. Le compare au hash stocké dans la base de données
        3. Retourne True si ça correspond, False sinon

        Utilisation typique: Lors du login pour vérifier les identifiants
        """
        return check_password_hash(self.password_hash, password)

    def to_dict(self, include_sensitive=False):
        """
        Convertit l'objet User en dictionnaire Python (pour JSON/API)

        Paramètre:
            include_sensitive (bool): Si True, inclut les données sensibles (password_hash)

        Retour:
            dict: Dictionnaire contenant les données de l'utilisateur

        Pourquoi cette méthode?
        - Les APIs REST renvoient du JSON, pas des objets Python
        - Cette méthode facilite la conversion: user.to_dict() → JSON
        - On peut choisir d'inclure ou non les données sensibles
        """
        # Dictionnaire de base avec les données publiques
        data = {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'is_admin': self.is_admin,
            'created_at': self.created_at.isoformat()  # .isoformat() convertit la date en format texte
        }
        # Si demandé, ajouter les données sensibles (normalement jamais envoyé au frontend!)
        if include_sensitive:
            data['password_hash'] = self.password_hash
        return data

    def __repr__(self):
        """
        Représentation textuelle de l'objet User

        Retour:
            str: Représentation lisible de l'utilisateur

        Utilité: Quand on fait print(user), on voit "<User john>" au lieu de "<User object at 0x...>"
        Très pratique pour le debugging!
        """
        return f'<User {self.username}>'


class Post(db.Model):
    """
    Modèle Post - Représente une publication/article du forum
    ==========================================================
    Cette classe définit la table 'posts' dans la base de données.
    Chaque post est créé par un utilisateur et peut avoir des commentaires et des likes.

    Attributs:
    - id: Identifiant unique du post
    - title: Titre du post
    - content: Contenu/texte du post
    - user_id: ID de l'utilisateur qui a créé ce post (clé étrangère)
    - created_at: Date de création
    - updated_at: Date de dernière modification

    Relations:
    - author: L'utilisateur qui a créé ce post (via user_id)
    - comments: Liste des commentaires sur ce post
    - likes: Liste des likes sur ce post
    """

    # Nom explicite de la table dans la base de données
    __tablename__ = 'posts'

    # === COLONNES DE LA TABLE ===

    # id: Identifiant unique du post (clé primaire auto-incrémentée)
    id = db.Column(db.Integer, primary_key=True)

    # title: Titre du post
    # - db.String(200): Max 200 caractères
    # - nullable=False: Obligatoire (un post doit avoir un titre)
    title = db.Column(db.String(200), nullable=False)

    # content: Contenu complet du post
    # - db.Text: Type texte (pas de limite de longueur contrairement à String)
    # - nullable=False: Obligatoire (un post doit avoir du contenu)
    content = db.Column(db.Text, nullable=False)

    # user_id: Clé étrangère vers la table users
    # - db.Integer: Type entier (pour stocker l'id d'un utilisateur)
    # - db.ForeignKey('users.id'): Référence la colonne 'id' de la table 'users'
    # - nullable=False: Obligatoire (un post doit toujours avoir un auteur)
    # Principe: Cette colonne crée le lien entre Post et User
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    # created_at: Date et heure de création du post
    # - default=datetime.utcnow: Automatiquement rempli à la création
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # updated_at: Date et heure de dernière modification
    # - default=datetime.utcnow: Date initiale = date de création
    # - onupdate=datetime.utcnow: Automatiquement mis à jour quand on modifie le post
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # === RELATIONS AVEC D'AUTRES TABLES ===

    # Relation One-to-Many: Un post peut avoir plusieurs commentaires
    # - 'Comment': Classe liée
    # - backref='post': Permet d'accéder au post depuis un commentaire (comment.post)
    # - cascade='all, delete-orphan': Si on supprime le post, tous ses commentaires sont supprimés
    comments = db.relationship('Comment', backref='post', lazy=True, cascade='all, delete-orphan')

    # Relation One-to-Many: Un post peut avoir plusieurs likes
    # - primaryjoin: Condition spéciale pour ne récupérer que les likes du POST (pas des commentaires)
    # Explication: Un Like peut être sur un post OU un commentaire.
    # On veut seulement les likes où post_id est rempli ET comment_id est NULL
    likes = db.relationship('Like', backref='post', lazy=True, cascade='all, delete-orphan',
                           primaryjoin="and_(Post.id==Like.post_id, Like.comment_id==None)")

    # === MÉTHODES DE LA CLASSE ===

    def to_dict(self, include_author=True, include_stats=True):
        """
        Convertit le post en dictionnaire pour l'API JSON

        Paramètres:
            include_author (bool): Si True, inclut les infos de l'auteur du post
            include_stats (bool): Si True, inclut les statistiques (nombre de likes/comments)

        Retour:
            dict: Dictionnaire avec toutes les données du post

        Utilité: Préparer les données pour les envoyer au frontend en JSON
        """
        # Données de base du post
        data = {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'user_id': self.user_id,
            'created_at': self.created_at.isoformat(),  # Convertit la date en format ISO (texte)
            'updated_at': self.updated_at.isoformat()
        }

        # Si demandé ET que l'auteur existe, ajouter les infos de l'auteur
        if include_author and self.author:
            data['author'] = {
                'id': self.author.id,
                'username': self.author.username
            }

        # Si demandé, calculer et ajouter les statistiques
        if include_stats:
            # Compte le nombre de likes sur ce post (seulement ceux où comment_id est None)
            data['likes_count'] = len([like for like in self.likes if like.comment_id is None])
            # Compte le nombre total de commentaires
            data['comments_count'] = len(self.comments)

        return data

    def __repr__(self):
        """
        Représentation textuelle du post pour le debugging
        Exemple de retour: "<Post 5: Mon super titre>"
        """
        return f'<Post {self.id}: {self.title}>'


class Comment(db.Model):
    """
    Modèle Comment - Représente un commentaire sur un post
    =======================================================
    Cette classe définit la table 'comments' dans la base de données.
    Chaque commentaire est lié à un post et à un utilisateur (auteur).

    Attributs:
    - id: Identifiant unique du commentaire
    - content: Texte du commentaire
    - user_id: ID de l'auteur du commentaire (clé étrangère vers users)
    - post_id: ID du post commenté (clé étrangère vers posts)
    - created_at: Date de création
    - updated_at: Date de dernière modification

    Relations:
    - author: L'utilisateur qui a écrit ce commentaire
    - post: Le post sur lequel ce commentaire a été posté
    - likes: Liste des likes sur ce commentaire
    """

    # Nom de la table dans la base de données
    __tablename__ = 'comments'

    # === COLONNES DE LA TABLE ===

    # id: Identifiant unique du commentaire
    id = db.Column(db.Integer, primary_key=True)

    # content: Texte du commentaire
    # - db.Text: Pas de limite de longueur
    # - nullable=False: Obligatoire (un commentaire vide n'a pas de sens)
    content = db.Column(db.Text, nullable=False)

    # user_id: Clé étrangère vers l'utilisateur qui a écrit le commentaire
    # - db.ForeignKey('users.id'): Référence la table users
    # - nullable=False: Un commentaire doit toujours avoir un auteur
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    # post_id: Clé étrangère vers le post sur lequel le commentaire est posté
    # - db.ForeignKey('posts.id'): Référence la table posts
    # - nullable=False: Un commentaire doit toujours être lié à un post
    post_id = db.Column(db.Integer, db.ForeignKey('posts.id'), nullable=False)

    # created_at: Date et heure de création du commentaire
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # updated_at: Date et heure de dernière modification
    # onupdate: Se met à jour automatiquement quand on modifie le commentaire
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # === RELATIONS AVEC D'AUTRES TABLES ===

    # Relation One-to-Many: Un commentaire peut avoir plusieurs likes
    # primaryjoin: Condition pour ne récupérer que les likes du COMMENTAIRE (post_id doit être None)
    # Explication: Comme un Like peut être sur un post OU un commentaire,
    # on spécifie qu'on veut seulement ceux où comment_id correspond ET post_id est NULL
    likes = db.relationship('Like', backref='comment', lazy=True, cascade='all, delete-orphan',
                           primaryjoin="and_(Comment.id==Like.comment_id, Like.post_id==None)")

    # === MÉTHODES DE LA CLASSE ===

    def to_dict(self, include_author=True, include_stats=True):
        """
        Convertit le commentaire en dictionnaire pour l'API JSON

        Paramètres:
            include_author (bool): Si True, inclut les infos de l'auteur
            include_stats (bool): Si True, inclut le nombre de likes

        Retour:
            dict: Dictionnaire avec toutes les données du commentaire
        """
        # Données de base du commentaire
        data = {
            'id': self.id,
            'content': self.content,
            'user_id': self.user_id,
            'post_id': self.post_id,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

        # Si demandé, ajouter les infos de l'auteur du commentaire
        if include_author and self.author:
            data['author'] = {
                'id': self.author.id,
                'username': self.author.username
            }

        # Si demandé, compter et ajouter le nombre de likes
        if include_stats:
            # Compte seulement les likes où post_id est None (= likes du commentaire uniquement)
            data['likes_count'] = len([like for like in self.likes if like.post_id is None])

        return data

    def __repr__(self):
        """
        Représentation textuelle pour le debugging
        Exemple: "<Comment 12 on Post 5>"
        """
        return f'<Comment {self.id} on Post {self.post_id}>'


class Like(db.Model):
    """
    Modèle Like - Représente un "j'aime" sur un post OU un commentaire
    ===================================================================
    Cette classe définit la table 'likes' dans la base de données.
    Un like peut être sur un POST ou sur un COMMENTAIRE, mais pas les deux en même temps.

    Attributs:
    - id: Identifiant unique du like
    - user_id: ID de l'utilisateur qui a liké (clé étrangère)
    - post_id: ID du post liké (NULL si c'est un commentaire qui est liké)
    - comment_id: ID du commentaire liké (NULL si c'est un post qui est liké)
    - created_at: Date du like

    Contraintes importantes:
    - Un utilisateur ne peut liker qu'une seule fois un post ou commentaire donné
    - Soit post_id est rempli (like sur un post), soit comment_id (like sur un commentaire)
    - Les deux ne peuvent pas être remplis en même temps, ni être NULL en même temps
    """

    # Nom de la table dans la base de données
    __tablename__ = 'likes'

    # === COLONNES DE LA TABLE ===

    # id: Identifiant unique du like
    id = db.Column(db.Integer, primary_key=True)

    # user_id: Clé étrangère vers l'utilisateur qui a effectué le like
    # - nullable=False: Un like doit toujours avoir un auteur
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    # post_id: ID du post liké (si c'est un like sur un post)
    # - nullable=True: Peut être NULL (car si c'est un like sur un commentaire, ce champ est vide)
    post_id = db.Column(db.Integer, db.ForeignKey('posts.id'), nullable=True)

    # comment_id: ID du commentaire liké (si c'est un like sur un commentaire)
    # - nullable=True: Peut être NULL (car si c'est un like sur un post, ce champ est vide)
    comment_id = db.Column(db.Integer, db.ForeignKey('comments.id'), nullable=True)

    # created_at: Date et heure du like
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # === CONTRAINTES DE LA TABLE ===

    # __table_args__: Tuple de contraintes spéciales pour cette table
    __table_args__ = (
        # Contrainte 1: CheckConstraint - Vérifie qu'un like est soit sur un post, soit sur un commentaire
        # Logique: (post_id rempli ET comment_id NULL) OU (post_id NULL ET comment_id rempli)
        # Cela empêche:
        #   - Les deux champs remplis en même temps (like sur post ET commentaire = impossible!)
        #   - Les deux champs vides en même temps (like sur rien = pas de sens!)
        db.CheckConstraint('(post_id IS NOT NULL AND comment_id IS NULL) OR (post_id IS NULL AND comment_id IS NOT NULL)',
                          name='check_like_target'),

        # Contrainte 2: UniqueConstraint - Un utilisateur ne peut liker qu'une fois le même post/commentaire
        # Explication: La combinaison (user_id, post_id, comment_id) doit être unique
        # Exemple: L'utilisateur 5 ne peut pas liker deux fois le post 10
        # Si user_id=5, post_id=10, comment_id=NULL existe déjà, impossible d'insérer la même ligne
        db.UniqueConstraint('user_id', 'post_id', 'comment_id', name='unique_user_like'),
    )

    # === MÉTHODES DE LA CLASSE ===

    def to_dict(self):
        """
        Convertit le like en dictionnaire pour l'API JSON

        Retour:
            dict: Dictionnaire contenant les données du like

        Note: Inclut soit post_id, soit comment_id, selon le type de like
        """
        # Données de base toujours présentes
        data = {
            'id': self.id,
            'user_id': self.user_id,
            'created_at': self.created_at.isoformat()
        }

        # Ajouter post_id seulement s'il existe (like sur un post)
        if self.post_id:
            data['post_id'] = self.post_id

        # Ajouter comment_id seulement s'il existe (like sur un commentaire)
        if self.comment_id:
            data['comment_id'] = self.comment_id

        return data

    def __repr__(self):
        """
        Représentation textuelle pour le debugging
        Détermine automatiquement si c'est un like sur un post ou un commentaire
        Exemples:
        - "<Like by User 5 on Post 10>"
        - "<Like by User 3 on Comment 25>"
        """
        # Condition ternaire: si post_id existe, afficher "Post X", sinon "Comment Y"
        target = f'Post {self.post_id}' if self.post_id else f'Comment {self.comment_id}'
        return f'<Like by User {self.user_id} on {target}>'
