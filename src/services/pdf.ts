import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Sale, SaleReturn } from '@/types'
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format'

const STORE_NAME = 'iLoc — Celulares y Accesorios'
const STORE_PHONE = 'Tel: (55) 1234-5678'

const PAYMENT_LABELS: Record<string, string> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
  canje: 'Equipo a cuenta',
  credito: 'Crédito',
  otro: 'Otro',
}

export function generateSaleReceipt(sale: Sale): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: [80, 200] })
  const pageWidth = doc.internal.pageSize.getWidth()
  let y = 10

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(STORE_NAME, pageWidth / 2, y, { align: 'center' })
  y += 5

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(STORE_PHONE, pageWidth / 2, y, { align: 'center' })
  y += 8

  doc.setFontSize(7)
  doc.text(`Ticket #${sale.id.slice(0, 8).toUpperCase()}`, 5, y)
  y += 4
  doc.text(formatDateTime(sale.date), 5, y)
  y += 6

  if (sale.customerName) {
    doc.text(`Cliente: ${sale.customerName}`, 5, y)
    y += 4
  }
  if (sale.customerPhone) {
    doc.text(`Tel: ${sale.customerPhone}`, 5, y)
    y += 4
  }

  y += 2
  doc.setLineWidth(0.2)
  doc.line(5, y, pageWidth - 5, y)
  y += 4

  autoTable(doc, {
    startY: y,
    head: [['Producto', 'Cant', 'Precio', 'Sub']],
    body: sale.items.map((item) => [
      item.productName.length > 18 ? item.productName.slice(0, 18) + '…' : item.productName,
      String(item.quantity),
      formatCurrency(item.unitPrice),
      formatCurrency(item.subtotal),
    ]),
    theme: 'plain',
    styles: { fontSize: 7, cellPadding: 1 },
    headStyles: { fontStyle: 'bold', fillColor: [240, 240, 240], textColor: [0, 0, 0] },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 10, halign: 'center' },
      2: { cellWidth: 18, halign: 'right' },
      3: { cellWidth: 18, halign: 'right' },
    },
    margin: { left: 5, right: 5 },
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 6

  if (sale.discountAmount && sale.discountAmount > 0) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text('Subtotal:', 5, y)
    doc.text(
      formatCurrency(sale.subtotal ?? sale.total + sale.discountAmount),
      pageWidth - 5,
      y,
      { align: 'right' },
    )
    y += 5
    const discountLabel =
      sale.discountType === 'percent' ? `Descuento (${sale.discountValue}%):` : 'Descuento:'
    doc.text(discountLabel, 5, y)
    doc.text(`-${formatCurrency(sale.discountAmount)}`, pageWidth - 5, y, { align: 'right' })
    y += 6
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('TOTAL:', 5, y)
  doc.text(formatCurrency(sale.total), pageWidth - 5, y, { align: 'right' })
  y += 6

  if (sale.tradeInValue && sale.tradeInValue > 0) {
    const credit = Math.min(sale.tradeInValue, sale.total)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text('Equipo a cuenta:', 5, y)
    y += 4
    if (sale.tradeInItems && sale.tradeInItems.length) {
      for (const t of sale.tradeInItems) {
        const name = t.productName.length > 20 ? t.productName.slice(0, 20) + '…' : t.productName
        doc.text(`  ${name} x${t.quantity}`, 5, y)
        doc.text(`-${formatCurrency(t.unitValue * t.quantity)}`, pageWidth - 5, y, {
          align: 'right',
        })
        y += 4
      }
    } else {
      doc.text('  Equipo recibido', 5, y)
      doc.text(`-${formatCurrency(credit)}`, pageWidth - 5, y, { align: 'right' })
      y += 4
    }
    y += 1
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text('Saldo a pagar:', 5, y)
    doc.text(formatCurrency(Math.max(sale.total - sale.tradeInValue, 0)), pageWidth - 5, y, {
      align: 'right',
    })
    y += 6
  }

  if (sale.paymentMethod === 'credito' && sale.creditBalance !== undefined) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text('Abono inicial:', 5, y)
    doc.text(formatCurrency(sale.creditDownPayment ?? 0), pageWidth - 5, y, { align: 'right' })
    y += 5
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text('Saldo pendiente:', 5, y)
    doc.text(formatCurrency(sale.creditBalance), pageWidth - 5, y, { align: 'right' })
    y += 5
    if (sale.creditDueDate) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.text(`Pago final: ${formatDate(sale.creditDueDate)}`, 5, y)
      y += 5
    }
    y += 1
  }

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text(`Pago: ${PAYMENT_LABELS[sale.paymentMethod] ?? sale.paymentMethod}`, 5, y)
  y += 8

  if (sale.notes) {
    doc.setFontSize(7)
    doc.text(`Notas: ${sale.notes}`, 5, y, { maxWidth: pageWidth - 10 })
    y += 8
  }

  doc.setFontSize(7)
  doc.text('¡Gracias por su compra!', pageWidth / 2, y, { align: 'center' })

  return doc
}

