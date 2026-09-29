# 28u T50: Thornferry Road + summoned-pact seed 58 x maxlevel/storyfollower/completionist.
# Hosted Free writer via gm-turn, Fate pick mode, loop auto-stop on (default), autoThumbs on (default).
$ErrorActionPreference = 'Continue'
Set-Location (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent)
Remove-Item Env:SGM_AUTOPLAY_LOOP_STOP -ErrorAction SilentlyContinue
$logDir = Join-Path (Get-Location) 'docs\orders\t50-28u-logs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$procs = @()
foreach ($bible in 'thornferry-road', 'summoned-pact') {
  foreach ($mode in 'maxlevel', 'storyfollower', 'completionist') {
    $tag = "$bible-$mode"
    $log = Join-Path $logDir "$tag.log"
    $cmdLine = "/c npm run fate-autoplay -- --turns 50 --seed 58 --bible $bible --writer default --pick-mode fate --ai-agent-mode $mode > `"$log`" 2>&1"
    $procs += @{ tag = $tag; p = (Start-Process -FilePath cmd.exe -ArgumentList $cmdLine -PassThru -WindowStyle Hidden) }
  }
}
foreach ($x in $procs) { $x.p.WaitForExit() }
foreach ($x in $procs) { Write-Output "$($x.tag) exit=$($x.p.ExitCode)" }
Write-Output 'T50 DONE'

