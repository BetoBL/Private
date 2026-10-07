# Extrai valores, fórmulas, formatação condicional e definição dos gráficos de abas de uma planilha
# Excel (.xlsm/.xlsx) lendo direto os XMLs do arquivo: NÃO precisa do Excel, NÃO executa macros e
# funciona com abas ocultas/protegidas. Deixa o resultado em PARTES de texto para colar no chat.
#
# Uso (cole o bloco inteiro no PowerShell). Antes, opcionalmente:
#   $arq  = "C:\caminho\planilha-da-psicologa.xlsm"     (se vazio, procura "planilha*.xls*" na pasta do usuário)
#   $abas = "WAIS-III","WISC-IV"                (padrão)
# Ao final, digite:  P 1   P 2   P 3 ...   (cada comando copia uma parte para a área de transferência)

if (-not $arq) {
  $arq = (Get-ChildItem $env:USERPROFILE -Recurse -Filter "planilha*.xls*" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1).FullName
}
if (-not $abas) { $abas = @("WAIS-III", "WISC-IV") }
"Planilha: $arq"
if (-not $arq -or -not (Test-Path -LiteralPath $arq)) { throw "Planilha não encontrada. Defina `$arq com o caminho completo e rode de novo." }

Add-Type -AssemblyName System.IO.Compression.FileSystem
$tmp = Join-Path $env:TEMP "copia-export.zip"
Copy-Item -LiteralPath $arq -Destination $tmp -Force
$z = [IO.Compression.ZipFile]::OpenRead($tmp)
$NS_R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"

function Ler-Texto($nome) {
  $e = $z.GetEntry($nome); if (-not $e) { return $null }
  $sr = New-Object IO.StreamReader($e.Open(), [Text.Encoding]::UTF8); $t = $sr.ReadToEnd(); $sr.Close(); $t
}
function Resolver($baseDir, $alvo) {
  $partes = New-Object System.Collections.Generic.List[string]
  foreach ($p in (($baseDir.TrimEnd("/") + "/" + $alvo) -split "/")) {
    if ($p -eq "..") { if ($partes.Count) { $partes.RemoveAt($partes.Count - 1) } } elseif ($p -and $p -ne ".") { $partes.Add($p) }
  }
  $partes -join "/"
}
function Rels($caminhoParte) {   # devolve @{ rId = @{ tipo; alvo } } do arquivo .rels da parte
  $dir = Split-Path $caminhoParte -Parent; $dir = $dir -replace "\\", "/"
  $nome = Split-Path $caminhoParte -Leaf
  $xml = Ler-Texto "$dir/_rels/$nome.rels"
  $m = @{}
  if ($xml) { foreach ($x in ([regex]::Matches($xml, '<Relationship [^>]*>'))) {
    $id = [regex]::Match($x.Value, 'Id="([^"]+)"').Groups[1].Value
    $tp = [regex]::Match($x.Value, 'Type="([^"]+)"').Groups[1].Value
    $al = [regex]::Match($x.Value, 'Target="([^"]+)"').Groups[1].Value
    $m[$id] = @{ tipo = $tp; alvo = (Resolver $dir $al) }
  } }
  $m
}

# --- abas do livro
$wbXml = Ler-Texto "xl/workbook.xml"
$wbRels = Rels "xl/workbook.xml"
$todas = @()
foreach ($m in [regex]::Matches($wbXml, '<sheet [^>]*/>')) {
  $nome = [Net.WebUtility]::HtmlDecode([regex]::Match($m.Value, 'name="([^"]*)"').Groups[1].Value)
  $rid = [regex]::Match($m.Value, 'r:id="([^"]+)"').Groups[1].Value
  $estado = [regex]::Match($m.Value, 'state="([^"]+)"').Groups[1].Value
  $todas += [pscustomobject]@{ nome = $nome; parte = $wbRels[$rid].alvo; estado = $(if ($estado) { $estado } else { "visible" }) }
}
"O livro tem $($todas.Count) abas."

# --- textos compartilhados
$ss = New-Object System.Collections.Generic.List[string]
$e = $z.GetEntry("xl/sharedStrings.xml")
if ($e) {
  $rd = [Xml.XmlReader]::Create($e.Open())
  $ok = $rd.Read(); $sb = $null
  while ($ok) {
    if ($rd.NodeType -eq "Element" -and $rd.LocalName -eq "si") { $sb = New-Object Text.StringBuilder; $ok = $rd.Read() }
    elseif ($rd.NodeType -eq "Element" -and $rd.LocalName -eq "rPh") { $rd.Skip() }
    elseif ($rd.NodeType -eq "Element" -and $rd.LocalName -eq "t") { [void]$sb.Append($rd.ReadElementContentAsString()) }
    elseif ($rd.NodeType -eq "EndElement" -and $rd.LocalName -eq "si") { $ss.Add($sb.ToString()); $ok = $rd.Read() }
    else { $ok = $rd.Read() }
  }
  $rd.Close()
}
"$($ss.Count) textos compartilhados lidos."

function Letras-Coluna([int]$n) { $s = ""; while ($n -gt 0) { $m = ($n - 1) % 26; $s = [char](65 + $m) + $s; $n = [int][Math]::Floor(($n - 1) / 26) }; $s }

