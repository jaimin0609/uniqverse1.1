#!/bin/bash
# UselfUnik Rebranding Migration Script
# This script helps migrate from Uniqverse to UselfUnik branding

echo "🚀 Starting UselfUnik Rebranding Migration..."

# Function to replace text in files
replace_in_files() {
    local search="$1"
    local replace="$2"
    local pattern="$3"
    
    echo "Replacing '$search' with '$replace' in $pattern files..."
    
    # Use PowerShell for Windows compatibility
    powershell -Command "
        Get-ChildItem -Path '.' -Recurse -Include $pattern | ForEach-Object {
            if (-not \$_.PSIsContainer) {
                (Get-Content \$_.FullName -Raw) -replace '$search', '$replace' | Set-Content \$_.FullName -NoNewline
            }
        }
    "
}

# Brand name replacements
echo "📝 Updating brand names..."
replace_in_files "Uniqverse" "UselfUnik" "*.tsx,*.ts,*.jsx,*.js,*.json,*.html,*.md"
replace_in_files "uniqverse" "uselfunik" "*.tsx,*.ts,*.jsx,*.js,*.json,*.html,*.md"
replace_in_files "UNIQVERSE" "USELFUNIK" "*.tsx,*.ts,*.jsx,*.js,*.json,*.html,*.md"

# Update taglines and descriptions
echo "✨ Updating taglines..."
replace_in_files "Unique Universe" "Be Uniquely You" "*.tsx,*.ts,*.jsx,*.js,*.json,*.html,*.md"
replace_in_files "A unique universe of products" "Be Uniquely You" "*.tsx,*.ts,*.jsx,*.js,*.json,*.html,*.md"

# Update color references (gradual migration)
echo "🎨 Updating color references..."
replace_in_files "#6366F1" "#6C5CE7" "*.css,*.scss,*.tsx,*.ts"
replace_in_files "#8B5CF6" "#A29BFE" "*.css,*.scss,*.tsx,*.ts"

# Update logo references
echo "🖼️ Updating logo references..."
replace_in_files "uniqverse-icon.svg" "uselfunik-icon.svg" "*.tsx,*.ts,*.jsx,*.js,*.html"
replace_in_files "/logo.svg" "/uselfunik-logo.svg" "*.tsx,*.ts,*.jsx,*.js,*.html"

echo "✅ Rebranding migration completed!"
echo ""
echo "📋 Next steps:"
echo "1. Update components to use new logo files"
echo "2. Test the application thoroughly"
echo "3. Update external services (domain, social media)"
echo "4. Deploy with new branding"
echo ""
echo "🎯 New brand assets created:"
echo "- /public/uselfunik-logo.svg (primary logo)"
echo "- /public/uselfunik-icon.svg (icon only)"
echo "- /public/uselfunik-mono-black.svg (black version)"
echo "- /public/uselfunik-mono-white.svg (white version)"
echo "- /public/uselfunik-brand.css (brand styles)"
echo "- /docs/USELFUNIK_BRAND_GUIDELINES.md (brand guidelines)"