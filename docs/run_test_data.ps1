# ========================================
# Run Test Data Script - MedicalTech
# ========================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  MedicalTech - Test Data Import" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$scriptPath = "$PSScriptRoot\comprehensive_test_data.sql"
$dbName = "medical_appointment_system"

# Check if SQL file exists
if (-not (Test-Path $scriptPath)) {
    Write-Host "ERROR: File not found: $scriptPath" -ForegroundColor Red
    exit 1
}

Write-Host "SQL File: $scriptPath" -ForegroundColor Green
Write-Host "Database: $dbName" -ForegroundColor Green
Write-Host ""

# Try to find MySQL executable
$mysqlPaths = @(
    "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe",
    "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe",
    "C:\xampp\mysql\bin\mysql.exe",
    "C:\wamp64\bin\mysql\mysql8.0.27\bin\mysql.exe"
)

$mysqlExe = $null
foreach ($path in $mysqlPaths) {
    if (Test-Path $path) {
        $mysqlExe = $path
        break
    }
}

if ($mysqlExe) {
    Write-Host "Found MySQL at: $mysqlExe" -ForegroundColor Green
    Write-Host ""
    Write-Host "Running script..." -ForegroundColor Yellow
    Write-Host ""
    
    # Run MySQL command
    & $mysqlExe -u root -p $dbName -e "source $scriptPath"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "  Test Data Import SUCCESSFUL!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "You can now login with:" -ForegroundColor Cyan
        Write-Host "  Email:    admin@meditech.com" -ForegroundColor White
        Write-Host "  Password: Test@123456" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "ERROR: Import failed!" -ForegroundColor Red
    }
} else {
    Write-Host "MySQL executable not found in common locations." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please import manually using MySQL Workbench:" -ForegroundColor Cyan
    Write-Host "  1. Open MySQL Workbench" -ForegroundColor White
    Write-Host "  2. Connect to '$dbName'" -ForegroundColor White
    Write-Host "  3. File > Open SQL Script" -ForegroundColor White
    Write-Host "  4. Select: $scriptPath" -ForegroundColor White
    Write-Host "  5. Click Execute (Lightning icon)" -ForegroundColor White
    Write-Host ""
    Write-Host "OR specify MySQL path manually:" -ForegroundColor Cyan
    Write-Host '  $mysqlPath = "C:\path\to\mysql.exe"' -ForegroundColor White
    Write-Host '  & $mysqlPath -u root -p medical_appointment_system < "$scriptPath"' -ForegroundColor White
    Write-Host ""
}

Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
