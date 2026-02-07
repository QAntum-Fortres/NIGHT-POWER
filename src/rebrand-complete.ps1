# ═══════════════════════════════════════════════════════════════════════════════
# ⚛️ QANTUM COMPLETE REBRAND SCRIPT
# ═══════════════════════════════════════════════════════════════════════════════
# 
# Self-adjusting script - one execution, complete transformation
# @author dp | QAntum Labs
# @version 1.0.0
#
# ═══════════════════════════════════════════════════════════════════════════════

$ErrorActionPreference = "Continue"
$ProjectRoot = Split-Path -Parent $PSScriptRoot

Write-Host @"

    ██████╗  █████╗ ███╗   ██╗████████╗██╗   ██╗███╗   ███╗
   ██╔═══██╗██╔══██╗████╗  ██║╚══██╔══╝██║   ██║████╗ ████║
   ██║   ██║███████║██╔██╗ ██║   ██║   ██║   ██║██╔████╔██║
   ██║▄▄ ██║██╔══██║██║╚██╗██║   ██║   ██║   ██║██║╚██╔╝██║
   ╚██████╔╝██║  ██║██║ ╚████║   ██║   ╚██████╔╝██║ ╚═╝ ██║
    ╚══▀▀═╝ ╚═╝  ╚═╝╚═╝  ╚═══╝   ╚═╝    ╚═════╝ ╚═╝     ╚═╝

              ⚛️ COMPLETE REBRAND SCRIPT ⚛️
                    [ dp ] qantum labs

"@ -ForegroundColor Cyan

# ═══════════════════════════════════════════════════════════════════════════════
# CONFIGURATION - Single Source of Truth
# ═══════════════════════════════════════════════════════════════════════════════

$Config = @{
    NewVersion = "1.0.0"
    NewName = "QAntum"
    NewAuthor = "dp | QAntum Labs"
    NewTagline = "The Autonomous QA Agent"
    
    # Version patterns to replace
    VersionPatterns = @(
        "27\.2\.0", "27\.1\.0", "27\.0\.1", "27\.0\.0", "27\.0",
        "26\.0\.0", "26\.0", "25\.0\.0", "24\.0\.0"
    )
    
    # Codenames to remove
    Codenames = @(
        '"Antifragile"', '"ANTIFRAGILE"',
        '"INDESTRUCTIBLE"', '"Indestructible"',
        '"Ghost in the Machine"', '"GHOST IN THE MACHINE"',
        '"Zero-Detection Edition"'
    )
    
    # Text replacements
    Replacements = @{
        'v27.2.0' = 'v1.0.0'
        'v27.1.0' = 'v1.0.0'
        'v27.0.1' = 'v1.0.0'
        'v27.0.0' = 'v1.0.0'
        'v26.0.0' = 'v1.0.0'
        'v27.0' = 'v1.0.0'
        'v26.0' = 'v1.0.0'
        '@version 27.2.0' = '@version 1.0.0'
        '@version 27.1.0' = '@version 1.0.0'
        '@version 27.0.1' = '@version 1.0.0'
        '@version 27.0.0' = '@version 1.0.0'
        '@version 26.0.0' = '@version 1.0.0'
        "version: '27.2.0'" = "version: '1.0.0'"
        "version: '27.1.0'" = "version: '1.0.0'"
        "version: '27.0.0'" = "version: '1.0.0'"
        "version: '26.0.0'" = "version: '1.0.0'"
        'VERSION = ''27.2.0''' = "VERSION = '1.0.0'"
        'VERSION = ''27.1.0''' = "VERSION = '1.0.0'"
        "export const VERSION = '27.2.0'" = "export const VERSION = '1.0.0'"
        '@codename Antifragile' = '@codename Quantum'
        '@codename INDESTRUCTIBLE' = '@codename Quantum'
        '"Antifragile" Edition' = '"Quantum" Edition'
        '"INDESTRUCTIBLE"' = '"Quantum"'
        'v27.1.0 "Antifragile"' = 'v1.0.0 "Quantum"'
        'v27.0.1 "INDESTRUCTIBLE"' = 'v1.0.0 "Quantum"'
    }
    
    # File extensions to process
    Extensions = @("*.ts", "*.js", "*.json", "*.md")
    
    # Directories to skip
    SkipDirs = @("node_modules", "dist", ".git")
}

# ═══════════════════════════════════════════════════════════════════════════════
# STATISTICS
# ═══════════════════════════════════════════════════════════════════════════════

$Stats = @{
    FilesScanned = 0
    FilesModified = 0
    ReplacementsMade = 0
    Errors = 0
}

# ═══════════════════════════════════════════════════════════════════════════════
# FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

function Write-Step {
    param([string]$Message, [string]$Status = "...")
    $icon = switch ($Status) {
        "OK" { "✅" }
        "SKIP" { "⏭️" }
        "ERROR" { "❌" }
        default { "⏳" }
    }
    Write-Host "   $icon $Message" -ForegroundColor $(if ($Status -eq "ERROR") { "Red" } elseif ($Status -eq "OK") { "Green" } else { "White" })
}

