# 🚀 Nexus - Quick Deployment Script
# This script helps you deploy Nexus step-by-step

Write-Host "===================================" -ForegroundColor Cyan
Write-Host "  NEXUS DEPLOYMENT HELPER" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if command exists
function Test-Command {
    param($Command)
    try {
        if (Get-Command $Command -ErrorAction Stop) {
            return $true
        }
    }
    catch {
        return $false
    }
}

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow
Write-Host ""

$allGood = $true

# Check Node.js
if (Test-Command "node") {
    $nodeVersion = node --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js not found. Install from https://nodejs.org/" -ForegroundColor Red
    $allGood = $false
}

# Check npm
if (Test-Command "npm") {
    $npmVersion = npm --version
    Write-Host "✅ npm: v$npmVersion" -ForegroundColor Green
} else {
    Write-Host "❌ npm not found" -ForegroundColor Red
    $allGood = $false
}

# Check git
if (Test-Command "git") {
    $gitVersion = git --version
    Write-Host "✅ Git: $gitVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Git not found" -ForegroundColor Red
    $allGood = $false
}

# Check EAS CLI
if (Test-Command "eas") {
    Write-Host "✅ EAS CLI installed" -ForegroundColor Green
} else {
    Write-Host "⚠️  EAS CLI not found. Install with: npm install -g eas-cli" -ForegroundColor Yellow
}

Write-Host ""

if (-not $allGood) {
    Write-Host "❌ Please install missing prerequisites and run again." -ForegroundColor Red
    exit 1
}

# Main menu
Write-Host "What would you like to deploy?" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. 📱 Build Mobile APK (for testing)"
Write-Host "2. 🔧 Setup Backend Environment"
Write-Host "3. 🌐 Setup Frontend Environment"
Write-Host "4. 📊 Check Project Status"
Write-Host "5. 🧪 Run Tests"
Write-Host "6. 📖 Open Documentation"
Write-Host "0. Exit"
Write-Host ""

$choice = Read-Host "Enter your choice (0-6)"