$saida = [ordered]@{}
foreach ($nome in $abas) {
  $aba = $todas | Where-Object { $_.nome -eq $nome } | Select-Object -First 1
  if (-not $aba) { "Aba '$nome' NAO ENCONTRADA"; $saida[$nome] = "NAO ENCONTRADA"; continue }
  $entry = $z.GetEntry($aba.parte)
  $cel = New-Object System.Collections.Generic.List[object]
  $merges = New-Object System.Collections.Generic.List[string]
  $cfs = New-Object System.Collections.Generic.List[string]
  $dim = $null; $drawRid = $null; $protegida = $false; $colunas = @()
  $rd = [Xml.XmlReader]::Create($entry.Open())
  $ok = $rd.Read()
  while ($ok) {
    if ($rd.NodeType -ne "Element") { $ok = $rd.Read(); continue }
    $ln = $rd.LocalName
    if ($ln -eq "c") {
      $addr = $rd.GetAttribute("r"); $t = $rd.GetAttribute("t"); $fx = $null; $val = $null; $fsi = $null
      if ($rd.IsEmptyElement) { $ok = $rd.Read(); continue }
      $d = $rd.Depth; [void]$rd.Read()
      while ($true) {
        if ($rd.NodeType -eq "EndElement" -and $rd.Depth -eq $d) { break }
        if ($rd.NodeType -eq "Element" -and $rd.LocalName -eq "f") {
          $ft = $rd.GetAttribute("t"); $si = $rd.GetAttribute("si"); $txt = $rd.ReadElementContentAsString()
          if ($ft -eq "shared") { $fsi = $si }
          if ($txt) { $fx = "=" + $txt } elseif ($ft -eq "shared") { $fx = "(fórmula compartilhada #$si)" }
          continue
        }
        if ($rd.NodeType -eq "Element" -and $rd.LocalName -eq "v") { $val = $rd.ReadElementContentAsString(); continue }
        if ($rd.NodeType -eq "Element" -and $rd.LocalName -eq "is") { $val = [regex]::Replace($rd.ReadInnerXml(), "<[^>]+>", ""); continue }
        [void]$rd.Read()
      }
      [void]$rd.Read(); $ok = $true
      if ($t -eq "s" -and $val -ne $null -and $val -ne "") { $val = $ss[[int]$val] }
      elseif ($t -eq "b") { $val = ($val -eq "1") }
      if (($null -ne $val -and "$val" -ne "") -or $fx) { $cel.Add([ordered]@{ c = $addr; v = $val; f = $fx; s = $fsi; t = $t }) }
      continue
    }
    if ($ln -eq "dimension") { $dim = $rd.GetAttribute("ref") }
    elseif ($ln -eq "mergeCell") { $merges.Add($rd.GetAttribute("ref")) }
    elseif ($ln -eq "sheetProtection") { $protegida = $true }
    elseif ($ln -eq "drawing") { $drawRid = $rd.GetAttribute("id", $NS_R) }
    elseif ($ln -eq "col") { $colunas += [ordered]@{ min = $rd.GetAttribute("min"); max = $rd.GetAttribute("max"); larg = $rd.GetAttribute("width"); oculta = $rd.GetAttribute("hidden") } }
    elseif ($ln -eq "conditionalFormatting") { $cfs.Add($rd.ReadOuterXml()); $ok = $true; continue }
    $ok = $rd.Read()
  }
  $rd.Close()

  # gráficos e desenhos da aba (XML bruto — compacta bem)
  $desenhos = @(); $graficos = @()
  if ($drawRid) {
    $relsAba = Rels $aba.parte
    $dparte = $relsAba[$drawRid].alvo
    if ($dparte) {
      $desenhos += [ordered]@{ parte = $dparte; xml = (Ler-Texto $dparte) }
      foreach ($r in (Rels $dparte).GetEnumerator()) {
        if ($r.Value.tipo -like "*/chart") { $graficos += [ordered]@{ parte = $r.Value.alvo; xml = (Ler-Texto $r.Value.alvo) } }
      }
    }
  }
  $saida[$nome] = [ordered]@{ estado = $aba.estado; protegida = $protegida; dimensao = $dim; mesclagens = $merges; colunas = $colunas
                              celulas = $cel; formatacaoCondicional = $cfs; desenhos = $desenhos; graficos = $graficos }
  "Aba {0} ({1}): dimensão {2}, {3} células, {4} gráfico(s), {5} regra(s) de formatação condicional" -f $nome, $aba.estado, $dim, $cel.Count, $graficos.Count, $cfs.Count
}
$z.Dispose(); Remove-Item -LiteralPath $tmp -Force -ErrorAction SilentlyContinue

$json = $saida | ConvertTo-Json -Depth 8 -Compress
$bytes = [Text.Encoding]::UTF8.GetBytes($json)
$ms = New-Object IO.MemoryStream
$gz = New-Object IO.Compression.GZipStream($ms, [IO.Compression.CompressionMode]::Compress)
$gz.Write($bytes, 0, $bytes.Length); $gz.Close()
$script:b64 = [Convert]::ToBase64String($ms.ToArray())
$script:tam = 18000
$script:n = [int][Math]::Ceiling($script:b64.Length / $script:tam)
$script:id = Get-Date -Format "HHmmss"
function P($i) {
  $ini = ($i - 1) * $script:tam
  $parte = $script:b64.Substring($ini, [Math]::Min($script:tam, $script:b64.Length - $ini))
  Set-Clipboard -Value ("#EXCEL {0} {1}/{2}`n{3}" -f $script:id, $i, $script:n, $parte)
  "Parte $i de $($script:n) copiada. Cole no chat." + $(if ($i -lt $script:n) { "  Depois digite: P $($i + 1)" } else { "  Era a última." })
}
""
"JSON: $($json.Length) caracteres -> $($script:b64.Length) comprimido -> $($script:n) parte(s)."
"Para começar, digite:  P 1"
