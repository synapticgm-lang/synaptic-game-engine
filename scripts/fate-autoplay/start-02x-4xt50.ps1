$ErrorActionPreference = 'Continue'
$Root = Resolve-Path (Join-Path $PSScriptRoot '..\..')
Set-Location $Root
$logDir = Join-Path $Root 'scripts\fate-autoplay\runs\_detached-logs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$stamp = Get-Date -Format 'yyyy-MM-ddTHH-mm-ss'
$stdout = Join-Path $logDir "detached-02x-4xt50-$stamp.out.log"
$stderr = Join-Path $logDir "detached-02x-4xt50-$stamp.err.log"
$pidFile = Join-Path $logDir "detached-02x-4xt50-$stamp.pid"
$node = (Get-Command node -ErrorAction Stop).Source
$viteNode = Join-Path $Root 'node_modules\vite-node\vite-node.mjs'
$argString = '"' + $viteNode + '" --config vite.config.ts scripts/fate-autoplay/run02xFourModeT50.ts'
$p = Start-Process -FilePath $node -ArgumentList $argString -WorkingDirectory $Root -RedirectStandardOutput $stdout -RedirectStandardError $stderr -WindowStyle Hidden -PassThru
Set-Content -Path $pidFile -Value $p.Id -Encoding ascii
Write-Host "pid=$($p.Id)"
Write-Host "out=$stdout"
Write-Host "err=$stderr"
Write-Host "status=$(Join-Path $Root 'scripts\fate-autoplay\runs\rrr-4x-t50-02x-status.md')"
