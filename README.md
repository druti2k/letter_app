# Letter Writing Application

A modern web application for writing and managing letters with Google Drive integration.

## Features

- Write and edit letters with a rich text editor
- Save letters locally and to Google Drive
- Google OAuth authentication
- Dashboard with statistics and recent activity
- Profile management
- Responsive design

## Tech Stack

### Frontend
- React.js
- Material-UI
- React Router
- React Quill (rich text editor)
- Framer Motion (animations)

### Backend
- Node.js
- Express.js
- SQLite database
- Google Drive API
- JWT authentication

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Google Cloud Platform account with OAuth 2.0 credentials

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/letter_app.git
cd letter_app
```

2. Install dependencies:
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

3. Set up environment variables:

Create `.env` file in the server directory:
```env
NODE_ENV=development
PORT=3001
CLIENT_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
SECRET_KEY=your_secret_key
```

Create `.env` file in the client directory:
```env
REACT_APP_API_URL=http://localhost:3001
REACT_APP_GOOGLE_CLIENT_ID=your_client_id
```

4. Start the development servers:

```bash
# Start the backend server
cd server
npm start

# In a new terminal, start the frontend
cd client
npm start
```

The application will be available at `http://localhost:3000`

## Deployment

The application is deployed using:
- Frontend: Netlify
- Backend: Render

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
