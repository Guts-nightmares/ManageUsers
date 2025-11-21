# Flask React Forum 🚀

Une application web complète de forum avec authentification JWT, système de posts et commentaires, likes, profils utilisateurs, recherche et panneau d'administration.

## 📋 Table des matières

- [Fonctionnalités](#fonctionnalités)
- [Technologies utilisées](#technologies-utilisées)
- [Structure du projet](#structure-du-projet)
- [Installation](#installation)
- [Lancement de l'application](#lancement-de-lapplication)
- [Utilisation](#utilisation)
- [API Routes](#api-routes)
- [Production](#production)

## ✨ Fonctionnalités

### 🔐 Authentification & Gestion des utilisateurs
- ✅ Inscription et connexion avec JWT
- ✅ Rôles utilisateur (Admin / Utilisateur normal)
- ✅ Profils utilisateurs avec statistiques
- ✅ Modification du profil (username, email)
- ✅ Changement de mot de passe sécurisé
- ✅ Sessions persistantes (localStorage)

### 💬 Système de Forum
- ✅ Création, modification, suppression de posts
- ✅ Système de commentaires sur les posts
- ✅ Like/Unlike des posts et commentaires
- ✅ Pagination des posts
- ✅ Recherche dans les posts (titre et contenu)
- ✅ Vue détaillée des posts avec commentaires
- ✅ Permissions basées sur les rôles (propriétaire ou admin)

### 👤 Profils Utilisateurs
- ✅ Page de profil publique avec statistiques
- ✅ Affichage des posts récents de l'utilisateur
- ✅ Compteurs (posts, commentaires, likes donnés)
- ✅ Édition du profil personnel

### 🎨 Interface Utilisateur
- ✅ Design moderne avec Bootstrap 5
- ✅ Navigation intuitive avec barre de recherche intégrée
- ✅ Menu dropdown utilisateur
- ✅ Icônes Bootstrap Icons
- ✅ Interface responsive (mobile-friendly)
- ✅ Feedback visuel (spinners, alertes, badges)

### 🛡️ Administration
- ✅ Panneau d'administration pour gérer les utilisateurs
- ✅ Modération des posts et commentaires (suppression)
- ✅ Gestion des rôles utilisateurs

## 🛠️ Technologies utilisées

### Backend
- **Flask 3.0.0** - Framework web Python
- **Flask-SQLAlchemy 3.1.1** - ORM pour la base de données
- **Flask-CORS 4.0.0** - Gestion des requêtes cross-origin
- **PyJWT 2.8.0** - Authentification par tokens JWT
- **SQLite** - Base de données (fichier)
- **Werkzeug 3.0.1** - Hachage sécurisé des mots de passe

### Frontend
- **React 18.2.0** - Bibliothèque UI
- **React Router DOM 6.20.0** - Routing côté client
- **Vite 5.4.21** - Build tool et dev server ultra-rapide
- **Axios 1.6.2** - Client HTTP avec intercepteurs
- **Bootstrap 5.3.2** - Framework CSS
- **Bootstrap Icons 1.11.0** - Icônes

## 📁 Structure du projet

```
flask-react-auth/
├── backend/              # API Flask
│   ├── app.py           # Routes API et configuration
│   ├── models.py        # Modèles SQLAlchemy (User, Post, Comment, Like)
│   ├── config.py        # Configuration Flask
│   ├── requirements.txt # Dépendances Python
│   └── instance/
│       └── database.db  # Base de données SQLite (créée automatiquement)
│
└── frontend/            # Application React
    ├── package.json
    ├── vite.config.js   # Configuration Vite avec proxy
    ├── index.html       # Point d'entrée HTML
    └── src/
        ├── App.js       # Composant racine avec routes
        ├── index.js     # Point d'entrée React
        ├── components/
        │   ├── Navbar.js         # Navigation avec recherche
        │   ├── Login.js          # Page de connexion
        │   ├── Register.js       # Page d'inscription
        │   ├── Dashboard.js      # Tableau de bord utilisateur
        │   ├── Admin.js          # Panneau d'administration
        │   ├── Forum.js          # Liste des posts avec pagination
        │   ├── CreatePost.js     # Formulaire de création de post
        │   ├── PostDetail.js     # Vue détaillée d'un post
        │   ├── UserProfile.js    # Profil utilisateur
        │   ├── SearchResults.js  # Résultats de recherche
        │   └── PrivateRoute.js   # Route protégée
        └── services/
            └── api.js    # Services API (axios)
```

## 📦 Installation

### Prérequis
- **Python 3.8+**
- **Node.js 14+**
- **npm** ou **yarn**

### 1. Cloner le projet
```bash
git clone <votre-repo>
cd flask-react-auth
```

### 2. Installer le backend

```bash
cd backend

# Créer un environnement virtuel (recommandé)
python3 -m venv venv

# Activer l'environnement virtuel
source venv/bin/activate  # Linux / Mac
# ou
venv\Scripts\activate     # Windows

# Installer les dépendances
pip install -r requirements.txt
```

### 3. Installer le frontend

```bash
cd frontend
npm install
```

## 🚀 Lancement de l'application

### Démarrer le backend (Terminal 1)

```bash
cd backend
source venv/bin/activate  # ou venv\Scripts\activate sur Windows
python app.py
```

**✅ Le serveur Flask tourne sur http://127.0.0.1:5000**

Au premier lancement, la base de données est créée automatiquement avec un compte admin par défaut.

### Démarrer le frontend (Terminal 2)

```bash
cd frontend
npm run dev
```

**✅ L'application React sera accessible sur http://localhost:3000**

Le hot-reload est activé : vos modifications sont visibles instantanément !

## 📘 Utilisation

### Compte administrateur par défaut

Au premier lancement, un compte admin est créé automatiquement :

- **Username:** `admin`
- **Password:** `admin123`
- **Email:** `admin@example.com`

⚠️ **Pensez à changer ces identifiants en production !**

### Pages disponibles

| Route | Description | Accès |
|-------|-------------|-------|
| `/` | Page d'accueil (redirige vers `/forum`) | Public |
| `/forum` | Liste des posts avec pagination | Public |
| `/forum/new` | Créer un nouveau post | Authentifié |
| `/forum/posts/:id` | Voir un post et ses commentaires | Public |
| `/forum/search?q=...` | Résultats de recherche | Public |
| `/profile/:userId` | Profil utilisateur | Public |
| `/login` | Page de connexion | Public |
| `/register` | Page d'inscription | Public |
| `/dashboard` | Tableau de bord utilisateur | Authentifié |
| `/admin` | Panneau d'administration | Admin uniquement |

### Fonctionnalités principales

#### 📝 Créer un post
1. Connectez-vous avec votre compte
2. Cliquez sur "Nouveau post" dans la navbar
3. Remplissez le titre et le contenu
4. Cliquez sur "Publier"

#### 💬 Commenter
1. Ouvrez un post en cliquant sur son titre
2. Tapez votre commentaire en bas de la page
3. Cliquez sur "Commenter"

#### ❤️ Liker
- Cliquez sur le bouton "like" sous un post ou un commentaire
- Cliquez à nouveau pour retirer votre like

#### 🔍 Rechercher
- Utilisez la barre de recherche dans la navbar
- Tapez au moins 2 caractères
- Les résultats affichent les correspondances dans les titres et contenus

#### 👤 Voir un profil
- Cliquez sur le nom d'un utilisateur
- Consultez ses statistiques et posts récents
- Modifiez votre propre profil si c'est le vôtre

## 🔌 API Routes

### Authentification

| Méthode | Route | Description | Auth |
|---------|-------|-------------|------|
| POST | `/api/register` | Créer un compte | Public |
| POST | `/api/login` | Se connecter | Public |
| GET | `/api/me` | Récupérer l'utilisateur actuel | JWT |

### Posts

| Méthode | Route | Description | Auth |
|---------|-------|-------------|------|
| GET | `/api/posts` | Liste des posts (pagination) | Public |
| GET | `/api/posts/:id` | Détails d'un post | Public |
| POST | `/api/posts` | Créer un post | JWT |
| PUT | `/api/posts/:id` | Modifier un post | Propriétaire/Admin |
| DELETE | `/api/posts/:id` | Supprimer un post | Propriétaire/Admin |
| GET | `/api/posts/search?q=...` | Rechercher des posts | Public |

### Commentaires

| Méthode | Route | Description | Auth |
|---------|-------|-------------|------|
| GET | `/api/posts/:id/comments` | Liste des commentaires | Public |
| POST | `/api/posts/:id/comments` | Créer un commentaire | JWT |
| PUT | `/api/comments/:id` | Modifier un commentaire | Propriétaire/Admin |
| DELETE | `/api/comments/:id` | Supprimer un commentaire | Propriétaire/Admin |

### Likes

| Méthode | Route | Description | Auth |
|---------|-------|-------------|------|
| POST | `/api/posts/:id/like` | Liker/Unliker un post | JWT |
| POST | `/api/comments/:id/like` | Liker/Unliker un commentaire | JWT |
| GET | `/api/posts/:id/likes` | Liste des likes d'un post | Public |
| GET | `/api/comments/:id/likes` | Liste des likes d'un commentaire | Public |
| GET | `/api/posts/:id/user-liked` | Vérifier si l'utilisateur a liké | JWT |
| GET | `/api/comments/:id/user-liked` | Vérifier si l'utilisateur a liké | JWT |

### Profils

| Méthode | Route | Description | Auth |
|---------|-------|-------------|------|
| GET | `/api/users/:id/profile` | Profil public avec stats | Public |
| PUT | `/api/profile` | Mettre à jour son profil | JWT |
| PUT | `/api/profile/password` | Changer son mot de passe | JWT |

### Administration

| Méthode | Route | Description | Auth |
|---------|-------|-------------|------|
| GET | `/api/admin/users` | Liste tous les utilisateurs | Admin |
| PUT | `/api/admin/users/:id` | Modifier un utilisateur | Admin |
| DELETE | `/api/admin/users/:id` | Supprimer un utilisateur | Admin |

## 🎨 Détails techniques

### Proxy API
Le frontend communique avec le backend via un proxy configuré dans `vite.config.js` :

```javascript
server: {
    proxy: {
        '/api': 'http://127.0.0.1:5000'
    }
}
```

### Authentification JWT
- Le token est stocké dans `localStorage`
- Ajouté automatiquement à chaque requête via un intercepteur Axios
- Expiration après 24 heures (configurable dans `backend/config.py`)

### Permissions
- **Public:** Tout le monde peut voir les posts, commentaires, et profils
- **Authentifié:** Peut créer des posts, commenter, liker
- **Propriétaire:** Peut modifier/supprimer ses propres posts et commentaires
- **Admin:** Peut tout modifier/supprimer, gérer les utilisateurs

### Base de données
- **SQLite** pour le développement
- Tables: `users`, `posts`, `comments`, `likes`
- Relations en cascade (supprimer un post supprime ses commentaires et likes)
- Contraintes d'unicité sur les likes

## 🏭 Production

### Backend

1. Désactivez le mode debug dans `app.py` :
```python
if __name__ == '__main__':
    app.run(debug=False)  # Mettre à False
```

2. Utilisez un secret key sécurisé dans `.env` :
```bash
SECRET_KEY=votre-clé-super-sécurisée-ici
```

3. Déployez avec **Gunicorn** ou **uWSGI** + **Nginx**
```bash
pip install gunicorn
gunicorn app:app
```

4. Pour plus de scalabilité, remplacez SQLite par **PostgreSQL** ou **MySQL**

### Frontend

1. Créez un build de production :
```bash
npm run build
```

2. Servez le dossier `dist/` avec **Nginx**, **Apache**, ou un CDN

3. Configurez les variables d'environnement pour l'API en production

## 📚 Commandes utiles

### Backend
```bash
python app.py                    # Lancer le serveur Flask
pip install -r requirements.txt  # Installer les dépendances
pip freeze > requirements.txt    # Mettre à jour les dépendances
```

### Frontend
```bash
npm install       # Installer les dépendances
npm run dev       # Serveur de développement
npm run build     # Build pour production
npm run preview   # Prévisualiser le build
```

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
- Signaler des bugs
- Proposer de nouvelles fonctionnalités
- Soumettre des pull requests

## 📄 Licence

Ce projet est libre d'utilisation pour l'apprentissage et les projets personnels.

## 🔗 Ressources

- [Documentation Flask](https://flask.palletsprojects.com/)
- [Documentation React](https://react.dev/)
- [Documentation Vite](https://vitejs.dev/)
- [Bootstrap 5](https://getbootstrap.com/)
- [SQLAlchemy](https://www.sqlalchemy.org/)

---

Créé avec ❤️ par Claude Code
