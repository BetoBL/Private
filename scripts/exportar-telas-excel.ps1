<#
.SYNOPSIS
  Exporta, de uma planilha Excel (.xlsm/.xlsx), as telas e os dados das abas escolhidas, para
  levar a outro computador. Não altera o arquivo original e não executa macros.

.DESCRIPTION
  Trabalha numa CÓPIA temporária da planilha (o original nunca é aberto). Abas ocultas são
  exibidas apenas nessa cópia. Para cada aba pedida gera, na pasta de saída:
    <aba>\graficos\*.png   cada gráfico da aba como imagem
    <aba>\aba.pdf          a área com conteúdo da aba como PDF (aparência geral)
    <aba>\aba.png          a mesma área como imagem (reserva, caso o PDF falhe)
    <aba>\celulas.json     células não vazias: endereço, valor e fórmula
  No final compacta tudo em telas-excel.zip, dentro da pasta de saída.

.PARAMETER Arquivo
  Caminho da planilha.
.PARAMETER Abas
  Nomes exatos das abas. Padrão: WAIS-III e WISC-IV.
.PARAMETER Saida
  Pasta de saída. Padrão: .\telas-excel
.PARAMETER ListarAbas
  Só mostra os nomes das abas (e se estão ocultas) e sai.
.PARAMETER SemCelulas
  Não exporta celulas.json (mais rápido).

.EXAMPLE
  .\exportar-telas-excel.ps1 -Arquivo "C:\Planilhas\planilha-da-psicologa.xlsm" -ListarAbas
  .\exportar-telas-excel.ps1 -Arquivo "C:\Planilhas\planilha-da-psicologa.xlsm" -Abas "WAIS-III","WISC-IV"
#>
param(
  [Parameter(Mandatory = $true)][string]$Arquivo,
  [string[]]$Abas = @("WAIS-III", "WISC-IV"),
  [string]$Saida = ".\telas-excel",
  [switch]$ListarAbas,
  [switch]$SemCelulas
)

$ErrorActionPreference = "Stop"
$LIMITE_CELULAS = 600000   # acima disso, pula celulas.json (a leitura travaria o Excel)

function Nome-Seguro([string]$s) { ($s -replace '[\\/:*?"<>|]', '_').Trim() }

function Letras-Coluna([int]$n) {
  $s = ""
  while ($n -gt 0) { $m = ($n - 1) % 26; $s = [char](65 + $m) + $s; $n = [int][Math]::Floor(($n - 1) / 26) }
  $s
}

# Última célula com conteúdo (valor ou fórmula). Evita UsedRange, que em planilhas formatadas até
# o fim da folha cobre milhões de células e derruba o Excel.
function Extensao-Real($ws) {
  $miss = [Type]::Missing
  $ultLinha = $ws.Cells.Find("*", $miss, -4123, 2, 1, 2)   # xlFormulas, xlPart, xlByRows, xlPrevious
  if ($null -eq $ultLinha) { return $null }
  $ultCol = $ws.Cells.Find("*", $miss, -4123, 2, 2, 2)     # xlByColumns
  return @{ Linhas = $ultLinha.Row; Colunas = $ultCol.Column }
}

if (-not (Test-Path -LiteralPath $Arquivo)) { throw "Arquivo não encontrado: $Arquivo" }
$origem = (Resolve-Path -LiteralPath $Arquivo).Path

$tmp = Join-Path $env:TEMP ("exportar-telas-" + [guid]::NewGuid().ToString("N") + [IO.Path]::GetExtension($origem))
Copy-Item -LiteralPath $origem -Destination $tmp

