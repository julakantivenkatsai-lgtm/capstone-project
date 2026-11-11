#!/bin/bash
# This script starts the MaintIQ application (backend + frontend)
# Ensure you are in the project root (where package.json resides)

# Exit on any error
set -e

# Install dependencies (skip if already installed)
npm install

# Build the frontend
npm run build

# Start the Express server (serves the built UI)
# The server will listen on PORT defined in .env (default 3000)
npm start
