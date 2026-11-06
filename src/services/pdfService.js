import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { rupeesInWords } from '../utils/numberToWords'
const money = n => `Rs. ${Number(n || 0).toFixed(2)}`
const asDataUrl = async value => {
  if (!value || value.startsWith('data:')) return value
  const blob = await fetch(value).then(response => response.blob())
  return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(blob) })
}
const imageFormat = value => value?.startsWith('data:image/jpeg') || value?.startsWith('data:image/jpg') ? 'JPEG' : 'PNG'
export async function downloadInvoice(bill, settings, totals) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' }); const left=12, right=198
  const logo = await asDataUrl(settings.logo); const signature = await asDataUrl(settings.signature)
  doc.setTextColor(20,20,20); doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.text((bill.invoiceType || settings.invoiceType).toUpperCase(), left, 12)
  if (logo) { try { doc.addImage(logo, imageFormat(logo), left, 21, 35, 21) } catch { /* retain text-based fallback */ } }
  doc.setFont('helvetica','bold'); doc.setFontSize(19); doc.text(settings.name, 51, 28)
  doc.setFont('helvetica','normal'); doc.setFontSize(8.5); doc.text(settings.address, 51, 35); doc.setFont('helvetica','bold'); doc.text(`Mobile:  ${settings.mobile}`, 51, 40)
  doc.setFillColor(0,0,0); doc.rect(left, 52, right-left, 2, 'F'); doc.setFillColor(229,229,229); doc.rect(left, 54, right-left, 13, 'F')
  doc.setFontSize(9); doc.setFont('helvetica','bold'); doc.text('Invoice No.:', 16, 61.5); doc.setFont('helvetica','normal'); doc.text(String(bill.invoiceNo), 38, 61.5)
  doc.setFont('helvetica','bold'); doc.text('Invoice Date:', 80, 61.5); doc.setFont('helvetica','normal'); doc.text(bill.date, 105, 61.5)
  doc.setFont('helvetica','bold'); doc.text('Due Date:', 157, 61.5); doc.setFont('helvetica','normal'); doc.text(bill.dueDate || '—', 176, 61.5)
  doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.text('BILL TO', left, 75); doc.setFontSize(9); doc.text(bill.customer.name || 'Walk-in Customer', left, 82)
  doc.setFont('helvetica','normal'); doc.text(bill.customer.mobile ? `Mobile:  ${bill.customer.mobile}` : '', left, 88); if (bill.customer.address) doc.text(bill.customer.address, left, 94, { maxWidth: 100 })
  const tableY = bill.customer.address ? 101 : 94
  autoTable(doc,{ startY:tableY, margin:{left,right:12}, head:[['ITEMS','QTY.','RATE','AMOUNT']], body:bill.items.map(x=>[x.name,`${Number(x.quantity).toFixed(2).replace(/\.00$/,'')} ${x.unit}`,Number(x.rate).toFixed(2).replace(/\.00$/,''),Number(x.quantity||0)*Number(x.rate||0)*(1-Number(x.discount||0)/100)]), theme:'plain', headStyles:{fillColor:[255,255,255],textColor:[15,15,15],fontStyle:'bold',lineWidth:.5,lineColor:[0,0,0],fontSize:9,cellPadding:3}, styles:{fontSize:8.5,cellPadding:3,lineColor:[220,220,220],lineWidth:.2}, columnStyles:{0:{cellWidth:94},1:{cellWidth:33,halign:'left'},2:{cellWidth:28,halign:'right'},3:{cellWidth:31,halign:'right'}}, didDrawCell(data){ if (data.section === 'head' && data.row.index === 0) { doc.setDrawColor(0); doc.setLineWidth(.5); doc.line(left, data.cell.y, right, data.cell.y); doc.line(left, data.cell.y+data.cell.height, right, data.cell.y+data.cell.height) } } })
  let y = Math.max(doc.lastAutoTable.finalY + 30, 165); doc.setDrawColor(0); doc.setLineWidth(.45); doc.line(left,y,right,y); y+=7
  doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.text('SUBTOTAL', 14, y); doc.text(`${bill.items.reduce((n,x)=>n+Number(x.quantity||0),0).toFixed(2).replace(/\.00$/,'')}`, 118, y, {align:'right'}); doc.text(money(totals.subtotal), right-2, y, {align:'right'}); y+=5; doc.line(left,y,right,y)
  const totalX=134; y+=9; doc.setFontSize(8.5); const amountLines=[['Discount',-totals.discount],['GST',totals.gst],['Additional charges',totals.additional],['Round off',totals.rounding],['Total Amount',totals.grand],['Received Amount',bill.received],['Balance Due',Math.max(0, totals.grand-Number(bill.received||0))]]
  amountLines.forEach(([label,value], index)=>{ if(index<4 && Math.abs(Number(value))<.005)return; doc.setFont('helvetica', index===4?'bold':'normal'); doc.text(label, totalX+31, y, {align:'right'}); doc.text(money(value), right-2, y,{align:'right'}); doc.setDrawColor(150); doc.setLineWidth(.15); doc.line(totalX,y+3,right,y+3); y+=6 })
  const termsY = y-35; doc.setFont('helvetica','bold'); doc.text('TERMS AND CONDITIONS', left+2, termsY); doc.setFont('helvetica','normal'); doc.text(`1. ${settings.terms}`, left+2, termsY+6, {maxWidth:112})
  y+=5; doc.setFont('helvetica','bold'); doc.text('Total Amount (in words)',right-2,y,{align:'right'}); doc.setFont('helvetica','normal'); doc.text(rupeesInWords(totals.grand),right-2,y+6,{align:'right',maxWidth:118})
  if (signature) { try { doc.addImage(signature,imageFormat(signature),160,y+17,30,16) } catch {} } doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.text(`AUTHORISED SIGNATORY FOR`,right-2,y+43,{align:'right'}); doc.text(settings.name,right-2,y+48,{align:'right'})
  doc.save(`${settings.name.replace(/\s+/g,'_')}_Invoice_${bill.invoiceNo}.pdf`)
}
