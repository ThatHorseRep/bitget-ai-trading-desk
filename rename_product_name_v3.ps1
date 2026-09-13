$root = 'C:\Users\HP\Desktop\newBitgetProject'
$map = @{
    'Bitget AI Trading Desk — RedTeam Risk Workbench' = 'Bitget AI RedTeam Desk'
    'Bitget AI Trading Desk' = 'Bitget AI RedTeam Desk'
    'RedTeam Risk Workbench' = 'Bitget AI RedTeam Desk'
    'RedTeam Desk' = 'Bitget AI RedTeam Desk'
}
Get-ChildItem -Path $root -Recurse -File -Include *.md,*.tsx,*.ts,*.js,*.jsx,*.json |
    ForEach-Object {
        try {
            $text = Get-Content -Path $_.FullName -Raw -ErrorAction Stop
        } catch {
            $text = (Get-Content -Path $_.FullName -ErrorAction Stop) -join "`n"
        }
        foreach($kv in $map.GetEnumerator()){
            $escaped = [regex]::Escape($kv.Key)
            $text = $text -replace $escaped, $kv.Value
        }
        Set-Content -Path $_.FullName -Value $text -ErrorAction Stop
    }
