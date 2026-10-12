$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
foreach ($name in @('relay-api','relay-client')) {
  $path = Join-Path $root $name
  Push-Location $path
  try {
    if (-not (Test-Path '.git')) {
      git init --initial-branch=main | Out-Host
      if ($LASTEXITCODE -ne 0) { throw "git init failed in $name" }
      git add .
      # Avoid depending on global user.name/email for the disposable fixture.
      git -c user.name='RelayLab Fixture' -c user.email='fixture@relaylab.invalid' commit -m 'test: initial RelayLab fixture' | Out-Host
      if ($LASTEXITCODE -ne 0) { throw "git commit failed in $name" }
      Write-Host "Initialized $name" -ForegroundColor Green
    } else { Write-Host "Already a git repo: $name" }
  } finally { Pop-Location }
}
Write-Host 'Both projects are separate Git repositories.'