export function downloadSaleReceipt(sale: Sale): void {
  const doc = generateSaleReceipt(sale)
  doc.save(`ticket-${sale.id.slice(0, 8)}.pdf`)
}

const REFUND_LABELS: Record<string, string> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
}

export function generateReturnReceipt(sale: Sale, ret: SaleReturn): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: [80, 200] })
  const pageWidth = doc.internal.pageSize.getWidth()
  let y = 10

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(STORE_NAME, pageWidth / 2, y, { align: 'center' })
  y += 5
  doc.setFontSize(9)
  doc.text('NOTA DE DEVOLUCIÓN', pageWidth / 2, y, { align: 'center' })
  y += 7

  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.text(`Ticket venta #${sale.id.slice(0, 8).toUpperCase()}`, 5, y)
  y += 4
  doc.text(formatDateTime(ret.date), 5, y)
  y += 4
  if (sale.customerName) {
    doc.text(`Cliente: ${sale.customerName}`, 5, y)
    y += 4
  }

  y += 2
  doc.setLineWidth(0.2)
  doc.line(5, y, pageWidth - 5, y)
  y += 4

  autoTable(doc, {
    startY: y,
    head: [['Producto', 'Cant', 'Sub']],
    body: ret.items.map((it) => [
      (it.productName.length > 24 ? it.productName.slice(0, 24) + '…' : it.productName) +
        (it.restocked ? '' : ' (sin reingresar)'),
      String(it.quantity),
      formatCurrency(it.refundPerUnit * it.quantity),
    ]),
    theme: 'plain',
    styles: { fontSize: 7, cellPadding: 1 },
    headStyles: { fontStyle: 'bold', fillColor: [240, 240, 240], textColor: [0, 0, 0] },
    columnStyles: {
      0: { cellWidth: 42 },
      1: { cellWidth: 10, halign: 'center' },
      2: { cellWidth: 18, halign: 'right' },
    },
    margin: { left: 5, right: 5 },
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 6

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('REEMBOLSO:', 5, y)
  doc.text(formatCurrency(ret.refundAmount), pageWidth - 5, y, { align: 'right' })
  y += 6

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  if (ret.balanceApplied > 0) {
    doc.text('Aplicado al saldo:', 5, y)
    doc.text(formatCurrency(ret.balanceApplied), pageWidth - 5, y, { align: 'right' })
    y += 4
    doc.text('Devuelto en efectivo:', 5, y)
    doc.text(formatCurrency(ret.refundAmount - ret.balanceApplied), pageWidth - 5, y, {
      align: 'right',
    })
    y += 5
  }
  doc.text(`Método: ${REFUND_LABELS[ret.refundMethod] ?? ret.refundMethod}`, 5, y)
  y += 4
  doc.text(`Motivo: ${ret.reason}`, 5, y, { maxWidth: pageWidth - 10 })
  y += 6

  if (ret.notes) {
    doc.setFontSize(7)
    doc.text(`Notas: ${ret.notes}`, 5, y, { maxWidth: pageWidth - 10 })
  }

  return doc
}

export function downloadReturnReceipt(sale: Sale, ret: SaleReturn): void {
  const doc = generateReturnReceipt(sale, ret)
  doc.save(`devolucion-${sale.id.slice(0, 8)}-${ret.id.slice(0, 6)}.pdf`)
}