# UselfUnik Rebranding Migration Script (PowerShell)
# This script helps migrate from Uniqverse to UselfUnik branding

Write-Host "🚀 Starting UselfUnik Rebranding Migration..." -ForegroundColor Green

# Function to replace text in files
function Replace-InFiles {
    param(
        [string]$Search,
        [string]$Replace,
        [string[]]$Include
    )
    
    Write-Host "Replacing '$Search' with '$Replace'..." -ForegroundColor Yellow
    
    Get-ChildItem -Path "." -Recurse -Include $Include | ForEach-Object {
        if (-not $_.PSIsContainer) {
            try {
                $content = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue
                if ($content -and $content.Contains($Search)) {
                    $newContent = $content -replace [regex]::Escape($Search), $Replace
                    Set-Content $_.FullName -Value $newContent -NoNewline
                    Write-Host "  Updated: $($_.Name)" -ForegroundColor Cyan
                }
            }
            catch {
                Write-Host "  Skipped: $($_.Name) (Error: $($_.Exception.Message))" -ForegroundColor Red
            }
        }
    }
}

# Brand name replacements
Write-Host "📝 Updating brand names..." -ForegroundColor Magenta
Replace-InFiles -Search "Uniqverse" -Replace "UselfUnik" -Include @("*.tsx", "*.ts", "*.jsx", "*.js", "*.json", "*.html", "*.md")
Replace-InFiles -Search "uniqverse" -Replace "uselfunik" -Include @("*.tsx", "*.ts", "*.jsx", "*.js", "*.json", "*.html", "*.md")
Replace-InFiles -Search "UNIQVERSE" -Replace "USELFUNIK" -Include @("*.tsx", "*.ts", "*.jsx", "*.js", "*.json", "*.html", "*.md")

# Update taglines and descriptions
Write-Host "✨ Updating taglines..." -ForegroundColor Magenta
Replace-InFiles -Search "Unique Universe" -Replace "Be Uniquely You" -Include @("*.tsx", "*.ts", "*.jsx", "*.js", "*.json", "*.html", "*.md")
Replace-InFiles -Search "A unique universe of products" -Replace "Be Uniquely You" -Include @("*.tsx", "*.ts", "*.jsx", "*.js", "*.json", "*.html", "*.md")

# Update color references (gradual migration)
Write-Host "🎨 Updating color references..." -ForegroundColor Magenta
Replace-InFiles -Search "#6366F1" -Replace "#6C5CE7" -Include @("*.css", "*.scss", "*.tsx", "*.ts")
Replace-InFiles -Search "#8B5CF6" -Replace "#A29BFE" -Include @("*.css", "*.scss", "*.tsx", "*.ts")

# Update logo references
Write-Host "🖼️ Updating logo references..." -ForegroundColor Magenta
Replace-InFiles -Search "uniqverse-icon.svg" -Replace "uselfunik-icon.svg" -Include @("*.tsx", "*.ts", "*.jsx", "*.js", "*.html")
Replace-InFiles -Search "/logo.svg" -Replace "/uselfunik-logo.svg" -Include @("*.tsx", "*.ts", "*.jsx", "*.js", "*.html")

Write-Host "✅ Rebranding migration completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Yellow
Write-Host "1. Update components to use new logo files"
Write-Host "2. Test the application thoroughly"
Write-Host "3. Update external services (domain, social media)"
Write-Host "4. Deploy with new branding"
Write-Host ""
Write-Host "🎯 New brand assets created:" -ForegroundColor Cyan
Write-Host "- /public/uselfunik-logo.svg (primary logo)"
Write-Host "- /public/uselfunik-icon.svg (icon only)"
Write-Host "- /public/uselfunik-mono-black.svg (black version)"
Write-Host "- /public/uselfunik-mono-white.svg (white version)"
Write-Host "- /public/uselfunik-brand.css (brand styles)"
Write-Host "- /docs/USELFUNIK_BRAND_GUIDELINES.md (brand guidelines)"

Write-Host ""
Write-Host "🚀 Ready to launch UselfUnik - Be Uniquely You!" -ForegroundColor Green