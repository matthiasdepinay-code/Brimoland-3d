# Le jalon J1 sur le PC, d'une traite : Git LFS, la compilation du module, les scripts de l'éditeur sans fenêtre, puis le banc des scripts.
# Dans PowerShell, à la racine du dépôt (l'éditeur fermé : Live Coding bloque la compilation) :
#   powershell -ExecutionPolicy Bypass -File outils\unreal\j1.ps1
# Options :
#   -Moteur C:\Unreal\UE_5.8   le dossier qui contient Engine (sinon, il est cherché sous C:\Unreal)
#   -SansImport                remonte le Jardin et l'encre sans refaire l'import des assets (un quart d'heure de moins)
#   -SansCompilation           saute la compilation du module
# Tout est écrit dans Unreal\Brimoland\Saved\J1 : resume.txt est ce qu'il faut m'envoyer (et editeur.log s'il y a un échec).
param([string]$Moteur = '', [switch]$SansImport, [switch]$SansCompilation)

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8   # les accents des journaux d'Unreal et du banc
$env:PYTHONUTF8 = '1'
$Depot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$Projet = Join-Path $Depot 'Unreal\Brimoland\Brimoland.uproject'
$Journaux = Join-Path $Depot 'Unreal\Brimoland\Saved\J1'
New-Item -ItemType Directory -Force -Path $Journaux | Out-Null
$Resume = Join-Path $Journaux 'resume.txt'
Set-Content -Path $Resume -Encoding UTF8 -Value ('J1, ' + (Get-Date -Format 'yyyy-MM-dd HH:mm'))
function Dire([string]$t) { Write-Host "[J1] $t" -ForegroundColor Cyan; Add-Content -Path $Resume -Encoding UTF8 -Value "[J1] $t" }
function Arreter([string]$t) { Dire "ARRÊT : $t"; Dire "Envoie-moi $Resume"; exit 1 }
function Extraire([string]$fichier, [string]$motif, [int]$n) {
  if (Test-Path $fichier) { Get-Content -Encoding UTF8 -Path $fichier | Select-String -Pattern $motif | Select-Object -First $n | ForEach-Object { $_.Line } | Add-Content -Path $Resume -Encoding UTF8 }
}

# ---------- le moteur ----------
if (-not $Moteur) {
  $cands = @('C:\Unreal') + @(Get-ChildItem 'C:\Unreal' -Directory -ErrorAction SilentlyContinue | ForEach-Object { $_.FullName; Get-ChildItem $_.FullName -Directory -ErrorAction SilentlyContinue | ForEach-Object { $_.FullName } })
  $Moteur = $cands | Where-Object { Test-Path (Join-Path $_ 'Engine\Build\BatchFiles\Build.bat') } | Select-Object -First 1
  if (-not $Moteur) { Arreter "Unreal introuvable sous C:\Unreal : relance avec -Moteur <le dossier qui contient Engine>" }
}
$Build = Join-Path $Moteur 'Engine\Build\BatchFiles\Build.bat'
$Editeur = Join-Path $Moteur 'Engine\Binaries\Win64\UnrealEditor-Cmd.exe'
$PythonUE = Join-Path $Moteur 'Engine\Binaries\ThirdParty\Python3\Win64\python.exe'
Dire "moteur : $Moteur"
Dire "projet : $Projet"

# ---------- 1. Git LFS ----------
Push-Location $Depot
try {
  $liste = @(git lfs ls-files)
  if ($LASTEXITCODE -ne 0) { Arreter 'Git LFS ne répond pas : installe Git pour Windows (Git LFS est dedans), puis : git lfs install' }
  $pointeurs = @($liste | Where-Object { $_ -match '^[0-9a-f]+ - ' }).Count
  if ($pointeurs -gt 0) {
    Dire "Git LFS : $pointeurs fichiers sur $($liste.Count) ne sont que des pointeurs : git lfs install, puis git lfs pull"
    git lfs install
    git lfs pull
    $liste = @(git lfs ls-files)
    $pointeurs = @($liste | Where-Object { $_ -match '^[0-9a-f]+ - ' }).Count
    if ($pointeurs -gt 0) { Arreter "Git LFS : $pointeurs fichiers manquent encore après git lfs pull" }
  }
  Dire "1. Git LFS : les $($liste.Count) fichiers sont là"
} finally { Pop-Location }

