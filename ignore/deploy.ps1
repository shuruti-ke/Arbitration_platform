param([switch]$BackendOnly, [switch]$FrontendOnly, [switch]$SkipGit)

$root    = "C:\Users\shuru\documents\aiprojects\arbitration_platform"
$sshKey  = "C:\Users\shuru\Documents\AIProjects\Arbitration_Platform\ssh-key-2026-04-14 (1).key"
$remote  = "opc@152.70.201.154"
$so      = @("-o","ConnectTimeout=20","-o","StrictHostKeyChecking=no","-o","BatchMode=yes","-i",$sshKey)

Set-Location $root

# ---- 1. Git commit + push (triggers Vercel auto-deploy) ----------------------
if (-not $BackendOnly -and -not $SkipGit) {
    Write-Host "Pushing to GitHub (triggers Vercel deploy)..." -ForegroundColor Cyan
    git add -A
    $status = git status --porcelain 2>&1
    if ($status) {
        $msg = "Deploy $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
        git commit -m $msg 2>&1 | Where-Object { $_ -match "master|main|file|create|change" }
    }
    git push origin main 2>&1 | Where-Object { $_ -match "main -> main|error|Error" }
    Write-Host "  OK Pushed. Vercel will auto-deploy in ~30s." -ForegroundColor Green
    Write-Host "     https://arbitration-platform.vercel.app" -ForegroundColor DarkGray
}

# ---- 2. Push backend to Oracle VM -------------------------------------------
if (-not $FrontendOnly) {
    Write-Host "Uploading backend to Oracle VM..." -ForegroundColor Cyan
    & scp @so "$root\src\index.js" "${remote}:/home/opc/arbitration-platform/src/index.js" 2>&1 | Where-Object { $_ -notmatch "WARNING|post-quantum" }
    Write-Host "  OK Backend uploaded." -ForegroundColor Green

    Write-Host "Restarting PM2..." -ForegroundColor Cyan
    & ssh @so $remote "pm2 restart arbitration-backend --update-env 2>&1 | tail -1" 2>&1 | Where-Object { $_ -notmatch "WARNING|post-quantum" }
    Write-Host "  OK PM2 restarted." -ForegroundColor Green
}

# ---- 3. Health check --------------------------------------------------------
Write-Host "Health check..." -ForegroundColor Cyan
Start-Sleep -Seconds 3
try {
    $r = Invoke-WebRequest -Uri "http://152.70.201.154:3000/api/health" -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
    Write-Host "  OK Oracle VM online -- HTTP $($r.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "  WARN $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Done." -ForegroundColor Green
Write-Host "  Vercel (frontend) : https://arbitration-platform.vercel.app" -ForegroundColor DarkGray
Write-Host "  Oracle VM (API)   : http://152.70.201.154:3000" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Tips:" -ForegroundColor DarkGray
Write-Host "  .\ignore\deploy.ps1                  push everything (git + backend)" -ForegroundColor DarkGray
Write-Host "  .\ignore\deploy.ps1 -BackendOnly      Oracle VM backend only (no git push)" -ForegroundColor DarkGray
Write-Host "  .\ignore\deploy.ps1 -FrontendOnly     git push only (no backend restart)" -ForegroundColor DarkGray
Write-Host "  .\ignore\deploy.ps1 -SkipGit          Oracle VM only, no git push" -ForegroundColor DarkGray
