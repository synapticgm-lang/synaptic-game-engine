# Launch fate-curriculum outside the Cursor agent job tree.
# Usage:
#   powershell -File scripts/fate-autoplay/start-curriculum-detached.ps1 -- --ladder 50,100,200,300 --writer minimax

$ErrorActionPreference = 'Stop'
$Root = Resolve-Path (Join-Path $PSScriptRoot '..\..')
Set-Location $Root

$FateArgs = @()
if ($args.Count -gt 0) {
  $FateArgs = @($args)
  if ($FateArgs[0] -eq '--') {
    $FateArgs = @($FateArgs | Select-Object -Skip 1)
  }
}

if ($FateArgs.Count -eq 0) {
  $FateArgs = @('--ladder', '50,100,200,300', '--max-iters', '3', '--writer', 'minimax')
}

$stamp = Get-Date -Format 'yyyy-MM-ddTHH-mm-ss'
$logDir = Join-Path $Root 'scripts\fate-autoplay\runs\_detached-logs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$stdout = Join-Path $logDir "curriculum-$stamp.out.log"
$stderr = Join-Path $logDir "curriculum-$stamp.err.log"
$pidFile = Join-Path $logDir "curriculum-$stamp.pid"

$node = (Get-Command node -ErrorAction Stop).Source
$viteNode = Join-Path $Root 'node_modules\vite-node\vite-node.mjs'
if (-not (Test-Path $viteNode)) {
  throw "Missing $viteNode - run npm install."
}

$argList = @(
  "`"$viteNode`"",
  '--config',
  'vite.config.ts',
  'scripts/fate-autoplay/curriculumImprove.ts',
  '--'
) + ($FateArgs | ForEach-Object {
  if ($_ -match '\s') { "`"$_`"" } else { $_ }
})

Write-Host "Detached fate-curriculum starting..."
Write-Host "  cwd:  $Root"
Write-Host "  args: $($FateArgs -join ' ')"
Write-Host "  out:  $stdout"
Write-Host "  err:  $stderr"

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
Write-Host "Monitor: Get-Content '$stdout' -Wait -Tail 30"
exit 0
