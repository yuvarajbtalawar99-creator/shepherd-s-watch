import jsPDF from 'jspdf';
import QRCode from 'qrcode';

interface GeneratedSheep {
    id: string;
    tag_id: string;
    name: string;
    qr_code: string;
}

export async function generateQRSheet(sheep: GeneratedSheep[]) {
    // Create new PDF doc (A4 size by default: 210 x 297 mm)
    const pdf = new jsPDF();

    const qrSize = 60; // mm
    const cellWidth = 90;
    const cellHeight = 90;

    // Page margins
    const startX = 15;
    const startY = 15;

    for (let i = 0; i < sheep.length; i++) {
        // Add new page after every 6 QR codes (2 columns x 3 rows)
        if (i > 0 && i % 6 === 0) {
            pdf.addPage();
        }

        // Calculate position
        const indexOnPage = i % 6;
        const col = indexOnPage % 2;
        const row = Math.floor(indexOnPage / 2);

        const x = startX + (col * cellWidth);
        const y = startY + (row * cellHeight);

        try {
            // Generate QR code as data URL
            const qrDataUrl = await QRCode.toDataURL(sheep[i].qr_code || sheep[i].id, {
                width: 400,
                margin: 2
            });

            // Draw border/cut lines
            pdf.setDrawColor(200, 200, 200);
            (pdf as any).setLineDash([3, 3], 0);
            pdf.rect(x, y, cellWidth - 5, cellHeight - 5);

            // Add QR code image
            pdf.addImage(qrDataUrl, 'PNG', x + 12, y + 5, qrSize, qrSize);

            // Reset dash pattern for text
            (pdf as any).setLineDash([], 0);

            // Add Tag ID (Bold, Large)
            pdf.setFontSize(16);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(0, 0, 0);
            pdf.text(sheep[i].tag_id, x + (cellWidth / 2) - 2.5, y + qrSize + 12, { align: 'center' });

            // Add Name (Regular, Medium)
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(80, 80, 80);
            pdf.text(sheep[i].name, x + (cellWidth / 2) - 2.5, y + qrSize + 19, { align: 'center' });

        } catch (error) {
            console.error(`Error generating QR for sheep ${sheep[i].tag_id}:`, error);
        }
    }

    // Save the PDF
    const timestamp = new Date().toISOString().split('T')[0];
    pdf.save(`shepherd-care-qr-codes-${timestamp}.pdf`);
}
