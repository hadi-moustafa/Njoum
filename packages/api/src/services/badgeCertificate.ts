// ============================================================
// Badge certificate PDF generator — uses pdfkit
// Produces a printable A4 certificate for a badge award.
// ============================================================
import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

export interface CertificateData {
  recipientName: string;   // display name of the girl
  badgeName:     string;
  badgeModule:   string;
  awardedBy:     string;   // troop leader's name
  awardedAt:     string;   // ISO date string
  troopName?:    string;
}

const PRIMARY   = '#B5586A';
const ACCENT    = '#C8956A';
const DEPTH     = '#7A4E7A';
const TEXT      = '#2A1520';
const MUTED     = '#8A6070';

/**
 * Generates a PDF certificate and returns it as a Buffer.
 */
export async function generateBadgeCertificate(data: CertificateData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc  = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 60 });
    const chunks: Buffer[] = [];

    doc.on('data',  chunk => chunks.push(chunk));
    doc.on('end',   ()    => resolve(Buffer.concat(chunks)));
    doc.on('error', err   => reject(err));

    const { width, height } = doc.page;

    // ── Background border ──────────────────────────────────────
    doc.rect(30, 30, width - 60, height - 60)
       .lineWidth(4)
       .strokeColor(PRIMARY)
       .stroke();

    doc.rect(38, 38, width - 76, height - 76)
       .lineWidth(1.5)
       .strokeColor(ACCENT)
       .stroke();

    // ── Header stripe ─────────────────────────────────────────
    doc.rect(30, 30, width - 60, 80)
       .fillColor(PRIMARY)
       .fill();

    // ── App name (stars + Njoum) ───────────────────────────────
    doc.font('Helvetica-Bold')
       .fontSize(22)
       .fillColor('#FFFFFF')
       .text('★  نجوم  ★', 0, 48, { align: 'center' });

    // ── Certificate title ──────────────────────────────────────
    doc.font('Helvetica-Bold')
       .fontSize(28)
       .fillColor(DEPTH)
       .text('شهادة إنجاز', 0, 140, { align: 'center' });

    doc.font('Helvetica')
       .fontSize(13)
       .fillColor(MUTED)
       .text('Certificate of Achievement', 0, 175, { align: 'center' });

    // ── Divider ────────────────────────────────────────────────
    doc.moveTo(120, 205).lineTo(width - 120, 205)
       .lineWidth(1)
       .strokeColor(ACCENT)
       .stroke();

    // ── Body text ─────────────────────────────────────────────
    doc.font('Helvetica')
       .fontSize(14)
       .fillColor(TEXT)
       .text('تُمنح هذه الشهادة إلى', 0, 225, { align: 'center' });

    doc.font('Helvetica-Bold')
       .fontSize(26)
       .fillColor(PRIMARY)
       .text(data.recipientName, 0, 248, { align: 'center' });

    doc.font('Helvetica')
       .fontSize(13)
       .fillColor(TEXT)
       .text('لإتمامها متطلبات نيل شارة', 0, 288, { align: 'center' });

    doc.font('Helvetica-Bold')
       .fontSize(20)
       .fillColor(DEPTH)
       .text(data.badgeName, 0, 310, { align: 'center' });

    doc.font('Helvetica')
       .fontSize(11)
       .fillColor(MUTED)
       .text(`قسم: ${data.badgeModule}`, 0, 340, { align: 'center' });

    // ── Award details ──────────────────────────────────────────
    doc.moveTo(120, 365).lineTo(width - 120, 365)
       .strokeColor(ACCENT)
       .stroke();

    const awardDate = new Date(data.awardedAt).toLocaleDateString('ar-LB', {
      day: 'numeric', month: 'long', year: 'numeric',
    });

    doc.font('Helvetica')
       .fontSize(12)
       .fillColor(MUTED)
       .text(`بتاريخ: ${awardDate}`, 120, 380)
       .text(`مُمنوحة من: ${data.awardedBy}`, 120, 400);

    if (data.troopName) {
      doc.text(`الفرقة: ${data.troopName}`, 120, 420);
    }

    // ── Star decoration ────────────────────────────────────────
    doc.font('Helvetica-Bold')
       .fontSize(36)
       .fillColor(ACCENT)
       .text('★', width - 130, 370);

    // ── Footer ─────────────────────────────────────────────────
    doc.font('Helvetica')
       .fontSize(9)
       .fillColor(MUTED)
       .text(
         'نجوم — تطبيق السلامة للفتيات والشابات  •  njoum.app',
         0, height - 55,
         { align: 'center' }
       );

    doc.end();
  });
}