switch ($choice) {
    "1" {
        Write-Host "`n📱 Building Mobile APK..." -ForegroundColor Cyan
        Write-Host ""
        
        # Check if EAS CLI is installed
        if (-not (Test-Command "eas")) {
            Write-Host "Installing EAS CLI..." -ForegroundColor Yellow
            npm install -g eas-cli
        }
        
        # Navigate to mobile folder
        Set-Location -Path "mobilef"
        
        Write-Host "Installing dependencies..." -ForegroundColor Yellow
        npm install --legacy-peer-deps
        
        Write-Host ""
        Write-Host "Login to Expo:" -ForegroundColor Yellow
        eas login
        
        Write-Host ""
        Write-Host "Building APK (this will take 10-15 minutes)..." -ForegroundColor Yellow
        eas build --platform android --profile preview
        
        Write-Host ""
        Write-Host "✅ Build started! Check Expo dashboard for progress." -ForegroundColor Green
        Write-Host "   URL: https://expo.dev/" -ForegroundColor Cyan
    }
    
    "2" {
        Write-Host "`n🔧 Setting up Backend Environment..." -ForegroundColor Cyan
        Write-Host ""
        
        Set-Location -Path "Backend/Server"
        
        if (Test-Path ".env") {
            Write-Host "⚠️  .env file already exists!" -ForegroundColor Yellow
            $overwrite = Read-Host "Overwrite? (y/n)"
            if ($overwrite -eq "y") {
                Copy-Item ".env.template" ".env"
                Write-Host "✅ Created .env from template" -ForegroundColor Green
            }
        } else {
            Copy-Item ".env.template" ".env"
            Write-Host "✅ Created .env from template" -ForegroundColor Green
        }
        
        Write-Host ""
        Write-Host "📝 Please edit Backend/Server/.env with your values:" -ForegroundColor Yellow
        Write-Host "   - SUPABASE_URL" -ForegroundColor White
        Write-Host "   - SUPABASE_ANON_KEY" -ForegroundColor White
        Write-Host "   - GROQ_API_KEY" -ForegroundColor White
        Write-Host "   - REDIS_URL" -ForegroundColor White
        Write-Host ""
        
        $install = Read-Host "Install dependencies now? (y/n)"
        if ($install -eq "y") {
            npm install
            Write-Host "✅ Dependencies installed" -ForegroundColor Green
        }
        
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "1. Edit .env file with your API keys"
        Write-Host "2. Deploy to Railway/Render (see DEPLOYMENT_GUIDE.md)"
        Write-Host "3. Or test locally: npm start"
    }
    
    "3" {
        Write-Host "`n🌐 Setting up Frontend Environment..." -ForegroundColor Cyan
        Write-Host ""
        
        Set-Location -Path "Frontend"
        
        if (Test-Path ".env") {
            Write-Host "⚠️  .env file already exists!" -ForegroundColor Yellow
            $overwrite = Read-Host "Overwrite? (y/n)"
            if ($overwrite -eq "y") {
                Copy-Item ".env.template" ".env"
                Write-Host "✅ Created .env from template" -ForegroundColor Green
            }
        } else {
            Copy-Item ".env.template" ".env"
            Write-Host "✅ Created .env from template" -ForegroundColor Green
        }
        
        Write-Host ""
        Write-Host "📝 Please edit Frontend/.env with your values:" -ForegroundColor Yellow
        Write-Host "   - VITE_SUPABASE_URL" -ForegroundColor White
        Write-Host "   - VITE_SUPABASE_ANON_KEY" -ForegroundColor White
        Write-Host "   - VITE_API_URL" -ForegroundColor White
        Write-Host ""
        
        $install = Read-Host "Install dependencies now? (y/n)"
        if ($install -eq "y") {
            npm install
            Write-Host "✅ Dependencies installed" -ForegroundColor Green
        }
        
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "1. Edit .env file"
        Write-Host "2. Test locally: npm run dev"
        Write-Host "3. Deploy to Netlify (see DEPLOYMENT_GUIDE.md)"
    }
    
    "4" {
        Write-Host "`n📊 Checking Project Status..." -ForegroundColor Cyan
        Write-Host ""
        
        # Check Backend
        Write-Host "Backend Server:" -ForegroundColor Yellow
        if (Test-Path "Backend/Server/.env") {
            Write-Host "  ✅ .env file exists" -ForegroundColor Green
        } else {
            Write-Host "  ❌ .env file missing" -ForegroundColor Red
        }
        
        if (Test-Path "Backend/Server/node_modules") {
            Write-Host "  ✅ Dependencies installed" -ForegroundColor Green
        } else {
            Write-Host "  ❌ Dependencies not installed" -ForegroundColor Red
        }
        
        Write-Host ""
        
        # Check Frontend
        Write-Host "Frontend:" -ForegroundColor Yellow
        if (Test-Path "Frontend/.env") {
            Write-Host "  ✅ .env file exists" -ForegroundColor Green
        } else {
            Write-Host "  ❌ .env file missing" -ForegroundColor Red
        }
        
        if (Test-Path "Frontend/node_modules") {
            Write-Host "  ✅ Dependencies installed" -ForegroundColor Green
        } else {
            Write-Host "  ❌ Dependencies not installed" -ForegroundColor Red
        }
        
        Write-Host ""
        
        # Check Mobile
        Write-Host "Mobile App:" -ForegroundColor Yellow
        if (Test-Path "mobilef/node_modules") {
            Write-Host "  ✅ Dependencies installed" -ForegroundColor Green
        } else {
            Write-Host "  ❌ Dependencies not installed" -ForegroundColor Red
        }
        
        Write-Host ""
        
        # Check Git
        Write-Host "Git Repository:" -ForegroundColor Yellow
        $gitRemote = git remote -v 2>$null
        if ($gitRemote) {
            Write-Host "  ✅ Git initialized" -ForegroundColor Green
            Write-Host "  Remote: $($gitRemote[0])" -ForegroundColor White
        } else {
            Write-Host "  ❌ Git not initialized" -ForegroundColor Red
        }
    }
    
    "5" {
        Write-Host "`n🧪 Running Tests..." -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Test suite coming soon!" -ForegroundColor Yellow
        Write-Host "For now, manually test:" -ForegroundColor White
        Write-Host "1. Backend: cd Backend/Server && npm start" -ForegroundColor White
        Write-Host "2. Frontend: cd Frontend && npm run dev" -ForegroundColor White
        Write-Host "3. Mobile: cd mobilef && npm start" -ForegroundColor White
    }
    
    "6" {
        Write-Host "`n📖 Opening Documentation..." -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Available documentation:" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "1. README.md - Project overview"
        Write-Host "2. DEPLOYMENT_GUIDE.md - Full deployment guide"
        Write-Host "3. TESTING_CHECKLIST.md - Testing guide for 30 users"
        Write-Host "4. MOBILE_APP_STATUS.md - Mobile app status"
        Write-Host ""
        
        $doc = Read-Host "Which document to open? (1-4)"
        switch ($doc) {
            "1" { Start-Process "README.md" }
            "2" { Start-Process "DEPLOYMENT_GUIDE.md" }
            "3" { Start-Process "TESTING_CHECKLIST.md" }
            "4" { Start-Process "MOBILE_APP_STATUS.md" }
            default { Write-Host "Invalid choice" -ForegroundColor Red }
        }
    }
    
    "0" {
        Write-Host "`nGoodbye! 👋" -ForegroundColor Cyan
        exit 0
    }
    
    default {
        Write-Host "`n❌ Invalid choice. Please run the script again." -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📖 Full Guide: DEPLOYMENT_GUIDE.md" -ForegroundColor Yellow
Write-Host "🐛 Issues: https://github.com/zishandeshmukh/complete-nexus/issues" -ForegroundColor Yellow
Write-Host ""
