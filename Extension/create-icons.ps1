# Create placeholder icons for Chrome Extension
$icon16 = "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABl0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC4xMkMEa+wAAAAnSURBVDhPY/wPBAxUAExUGzAKRsEoGAWjYBSMglEwCkbBKBgFVAEANj8CBAc9vQAAAAAASUVORK5CYII="
$icon48 = "iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABl0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC4xMkMEa+wAAABUSURBVGhD7doxDQAgDMDAHv/nHho+wlNJuQ4AAAD+wxIAAACWAAAAlgAAAJYAAACWAAAAlgAAAJYAAACWAAAAlgAAAJYAAACWAAAAfwZwAGD9AjS7xKB+AAAAAElFTkSuQmCC"
$icon128 = "iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABl0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC4xMkMEa+wAAABaSURBVHhe7dAxAQAACMCg+TfdjyAEigEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADgZwCWAAD+9gIAAAAASUVORK5CYII="

[System.IO.File]::WriteAllBytes("D:\nexus-ai-memory (8)\My_Revive\Extension\icons\icon16.png", [Convert]::FromBase64String($icon16))
[System.IO.File]::WriteAllBytes("D:\nexus-ai-memory (8)\My_Revive\Extension\icons\icon48.png", [Convert]::FromBase64String($icon48))
[System.IO.File]::WriteAllBytes("D:\nexus-ai-memory (8)\My_Revive\Extension\icons\icon128.png", [Convert]::FromBase64String($icon128))

Write-Host "✅ Icons created successfully!" -ForegroundColor Green
