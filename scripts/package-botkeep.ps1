$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Write-Host "Building client and server in $repoRoot..." -ForegroundColor Cyan
Set-Location $repoRoot

npm run build

Write-Host "Staging files for botkeep deployment..." -ForegroundColor Cyan
$stage = Join-Path $repoRoot ".deploy_staging"
if (Test-Path $stage) { Remove-Item -Recurse -Force $stage }
New-Item -ItemType Directory -Path "$stage\client", "$stage\server" -Force | Out-Null

Copy-Item (Join-Path $repoRoot "client\dist") "$stage\client\dist" -Recurse
Copy-Item (Join-Path $repoRoot "server\dist") "$stage\server\dist" -Recurse
Copy-Item (Join-Path $repoRoot "index.js") "$stage\index.js"

# Create a clean root package.json for Botkeep with all production dependencies directly included
$serverPkg = Get-Content (Join-Path $repoRoot "server\package.json") -Raw | ConvertFrom-Json
$deployPkg = [ordered]@{
  name = "chz-room"
  version = "1.0.0"
  private = $true
  main = "index.js"
  scripts = [ordered]@{
    start = "node index.js"
  }
  dependencies = $serverPkg.dependencies
}
$deployPkgJson = $deployPkg | ConvertTo-Json -Depth 5
[System.IO.File]::WriteAllText((Join-Path $stage "package.json"), $deployPkgJson)

$zipPath = Join-Path $repoRoot "botkeep-deploy.zip"
try {
  if (Test-Path $zipPath) { Remove-Item -Force $zipPath -ErrorAction Stop }
} catch {
  Write-Warning "botkeep-deploy.zip is locked by an external app (e.g. Bandizip). Creating botkeep-deploy-update.zip instead."
  $zipPath = Join-Path $repoRoot "botkeep-deploy-update.zip"
  if (Test-Path $zipPath) { Remove-Item -Force $zipPath }
}

Compress-Archive -Path "$stage\*" -DestinationPath $zipPath -Force
Remove-Item -Recurse -Force $stage

$fileSize = [math]::Round((Get-Item $zipPath).Length / 1KB, 2)
Write-Host "SUCCESS: Created $zipPath ($fileSize KB)" -ForegroundColor Green
