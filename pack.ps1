$ErrorActionPreference = "Stop"

npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Copying source files to dist/src..."
if (Test-Path dist/src) { Remove-Item -Recurse -Force dist/src }
New-Item -ItemType Directory -Force -Path dist/src | Out-Null
Copy-Item -Recurse -Path src/* -Destination dist/src/

Write-Host "Creating plugin.zip..."
$zipPath = Join-Path (Get-Location) "plugin.zip"
if (Test-Path $zipPath) { Remove-Item -Force $zipPath }
$distPath = Join-Path (Get-Location) "dist"
Compress-Archive -Path "$distPath\*" -DestinationPath $zipPath

Write-Host "plugin.zip created successfully!"
