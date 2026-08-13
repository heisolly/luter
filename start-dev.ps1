Write-Host "Starting Luter Development Environment..." -ForegroundColor Green
Write-Host ""

Write-Host "Starting Battle Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server; npm run dev"

Write-Host "Starting Client Server..." -ForegroundColor Yellow  
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev:client"

Write-Host "Starting Admin Dashboard..." -ForegroundColor Yellow  
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev:admin"

Write-Host ""
Write-Host "All three servers are starting in separate PowerShell windows..." -ForegroundColor Green
Write-Host "Battle Server: http://localhost:3001" -ForegroundColor Cyan
Write-Host "Client Server: http://localhost:5173" -ForegroundColor Cyan
Write-Host "Admin Dashboard: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
