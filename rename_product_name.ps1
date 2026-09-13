$root = 'C:\Users\HP\Desktop\newBitgetProject'
$oldNewMap = @{
    'Bitget AI Trading Desk — RedTeam Risk Workbench' = 'Bitget AI RedTeam Desk'
    'Bitget AI Trading Desk' = 'Bitget AI RedTeam Desk'
    'RedTeam Risk Workbench' = 'Bitget AI RedTeam Desk'
    'RedTeam Desk' = 'Bitget AI RedTeam Desk'
}
Get-ChildItem -Path $root -Recurse -Include *.md,*.tsx,*.ts,*.js,*.jsx,*.json -File | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    foreach ($pair in $oldNewMap.GetEnumerator()) {
        $content = $content -replace [regex]::Escape($pair.Key), $pair.Value
    }
    Set-Content -Path $_.FullName -Value $content
}
