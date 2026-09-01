# Overnight curriculum ledger watcher
# Polls curriculum history.json / patch logs and refreshes OVERNIGHT-LEDGER.md + REPAIRS.md
# Usage: powershell -File scripts/fate-autoplay/overnight-ledger-watcher.ps1 -CurriculumRoot <path>
param(
  [Parameter(Mandatory = $true)][string]$CurriculumRoot,
  [int]$IntervalSec = 90
)

$ErrorActionPreference = 'Continue'
$Root = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$CurriculumRoot = Resolve-Path $CurriculumRoot
$ledgerPath = Join-Path $CurriculumRoot 'OVERNIGHT-LEDGER.md'
$repairsPath = Join-Path $CurriculumRoot 'REPAIRS.md'
$pidPath = Join-Path $CurriculumRoot 'ledger-watcher.pid'
Set-Content -Path $pidPath -Value $PID -Encoding ascii

function Get-History {
  $h = Join-Path $CurriculumRoot 'history.json'
  if (-not (Test-Path $h)) { return @() }
  try { return @(Get-Content $h -Raw | ConvertFrom-Json) } catch { return @() }
}

function Update-Ledger {
  $history = Get-History
  $planPath = Join-Path $CurriculumRoot 'plan.json'
  $plan = $null
  if (Test-Path $planPath) {
    try { $plan = Get-Content $planPath -Raw | ConvertFrom-Json } catch {}
  }
  $finalPath = Join-Path $CurriculumRoot 'final.json'
  $done = Test-Path $finalPath
  $now = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')

  $lines = @()
  $lines += '# Overnight ledger'
  $lines += ''
  $lines += "- Updated (UTC): $now"
  $lines += "- Curriculum root: ``$CurriculumRoot``"
  $lines += "- Done: $(if ($done) { 'yes (final.json present)' } else { 'running / in progress' })"
  if ($plan) {
    $lines += "- Writer: $($plan.writer)"
    $lines += "- Ladder: $($plan.ladder -join '->')"
    $lines += "- maxIters: $($plan.maxIters) (repair-until-clean per cell, then escalate only when ALL cells smooth)"
    $lines += "- Premades: $($plan.premades)"
  }
  $lines += ''
  $lines += '## Behavior notes'
  $lines += '- Dual review: story-standalone (Narration-only novel read) + game-vibe-pace (full tape).'
  $lines += '- Gemini pastes: ``dual-review/*__gemini-pro-PASTE.md`` written each review (no Gemini API call overnight).'
  $lines += '- Auto-improve allowlist ON; patches logged under each cell ``iter-N/patch.log``.'
  $lines += '- Mid writer OFF (curriculum stamps code-baseline.json).'
  $lines += '- If critics 429/DNS: review-deferred - cell treated smooth for ladder; morning Gemini still has pastes.'
  $lines += ''
  $lines += '## Cells'
  $lines += ''
  $lines += '| Tier | Bible | Mode | Smooth | Stop | P0 | Iters | Run dir |'
  $lines += '|------|-------|------|--------|------|----|-------|---------|'
  foreach ($c in $history) {
    $run = if ($c.runDir) { Split-Path $c.runDir -Leaf } else { '' }
    $p0 = if ($null -eq $c.p0) { '-' } else { $c.p0 }
    $lines += "| T$($c.tier) | $($c.bibleId) | $($c.engineMode) | $($c.smooth) | $($c.stop) | $p0 | $($c.iters) | ``$run`` |"
  }
  if (-not $history -or $history.Count -eq 0) {
    $lines += '| - | (waiting for first cell) | - | - | - | - | - | - |'
  }
  $lines += ''
  $lines += '## Free-hook call'
  $lines += 'See game-vibe-pace critic JSON / Gemini game paste per completed cell (Free day-1 hook quality).'
  $lines += ''
  $lines += '## Novel-score'
  $lines += 'If Flash Lite critic emits a numeric novel/story score, harvest from ``dual-review/story-standalone__*.md`` JSON; else morning Gemini judges Narration-only paste.'
  $lines += ''
  Set-Content -Path $ledgerPath -Value ($lines -join "`n") -Encoding utf8

  $repairLines = @()
  $repairLines += '# REPAIRS (chronological)'
  $repairLines += ''
  $repairLines += "Updated (UTC): $now"
  $repairLines += ''
  $iters = Get-ChildItem -Path $CurriculumRoot -Recurse -Filter 'patch.log' -ErrorAction SilentlyContinue | Sort-Object LastWriteTime
  if (-not $iters) {
    $repairLines += '_No patch.log files yet._'
  } else {
    foreach ($f in $iters) {
      $rel = $f.FullName.Substring($CurriculumRoot.Path.Length).TrimStart('\','/')
      $repairLines += "## ``$rel`` ($($f.LastWriteTime.ToUniversalTime().ToString('u')))"
      $repairLines += '```'
      $tail = Get-Content $f.FullName -ErrorAction SilentlyContinue | Select-Object -Last 80
      $repairLines += ($tail -join "`n")
      $repairLines += '```'
      $repairLines += ''
    }
  }
  Set-Content -Path $repairsPath -Value ($repairLines -join "`n") -Encoding utf8
}

Write-Host "[ledger-watcher] watching $CurriculumRoot every ${IntervalSec}s (pid $PID)"
Update-Ledger
while ($true) {
  Start-Sleep -Seconds $IntervalSec
  try { Update-Ledger } catch { Write-Host "[ledger-watcher] $($_.Exception.Message)" }
  if (Test-Path (Join-Path $CurriculumRoot 'final.json')) {
    Update-Ledger
    Write-Host '[ledger-watcher] final.json seen - exiting'
    break
  }
}
