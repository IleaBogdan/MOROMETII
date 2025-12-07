# Interventii24

Interventii24 is a multi-language application developed for the Polihack Winter 2025 competition.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the Application](#running-the-application)
- [Development](#development)
  - [Available Scripts](#available-scripts)
  - [Code Style and Linting](#code-style-and-linting)
- [Testing](#testing)
- [Configuration and Environment Variables](#configuration-and-environment-variables)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**Interventii24** is intended to provide a structured, reliable platform for managing interventions (e.g., service calls, maintenance tasks, or incident responses) in a centralized way.

You should customize this section with a concrete description of the project:

- **Purpose**: What problem does Interventii24 solve?
- **Target users**: Who uses the system (operators, technicians, admins, etc.)?
- **Key capabilities** (examples, replace with your actual features):
  - Creation and tracking of interventions
  - Assignment of interventions to responsible personnel
  - Status monitoring and history of interventions
  - Basic reporting or analytics

---

## Tech Stack

### Languages

- **TypeScript** – main frontend (and possibly Node.js backend) implementation
- **C#** – backend services (e.g., ASP.NET Core Web API)
- **JavaScript** – smaller scripts and tooling

### Typical Components (to be adjusted to the real stack)

- **Frontend**: TypeScript-based SPA framework (e.g., React with Vite or similar)
- **Backend**: ASP.NET Core Web API (C#)
- **Database**: SQL Server / PostgreSQL / SQLite (update to match your project)
- **Build & Tooling**:
  - Node.js + `npm` / `pnpm` / `yarn`
  - .NET SDK

---

## Project Structure

> Update this section to reflect the actual directory layout in the repository.

```text
.
├── client/                     # Frontend application (TypeScript)
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Screens / routed pages
│   │   ├── features/           # Feature modules (auth, interventions, users, etc.)
│   │   ├── services/           # API client logic for the backend
│   │   ├── hooks/              # Custom React hooks (if using React)
│   │   └── main.tsx            # Frontend entry point
│   └── package.json
│
├── server/                     # Backend application (C#)
│   ├── Controllers/            # HTTP API controllers
│   ├── Models/                 # Domain models and DTOs
│   ├── Services/               # Business logic services
│   ├── Repositories/           # Data access layer
│   ├── appsettings.json        # Application configuration
│   └── Program.cs              # Backend entry point
│
├── scripts/                    # Auxiliary JavaScript/TypeScript scripts (optional)
│   └── example-script.js
│
├── README.md
└── LICENSE
```

If your project uses a different structure (for example, only a `src/` folder at root or a different backend folder name), adjust this section accordingly.

---

## Getting Started

### Prerequisites

Ensure the following are installed:

- **Git**  
- **Node.js** (LTS recommended) – [https://nodejs.org/](https://nodejs.org/)  
- **.NET SDK** – [https://dotnet.microsoft.com/download](https://dotnet.microsoft.com/download)

Verify the installations:

```bash
node -v
npm -v          # or pnpm -v / yarn -v
dotnet --version
```

### Installation

Clone the repository:

```bash
git clone https://github.com/IleaBogdan/MOROMETII.git
cd MOROMETII
```

Install frontend dependencies (if the `client/` folder exists):

```bash
cd client
npm install      # or pnpm install / yarn
cd ..
```

Restore backend dependencies (if the `server/` folder exists):

```bash
cd server
dotnet restore
cd ..
```

### Running the Application

#### Frontend

From the `client/` directory:

```bash
cd client
npm run dev      # or npm start / pnpm dev / yarn dev
```

Common local development URLs include:

- `http://localhost:3000`
- `http://localhost:5173`

Consult `package.json` or the console output for the actual URL.

#### Backend

From the `server/` directory:

```bash
cd server
dotnet run
```

The API will usually start on one of:

- `https://localhost:5001`
- `http://localhost:5000`

Check `launchSettings.json` or console output for the exact address.

#### Full Stack Development

1. Start the backend:
   ```bash
   cd server
   dotnet run
   ```
2. Start the frontend:
   ```bash
   cd ../client
   npm run dev
   ```
3. Ensure the frontend is configured to call the backend using the correct base URL (see [Configuration and Environment Variables](#configuration-and-environment-variables)).

---

## Development

### Available Scripts

**Frontend** (example for `client/package.json`):

```jsonc
{
  "name": "interventii24-client",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext .ts,.tsx",
    "test": "vitest"
  }
}
```

**Backend** (from `server/`):

```bash
dotnet restore        # Restore NuGet packages
dotnet build          # Build the backend
dotnet run            # Run the application
dotnet test           # Execute backend tests (if configured)
```

Align these commands with the actual scripts defined in your project.

### Code Style and Linting

Recommended practices:

- **TypeScript / JavaScript**
  - Use **ESLint** for static analysis
  - Use **Prettier** (or a similar tool) for formatting
  - Run TypeScript compiler checks (e.g., `tsc --noEmit`) if applicable

- **C#**
  - Maintain style rules via `.editorconfig`
  - Optionally use analyzers such as StyleCop or built‑in Roslyn analyzers

Example workflow:

```bash
# Frontend
cd client
npm run lint
npm run build

# Backend
cd ../server
dotnet build
```

---

## Testing

Update this section to describe the real testing setup.

Example commands:

```bash
# Frontend tests
cd client
npm test            # or npm run test / npm run test:unit

# Backend tests
cd ../server
dotnet test
```

If you use end‑to‑end or integration tests (e.g., Cypress, Playwright, or custom integration suites), document how to run them here.

---

## Configuration and Environment Variables

Create local environment configuration files to avoid hard‑coding secrets and environment‑specific details.

### Frontend

For example, in `client/.env` or `client/.env.local`:

```bash
VITE_API_BASE_URL=http://localhost:5000
VITE_APP_NAME=Interventii24
```

Adjust these names according to your build tooling (e.g., `VITE_` prefix for Vite).

### Backend

You can use environment variables or `appsettings.*.json`.

Example environment variables:

```bash
ASPNETCORE_ENVIRONMENT=Development
INTERVENTII24_DB_CONNECTION=Server=localhost;Database=Interventii24;User Id=...;Password=...
INTERVENTII24_JWT_SECRET=change-this-secret
INTERVENTII24_ALLOWED_ORIGINS=http://localhost:3000
```

Example `appsettings.Development.json`:

```jsonc
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=Interventii24;User Id=...;Password=..."
  },
  "Jwt": {
    "Secret": "change-this-secret",
    "Issuer": "Interventii24",
    "Audience": "Interventii24Client"
  },
  "AllowedHosts": "*"
}
```

Do **not** commit real credentials, tokens, or production keys to the repository.

---

## Contributing

1. Fork the repository.  
2. Create a new branch for your change:
   ```bash
   git checkout -b feature/short-description
   ```
3. Implement and test your changes.  
4. Run linters and tests (where applicable):
   ```bash
   cd client
   npm run lint
   npm test

   cd ../server
   dotnet test
   ```
5. Commit with a clear, concise message:
   ```bash
   git commit -m "feat: add <short description> to Interventii24"
   ```
6. Push the branch and open a Pull Request against the main branch.

If no license has been chosen yet, consider options such as MIT, Apache 2.0, or GPL-3.0 and update this section accordingly.
