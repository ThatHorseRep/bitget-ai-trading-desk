$root = 'C:\Users\HP\Desktop\newBitgetProject'
$oldNewMap = @{
    'Bitget AI Trading Desk — RedTeam Risk Workbench' = 'Bitget AI RedTeam Desk'
    'Bitget AI Trading Desk' = 'Bitget AI RedTeam Desk'
    'RedTeam Risk Workbench' = 'Bitget AI RedTeam Desk'
    'RedTeam Desk' = 'Bitget AI RedTeam Desk'
}
# Get all target files, exclude generated folders
Get-ChildItem -Path $root -Recurse -File -Include *.md,*.tsx,*.ts,*.js,*.jsx,*.json |
    Where-Object { $_.FullName -notmatch '\\.next\\' -and $_.FullName -notmatch '\\node_modules\\' } |
    ForEach-Object {
        try {
            # Read file content as a single string (compatible with older PowerShell)
            $content = (Get-Content -Path $_.FullName -ErrorAction Stop) -join "`n"
            foreach ($pair in $oldNewMap.GetEnumerator()) {
                $escapedKey = [regex]::Escape($pair.Key)
                $content = $content -replace $escapedKey, $pair.Value
            }
            Set-Content -Path $_.FullName -Value $content -ErrorAction Stop
        } catch {
            Write-Host "Skipping file $($_.FullName): $_"
        }
    }
