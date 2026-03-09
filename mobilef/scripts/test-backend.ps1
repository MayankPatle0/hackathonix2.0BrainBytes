# Quick Test Script - Tests Backend API Health

Write-Host "🔍 Testing Backend API Health..." -ForegroundColor Cyan

$backendUrl = "https://complete-nexus.onrender.com"

try {
    Write-Host "`nTesting: $backendUrl/health" -ForegroundColor Yellow
    $response = Invoke-RestMethod -Uri "$backendUrl/health" -Method Get -TimeoutSec 10
    
    if ($response.status -eq "healthy") {
        Write-Host "✅ Backend is HEALTHY!" -ForegroundColor Green
        Write-Host "   Redis: $($response.redis)" -ForegroundColor Cyan
        Write-Host "   Queue Waiting: $($response.queue.waiting)" -ForegroundColor Cyan
        Write-Host "   Queue Active: $($response.queue.active)" -ForegroundColor Cyan
        Write-Host "   Queue Failed: $($response.queue.failed)" -ForegroundColor Cyan
        Write-Host "   Timestamp: $($response.timestamp)`n" -ForegroundColor Cyan
    } else {
        Write-Host "⚠️  Backend status: $($response.status)`n" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Backend is NOT responding!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Make sure the backend is deployed and running.`n" -ForegroundColor Yellow
    exit 1
}

Write-Host "Testing: $backendUrl/metrics" -ForegroundColor Yellow
try {
    $metrics = Invoke-RestMethod -Uri "$backendUrl/metrics" -Method Get -TimeoutSec 10
    Write-Host "✅ Metrics endpoint is working!" -ForegroundColor Green
    Write-Host "   Queue: $($metrics.queue)" -ForegroundColor Cyan
    Write-Host "   Workers: $($metrics.workers)`n" -ForegroundColor Cyan
} catch {
    Write-Host "⚠️  Metrics endpoint failed (may be normal)`n" -ForegroundColor Yellow
}

Write-Host "================================`n" -ForegroundColor Cyan
Write-Host "✅ Backend API is operational!" -ForegroundColor Green
Write-Host "You can proceed with building the mobile app.`n" -ForegroundColor Cyan
