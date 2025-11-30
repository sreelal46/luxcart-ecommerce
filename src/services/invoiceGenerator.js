const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

function generateInvoice(order, outputPath) {
  const doc = new PDFDocument({
    size: "A4",
    margin: 50,
  });

  const fontPath = path.join(__dirname, "../font/DejaVuSans.ttf");
  doc.registerFont("DejaVu", fontPath);
  doc.font("DejaVu");

  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  // ---------------- HEADER ----------------
  doc
    .fontSize(26)
    .fillColor("#222")
    .text("LUXCART", { align: "center" })
    .moveDown(0.3);

  doc
    .fontSize(14)
    .fillColor("#666")
    .text("INVOICE", { align: "center" })
    .moveDown(1.8);

  // ---------------- ORDER INFO ----------------
  doc.fontSize(12).fillColor("#333");

  doc
    .text(`Order ID : ${order.orderId}`)
    .text(`Date     : ${new Date(order.createdAt).toDateString()}`)
    .moveDown(1.5);

  // ---------------- BILLING SECTION BOX ----------------
  doc
    .fontSize(14)
    .fillColor("#000")
    .text("Billing Details", { underline: true });

  doc.moveDown(0.6);

  doc.fontSize(12).fillColor("#333");
  doc.text(`Name    : ${order.customerName}`);
  doc.text(`Address : ${order.customerAddress}`);

  doc.moveDown(1.6);

  // ---------------- ITEMS TABLE TITLE ----------------
  doc.fontSize(14).fillColor("#000").text("Order Items", { underline: true });

  doc.moveDown(0.7);

  // ---------------- TABLE HEADER ----------------
  const tableTop = doc.y;

  doc
    .fontSize(12)
    .fillColor("#555")
    .text("Description", 50, tableTop)
    .text("Qty", 300, tableTop)
    .text("Price", 360, tableTop)
    .text("Total", 460, tableTop);

  doc
    .moveTo(50, tableTop + 18)
    .lineTo(550, tableTop + 18)
    .strokeColor("#ddd")
    .stroke();

  let y = tableTop + 25;

  // ---------------- TABLE CONTENT ----------------
  order.items.forEach((item) => {
    doc
      .fontSize(12)
      .fillColor("#333")
      .text(item.description, 50, y, { width: 230 })
      .text(item.qty.toString(), 300, y)
      .text(`₹${item.price.toLocaleString()}`, 360, y)
      .text(`₹${item.total.toLocaleString()}`, 460, y);

    y += 28;
  });

  // ---------------- PAYMENT SUMMARY BOX ----------------
  const boxX = 300;
  const boxY = y + 30;
  const boxWidth = 260;
  const boxHeight = 150;

  doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 12).fill("#f5f5f5");

  doc
    .fillColor("#111")
    .fontSize(14)
    .text("Payment Summary", boxX + 15, boxY + 12);

  let lineY = boxY + 45;

  // Fixed right column position (NO ALIGN)
  const rightX = boxX + boxWidth - 90;

  // Subtotal
  doc.fontSize(12).fillColor("#333");
  doc.text("Subtotal:", boxX + 15, lineY);
  doc.text(`₹${order.subtotal.toLocaleString()}`, rightX, lineY);

  // Tax
  lineY += 22;
  doc.text(`Tax (${order.taxPercent}%):`, boxX + 15, lineY);
  doc.text(`₹${order.taxAmount.toLocaleString()}`, rightX, lineY);

  // Total Amount
  lineY += 32;
  doc
    .fontSize(13)
    .fillColor("#111")
    .text("Total Amount:", boxX + 15, lineY);

  doc
    .fontSize(15)
    .fillColor("#000")
    .text(`₹${order.totalAmount.toLocaleString()}`, rightX, lineY);

  // ---------------- FOOTER ----------------
  doc.moveDown(6);
  doc
    .fontSize(11)
    .fillColor("#777")
    .text("Thank you for shopping with LUXCART.", { align: "center" });

  doc
    .fontSize(10)
    .fillColor("#aaa")
    .text(
      "This is a system generated invoice and does not require signature.",
      {
        align: "center",
      }
    );

  doc.end();
}

module.exports = generateInvoice;
