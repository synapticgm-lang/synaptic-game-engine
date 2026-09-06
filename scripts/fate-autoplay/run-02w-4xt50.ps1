# 02w Lock A confirm: 4 flagship T50 writer-only, then Gemini paste packs.
# Does NOT call OpenRouter Gemini critic.
$ErrorActionPreference = 'Stop'
$Root = Resolve-Path (Join-Path $PSScriptRoot '..\..')
Set-Location $Root

$stamp = '2026-09-02w'
$outRoot = Join-Path $Root 'scripts\fate-autoplay\runs'
$pasteRoot = Join-Path $outRoot 'gemini-paste-2026-09-02w-t50'
$status = Join-Path $outRoot 'rrr-4x-t50-02w-status.md'
New-Item -ItemType Directory -Force -Path $outRoot | Out-Null
New-Item -ItemType Directory -Force -Path $pasteRoot | Out-Null

$cells = @(
  @{ Label = '01-LITRPG'; Engine = 'litrpg'; Bible = 'summoned-pact'; Personality = 'cold-system' }
  @{ Label = '02-DND'; Engine = 'dnd'; Bible = 'summoned-pact'; Personality = 'chilled-gm' }
  @{ Label = '03-RPG'; Engine = 'rpg'; Bible = 'summoned-pact'; Personality = 'chilled-gm' }
  @{ Label = '04-PYOA'; Engine = 'pyoa'; Bible = 'thornferry-road'; Personality = 'army-brief' }
)

function Write-Status([string]$msg) {
  $line = '[' + (Get-Date -Format o) + '] ' + $msg
  Add-Content -Path $status -Value $line
  Write-Host $line
}

Set-Content -Path $status -Value "# 02w 4xT50 writer-only (no OpenRouter Gemini critic)`r`n"
Write-Status ('start stamp=' + $stamp + ' seed=42 turns=50 writer=default')

$runDirs = @()
$i = 0
foreach ($c in $cells) {
  $i++
  Write-Status ('[' + $i + '/4] ' + $c.Label + ' ' + $c.Engine + ' ' + $c.Bible + ' ' + $c.Personality)
  $log = Join-Path $outRoot ('02w-' + $c.Label + '-t50.out.log')
  & npm run fate-autoplay -- --turns 50 --seed 42 --bible $c.Bible --personality $c.Personality --engine $c.Engine --writer default *>&1 | Tee-Object -FilePath $log
  if ($LASTEXITCODE -ne 0) {
    Write-Status ('FAIL ' + $c.Label + ' exit=' + $LASTEXITCODE + ' see ' + $log)
    exit $LASTEXITCODE
  }
  $done = Select-String -Path $log -Pattern 'Done . (.+)$' | Select-Object -Last 1
  if (-not $done) {
    Write-Status ('FAIL ' + $c.Label + ' no Done path in ' + $log)
    exit 2
  }
  $dir = $done.Matches[0].Groups[1].Value.Trim()
  $runDirs += $dir
  Write-Status ('  done ' + $dir)
}

Write-Status 'building Gemini paste packs (local files only)'
$pasteArgs = @()
foreach ($d in $runDirs) {
  $pasteArgs += @('--run-dir', $d)
}
$pasteArgs += @('--out', $pasteRoot)
& npm run fate-gemini-pastes -- @pasteArgs
if ($LASTEXITCODE -ne 0) {
  Write-Status ('FAIL paste packs exit=' + $LASTEXITCODE)
  exit $LASTEXITCODE
}

$names = @('01-LITRPG', '02-DND', '03-RPG', '04-PYOA')
for ($n = 0; $n -lt $runDirs.Count; $n++) {
  $src = Join-Path $runDirs[$n] 'dual-review\story-standalone__gemini-pro-PASTE.md'
  $dst = Join-Path $pasteRoot ($names[$n] + '__story-standalone__gemini-pro-PASTE.md')
  if (Test-Path $src) {
    Copy-Item $src $dst -Force
    Write-Status ('paste ' + $names[$n] + ' -> ' + $dst)
  } else {
    Write-Status ('WARN missing ' + $src)
  }
}

$readme = @(
  '# Paste these into Gemini (one chat per file)',
  '',
  'Story lens only. Do not use OpenRouter. Feed each file to Gemini yourself and send the reply back.',
  '',
  '1. 01-LITRPG__story-standalone__gemini-pro-PASTE.md',
  '2. 02-DND__story-standalone__gemini-pro-PASTE.md',
  '3. 03-RPG__story-standalone__gemini-pro-PASTE.md',
  '4. 04-PYOA__story-standalone__gemini-pro-PASTE.md',
  '',
  ('Stamp: ' + $stamp + ' seed 42, 50 turns, writer default, no Gemini critic API.')
)
Set-Content -Path (Join-Path $pasteRoot 'README-JOHN.md') -Value $readme

Write-Status ('ALL DONE pastes=' + $pasteRoot)
exit 0
