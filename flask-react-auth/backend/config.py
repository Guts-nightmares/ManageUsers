"""
Fichier de configuration de l'application Flask
================================================
Ce fichier contient tous les paramètres de configuration nécessaires au fonctionnement
de l'application backend (serveur Flask).
"""

# Import de la bibliothèque os pour accéder aux variables d'environnement du système
import os
# Import de timedelta pour gérer les durées/délais (utilisé pour l'expiration des tokens JWT)
from datetime import timedelta

class Config:
    """
    Classe de configuration principale de l'application
    ---------------------------------------------------
    Cette classe contient toutes les variables de configuration nécessaires pour:
    - La sécurité (clé secrète)
    - La base de données (connexion SQLAlchemy)
    - L'authentification (expiration des tokens JWT)
    """

    # SECRET_KEY: Clé secrète utilisée pour signer les tokens JWT et sécuriser les sessions
    # Principe: Essaie d'abord de récupérer la clé depuis les variables d'environnement (plus sécurisé)
    # Si elle n'existe pas, utilise une clé par défaut pour le développement (NE JAMAIS utiliser en production!)
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'

    # SQLALCHEMY_DATABASE_URI: Chaîne de connexion à la base de données
    # 'sqlite:///database.db' signifie:
    #   - sqlite: On utilise SQLite comme système de base de données (fichier local, idéal pour le développement)
    #   - ///: Trois slashes indiquent un chemin relatif
    #   - database.db: Nom du fichier de base de données qui sera créé dans le dossier backend/
    SQLALCHEMY_DATABASE_URI = 'sqlite:///database.db'

    # SQLALCHEMY_TRACK_MODIFICATIONS: Désactive le système de suivi des modifications de SQLAlchemy
    # Raison: Ce système consomme de la mémoire et n'est généralement pas nécessaire
    # Il est recommandé de le désactiver (False) pour améliorer les performances
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # JWT_EXPIRATION_DELTA: Durée de validité d'un token JWT (JSON Web Token)
    # timedelta(hours=24): Le token expire après 24 heures
    # Cela signifie qu'un utilisateur devra se reconnecter après 24h d'inactivité
    # Vous pouvez ajuster cette valeur selon vos besoins de sécurité
    JWT_EXPIRATION_DELTA = timedelta(hours=24)
