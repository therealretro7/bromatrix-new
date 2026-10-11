@echo off
title Bromatrix Aerospace Lab - Local Server
echo ===================================================
echo   BROMATRIX AEROSPACE LAB - LOCAL SERVER
echo   Hosting 3D Hologram, 120-Frame Hero & Web Platform
echo ===================================================
echo.
echo Launching local server at http://localhost:8080/ ...
powershell -ExecutionPolicy Bypass -Command "& { $listener = New-Object System.Net.HttpListener; $listener.Prefixes.Add('http://localhost:8080/'); try { $listener.Start(); } catch { Write-Host 'Port 8080 busy, trying 8081...'; $listener = New-Object System.Net.HttpListener; $listener.Prefixes.Add('http://localhost:8081/'); $listener.Start(); }; Write-Host 'Server running!'; Start-Process ($listener.Prefixes | Select-Object -First 1); while ($listener.IsListening) { $ctx = $listener.GetContext(); [System.Threading.ThreadPool]::QueueUserWorkItem({ param($c) try { $req = $c.Request; $res = $c.Response; $res.Headers.Add('Access-Control-Allow-Origin', '*'); $p = $req.Url.LocalPath.TrimStart('/'); if ([string]::IsNullOrEmpty($p)) { $p = 'index.html' }; $p = [System.Uri]::UnescapeDataString($p); if (Test-Path $p -PathType Leaf) { $ext = [System.IO.Path]::GetExtension($p).ToLower(); $mimes = @{ '.html'='text/html'; '.css'='text/css'; '.js'='application/javascript'; '.json'='application/json'; '.png'='image/png'; '.jpg'='image/jpeg'; '.glb'='model/gltf-binary'; '.gltf'='model/gltf+json'; '.svg'='image/svg+xml' }; if ($mimes.ContainsKey($ext)) { $res.ContentType = $mimes[$ext] }; $bytes = [System.IO.File]::ReadAllBytes($p); $res.ContentLength64 = $bytes.Length; $res.OutputStream.Write($bytes, 0, $bytes.Length) } else { $res.StatusCode = 404 } } catch {} finally { try { $c.Response.Close() } catch {} } }, $ctx) } }"
pause
