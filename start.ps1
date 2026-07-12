# PlacePilot Parallel Service Launcher for Windows
Write-Host "Initializing PlacePilot Development Services..." -ForegroundColor Magenta

if (-not (Test-Path "server/node_modules")) {
    Write-Host "Installing backend packages..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server; npm install" -Wait
}

if (-not (Test-Path "client/node_modules")) {
    Write-Host "Installing frontend packages..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd client; npm install" -Wait
}

# Launch Backend
Write-Host "Launching Backend API Server on http://localhost:5000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server; npm run dev"

# Launch Frontend
Write-Host "Launching Frontend React Server on http://localhost:5173..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd client; npm run dev"

Write-Host "Services initiated! Go to http://localhost:5173" -ForegroundColor Green
