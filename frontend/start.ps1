$ErrorActionPreference = "Stop"

Write-Host "Starting CiteWise AI Frontend..." -ForegroundColor Cyan

# Check for npm
if (-not (Get-Command "npm" -ErrorAction SilentlyContinue)) {
    Write-Error "npm is not installed or not in PATH."
    exit 1
}

# Install dependencies if node_modules doesn't exist
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Start Vite dev server
Write-Host "Starting Vite development server..." -ForegroundColor Green
npm run dev
