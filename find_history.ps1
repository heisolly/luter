$files = Get-ChildItem -Path $env:APPDATA\Trae\User\History -Recurse -ErrorAction SilentlyContinue | Where-Object { -not $_.PSIsContainer } | Sort-Object LastWriteTime -Descending | Select-Object -First 20
foreach ($f in $files) {
    Write-Host "$($f.Length) $($f.FullName)"
}