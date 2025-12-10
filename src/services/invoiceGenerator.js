// generateInvoice.js - Single Page Optimized Version
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

/**
 * Format number as Indian currency with proper grouping
 * @param {number|string} value - Amount to format
 * @returns {string} Formatted currency string
 */
function formatCurrency(value) {
  const num = Number(value || 0);
  return `₹${num.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Convert number to words (Indian system)
 * @param {number} num - Number to convert
 * @returns {string} Number in words
 */
function numberToWords(num) {
  if (num === 0) return "Zero Rupees Only";

  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];
  const teens = [
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];

  function convert(n) {
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100)
      return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
    if (n < 1000)
      return (
        ones[Math.floor(n / 100)] +
        " Hundred" +
        (n % 100 ? " " + convert(n % 100) : "")
      );
    return "";
  }

  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const hundred = num % 1000;

  let result = "";
  if (crore) result += convert(crore) + " Crore ";
  if (lakh) result += convert(lakh) + " Lakh ";
  if (thousand) result += convert(thousand) + " Thousand ";
  if (hundred) result += convert(hundred);

  return result.trim() + " Rupees Only";
}

/**
 * Generate professional invoice PDF (Single Page Optimized)
 * @param {Object} order - Order details
 * @param {string} outputPath - Output file path
 * @param {Object} options - Additional options
 */
function generateInvoice(order, outputPath, options = {}) {
  const doc = new PDFDocument({
    size: "A4",
    margin: 40,
  });

  // Register font
  const fontPath = path.join(__dirname, "../font/DejaVuSans.ttf");
  const fontBoldPath = path.join(__dirname, "../font/DejaVuSans-Bold.ttf");

  doc.registerFont("DejaVu", fontPath);
  if (fs.existsSync(fontBoldPath)) {
    doc.registerFont("DejaVuBold", fontBoldPath);
  }
  doc.font("DejaVu");

  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  const marginLeft = 40;
  const marginRight = 555;
  const pageWidth = 515;

  // Color scheme
  const colors = {
    primary: "#1a1a1a",
    secondary: "#666666",
    accent: "#2563eb",
    lightGray: "#f8f9fa",
    border: "#dee2e6",
    success: "#10b981",
    headerBg: "#1e40af",
  };

  let currentY = 40;

  // ========== HEADER SECTION ==========
  // Logo box
  doc
    .roundedRect(marginLeft, currentY, 50, 50, 4)
    .fillAndStroke(colors.accent, colors.accent);

  doc
    .fontSize(22)
    .fillColor("#ffffff")
    .text("LC", marginLeft + 10, currentY + 13);

  // Company info
  doc
    .fontSize(20)
    .fillColor(colors.primary)
    .text("LUXCART", marginLeft + 65, currentY + 2);

  doc
    .fontSize(9)
    .fillColor(colors.secondary)
    .text("Premium Car Accessories & Detailing", marginLeft + 65, currentY + 26)
    .text("www.luxcart.com", marginLeft + 65, currentY + 38);

  // Invoice details box
  const invoiceBoxX = 410;
  const invoiceBoxWidth = 145;

  doc
    .roundedRect(invoiceBoxX, currentY, invoiceBoxWidth, 50, 4)
    .fillAndStroke(colors.lightGray, colors.border);

  doc
    .fontSize(14)
    .fillColor(colors.accent)
    .text("INVOICE", invoiceBoxX + 10, currentY + 8);

  doc
    .fontSize(8)
    .fillColor(colors.secondary)
    .text(`Order ID: ${order.orderId}`, invoiceBoxX + 10, currentY + 26)
    .text(
      `Date: ${new Date(order.createdAt).toLocaleDateString("en-IN")}`,
      invoiceBoxX + 10,
      currentY + 38
    );

  currentY += 65;

  // Separator
  doc
    .moveTo(marginLeft, currentY)
    .lineTo(marginRight, currentY)
    .strokeColor(colors.border)
    .lineWidth(1)
    .stroke();

  currentY += 15;

  // ========== BILLING SECTION (2 COLUMNS) ==========
  const billToY = currentY;

  // Left: Bill To
  doc
    .fontSize(10)
    .fillColor(colors.accent)
    .text("BILL TO", marginLeft, currentY);

  let leftY = currentY + 15;

  const customerName = order.customerName || order.address?.name || "Customer";
  const address = order.address || {};
  const customerAddress =
    order.customerAddress ||
    `${address.street || ""}${address.city ? ", " + address.city : ""}${
      address.state ? ", " + address.state : ""
    }${address.pincode ? " - " + address.pincode : ""}`;

  doc
    .fontSize(10)
    .fillColor(colors.primary)
    .text(customerName, marginLeft, leftY);

  leftY += 14;

  if (customerAddress.trim()) {
    doc
      .fontSize(9)
      .fillColor(colors.secondary)
      .text(customerAddress, marginLeft, leftY, { width: 240 });
    leftY = doc.y + 4;
  }

  if (address.phone) {
    doc.text(`Ph: ${address.phone}`, marginLeft, leftY);
    leftY = doc.y + 3;
  }

  if (address.email) {
    doc.text(`Email: ${address.email}`, marginLeft, leftY);
    leftY = doc.y;
  }

  // Right: From
  doc.fontSize(10).fillColor(colors.accent).text("FROM", 305, billToY);

  let rightY = billToY + 15;

  const companyInfo = options.companyInfo || {
    name: "LUXCART India Pvt. Ltd.",
    address: "123 Business Park, MG Road",
    city: "Bangalore, Karnataka - 560001",
    gstin: "29XXXXXXXXXXXXX",
    phone: "+91-XXXX-XXXXXX",
    email: "support@luxcart.com",
  };

  doc
    .fontSize(10)
    .fillColor(colors.primary)
    .text(companyInfo.name, 305, rightY);

  doc
    .fontSize(9)
    .fillColor(colors.secondary)
    .text(companyInfo.address, 305, rightY + 14)
    .text(companyInfo.city, 305, doc.y + 3)
    .text(`GSTIN: ${companyInfo.gstin}`, 305, doc.y + 3);

  currentY = Math.max(leftY, doc.y) + 20;

  // ========== ORDER ITEMS TABLE ==========
  doc
    .fontSize(11)
    .fillColor(colors.primary)
    .text("ORDER ITEMS", marginLeft, currentY);

  currentY += 18;

  // Table dimensions
  const tableTop = currentY;
  const descX = marginLeft;
  const qtyX = 320;
  const unitPriceX = 380;
  const totalX = 470;

  const descWidth = qtyX - descX - 10;
  const qtyWidth = 45;
  const unitPriceWidth = 75;
  const totalWidth = 85;

  // Table header
  doc
    .rect(marginLeft, tableTop, pageWidth, 22)
    .fillAndStroke(colors.headerBg, colors.headerBg);

  doc
    .fontSize(9)
    .fillColor("#ffffff")
    .text("DESCRIPTION", descX + 6, tableTop + 7)
    .text("QTY", qtyX, tableTop + 7, { width: qtyWidth, align: "center" })
    .text("UNIT PRICE", unitPriceX, tableTop + 7, {
      width: unitPriceWidth,
      align: "right",
    })
    .text("TOTAL", totalX, tableTop + 7, { width: totalWidth, align: "right" });

  currentY = tableTop + 26;

  // Table rows
  const items = order.items || [];
  let isAlternate = false;

  items.forEach((item) => {
    const description = item.description || item.name || "Item";
    const qty = item.qty || item.quantity || 1;
    const price = item.price || 0;
    const total = item.total || item.totalItemAmount || qty * price;

    // Calculate row height based on description
    const descHeight = doc.heightOfString(description, {
      width: descWidth - 6,
    });
    const rowHeight = Math.max(descHeight + 16, 28);

    // Alternating background
    if (isAlternate) {
      doc
        .rect(marginLeft, currentY - 4, pageWidth, rowHeight)
        .fill(colors.lightGray);
    }
    isAlternate = !isAlternate;

    // Description
    doc
      .fontSize(9)
      .fillColor(colors.primary)
      .text(description, descX + 6, currentY, { width: descWidth - 6 });

    // Quantity (centered)
    doc.text(String(qty), qtyX, currentY, { width: qtyWidth, align: "center" });

    // Unit Price (right-aligned)
    doc
      .fontSize(9)
      .fillColor(colors.secondary)
      .text(formatCurrency(price), unitPriceX, currentY, {
        width: unitPriceWidth,
        align: "right",
      });

    // Total (right-aligned, bold)
    doc
      .fontSize(9)
      .fillColor(colors.primary)
      .text(formatCurrency(total), totalX, currentY, {
        width: totalWidth,
        align: "right",
      });

    currentY += rowHeight;
  });

  // Bottom table border
  doc
    .moveTo(marginLeft, currentY)
    .lineTo(marginRight, currentY)
    .strokeColor(colors.border)
    .lineWidth(1)
    .stroke();

  currentY += 20;

  // ========== PAYMENT SUMMARY ==========
  const summaryX = 325;
  const summaryWidth = 230;

  doc
    .roundedRect(summaryX, currentY, summaryWidth, 115, 6)
    .fillAndStroke(colors.lightGray, colors.border);

  let summaryY = currentY + 12;
  const labelX = summaryX + 12;
  const valueX = summaryX + summaryWidth - 12;

  doc
    .fontSize(11)
    .fillColor(colors.primary)
    .text("PAYMENT SUMMARY", labelX, summaryY);

  summaryY += 20;

  // Subtotal
  doc.fontSize(9).fillColor(colors.secondary);
  doc.text("Subtotal", labelX, summaryY);
  doc.text(formatCurrency(order.subtotal), valueX - 95, summaryY, {
    width: 95,
    align: "right",
  });

  summaryY += 16;

  // Tax
  const taxPercent = order.taxPercent || "";
  const taxLabel = taxPercent ? `Tax (${taxPercent}%)` : "Tax";
  doc.text(taxLabel, labelX, summaryY);
  doc.text(formatCurrency(order.taxAmount), valueX - 95, summaryY, {
    width: 95,
    align: "right",
  });

  summaryY += 16;

  // Discount (if any)
  if (order.discount && Number(order.discount) > 0) {
    doc.fillColor(colors.success);
    doc.text("Discount", labelX, summaryY);
    doc.text(`- ${formatCurrency(order.discount)}`, valueX - 95, summaryY, {
      width: 95,
      align: "right",
    });
    summaryY += 16;
  }

  // Divider
  doc
    .moveTo(labelX, summaryY + 2)
    .lineTo(valueX, summaryY + 2)
    .strokeColor(colors.border)
    .stroke();

  summaryY += 10;

  // Total Amount
  doc
    .fontSize(11)
    .fillColor(colors.primary)
    .text("Total Amount", labelX, summaryY);

  doc
    .fontSize(13)
    .fillColor(colors.accent)
    .text(formatCurrency(order.totalAmount), valueX - 95, summaryY, {
      width: 95,
      align: "right",
    });

  // Amount in words (below summary box)
  currentY = currentY + 130;

  doc
    .fontSize(8)
    .fillColor(colors.secondary)
    .text("Amount in words:", marginLeft, currentY);

  doc
    .fontSize(9)
    .fillColor(colors.primary)
    .text(
      numberToWords(Math.floor(order.totalAmount)),
      marginLeft,
      currentY + 11,
      {
        width: pageWidth * 0.7,
        lineGap: 2,
      }
    );

  currentY = doc.y + 18;

  // ========== TERMS & CONDITIONS ==========
  doc
    .fontSize(10)
    .fillColor(colors.primary)
    .text("Terms & Conditions", marginLeft, currentY);

  currentY = doc.y + 8;

  const terms = options.terms || [
    "Payment is due within 30 days of invoice date.",
    "Please include invoice number on your payment.",
    "All sales are final unless otherwise stated.",
    "Late payments may incur additional charges.",
  ];

  doc.fontSize(8).fillColor(colors.secondary);
  terms.forEach((term, index) => {
    doc.text(`${index + 1}. ${term}`, marginLeft, currentY);
    currentY = doc.y + 3;
  });

  currentY += 12;

  // ========== FOOTER ==========
  const footerY = currentY;

  // Footer separator line
  doc
    .moveTo(marginLeft, footerY)
    .lineTo(marginRight, footerY)
    .strokeColor(colors.border)
    .lineWidth(0.5)
    .stroke();

  doc
    .fontSize(9)
    .fillColor(colors.secondary)
    .text("Thank you for shopping with LUXCART!", marginLeft, footerY + 8, {
      width: pageWidth,
      align: "center",
    });

  doc
    .fontSize(7)
    .fillColor(colors.secondary)
    .text(
      "This is a system generated invoice and does not require signature.",
      marginLeft,
      footerY + 22,
      { width: pageWidth, align: "center" }
    );

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on("finish", () => resolve(outputPath));
    stream.on("error", reject);
  });
}

module.exports = generateInvoice;