function Process-File {
    param([string]$FilePath)
    
    $Stats.FilesScanned++
    $modified = $false
    
    try {
        $content = Get-Content $FilePath -Raw -ErrorAction Stop
        if (-not $content) { return }
        
        $originalContent = $content
        
        # Apply all replacements
        foreach ($key in $Config.Replacements.Keys) {
            if ($content -match [regex]::Escape($key)) {
                $content = $content -replace [regex]::Escape($key), $Config.Replacements[$key]
                $Stats.ReplacementsMade++
                $modified = $true
            }
        }
        
        # Additional regex replacements for version numbers
        # Match patterns like "27.1.0" or "27.0.0" standalone
        $versionRegex = '\b(27\.[0-2]\.[0-1]|26\.0\.0)\b'
        if ($content -match $versionRegex) {
            $content = $content -replace $versionRegex, '1.0.0'
            $Stats.ReplacementsMade++
            $modified = $true
        }
        
        if ($modified) {
            Set-Content $FilePath $content -NoNewline -ErrorAction Stop
            $Stats.FilesModified++
            return $true
        }
    }
    catch {
        $Stats.Errors++
        Write-Step "Error processing $FilePath : $_" "ERROR"
    }
    
    return $false
}

function Get-SourceFiles {
    param([string]$Path)
    
    $files = @()
    foreach ($ext in $Config.Extensions) {
        $found = Get-ChildItem -Path $Path -Filter $ext -Recurse -File -ErrorAction SilentlyContinue |
            Where-Object { 
                $skip = $false
                foreach ($dir in $Config.SkipDirs) {
                    if ($_.FullName -match [regex]::Escape($dir)) {
                        $skip = $true
                        break
                    }
                }
                -not $skip
            }
        $files += $found
    }
    return $files
}

# ═══════════════════════════════════════════════════════════════════════════════
# MAIN EXECUTION
# ═══════════════════════════════════════════════════════════════════════════════

Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor DarkGray
Write-Host "  PHASE 1: SCANNING PROJECT" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor DarkGray

$srcPath = Join-Path $ProjectRoot "src"
Write-Step "Scanning $srcPath"

$files = Get-SourceFiles -Path $srcPath
Write-Step "Found $($files.Count) source files" "OK"

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor DarkGray
Write-Host "  PHASE 2: APPLYING REPLACEMENTS" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor DarkGray

$modifiedFiles = @()
foreach ($file in $files) {
    $result = Process-File -FilePath $file.FullName
    if ($result) {
        $modifiedFiles += $file.Name
    }
}

if ($modifiedFiles.Count -gt 0) {
    Write-Host ""
    Write-Host "   Modified files:" -ForegroundColor Cyan
    $modifiedFiles | ForEach-Object { Write-Host "   - $_" -ForegroundColor DarkGray }
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor DarkGray
Write-Host "  PHASE 3: PROCESSING ROOT FILES" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor DarkGray

$rootFiles = @("package.json", "README.md", "CHANGELOG.md", "tsconfig.json")
foreach ($rootFile in $rootFiles) {
    $fullPath = Join-Path $ProjectRoot $rootFile
    if (Test-Path $fullPath) {
        $result = Process-File -FilePath $fullPath
        Write-Step "$rootFile" $(if ($result) { "OK" } else { "SKIP" })
    }
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor DarkGray
Write-Host "  PHASE 4: VERIFICATION" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor DarkGray

# Count remaining old versions
$remainingOld = (Get-ChildItem -Path $srcPath -Filter "*.ts" -Recurse | 
    Select-String -Pattern "v27|27\.[0-2]\.[0-1]|26\.0\.0" -ErrorAction SilentlyContinue).Count

Write-Step "Remaining old versions: $remainingOld" $(if ($remainingOld -eq 0) { "OK" } else { "..." })

# TypeScript check
Write-Step "Running TypeScript check..."
Push-Location $ProjectRoot
$tscResult = & npx tsc --noEmit 2>&1
Pop-Location

if ($LASTEXITCODE -eq 0) {
    Write-Step "TypeScript: 0 errors" "OK"
} else {
    Write-Step "TypeScript: Has errors" "ERROR"
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor DarkGray
Write-Host "  ⚛️ REBRAND COMPLETE" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor DarkGray
Write-Host ""
Write-Host "   📊 STATISTICS:" -ForegroundColor Cyan
Write-Host "   ├─ Files Scanned:    $($Stats.FilesScanned)" -ForegroundColor White
Write-Host "   ├─ Files Modified:   $($Stats.FilesModified)" -ForegroundColor White
Write-Host "   ├─ Replacements:     $($Stats.ReplacementsMade)" -ForegroundColor White
Write-Host "   └─ Errors:           $($Stats.Errors)" -ForegroundColor $(if ($Stats.Errors -gt 0) { "Red" } else { "Green" })
Write-Host ""
Write-Host "   [ dp ] qantum labs © 2025" -ForegroundColor DarkGray
Write-Host ""
