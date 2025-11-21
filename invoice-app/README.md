# Générateur de Factures - Web App

Application web dockerisée pour générer des factures PDF personnalisées.

## Fonctionnalités

- Interface web intuitive pour saisir les informations de facturation
- Génération automatique de PDF basée sur un template
- Calcul automatique des totaux HT, TVA et TTC
- Application stateless (pas de stockage persistant)
- Architecture dockerisée pour un déploiement facile

## Structure du projet

```
invoice-app/
├── frontend/          # Application React TypeScript
├── backend/           # API Node.js/Express
├── docker-compose.yml # Configuration Docker
└── README.md
```

## Démarrage rapide

### Avec Docker (recommandé)

```bash
# Cloner le projet et aller dans le dossier
cd invoice-app

# Démarrer l'application complète
docker-compose up --build

# L'application sera accessible sur:
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001
```

### Développement local

#### Backend

```bash
cd backend
npm install
npm start
# Serveur disponible sur http://localhost:3001
```

#### Frontend

```bash
cd frontend
npm install
npm start
# Application disponible sur http://localhost:3000
```

## Utilisation

1. Accédez à http://localhost:3000
2. Remplissez les champs du formulaire :
   - Informations de votre entreprise
   - Informations du client
   - Détails de la facture
   - Prestations avec quantités et prix
   - Taux de TVA
3. Cliquez sur "Générer la facture PDF"
4. Le PDF se télécharge automatiquement

## Technologies utilisées

- **Frontend** : React 18, TypeScript, Axios
- **Backend** : Node.js, Express, PDF-lib
- **Containerisation** : Docker, Docker Compose

## API Endpoints

- `POST /api/generate-invoice` : Génère et retourne un PDF de facture

## Configuration

L'application est entièrement stateless et ne nécessite aucune configuration de base de données.

## Développement

Pour contribuer au projet :

1. Forkez le repository
2. Créez une branche pour votre fonctionnalité
3. Testez vos changements
4. Soumettez une pull request