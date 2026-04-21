# OCI A1.Flex instance creation retry script
# Cycles through all availability domains until capacity is found

$compartmentId  = "ocid1.tenancy.oc1..aaaaaaaa6zib466gu6jkmhedlke5n4hvlwlagly2bvjdspycyw6k3sdrxjyq"
$subnetId       = "ocid1.subnet.oc1.iad.aaaaaaaabhkbafqeg2onwu2pqrxmpcfmoesld5lcgchztyprdxrs3cira4kq"
$imageId        = "ocid1.image.oc1.iad.aaaaaaaaxfcokbqtyp2of4lk43vb2uhf3ok3idgmvsfnvpotqd5ppg3nuwpa"
$sshPubKeyFile  = "C:\Users\shuru\Downloads\ssh-key-2026-04-18.key.pub"
$instanceName   = "arbitration-app-server"
$shape          = "VM.Standard.A1.Flex"
$oci            = "C:\Users\shuru\bin\oci.exe"
$ociConfig      = "C:\Users\shuru\.oci\config"
$ocpus          = 4
$memoryGb       = 24
$retryDelaySecs = 5
$logFile        = "C:\ProgramData\a1flex-retry.log"

$ads = @("JnCl:US-ASHBURN-AD-1", "JnCl:US-ASHBURN-AD-2", "JnCl:US-ASHBURN-AD-3")

# Write shape config to a temp file — PowerShell strips quotes when passing JSON to external exes
$shapeConfigFile = "$env:TEMP\oci-shape-config.json"
[System.IO.File]::WriteAllText($shapeConfigFile, ('{"ocpus":' + $ocpus + ',"memoryInGBs":' + $memoryGb + '}'))
$shapeConfig = "file://$shapeConfigFile"

function Log($msg) {
    $line = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $msg"
    Write-Output $line
    Add-Content -Path $logFile -Value $line -ErrorAction SilentlyContinue
}

Log "Starting A1.Flex retry loop - $ocpus OCPUs / $memoryGb GB across AD-1, AD-2, AD-3"
Log "Retrying every $retryDelaySecs seconds. Press Ctrl+C to stop."

while ($true) {
    foreach ($ad in $ads) {
        Log "Trying $ad..."

        $result = & $oci --config-file $ociConfig compute instance launch `
            --compartment-id $compartmentId `
            --display-name $instanceName `
            --availability-domain $ad `
            --shape $shape `
            --shape-config $shapeConfig `
            --image-id $imageId `
            --subnet-id $subnetId `
            --assign-public-ip true `
            --ssh-authorized-keys-file $sshPubKeyFile `
            2>&1

        if ($LASTEXITCODE -eq 0) {
            Log "SUCCESS! Instance created in $ad"
            Log ($result | Out-String)
            [Console]::Beep(1000, 500)
            [Console]::Beep(1000, 500)
            [Console]::Beep(1000, 500)
            exit 0
        } else {
            $errText = $result | Out-String
            if ($errText -match "Out of host capacity" -or $errText -match "timed out" -or $errText -match "RequestException") {
                Log "  No capacity in $ad - trying next..."
            } else {
                Log "  Unexpected error in ${ad}: $($errText.Trim())"
            }
        }
    }

    Log "All ADs full. Waiting $retryDelaySecs seconds..."
    Start-Sleep -Seconds $retryDelaySecs
}
