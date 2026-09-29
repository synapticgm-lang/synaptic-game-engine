# T10 gate: one run per test game mode (PYOA is never tested; Thornferry Road plays as PYOA):
#   litrpg = summoned-pact s27, tabletop = cursed-keep s27, rpg = salt-road-heist s27
# (pick-mode fate, Free writer via edge gm-turn, loop stop off, --game-mode forces the mode).
# Prints one line per run: 'P0=<n>' (summary.json readabilityGate.p0Count; a run with no summary counts as P0=1).
# Set T10_DRY=1 to smoke the plumbing with --dry-run (no writer calls).
$ErrorActionPreference = 'Continue'
Set-Location (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent)
$env:SGM_AUTOPLAY_LOOP_STOP = 'off'
$dry = if ($env:T10_DRY) { ' --dry-run' } else { '' }
$runs = @(
  @{ tag = 'litrpg-sp-s27';   mode = 'litrpg';   bible = 'summoned-pact';   seed = 27 },
  @{ tag = 'tabletop-ck-s27'; mode = 'tabletop'; bible = 'cursed-keep';     seed = 27 },
  @{ tag = 'rpg-srh-s27';     mode = 'rpg';      bible = 'salt-road-heist'; seed = 27 }
)
$logDir = Join-Path (Get-Location) 'docs\orders\t10-logs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$procs = @()
foreach ($r in $runs) {
  $log = Join-Path $logDir "$($r.tag).log"
  $cmdLine = "/c npm run fate-autoplay -- --turns 10 --seed $($r.seed) --game-mode $($r.mode) --bible $($r.bible) --writer default --pick-mode fate$dry > `"$log`" 2>&1"
  $p = Start-Process -FilePath cmd.exe -ArgumentList $cmdLine -PassThru -WindowStyle Hidden
  $procs += @{ run = $r; log = $log; p = $p }
}
foreach ($x in $procs) { $x.p.WaitForExit() }
foreach ($x in $procs) {
  $p0 = 1
  $text = if (Test-Path $x.log) { Get-Content $x.log -Raw -Encoding UTF8 } else { '' }
  $m = [regex]::Matches($text, '"outDir":\s*"([^"]+)"')
  if ($m.Count -gt 0) {
    $dir = $m[$m.Count - 1].Groups[1].Value -replace '\\\\', '\'
    $sum = Join-Path $dir 'summary.json'
    if (Test-Path $sum) {
      $j = Get-Content $sum -Raw -Encoding UTF8 | ConvertFrom-Json
      if ($null -ne $j.readabilityGate -and $null -ne $j.readabilityGate.p0Count) { $p0 = [int]$j.readabilityGate.p0Count }
      elseif ($env:T10_DRY) { $p0 = 0 }
    }
    Write-Output "$($x.run.tag) dir=$dir"
  } else {
    Write-Output "$($x.run.tag) no run dir (see $($x.log))"
  }
  Write-Output "P0=$p0"
}
Remove-Item Env:SGM_AUTOPLAY_LOOP_STOP -ErrorAction SilentlyContinue
