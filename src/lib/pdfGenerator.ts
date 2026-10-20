/**
 * Minimalist PDF Generator (Pure JavaScript, valid PDF 1.4 output)
 * Menghasilkan file PDF standar tanpa memerlukan dependensi npm eksternal yang berat.
 */
export function generateSimplePdfBlob(title: string, lines: string[]): Blob {
  const sanitize = (text: string) =>
    text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')

  let stream = 'BT\n/F1 16 Tf\n50 780 Td\n(' + sanitize(title) + ') Tj\nET\n'
  stream += 'BT\n/F2 10 Tf\n50 755 Td\n(Telkom Indonesia - B2G Regional Dashboard) Tj\nET\n'
  stream += 'q\n0.8 0.8 0.8 RG\n1 w\n50 745 m 550 745 l\nS\nQ\n'

  let currentY = 720
  for (const line of lines) {
    if (!line.trim()) {
      currentY -= 12
      continue
    }
    const isBold = line.startsWith('#') || line.endsWith(':')
    const font = isBold ? '/F1 11 Tf' : '/F2 10 Tf'
    const cleanLine = line.replace(/^#+\s*/, '')
    stream += `BT\n${font}\n50 ${currentY} Td\n(${sanitize(cleanLine)}) Tj\nET\n`
    currentY -= 16
    if (currentY < 50) break
  }

  const streamLength = stream.length

  const objects = [
    `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`,
    `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`,
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj\n`,
    `4 0 obj\n<< /Length ${streamLength} >>\nstream\n${stream}\nendstream\nendobj\n`,
    `5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n`,
    `6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`,
  ]

  let pdfContent = '%PDF-1.4\n'
  const xrefOffsets = [0]

  for (const obj of objects) {
    xrefOffsets.push(pdfContent.length)
    pdfContent += obj
  }

  const startXref = pdfContent.length
  pdfContent += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  for (let i = 1; i <= objects.length; i++) {
    pdfContent += `${String(xrefOffsets[i]).padStart(10, '0')} 00000 n \n`
  }

  pdfContent += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`

  return new Blob([pdfContent], { type: 'application/pdf' })
}

export function downloadPdf(filename: string, title: string, lines: string[]) {
  const blob = generateSimplePdfBlob(title, lines)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
