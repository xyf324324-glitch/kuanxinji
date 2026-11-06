param(
    [string]$UnsignedApk = 'reports/android-release/kuanxinji-1.0.0-unsigned.apk',
    [string]$OutputApk = 'public/downloads/android/kuanxinji-1.0.0.apk'
)
$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path $PSScriptRoot -Parent
$taskWorkspace = Split-Path $taskRoot -Parent
$taskTools = Join-Path $taskWorkspace '.tools/android-release'
$taskJava = Join-Path $taskTools 'jdk-17.0.20.1+1-jre/bin/java.exe'
$taskKeystore = Join-Path $taskTools 'signing/kuanxinji-release.p12'
$taskPasswordFile = Join-Path $taskTools 'signing/password.dpapi'
$taskSigner = Join-Path $taskRoot 'reports/android-release/apksigner.jar'
$taskInput = Join-Path $taskRoot $UnsignedApk
$taskOutput = Join-Path $taskRoot $OutputApk
foreach ($taskRequired in @($taskJava,$taskKeystore,$taskPasswordFile,$taskSigner,$taskInput)) {
    if (-not (Test-Path -LiteralPath $taskRequired)) { throw "Required file missing: $taskRequired" }
}
New-Item -ItemType Directory -Path (Split-Path $taskOutput) -Force | Out-Null
try {
    $taskProtected = [IO.File]::ReadAllBytes($taskPasswordFile)
    $env:KUANXIN_RELEASE_STOREPASS = [Text.Encoding]::UTF8.GetString([Security.Cryptography.ProtectedData]::Unprotect($taskProtected,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser))
    & $taskJava -jar $taskSigner sign --ks $taskKeystore --ks-key-alias kuanxinji-release --ks-pass env:KUANXIN_RELEASE_STOREPASS --key-pass env:KUANXIN_RELEASE_STOREPASS --out $taskOutput $taskInput
    if ($LASTEXITCODE -ne 0) { throw 'APK signing failed' }
    $taskVerification = (& $taskJava -jar $taskSigner verify --verbose --print-certs $taskOutput) -join "`n"
    if ($LASTEXITCODE -ne 0) { throw 'APK signature verification failed' }
    if (-not $taskVerification.Contains('b606170ba426079082f7af7a33a583e60ce03d78d4d88abfbdf8084d124e7a58')) { throw 'Unexpected release certificate; do not publish' }
    $taskVerification | Set-Content (Join-Path $taskRoot 'reports/android-release/signature.txt') -Encoding utf8
    $taskHash = (Get-FileHash -LiteralPath $taskOutput -Algorithm SHA256).Hash.ToLowerInvariant()
    Write-Output "Signed and verified: $OutputApk"
    Write-Output "SHA256: $taskHash"
} finally {
    Remove-Item Env:KUANXIN_RELEASE_STOREPASS -ErrorAction SilentlyContinue
}
