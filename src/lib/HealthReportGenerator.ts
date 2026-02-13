import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { Sheep, HealthEvent } from '@/types/sheep';

export async function generateHealthReport(sheep: Sheep, events: HealthEvent[]) {
    const pdf = new jsPDF();

    // Header
    pdf.setFontSize(22);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Sheep Health Report', 105, 20, { align: 'center' });

    // Date
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Generated on ${new Date().toLocaleDateString()}`, 105, 28, { align: 'center' });

    // QR Code
    try {
        const qrDataUrl = await QRCode.toDataURL(sheep.id, { width: 150 });
        pdf.addImage(qrDataUrl, 'PNG', 160, 15, 35, 35);
    } catch (e) {
        console.error("Failed to generate QR for report", e);
    }

    // Draw separator line
    pdf.setDrawColor(200, 200, 200);
    pdf.line(20, 35, 190, 35);

    // Identity Section
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Identity Details', 20, 50);

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Tag ID: ${sheep.tag_id}`, 20, 60);
    pdf.text(`Name: ${sheep.name}`, 20, 68);
    pdf.text(`Breed: ${sheep.breed || 'Not specified'}`, 20, 76);
    pdf.text(`Gender: ${sheep.gender || 'Not specified'}`, 100, 60);
    pdf.text(`Age: ${sheep.date_of_birth ? calculateAge(sheep.date_of_birth) : 'Unknown'}`, 100, 68);
    pdf.text(`Weight: ${sheep.weight_kg ? sheep.weight_kg + ' kg' : 'Not recorded'}`, 100, 76);

    // Health Summary Section
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Health Status', 20, 95);

    // Health Score Box
    pdf.setDrawColor(0, 0, 0);
    pdf.setFillColor(250, 250, 250);
    pdf.rect(20, 100, 170, 25, 'F');

    pdf.setFontSize(10);
    pdf.text(`Current Status: ${sheep.status.toUpperCase()}`, 30, 110);
    pdf.text(`Risk Level: ${sheep.risk_level.toUpperCase()}`, 30, 118);

    pdf.setFontSize(16);
    pdf.text(`${sheep.health_score}/100`, 150, 115);
    pdf.setFontSize(8);
    pdf.text("Health Score", 150, 120);

    // Health Timeline
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Health History & Events', 20, 145);

    let yPos = 155;

    if (events.length === 0) {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'italic');
        pdf.setTextColor(100, 100, 100);
        pdf.text("No health events recorded.", 20, yPos);
    } else {
        events.forEach((event, i) => {
            // Check if we need a new page
            if (yPos > 270) {
                pdf.addPage();
                yPos = 20;
            }

            pdf.setDrawColor(220, 220, 220);
            pdf.line(25, yPos, 25, yPos + 15); // Timeline vertical line
            pdf.circle(25, yPos + 2, 2, 'F');  // Bullet point

            pdf.setTextColor(0, 0, 0);
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'bold');
            pdf.text(`${new Date(event.date).toLocaleDateString()} - ${event.type.replace('_', ' ').toUpperCase()}`, 35, yPos + 2);

            pdf.setFontSize(9);
            pdf.setFont('helvetica', 'normal');
            pdf.text(event.description, 35, yPos + 8);

            yPos += 18;
        });
    }

    // Footer
    const pageCount = (pdf as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
        pdf.text("ShepherdCare Platform", 20, 290);
    }

    pdf.save(`health-report-${sheep.tag_id}.pdf`);
}

function calculateAge(dob: string) {
    const birthDate = new Date(dob);
    const diff = Date.now() - birthDate.getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970) + " years";
}