$xl = $null
$wb = $null
try {
  $xl = New-Object -ComObject Excel.Application
  $xl.Visible = $false
  $xl.DisplayAlerts = $false
  $xl.EnableEvents = $false          # não dispara Workbook_Open/eventos
  $xl.AutomationSecurity = 3         # msoAutomationSecurityForceDisable: macros desligadas
  $xl.ScreenUpdating = $false

  $wb = $xl.Workbooks.Open($tmp, 0, $false)   # UpdateLinks=0; cópia descartável, então pode ser gravável

  if ($ListarAbas) {
    "Abas de '$origem' ($($wb.Worksheets.Count)):"
    foreach ($ws in $wb.Worksheets) { "  {0}{1}" -f $ws.Name, $(if ($ws.Visible -ne -1) { "   (oculta)" } else { "" }) }
    return
  }

  $raiz = Join-Path (Resolve-Path -LiteralPath (New-Item -ItemType Directory -Force -Path $Saida)).Path "exportacao"
  if (Test-Path -LiteralPath $raiz) { Remove-Item -LiteralPath $raiz -Recurse -Force }
  New-Item -ItemType Directory -Force -Path $raiz | Out-Null

  $resumo = @()
  foreach ($nome in $Abas) {
    $ws = $null
    try { $ws = $wb.Worksheets.Item($nome) } catch { }
    if (-not $ws) { Write-Warning "Aba '$nome' não existe nesta planilha; pulando. (use -ListarAbas)"; $resumo += "$nome : NAO ENCONTRADA"; continue }

    $pasta = Join-Path $raiz (Nome-Seguro $nome)
    $pastaGraf = Join-Path $pasta "graficos"
    New-Item -ItemType Directory -Force -Path $pastaGraf | Out-Null
    Write-Host "== $nome"

    # Aba oculta não exporta PDF/imagem: exibe só na cópia.
    if ($ws.Visible -ne -1) { try { $ws.Visible = -1 } catch { Write-Warning "Não consegui exibir a aba oculta '$nome'." } }
    try { [void]$ws.Activate() } catch { }

    # 1) gráficos como PNG
    $nGraf = 0; $falhasGraf = 0
    $chartObjs = $ws.ChartObjects()
    for ($i = 1; $i -le $chartObjs.Count; $i++) {
      try {
        $co = $chartObjs.Item($i)
        $arq = Join-Path $pastaGraf ("grafico-{0:00}-{1}.png" -f $i, (Nome-Seguro $co.Name))
        [void]$co.Chart.Export($arq, "PNG")
        $nGraf++
      } catch { $falhasGraf++ }
    }

    $ext = Extensao-Real $ws
    $pdfOk = $false; $pngOk = $false; $nCel = 0
    if ($null -eq $ext) {
      Write-Warning "Aba '$nome' está vazia."
    } else {
      $rng = $ws.Range($ws.Cells.Item(1, 1), $ws.Cells.Item($ext.Linhas, $ext.Colunas))
      Write-Host ("   conteúdo: A1:{0}{1}" -f (Letras-Coluna $ext.Colunas), $ext.Linhas)

      # 2) PDF da área com conteúdo
      try {
        $ws.PageSetup.PrintArea = $rng.Address()
        [void]$ws.ExportAsFixedFormat(0, (Join-Path $pasta "aba.pdf"))
        $pdfOk = $true
      } catch { Write-Warning "PDF da aba '$nome' falhou: $($_.Exception.Message)" }

      # 2b) imagem da mesma área (reserva)
      try {
        $rng.CopyPicture(1, 2)    # xlScreen, xlBitmap
        $w = [Math]::Min($rng.Width, 2400); $h = [Math]::Min($rng.Height, 3200)
        $co = $ws.ChartObjects().Add(0, 0, $w, $h)
        [void]$co.Chart.Paste()
        [void]$co.Chart.Export((Join-Path $pasta "aba.png"), "PNG")
        $co.Delete()
        $pngOk = Test-Path -LiteralPath (Join-Path $pasta "aba.png")
      } catch { Write-Warning "Imagem da aba '$nome' falhou: $($_.Exception.Message)" }

      # 3) valores e fórmulas (células não vazias)
      if (-not $SemCelulas) {
        if ($ext.Linhas * $ext.Colunas -gt $LIMITE_CELULAS) {
          Write-Warning "Aba '$nome' tem área muito grande ($($ext.Linhas)x$($ext.Colunas)); celulas.json pulado."
        } else {
          $vals = $rng.Value2
          $forms = $rng.Formula
          $lista = New-Object System.Collections.Generic.List[object]
          if ($ext.Linhas -eq 1 -and $ext.Colunas -eq 1) {
            if ($null -ne $vals -and "$vals" -ne "") { $lista.Add([ordered]@{ c = "A1"; v = $vals; f = $(if ("$forms".StartsWith("=")) { "$forms" } else { $null }) }) }
          } else {
            for ($r = 1; $r -le $ext.Linhas; $r++) {
              for ($c = 1; $c -le $ext.Colunas; $c++) {
                $v = $vals[$r, $c]
                if ($null -eq $v -or "$v" -eq "") { continue }
                $f = $forms[$r, $c]
                $lista.Add([ordered]@{ c = ("{0}{1}" -f (Letras-Coluna $c), $r); v = $v; f = $(if ("$f".StartsWith("=")) { "$f" } else { $null }) })
              }
            }
          }
          $nCel = $lista.Count
          ($lista | ConvertTo-Json -Depth 4 -Compress) | Set-Content -LiteralPath (Join-Path $pasta "celulas.json") -Encoding UTF8
        }
      }
    }

    $linha = "{0} : {1} gráfico(s) PNG{2}, PDF {3}, imagem {4}, {5} célula(s)" -f $nome, $nGraf, $(if ($falhasGraf) { " ($falhasGraf falharam)" } else { "" }), $(if ($pdfOk) { "ok" } else { "FALHOU" }), $(if ($pngOk) { "ok" } else { "FALHOU" }), $nCel
    Write-Host "   $linha"
    $resumo += $linha
  }

  $resumo | Set-Content -LiteralPath (Join-Path $raiz "LEIAME.txt") -Encoding UTF8
  $zip = Join-Path (Split-Path $raiz -Parent) "telas-excel.zip"
  if (Test-Path -LiteralPath $zip) { Remove-Item -LiteralPath $zip -Force }
  Compress-Archive -Path (Join-Path $raiz "*") -DestinationPath $zip
  Write-Host ""
  Write-Host "Pronto. Traga este arquivo para o outro computador:"
  Write-Host "  $zip"
}
finally {
  if ($wb) { try { $wb.Close($false) } catch { } }
  if ($xl) { try { $xl.Quit() } catch { } ; [void][Runtime.InteropServices.Marshal]::ReleaseComObject($xl) }
  [GC]::Collect(); [GC]::WaitForPendingFinalizers()
  if (Test-Path -LiteralPath $tmp) { Remove-Item -LiteralPath $tmp -Force -ErrorAction SilentlyContinue }
}
