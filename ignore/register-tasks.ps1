# register-tasks.ps1
# Run once as Administrator.
# Tasks run as the current user — survives sleep and closed PowerShell sessions.

$scriptDir = "C:\Users\shuru\documents\aiprojects\arbitration_platform\ignore"
$currentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name

function Make-TaskXml($description, $scriptPath, $userId) {
    return @"
<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.4" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo>
    <Description>$description</Description>
  </RegistrationInfo>
  <Triggers>
    <BootTrigger><Enabled>true</Enabled></BootTrigger>
    <LogonTrigger><Enabled>true</Enabled></LogonTrigger>
    <EventTrigger>
      <Enabled>true</Enabled>
      <Subscription>&lt;QueryList&gt;&lt;Query Id="0" Path="System"&gt;&lt;Select Path="System"&gt;*[System[Provider[@Name='Microsoft-Windows-Power-Troubleshooter'] and EventID=1]]&lt;/Select&gt;&lt;/Query&gt;&lt;/QueryList&gt;</Subscription>
    </EventTrigger>
  </Triggers>
  <Principals>
    <Principal id="Author">
      <UserId>$userId</UserId>
      <LogonType>InteractiveToken</LogonType>
      <RunLevel>HighestAvailable</RunLevel>
    </Principal>
  </Principals>
  <Settings>
    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <AllowHardTerminate>true</AllowHardTerminate>
    <StartWhenAvailable>true</StartWhenAvailable>
    <RunOnlyIfNetworkAvailable>false</RunOnlyIfNetworkAvailable>
    <IdleSettings>
      <StopOnIdleEnd>false</StopOnIdleEnd>
      <RestartOnIdle>false</RestartOnIdle>
    </IdleSettings>
    <Enabled>true</Enabled>
    <Hidden>false</Hidden>
    <RunOnlyIfIdle>false</RunOnlyIfIdle>
    <WakeToRun>false</WakeToRun>
    <ExecutionTimeLimit>PT0S</ExecutionTimeLimit>
    <Priority>7</Priority>
    <RestartOnFailure>
      <Interval>PT1M</Interval>
      <Count>10</Count>
    </RestartOnFailure>
  </Settings>
  <Actions Context="Author">
    <Exec>
      <Command>powershell.exe</Command>
      <Arguments>-NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File "$scriptPath"</Arguments>
    </Exec>
  </Actions>
</Task>
"@
}

# ─── Watchdog ────────────────────────────────────────────────────────────────

$watchdogXml = Make-TaskXml "Arbitration platform watchdog" "$scriptDir\watchdog.ps1" $currentUser
Register-ScheduledTask -TaskName "ArbitrationWatchdog" -Xml $watchdogXml -Force | Out-Null
Start-ScheduledTask -TaskName "ArbitrationWatchdog"
Write-Host "Watchdog task registered and started." -ForegroundColor Green

# ─── A1.Flex Retry ───────────────────────────────────────────────────────────

$retryXml = Make-TaskXml "OCI A1.Flex instance creation retry" "$scriptDir\retry-create-instance.ps1" $currentUser
Register-ScheduledTask -TaskName "ArbitrationA1FlexRetry" -Xml $retryXml -Force | Out-Null
Start-ScheduledTask -TaskName "ArbitrationA1FlexRetry"
Write-Host "A1.Flex retry task registered and started." -ForegroundColor Green

# ─── Instance Watchdog (check OCI state + restart if stopped/hanging) ─────────

$instanceWatchdogXml = Make-TaskXml "OCI instance watchdog - restart if stopped or hanging" "$scriptDir\check-and-restart-instance.ps1" $currentUser
Register-ScheduledTask -TaskName "ArbitrationInstanceWatchdog" -Xml $instanceWatchdogXml -Force | Out-Null
Start-ScheduledTask -TaskName "ArbitrationInstanceWatchdog"
Write-Host "Instance watchdog task registered and started." -ForegroundColor Green

Write-Host "`nAll 3 tasks run as $currentUser -- survive sleep and closed PowerShell sessions." -ForegroundColor Cyan
Write-Host ""
Write-Host "To check status:"
Write-Host "  Get-ScheduledTask -TaskName 'ArbitrationA1FlexRetry'"
Write-Host "  Get-ScheduledTask -TaskName 'ArbitrationWatchdog'"
Write-Host "  Get-ScheduledTask -TaskName 'ArbitrationInstanceWatchdog'"
Write-Host ""
Write-Host "To stop:          Stop-ScheduledTask  -TaskName 'ArbitrationInstanceWatchdog'"
Write-Host "To remove all:    Unregister-ScheduledTask -TaskName 'ArbitrationA1FlexRetry','ArbitrationWatchdog','ArbitrationInstanceWatchdog' -Confirm:`$false"
Write-Host ""
Write-Host "Instance watchdog log: $scriptDir\instance-watchdog.log"
