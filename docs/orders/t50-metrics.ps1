# t50-metrics.ps1 -Filter '*_s58' : one table row per run dir (turns, mean ms, no-progress, thumbs, places, level/xp, recycle flags, fallback)
param([Parameter(Mandatory)]$Filter)
Set-Location (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent)
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
  "{0}|{1}|{2}|{3}|{4}|{5}%|{6}/{7}/{8}|{9}|L{10} xp{11}|rec={12}|fb={13}|xpTurns={14}|end={15}" -f $_.Name, $s.bibleId, $s.aiAgentMode, $s.completedTurns, $s.latencyMs.mean, $t.circling.noProgressPct, $up, $down, $unc, $t.circling.distinctPlaces, $st.character.level, $st.character.xp, $rec, $s.pathCounts.E_fallback, $xpNotes, $st.playPhase
}
