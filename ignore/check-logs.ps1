# check-logs.ps1
# Shows the latest log entries from all platform watchdog logs.
# Run in any PowerShell window. Use -Follow to tail live.

param(
    [int]$Lines  = 30,
    [switch]$Follow
)

$base    = "C:\Users\shuru\documents\aiprojects\arbitration_platform\ignore"
$sshKey  = "C:\Users\shuru\Documents\AIProjects\Arbitration_Platform\ssh-key-2026-04-14 (1).key"
$sshHost = "opc@152.70.201.154"

function Section($title) {
    Write-Host ""
    Write-Host ("=" * 60) -ForegroundColor DarkGray
    Write-Host "  $title" -ForegroundColor Cyan
    Write-Host ("=" * 60) -ForegroundColor DarkGray
}

function Show-Log($label, $path) {
    Section $label
    if (Test-Path $path) {
        Get-Content $path -Tail $Lines
    } else {
        Write-Host "  (log file not found: $path)" -ForegroundColor Yellow
    }
}

function Show-ServerStatus {
    Section "BACKEND SERVER STATUS"
    try {
        $response = Invoke-WebRequest -Uri "http://152.70.201.154:3000/api/health" -TimeoutSec 8 -UseBasicParsing -ErrorAction Stop
        Write-Host "  HTTP $($response.StatusCode) - " -NoNewline
        Write-Host "ONLINE" -ForegroundColor Green
        $body = $response.Content | ConvertFrom-Json -ErrorAction SilentlyContinue
        if ($body) {
            Write-Host "  Database : $($body.database)"
            Write-Host "  Timestamp: $($body.timestamp)"
        }
    } catch {
        Write-Host "  UNREACHABLE - $($_.Exception.Message)" -ForegroundColor Red
    }
}

function Show-PM2Status {
    Section "PM2 PROCESS STATUS (live from server)"
    try {
        $out = & ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -o BatchMode=yes `
            -i $sshKey $sshHost "pm2 list 2>/dev/null" 2>&1 | Where-Object { $_ -notmatch 'WARNING|banner|store now|post-quantum' }
        if ($out) { $out } else { Write-Host "  (no output — SSH may be unavailable)" -ForegroundColor Yellow }
    } catch {
        Write-Host "  SSH unreachable" -ForegroundColor Yellow
    }
}

# ─── One-shot snapshot ────────────────────────────────────────────────────────
if (-not $Follow) {
    Show-ServerStatus
    Show-PM2Status
    Show-Log "INSTANCE WATCHDOG  (OCI start/reboot + PM2 restart)" "$base\instance-watchdog.log"
    Show-Log "PM2 HEALTH WATCHDOG  (API health + PM2 restart)"     "$base\watchdog.log"

    $bootLog = "\\wsl$\Ubuntu\home\opc\pm2-boot.log"  # not local; skip if absent
    if (Test-Path "$base\pm2-boot.log") { Show-Log "PM2 BOOT LOG" "$base\pm2-boot.log" }

    Write-Host ""
    Write-Host "Tip: run with -Follow to tail instance-watchdog live." -ForegroundColor DarkGray
    Write-Host "Tip: run with -Lines 50 to see more history." -ForegroundColor DarkGray
    Write-Host ""
    exit
}

# ─── Live follow mode (-Follow) ───────────────────────────────────────────────
Write-Host ""
Write-Host "Following instance-watchdog.log  (Ctrl+C to stop)" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor DarkGray
Get-Content "$base\instance-watchdog.log" -Tail $Lines -Wait
