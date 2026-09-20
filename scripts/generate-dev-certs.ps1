$rootDir = Resolve-Path (Join-Path $PSScriptRoot "..")
$certDir = Join-Path $rootDir "certificates"
if (!(Test-Path $certDir)) {
    New-Item -ItemType Directory -Path $certDir | Out-Null
}

$certPath = Join-Path $certDir "dev-cert.pem"
$keyPath = Join-Path $certDir "dev-key.pem"

if ((Test-Path $certPath) -and (Test-Path $keyPath)) {
    Write-Host "Local dev certificates already exist in $certDir"
    exit 0
}

$opensslPath = "C:\Program Files\Git\usr\bin\openssl.exe"
if (!(Test-Path $opensslPath)) {
    $cmd = Get-Command openssl -ErrorAction SilentlyContinue
    if ($cmd) {
        $opensslPath = $cmd.Source
    } else {
        Write-Error "OpenSSL binary not found. Please ensure Git for Windows is installed."
        exit 1
    }
}

Write-Host "Generating local development HTTPS certificates for 10.62.127.58, localhost, 127.0.0.1..."
& $opensslPath req -x509 -newkey rsa:2048 -keyout $keyPath -out $certPath -days 365 -nodes -subj "/CN=10.62.127.58" -addext "subjectAltName=IP:10.62.127.58,DNS:localhost,IP:127.0.0.1"

Write-Host "Certificates generated successfully:"
Write-Host "  Certificate: $certPath"
Write-Host "  Private Key: $keyPath"
