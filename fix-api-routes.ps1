# PowerShell script to fix Next.js 15 API route params pattern

$files = @(
    "src\app\api\users\orders\[id]\route.ts",
    "src\app\api\users\orders\[id]\cancel\route.ts",
    "src\app\api\promotions\[id]\route.ts",
    "src\app\api\support\tickets\[id]\route.ts",
    "src\app\api\jobs\[id]\route.ts",
    "src\app\api\jobs\applications\[id]\route.ts",
    "src\app\api\events\[id]\route.ts",
    "src\app\api\blog-posts\slug\[slug]\route.ts",
    "src\app\api\blog-categories\slug\[slug]\route.ts",
    "src\app\api\orders\[orderId]\cancel-payment\route.ts",
    "src\app\api\coupons\[id]\route.ts"
)

foreach ($file in $files) {
    $fullPath = Join-Path $pwd $file
    if (Test-Path $fullPath) {
        Write-Host "Fixing $file..."
        
        # Read file content
        $content = Get-Content $fullPath -Raw
        
        # Replace id pattern
        $content = $content -replace '\{ params \}: \{ params: \{ id: string \} \}', '{ params }: { params: Promise<{ id: string }> }'
        
        # Replace slug pattern
        $content = $content -replace '\{ params \}: \{ params: \{ slug: string \} \}', '{ params }: { params: Promise<{ slug: string }> }'
        
        # Replace orderId pattern
        $content = $content -replace '\{ params \}: \{ params: \{ orderId: string \} \}', '{ params }: { params: Promise<{ orderId: string }> }'
        
        # Add resolvedParams await for each function
        $content = $content -replace '(\) \{\s*try \{)', ') {
    try {
        const resolvedParams = await params;'
        
        # Replace params.id with resolvedParams.id
        $content = $content -replace 'params\.id', 'resolvedParams.id'
        
        # Replace params.slug with resolvedParams.slug
        $content = $content -replace 'params\.slug', 'resolvedParams.slug'
        
        # Replace params.orderId with resolvedParams.orderId
        $content = $content -replace 'params\.orderId', 'resolvedParams.orderId'
        
        # Write back to file
        Set-Content $fullPath $content -NoNewline
        
        Write-Host "Fixed $file"
    }
    else {
        Write-Host "File not found: $file"
    }
}

Write-Host "All API routes fixed!"
