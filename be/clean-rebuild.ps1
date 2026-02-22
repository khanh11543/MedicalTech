# Script để clean và rebuild project Java Spring Boot với MapStruct + Lombok

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Clean and Rebuild MedicalTech Backend" -ForegroundColor Cyan  
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Xóa target folder
Write-Host "[1/5] Cleaning target folder..." -ForegroundColor Yellow
Remove-Item -Recurse -Force ".\target" -ErrorAction SilentlyContinue
Write-Host "Done: Target folder cleaned" -ForegroundColor Green

# 2. Xóa Eclipse project files
Write-Host "[2/5] Cleaning Eclipse project files..." -ForegroundColor Yellow
Remove-Item -Force ".classpath", ".project", ".factorypath" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force ".settings" -ErrorAction SilentlyContinue
Write-Host "Done: Eclipse files cleaned" -ForegroundColor Green

# 3. Skip VS Code cache (will be cleared on reload)
Write-Host "[3/5] VS Code Java cache will be cleared on reload" -ForegroundColor Gray

# 4. Maven clean compile
Write-Host "[4/5] Running Maven clean compile..." -ForegroundColor Yellow
.\mvnw.cmd clean compile
if ($LASTEXITCODE -eq 0) { 
    Write-Host "Done: Maven build successful" -ForegroundColor Green 
} else {
    Write-Host "Error: Maven build failed" -ForegroundColor Red
    exit 1
}

# 5. Verify generated files
Write-Host "[5/5] Verifying generated MapStruct files..." -ForegroundColor Yellow
$implFile = ".\target\generated-sources\annotations\com\q2k\meditech\dto\mapper\UserMapperImpl.java"
if (Test-Path $implFile) {
    Write-Host "Done: UserMapperImpl.java generated successfully" -ForegroundColor Green
} else {
    Write-Host "Warning: UserMapperImpl.java NOT found" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Clean and Rebuild completed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next: Reload VS Code Window" -ForegroundColor Yellow
Write-Host "  1. Press Ctrl+Shift+P" -ForegroundColor White
Write-Host "  2. Type: Developer: Reload Window" -ForegroundColor White
Write-Host "  3. Press Enter" -ForegroundColor White
Write-Host ""
