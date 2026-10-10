from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
root=Path(__file__).parent
with ZipFile(root/'dist/afterglow-lan.zip','w',ZIP_DEFLATED) as archive:
    for p in (root/'dist').rglob('*'):
        if p.is_file() and p.suffix!='.zip': archive.write(p,p.relative_to(root))
    archive.write(root/'lan-server.mjs','lan-server.mjs')
    archive.writestr('README.txt','APEX AFTERGLOW - LAN EDITION\n\nInstall Node.js on the host computer.\nExtract this entire archive. Open a terminal in the extracted folder.\nRun: node lan-server.mjs\n\nThe terminal prints a localhost URL and the address for other computers.\nEveryone opens the host network address in their browser on the same LAN.\nClick LAN MULTIPLAYER. The host creates a room and shares its room code.\nOther players join with that code. The host starts the race. Up to six players.\nAI fills empty slots. Each player can choose a different car.\nIf Windows asks, allow Node.js on your private network.\nCtrl+C stops the server. No installation of npm packages is required.\n\nControls: W/A/S/D or arrows; Shift nitro; Space handbrake; P autopilot;\nR recover to last checkpoint; Escape pause (LAN host only).\n')
print('Created dist/afterglow-lan.zip')
