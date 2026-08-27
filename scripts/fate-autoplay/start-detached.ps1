# Launch fate-autoplay outside the Cursor agent job tree so chat compact / shell
# reaping cannot kill a multi-hour batch.
#
# Usage (pass fate flags directly; no extra "--" needed):
#   powershell -File scripts/fate-autoplay/start-detached.ps1 -ModesAgents300 -Turns 300 -Seed 100
#   OR raw:
#   powershell -NoProfile -ExecutionPolicy Bypass -Command "& '.\scripts\fate-autoplay\start-detached.ps1' @('--modes-agents-300','--turns','300','--seed','100','--resume-dir',$batch)"

$ErrorActionPreference = 'Stop'
$Root = Resolve-Path (Join-Path $PSScriptRoot '..\..')
Set-Location $Root

# Prefer splatted args from caller; fall back to $args
$FateArgs = @()
if ($args.Count -gt 0) {
  $FateArgs = @($args)
  if ($FateArgs[0] -eq '--') {
    $FateArgs = @($FateArgs | Select-Object -Skip 1)
  }
}

if ($FateArgs.Count -eq 0) {
  throw "No fate-autoplay args. Example: @('--modes-agents-300','--turns','300','--seed','100')"
}

$stamp = Get-Date -Format 'yyyy-MM-ddTHH-mm-ss'
$logDir = Join-Path $Root 'scripts\fate-autoplay\runs\_detached-logs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$stdout = Join-Path $logDir "detached-$stamp.out.log"
$stderr = Join-Path $logDir "detached-$stamp.err.log"
$pidFile = Join-Path $logDir "detached-$stamp.pid"

$node = (Get-Command node -ErrorAction Stop).Source
$viteNode = Join-Path $Root 'node_modules\vite-node\vite-node.mjs'
if (-not (Test-Path $viteNode)) {
  throw "Missing $viteNode - run npm install (vite-node must be a local dep)."
}

$argList = @(
  "`"$viteNode`"",
  '--config',
  'vite.config.ts',
  'scripts/fate-autoplay/run.ts',
  '--'
) + ($FateArgs | ForEach-Object {
  if ($_ -match '\s') { "`"$_`"" } else { $_ }
})

Write-Host "Detached fate-autoplay starting..."
Write-Host "  cwd:  $Root"
Write-Host "  args: $($FateArgs -join ' ')"
Write-Host "  out:  $stdout"
Write-Host "  err:  $stderr"

# ArgumentList as a single string is more reliable on Windows PowerShell 5.1
$argString = $argList -join ' '
$p = Start-Process `
  -FilePath $node `
  -ArgumentList $argString `
  -WorkingDirectory $Root `
  -RedirectStandardOutput $stdout `
  -RedirectStandardError $stderr `
  -WindowStyle Hidden `
  -PassThru

Set-Content -Path $pidFile -Value $p.Id -Encoding ascii
Write-Host "  pid:  $($p.Id)  (saved $pidFile)"
Write-Host "Monitor: Get-Content '$stdout' -Wait -Tail 20"
exit 0
