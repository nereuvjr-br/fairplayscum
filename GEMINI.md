# GEMINI Project Overview

## Project Name
Next.js Project

## Description
This project is a Next.js application that integrates with Appwrite for authentication and uses JWT for session management. It includes features such as user login, session handling, and secure cookie management.

## Key Features
- **Authentication**: Integration with Appwrite for user authentication.
- **JWT Management**: Securely generates and verifies JWT tokens.
- **API Endpoints**: Provides endpoints for login, session management, and logout.
- **Frontend**: Built with Next.js, leveraging server-side rendering and modern React features.
- **Styling**: Uses Tailwind CSS for styling.

## Directory Structure
```
public/               # Static assets
scumlogs/            # Logs directory
src/
  app/
    globals.css      # Global styles
    layout.tsx       # Layout component
    page.tsx         # Main page
    components/
      ui/            # UI components (e.g., Button, Card)
    lib/             # Utility functions
      utils.ts       # Helper utilities
```

## Environment Variables
The following environment variables are required for the project:
- `NEXT_PUBLIC_APPWRITE_ENDPOINT`: Appwrite API endpoint.
- `NEXT_PUBLIC_APPWRITE_PROJECT_ID`: Appwrite project ID.
- `APPWRITE_API_KEY`: Appwrite API key.
- `AUTH_JWT_SECRET`: Secret key for JWT generation.

## Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```bash
   cd nextjs-project
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Scripts
- `npm run dev`: Starts the development server.
- `npm run build`: Builds the project for production.
- `npm run start`: Starts the production server.

## Authentication Flow
1. **Login**: Users log in via `/api/auth/login`.
2. **Session Creation**: Appwrite creates a session, and a JWT is generated.
3. **JWT Cookie**: The JWT is stored in an HttpOnly cookie.
4. **Session Validation**: The JWT is validated on subsequent requests.
5. **Logout**: The session is cleared via `/api/auth/logout`.

## Dependencies
- **Next.js**: Framework for building the application.
- **Appwrite**: Backend-as-a-service for authentication.
- **jsonwebtoken**: Library for generating and verifying JWTs.
- **Tailwind CSS**: Utility-first CSS framework.

## Contribution
1. Fork the repository.
2. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Commit your changes:
   ```bash
   git commit -m "Add your message here"
   ```
4. Push to the branch:
   ```bash
   git push origin feature/your-feature-name
   ```
5. Open a pull request.

## License
This project is licensed under the MIT License.