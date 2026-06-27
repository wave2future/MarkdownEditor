<#
.SYNOPSIS
  Tag the current version, build the Windows installer (if missing), and publish
  it to GitHub Releases. No GitHub CLI required -- the token is read from Git
  Credential Manager (the same one `git push` uses).

.USAGE
  npm run release:win              # build if needed, then tag + publish
  npm run release:win -- -Force    # force a clean rebuild of the installer

.NOTES
  Idempotent: re-running for the same version reuses the existing tag/release
  and replaces the uploaded asset instead of failing.
#>
param(
  [switch]$Force
)

$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

# git writes normal progress to stderr; under -ErrorActionPreference Stop that would
# be treated as a terminating error. Run git here and judge success by exit code only.
function Invoke-Git {
  param([Parameter(ValueFromRemainingArguments = $true)] [string[]] $GitArgs)
  $old = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  try {
    & git @GitArgs 2>&1 | ForEach-Object { Write-Host $_ }
    $code = $LASTEXITCODE
  } finally {
    $ErrorActionPreference = $old
  }
  if ($code -ne 0) { throw "git $($GitArgs -join ' ') failed (exit $code)" }
}

# Move to repo root (this script lives in scripts/)
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

# ---- Version and artifact paths ----
$version = (Get-Content package.json -Raw | ConvertFrom-Json).version
$tag = "v$version"
$installer = Join-Path $root "dist\Markdown Editor Setup $version Windows.exe"
$assetName = "Markdown.Editor.Setup.$version.Windows.exe"   # no spaces -> cleaner download link
Write-Host "Releasing $tag" -ForegroundColor Cyan

# ---- Parse owner/repo from the origin remote ----
$remote = (git remote get-url origin).Trim()
if ($remote -match 'github\.com[:/](.+?)(?:\.git)?$') {
  $repo = $Matches[1]
} else {
  throw "Cannot parse GitHub repo from origin: $remote"
}
Write-Host "Repo: $repo"

# ---- Build the installer (when missing or -Force) ----
if ($Force -or -not (Test-Path $installer)) {
  Write-Host "Building installer..." -ForegroundColor Yellow
  npm run dist:win
  if ($LASTEXITCODE -ne 0) { throw "electron-builder failed" }
}
if (-not (Test-Path $installer)) { throw "Installer not found: $installer" }
Write-Host ("Installer: {0} ({1} MB)" -f $installer, [math]::Round((Get-Item $installer).Length/1MB,1))

# ---- Create and push the tag (skip if it already exists) ----
git rev-parse -q --verify "refs/tags/$tag" *> $null
if ($LASTEXITCODE -ne 0) {
  Invoke-Git tag -a $tag -m "Markdown Editor $tag"
}
Invoke-Git push origin $tag

# ---- Read the GitHub token from Git Credential Manager (never printed) ----
# Requires PowerShell 7+ (pwsh); see the launcher in package.json's release:win.
$lines = "protocol=https`nhost=github.com`n`n" | git credential fill
$token = ($lines | Select-String '^password=' | Select-Object -First 1).ToString() -replace '^password=',''
if (-not $token) { throw "No GitHub token from credential manager (run 'git push' once to log in)" }
$apiHeaders = @{ Authorization = "token $token"; "User-Agent" = "md-editor-release"; Accept = "application/vnd.github+json" }
$upHeaders  = @{ Authorization = "token $token"; "User-Agent" = "md-editor-release" }

# ---- Find or create the Release ----
$rel = $null
try {
  $rel = Invoke-RestMethod -Method Get -Uri "https://api.github.com/repos/$repo/releases/tags/$tag" -Headers $apiHeaders
  Write-Host "Release already exists (id=$($rel.id)), reusing."
} catch {
  $body = @{
    tag_name   = $tag
    name       = "Markdown Editor $tag"
    body       = "Windows installer for Markdown Editor $tag.`n`nDefault install dir (per-user, selectable during setup): %LOCALAPPDATA%\Programs\Markdown Editor"
    draft      = $false
    prerelease = $false
  } | ConvertTo-Json
  $rel = Invoke-RestMethod -Method Post -Uri "https://api.github.com/repos/$repo/releases" -Headers $apiHeaders -Body $body -ContentType "application/json"
  Write-Host "Release created (id=$($rel.id))." -ForegroundColor Green
}

# ---- Replace the asset if one with the same name already exists ----
$existing = $rel.assets | Where-Object { $_.name -eq $assetName }
if ($existing) {
  Write-Host "Removing existing asset $assetName..."
  Invoke-RestMethod -Method Delete -Uri "https://api.github.com/repos/$repo/releases/assets/$($existing.id)" -Headers $apiHeaders | Out-Null
}

Write-Host "Uploading $assetName..." -ForegroundColor Yellow
$uploadUrl = "https://uploads.github.com/repos/$repo/releases/$($rel.id)/assets?name=$assetName"
$up = Invoke-RestMethod -Method Post -Uri $uploadUrl -Headers $upHeaders -ContentType "application/octet-stream" -InFile $installer
Write-Host ("Asset uploaded: {0}  state={1}  {2} MB" -f $up.name, $up.state, [math]::Round($up.size/1MB,1)) -ForegroundColor Green

Write-Host ""
Write-Host "Release URL: $($rel.html_url)" -ForegroundColor Cyan
