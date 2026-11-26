# Registers the nightly course fetch as a Windows scheduled task (current user, no admin needed).
# Runs daily at 7:20 pm local time (just after OpenGolfAPI's quota resets at midnight UTC), and as soon as
# possible after a missed run (e.g. the PC was asleep). The task deletes itself when the region is complete.
#
#   powershell -ExecutionPolicy Bypass -File scripts/courses/schedule-nightly.ps1 [-Region new-england]
param([string]$Region = 'new-england')

$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$node = (Get-Command node).Source
$taskName = 'GreensKeeper Course Fetch'

$action = New-ScheduledTaskAction -Execute $node -Argument "scripts\courses\nightly.mjs $Region" -WorkingDirectory $repo
$trigger = New-ScheduledTaskTrigger -Daily -At '7:20PM'
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit (New-TimeSpan -Hours 2)

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Description "Continue the $Region course fetch after the OpenGolfAPI quota resets, then import into Supabase. Removes itself when done." -Force | Out-Null
$t = Get-ScheduledTask -TaskName $taskName
"Registered '$taskName' ($($t.State)); next run: $((Get-ScheduledTaskInfo -TaskName $taskName).NextRunTime)"
