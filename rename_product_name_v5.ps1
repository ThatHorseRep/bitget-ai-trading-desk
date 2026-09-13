$root = 'C:\Users\HP\Desktop\newBitgetProject'
$oldNew = @{
    'Bitget AI Trading Desk — RedTeam Risk Workbench' = 'Bitget AI RedTeam Desk'
    'Bitget AI Trading Desk' = 'Bitget AI RedTeam Desk'
    'RedTeam Risk Workbench' = 'Bitget AI RedTeam Desk'
    'RedTeam Desk' = 'Bitget AI RedTeam Desk'
}
# Find target files, exclude generated folders
Get-ChildItem -Path $root -Recurse -Include *.md,*.tsx,*.ts,*.js,*.jsx,*.json -File \
    -Exclude '*\\node_modules\\*','*\\.next\\*' | ForEach-Object {
        $path = $_.FullName
        try {
            $content = Get-Content -Path $path -Raw -ErrorAction Stop
        } catch {
            # Fallback for older PowerShell where -Raw may not be supported
            $content = (Get-Content -Path $path -ErrorAction Stop) -join "`n"
        }
        foreach ($kv in $oldNew.GetEnumerator()) {
            $escaped = [regex]::Escape($kv.Key)
            $content = $content -replace $escaped, $kv.Value
        }
        Set-Content -Path $path -Value $content -Force -ErrorAction Stop
    }
