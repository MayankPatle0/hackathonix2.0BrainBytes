
Add-Type -AssemblyName System.Drawing

function New-Icon {
    param (
        [int]$size,
        [string]$path
    )

    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

    # Colors
    $bgBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 15, 23, 42)) 
    $cyanColor = [System.Drawing.Color]::FromArgb(255, 6, 182, 212)
    $cyanPen = New-Object System.Drawing.Pen $cyanColor, ([float]$size / 12)
    $cyanBrush = New-Object System.Drawing.SolidBrush $cyanColor
    $whiteBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)

    # Draw Background Circle
    $g.FillEllipse($bgBrush, 1, 1, $size-2, $size-2)

    # Draw "Nexus" Symbol
    $cx = [float]$size / 2
    $cy = [float]$size / 2
    $r = [float]$size / 10 

    # Define 3 points
    $p1x = $cx
    $p1y = [float]$size * 0.25
    
    $p2x = [float]$size * 0.25
    $p2y = [float]$size * 0.65
    
    $p3x = [float]$size * 0.75
    $p3y = [float]$size * 0.65

    # Draw Connections (using coordinates directly to avoid PointF issues)
    $g.DrawLine($cyanPen, $p1x, $p1y, $p2x, $p2y)
    $g.DrawLine($cyanPen, $p2x, $p2y, $p3x, $p3y)
    $g.DrawLine($cyanPen, $p3x, $p3y, $p1x, $p1y)
    
    # Draw Central Node
    $coreR = [float]$size / 6
    $g.FillEllipse($whiteBrush, ($cx - $coreR), ($cy * 1.1 - $coreR), ($coreR*2), ($coreR*2))
    $g.DrawEllipse($cyanPen, ($cx - $coreR), ($cy * 1.1 - $coreR), ($coreR*2), ($coreR*2))

    # Draw Outer Nodes
    $g.FillEllipse($cyanBrush, ($p1x - $r), ($p1y - $r), ($r*2), ($r*2))
    $g.FillEllipse($cyanBrush, ($p2x - $r), ($p2y - $r), ($r*2), ($r*2))
    $g.FillEllipse($cyanBrush, ($p3x - $r), ($p3y - $r), ($r*2), ($r*2))

    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
}

$iconDir = "D:\nexus-ai-memory (8)\My_Revive\Extension\icons"
if (-not (Test-Path $iconDir)) { New-Item -ItemType Directory -Path $iconDir | Out-Null }

New-Icon -size 16 -path "$iconDir\icon16.png"
New-Icon -size 48 -path "$iconDir\icon48.png"
New-Icon -size 128 -path "$iconDir\icon128.png"

Write-Host "✨ High-quality Nexus icons generated successfully!" -ForegroundColor Cyan
