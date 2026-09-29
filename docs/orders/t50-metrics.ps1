# t50-metrics.ps1 -Filter '*_s58' : one table row per run dir (turns, mean ms, no-progress, thumbs, places, level/xp, recycle flags, fallback,
# 28w tokens per turn in/out/cached, model calls per turn, estimated cost per turn from scripts/fate-autoplay/model-prices.json)
param([Parameter(Mandatory)]$Filter)
Set-Location (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent)
$prices = Get-Content scripts\fate-autoplay\model-prices.json -Raw -Encoding UTF8 | ConvertFrom-Json
function Get-Price($modelId) {
  if (-not $modelId) { return $null }
  foreach ($p in $prices.PSObject.Properties) { if ($p.Name -notlike '_*' -and $modelId.EndsWith($p.Name)) { return $p.Value } }
  return $null
}
function Get-Avg($xs) { $v = @($xs | ? { $null -ne $_ }); if ($v.Count) { [math]::Round((($v | Measure-Object -Sum).Sum / $v.Count), 1) } else { 'n/a' } }
Get-ChildItem scripts\fate-autoplay\runs -Directory -Filter $Filter | Sort-Object Name | ForEach-Object {
  $d = $_.FullName
  if (-not (Test-Path "$d\summary.json")) { return }
  $s = Get-Content "$d\summary.json" -Raw -Encoding UTF8 | ConvertFrom-Json
  $t = if (Test-Path "$d\thumbs.json") { Get-Content "$d\thumbs.json" -Raw -Encoding UTF8 | ConvertFrom-Json } else { $null }
  $snap = Get-Content "$d\snapshot.json" -Raw -Encoding UTF8 | ConvertFrom-Json
  $st = if ($snap.state) { $snap.state } else { $snap }
  $up = @($t.turns | ? { $_.verdict -eq 'up' }).Count
  $down = @($t.turns | ? { $_.verdict -eq 'down' }).Count
  $unc = @($t.turns | ? { $_.verdict -eq 'unclear' }).Count
  $rec = @($s.readabilityGate.violations | ? { $_.kind -match 'recycle|verbatim' }).Count
  $xpNotes = @(Get-Content "$d\turns.jsonl" -Encoding UTF8 | Select-String 'XP Gained' ).Count
  # 28w — a turn with no writer call costs 0; a turn with calls but no reported usage is left out (never estimated).
  $tin = @(); $tout = @(); $tcached = @(); $calls = @(); $cost = @(); $known = 0; $n = 0; $model = $null
  foreach ($line in Get-Content "$d\turns.jsonl" -Encoding UTF8) {
    if (-not $line.Trim()) { continue }
    $r = $line | ConvertFrom-Json
    if ($null -eq $r.turn) { continue }
    $n++
    $u = $r.writerUsage
    if (-not $u) {
      if ([int]$r.writerCalls -eq 0) { $known++; $tin += 0; $tout += 0; $tcached += 0; $calls += 0; $cost += 0 }
      continue
    }
    $known++
    if ($u.modelId) { $model = $u.modelId }
    $tin += $u.tokensIn; $tout += $u.tokensOut; $tcached += $u.tokensCached; $calls += $u.modelCalls
    $p = Get-Price $u.modelId
    if ($p -and $null -ne $u.tokensIn -and $null -ne $u.tokensOut) {
      $c = if ($null -ne $u.tokensCached) { [double]$u.tokensCached } else { 0 }
      $cost += ((([double]$u.tokensIn - $c) * $p.in) + ($c * $p.cached) + ([double]$u.tokensOut * $p.out)) / 1e6
    }
  }
  $costAvg = @($cost | ? { $null -ne $_ }); $costTxt = if ($costAvg.Count) { '$' + ('{0:N6}' -f (($costAvg | Measure-Object -Sum).Sum / $costAvg.Count)) } else { 'n/a' }
  "{0}|{1}|{2}|{3}|{4}|{5}%|{6}/{7}/{8}|{9}|L{10} xp{11}|rec={12}|fb={13}|xpTurns={14}|end={15}|tokIn={16}|tokOut={17}|tokCached={18}|calls={19}|cost/turn={20}|usageTurns={21}/{22}|model={23}" -f $_.Name, $s.bibleId, $s.aiAgentMode, $s.completedTurns, $s.latencyMs.mean, $t.circling.noProgressPct, $up, $down, $unc, $t.circling.distinctPlaces, $st.character.level, $st.character.xp, $rec, $s.pathCounts.E_fallback, $xpNotes, $st.playPhase, (Get-Avg $tin), (Get-Avg $tout), (Get-Avg $tcached), (Get-Avg $calls), $costTxt, $known, $n, $model
}
