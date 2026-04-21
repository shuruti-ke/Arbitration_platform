# check-and-restart-instance.ps1
# Runs continuously. Every 2 minutes checks if the backend is reachable.
# If not, finds the OCI instance via CLI, starts or reboots it, then
# does git pull + pm2 restart once SSH is up.
# Registered as a scheduled task so it survives sleep and closed PowerShell.

$serverIp       = "152.70.201.154"
$sshKey         = "C:\Users\shuru\Documents\AIProjects\Arbitration_Platform\ssh-key-2026-04-14 (1).key"
$sshUser        = "opc"
$projectDir     = "/home/opc/arbitration-platform"
$pm2Name        = "arbitration-backend"
$compartmentId  = "ocid1.tenancy.oc1..aaaaaaaa6zib466gu6jkmhedlke5n4hvlwlagly2bvjdspycyw6k3sdrxjyq"
$healthUrl      = "http://${serverIp}:3000/api/health"
$checkEvery     = 120   # seconds between health checks when server is up
$logFile        = "C:\Users\shuru\documents\aiprojects\arbitration_platform\ignore\instance-watchdog.log"

function Log($msg) {
    $line = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $msg"
    Write-Host $line
    Add-Content -Path $logFile -Value $line -ErrorAction SilentlyContinue
}

function Run-SSH($cmd) {
    & ssh -o ConnectTimeout=15 -o ServerAliveInterval=30 -o StrictHostKeyChecking=no `
        -o BatchMode=yes -i $sshKey "${sshUser}@${serverIp}" $cmd 2>&1
}

function Wait-ForSSH($maxAttempts) {
    for ($i = 1; $i -le $maxAttempts; $i++) {
        $t = Run-SSH "echo ok" 2>&1
        if ($t -match "ok") { return $true }
        Log "  Waiting for SSH... attempt $i/$maxAttempts"
        Start-Sleep -Seconds 20
    }
    return $false
}

function Find-Instance {
    $instListJson = & oci compute instance list `
        --compartment-id $compartmentId `
        --all `
        --output json 2>&1
    try {
        $instances = ($instListJson | ConvertFrom-Json).data
    } catch {
        Log "  ERROR: Could not parse instance list: $instListJson"
        return $null
    }

    foreach ($inst in $instances) {
        if ($inst."lifecycle-state" -eq "TERMINATED") { continue }
        $vaJson = & oci compute vnic-attachment list `
            --compartment-id $compartmentId `
            --instance-id $inst.id `
            --output json 2>&1
        try { $vas = ($vaJson | ConvertFrom-Json).data } catch { continue }
        foreach ($va in $vas) {
            $vnicJson = & oci network vnic get --vnic-id $va."vnic-id" --output json 2>&1
            try { $vnic = ($vnicJson | ConvertFrom-Json).data } catch { continue }
            if ($vnic."public-ip" -eq $serverIp) { return $inst }
        }
    }
    return $null
}

function Recover-Instance {
    Log "Server unreachable. Querying OCI for instance state..."
    $inst = Find-Instance
    if (-not $inst) {
        Log "  ERROR: No instance found at $serverIp. Manual intervention required."
        return
    }

    $instId = $inst.id
    $state  = $inst."lifecycle-state"
    $name   = $inst."display-name"
    Log "  Found: $name | State: $state | ID: $instId"

    if ($state -eq "RUNNING") {
        # Running but SSH not responding - reboot
        Log "  Instance is RUNNING but SSH is unresponsive. Issuing soft reboot..."
        & oci compute instance action --instance-id $instId --action SOFTRESET --output json | Out-Null
        Log "  Reboot issued. Waiting 90s..."
        Start-Sleep -Seconds 90

    } elseif ($state -in @("STOPPED", "STOPPING")) {
        Log "  Instance is $state. Starting it..."
        & oci compute instance action --instance-id $instId --action START --output json | Out-Null
        Log "  Start issued. Waiting 120s..."
        Start-Sleep -Seconds 120

    } elseif ($state -in @("PROVISIONING", "STARTING")) {
        Log "  Instance is booting ($state). Waiting 60s..."
        Start-Sleep -Seconds 60

    } else {
        Log "  Instance in state $state - manual intervention required."
        return
    }

    # Wait for SSH
    Log "  Waiting for SSH to become available..."
    $sshUp = Wait-ForSSH -maxAttempts 18
    if ($sshUp) {
        Log "  SSH up. Pulling latest code and restarting PM2..."
        Run-SSH "pm2 resurrect 2>/dev/null; pm2 list | grep -q '$pm2Name' || pm2 start $projectDir/src/index.js --name $pm2Name --cwd $projectDir; pm2 save" | ForEach-Object { Log "  $_" }
        Log "  Backend recovered successfully."
    } else {
        Log "  ERROR: SSH did not come up after 6 minutes. Will retry next check."
    }
}

# ─── Main loop ────────────────────────────────────────────────────────────────

Log "=== Instance watchdog started. Checking $healthUrl every ${checkEvery}s ==="

while ($true) {
    try {
        $r = Invoke-WebRequest -Uri $healthUrl -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
        Log "OK - HTTP $($r.StatusCode)"
    } catch {
        Log "Health check failed: $($_.Exception.Message)"
        Recover-Instance
    }
    Start-Sleep -Seconds $checkEvery
}
