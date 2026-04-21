# watchdog.ps1
# Polls the server every 30 seconds. If it's down, SSHes in and restarts PM2.

$serverIp   = "152.70.201.154"
$sshKey     = "C:\Users\shuru\Documents\AIProjects\Arbitration_Platform\ssh-key-2026-04-14 (1).key"
$healthUrl  = "http://$serverIp`:3000/api/health"
$checkEvery = 30
$logFile    = "C:\Users\shuru\documents\aiprojects\arbitration_platform\ignore\watchdog.log"

function Log($msg) {
    $line = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $msg"
    Add-Content -Path $logFile -Value $line -ErrorAction SilentlyContinue
}

Log "Watchdog started. Checking $healthUrl every $checkEvery seconds."

while ($true) {
    try {
        $response = Invoke-WebRequest -Uri $healthUrl -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
        Log "OK - HTTP $($response.StatusCode)"
    } catch {
        Log "Server down ($($_.Exception.Message)) - attempting restart..."

        $tmpKey = "$env:TEMP\oci_watchdog.key"
        Copy-Item -Path $sshKey -Destination $tmpKey -Force -ErrorAction SilentlyContinue

        $sshReady = $false
        for ($i = 0; $i -lt 20; $i++) {
            $test = & ssh -i $tmpKey -o StrictHostKeyChecking=no -o ConnectTimeout=10 -o BatchMode=yes "opc@$serverIp" "echo ready" 2>&1
            if ($test -match "ready") { $sshReady = $true; break }
            Log "  Waiting for SSH... ($i/20)"
            Start-Sleep -Seconds 15
        }

        if ($sshReady) {
            & ssh -i $tmpKey -o StrictHostKeyChecking=no "opc@$serverIp" "cd ~/arbitration-platform && pm2 resurrect 2>/dev/null || pm2 start src/index.js --name arbitration-platform; pm2 save" 2>&1 | Out-Null
            Log "Restart command sent."
        } else {
            Log "SSH unreachable - VM may still be booting."
        }
    }

    Start-Sleep -Seconds $checkEvery
}