# ---------- 2. la compilation du module ----------
if ($SansCompilation) { Dire '2. compilation sautée (-SansCompilation)' }
else {
  $log = Join-Path $Journaux 'compilation.log'
  Dire '2. compilation : BrimolandEditor Win64 Development (quelques minutes la première fois)'
  & $Build BrimolandEditor Win64 Development "-Project=$Projet" -WaitMutex | Tee-Object -FilePath $log
  $code = $LASTEXITCODE
  Extraire $log '(?i)error|warning [A-Z]+[0-9]+|: warning' 80
  if ($code -ne 0) { Arreter "la compilation a échoué (code $code) : les erreurs sont ci-dessus, le détail dans $log" }
  Dire '2. compilation : réussie'
}

# ---------- 3. les scripts de l'éditeur, sans fenêtre ----------
$log = Join-Path $Journaux 'editeur.log'
if ($SansImport) { $env:BRIMO_SANS_IMPORT = '1' } else { Remove-Item Env:BRIMO_SANS_IMPORT -ErrorAction SilentlyContinue }
Dire ("3. scripts de l'éditeur : brimo_tout.py" + $(if ($SansImport) { ' (sans import)' } else { " (l'import compte un quart d'heure)" }))
$Motif = '\[Brimo\]|LogBrimo|LogPython: Error|Traceback|Failed to compile|error X[0-9]+|SceneTextureLookup'
$Script = Join-Path $Depot 'Unreal\Brimoland\Content\Python\brimo_tout.py'
& $Editeur $Projet -run=pythonscript "-script=$Script" -unattended -nosplash -nop4 -stdout -FullStdOutLogOutput "-ABSLOG=$log" |
  ForEach-Object { if ($_ -match $Motif) { Write-Host $_ } }
$code = $LASTEXITCODE
Dire "3. l'éditeur a rendu le code $code ; le journal complet : $log"
Extraire $log $Motif 300
Extraire $log '(?i)\berror\b' 60
$texte = if (Test-Path $log) { Get-Content -Raw -Encoding UTF8 -Path $log } else { '' }
if ($texte -match 'brimo\.essai : \d+ essences') { Dire '   la magie C++ répond (brimo.essai)' } else { Dire '   ATTENTION : brimo.essai ne répond pas (le module Brimoland est-il chargé ?)' }
if ($texte -match 'Failed to compile|error X[0-9]+') { Dire "   ATTENTION : un matériau ne compile pas (sans doute M_Encre) : voir RECETTE.md §8" }
if ($texte -notmatch 'J1 : tout est mont') { Arreter "les scripts de l'éditeur ne sont pas allés au bout : les lignes [Brimo] et l'erreur sont ci-dessus" }
Dire "3. scripts de l'éditeur : import, Jardin d'essai et encre montés"

# ---------- 4. le banc des scripts ----------
if (Test-Path $PythonUE) {
  & $PythonUE (Join-Path $Depot 'outils\unreal\tester_scripts.py') | Tee-Object -Variable banc | Out-Host
  $banc | Select-Object -Last 3 | Add-Content -Path $Resume -Encoding UTF8
  if ($LASTEXITCODE -ne 0) { Arreter 'le banc des scripts échoue' }
  Dire '4. le banc des scripts : tout est bon'
} else { Dire "4. le banc des scripts : Python d'Unreal introuvable ($PythonUE), sauté" }

Dire "J1 : fini. Ouvre Brimoland.uproject, puis le niveau /Game/Brimo/Cartes/L_Jardin_Essai, et règle l'encre (RECETTE.md §6)."
