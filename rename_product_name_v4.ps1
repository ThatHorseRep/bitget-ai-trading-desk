$root = 'C:\Users\HP\Desktop\newBitgetProject'
$map = @{
    'Bitget AI Trading Desk — RedTeam Risk Workbench' = 'Bitget AI RedTeam Desk'
    'Bitget AI Trading Desk' = 'Bitget AI RedTeam Desk'
    'RedTeam Risk Workbench' = 'Bitget AI RedTeam Desk'
    'RedTeam Desk' = 'Bitget AI RedTeam Desk'
}
# Get all target files with the desired extensions, excluding common generated folders
Get-ChildItem -Path $root -Recurse -File |
    Where-Object { $_.FullName -notmatch '\\.next\\' -and $_.FullName -notmatch '\\node_modules\\' } |
    Where-Object { $_.Extension -in '.md', '.tsx', '.ts', '.js', '.jsx', '.json' } |
    ForEach-Object {
        try {
            # Read file content as a single string (compatible with older PowerShell)
            $content = (Get-Content -Path $_.FullName -ErrorAction Stop) -join "`n"
        } catch {
            Write-Host "Skipping unreadable file: $($_.FullName)"
            return
        }
        foreach ($kv in $map.GetEnumerator()) {
            $escaped = [regex]::Escape($kv.Key)
            $content = $content -replace $escaped, $kv.Value
        }
        try {
            Set-Content -Path $_.FullName -Value $content -ErrorAction Stop
        } catch {
            Write-Host "Failed to write file: $($_.FullName)"
        }
    }
