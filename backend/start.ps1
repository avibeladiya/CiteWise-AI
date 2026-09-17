$ErrorActionPreference = "Stop"

Write-Host "Starting CiteWise AI Backend..." -ForegroundColor Cyan

# Check for py
if (-not (Get-Command "py" -ErrorAction SilentlyContinue)) {
    Write-Error "py is not installed or not in PATH."
    exit 1
}

# Create virtual environment if it doesn't exist
if (-not (Test-Path "venv")) {
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    py -m venv venv
}

# Activate virtual environment
$activateScript = ".\venv\Scripts\Activate.ps1"
if (Test-Path $activateScript) {
    . $activateScript
} else {
    Write-Error "Could not find virtual environment activation script."
    exit 1
}

# Install requirements
Write-Host "Installing requirements..." -ForegroundColor Yellow
py -m pip install --upgrade pip | Out-Null
py -m pip install -r requirements.txt | Out-Null

# Start FastAPI application
Write-Host "Starting FastAPI application on port 8000..." -ForegroundColor Green
py -m uvicorn main:app --reload --port 8000
