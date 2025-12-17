// generateInvoice.js - Enhanced with Return Items Table (Fixed - No Blank Space)
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

function formatCurrency(value) {
  const num = Number(value || 0);
  // Format number with Indian numbering system
  const formatted = num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `₹${formatted}`;
}

function numberToWords(num) {
  if (!num) return "Zero Rupees Only";

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

function generateInvoice(order, outputPath, options = {}) {
  const config = {
    highQuality: options.highQuality !== false,
    compress: options.compress || false,
    colorProfile: options.colorProfile || "default",
    embedFonts: options.embedFonts !== false,
    addWatermark: options.addWatermark || false,
    watermarkText: options.watermarkText || "ORIGINAL",
  };

  const docOptions = {
    size: "A4",
    margin: 40,
    bufferPages: true,
    autoFirstPage: true,
    compress: config.compress,
    info: {
      Title: `Invoice ${order.orderId}`,
      Author: "LUXCART",
      Subject: `Invoice for Order ${order.orderId}`,
      Creator: "LUXCART Invoice System",
      CreationDate: new Date(),
    },
  };

  const doc = new PDFDocument(docOptions);

  const fontPath = path.join(__dirname, "../font/DejaVuSans.ttf");
  const fontBoldPath = path.join(__dirname, "../font/DejaVuSans-Bold.ttf");

  if (fs.existsSync(fontPath)) doc.registerFont("DejaVu", fontPath);
  if (fs.existsSync(fontBoldPath)) doc.registerFont("DejaVuBold", fontBoldPath);

  try {
    doc.font("DejaVu");
  } catch (e) {
    // Fallback to default font
  }

  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  const marginLeft = 40;
  const marginRight = 555;
  const pageWidth = 515;

  let colors = {
    primary: "#1a1a1a",
    secondary: "#666666",
    accent: "#2563eb",
    lightGray: "#f8f9fa",
    border: "#dee2e6",
    success: "#10b981",
    danger: "#ef4444",
    warning: "#f59e0b",
    headerBg: "#1e40af",
    cancelledBg: "#fee2e2",
    returnedBg: "#fff4e6",
  };

  let currentY = 40;

  // ========== WATERMARK ==========
  if (config.addWatermark) {
    doc.save();
    doc
      .fontSize(60)
      .fillColor(colors.lightGray)
      .opacity(0.1)
      .rotate(-45, { origin: [297, 420] })
      .text(config.watermarkText, 150, 400, { width: 400, align: "center" });
    doc.restore();
  }

  // ========== HEADER SECTION ==========
  doc.save();
  doc
    .roundedRect(marginLeft, currentY, 50, 50, 4)
    .lineWidth(0.5)
    .fillAndStroke(colors.accent, colors.accent);
  doc.restore();

  doc
    .fontSize(22)
    .fillColor("#ffffff")
    .text("LC", marginLeft + 10, currentY + 13);

  doc
    .fontSize(20)
    .fillColor(colors.primary)
    .text("LUXCART", marginLeft + 65, currentY + 2);
  doc
    .fontSize(9)
    .fillColor(colors.secondary)
    .text("Premium Car & Accessories Detailing", marginLeft + 65, currentY + 26)
    .text("www.luxcart.com", marginLeft + 65, currentY + 38);

  const invoiceBoxX = 410;
  const invoiceBoxWidth = 145;

  doc
    .roundedRect(invoiceBoxX, currentY, invoiceBoxWidth, 50, 4)
    .lineWidth(0.5)
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

  doc
    .moveTo(marginLeft, currentY)
    .lineTo(marginRight, currentY)
    .strokeColor(colors.border)
    .lineWidth(0.5)
    .stroke();

  currentY += 15;

  // ========== BILLING SECTION ==========
  const billToY = currentY;

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
      .text(customerAddress, marginLeft, leftY, { width: 240, lineGap: 2 });
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
    .text(companyInfo.address, 305, rightY + 14, { lineGap: 2 })
    .text(companyInfo.city, 305, doc.y + 3)
    .text(`GSTIN: ${companyInfo.gstin}`, 305, doc.y + 3);

  // FIXED: Calculate the correct currentY based on both columns
  currentY = Math.max(leftY, doc.y) + 15; // Reduced from 20 to 15

  // ========== FILTER ITEMS BY STATUS ==========
  const activeItems = order.items.filter((item) => {
    const status = (item.status || "").toUpperCase().trim();
    return status !== "CANCELLED" && status !== "RETURNED";
  });

  const cancelledItems = order.items.filter((item) => {
    const status = (item.status || "").toUpperCase().trim();
    return status === "CANCELLED";
  });

  const returnedItems = order.items.filter((item) => {
    const status = (item.status || "").toUpperCase().trim();
    return status === "RETURNED";
  });

  // Track if we've rendered any section yet
  let hasRenderedAnySection = false;

  // ========== ACTIVE ORDER ITEMS TABLE ==========
  if (activeItems.length > 0) {
    doc
      .fontSize(11)
      .fillColor(colors.primary)
      .text("ORDER ITEMS", marginLeft, currentY);
    currentY += 18;

    currentY = renderItemsTable(
      doc,
      activeItems,
      currentY,
      colors,
      marginLeft,
      pageWidth,
      false
    );
    hasRenderedAnySection = true;
  }

  // ========== CANCELLED ITEMS TABLE ==========
  if (cancelledItems.length > 0) {
    // Add spacing only if we already rendered a section
    if (hasRenderedAnySection) {
      currentY += 15;
    }

    // Check if we need a new page
    if (currentY > 650) {
      doc.addPage();
      currentY = 40;
    }

    doc
      .fontSize(11)
      .fillColor(colors.danger)
      .text("CANCELLED ITEMS", marginLeft, currentY);
    currentY += 18;

    currentY = renderItemsTable(
      doc,
      cancelledItems,
      currentY,
      colors,
      marginLeft,
      pageWidth,
      true,
      "CANCELLED"
    );
    hasRenderedAnySection = true;
  }

  // ========== RETURNED ITEMS TABLE ==========
  if (returnedItems.length > 0) {
    // Add spacing only if we already rendered a section
    if (hasRenderedAnySection) {
      currentY += 15;
    }

    // Check if we need a new page
    if (currentY > 650) {
      doc.addPage();
      currentY = 40;
    }

    doc
      .fontSize(11)
      .fillColor(colors.warning)
      .text("RETURNED ITEMS", marginLeft, currentY);
    currentY += 18;

    currentY = renderItemsTable(
      doc,
      returnedItems,
      currentY,
      colors,
      marginLeft,
      pageWidth,
      true,
      "RETURNED"
    );
    hasRenderedAnySection = true;
  }

  // ========== PAYMENT SUMMARY ==========
  currentY += 10; // Small gap before payment summary

  // Check if we need a new page for summary
  if (currentY > 600) {
    doc.addPage();
    currentY = 40;
  }

  const summaryX = 325;
  const summaryWidth = 230;

  const summaryLines = [];

  summaryLines.push({
    label: "Subtotal",
    value: formatCurrency(order.subtotal || 0),
    color: colors.secondary,
  });

  const taxPercent = order.taxPercent || "";
  const taxLabel = taxPercent ? `Tax (${taxPercent}%)` : "Tax";
  summaryLines.push({
    label: taxLabel,
    value: formatCurrency(order.taxAmount || 0),
    color: colors.secondary,
  });

  summaryLines.push({
    label: "Total Amount",
    value: formatCurrency(order.totalAmount || 0),
    color: colors.primary,
  });

  if (order.discount && Number(order.discount) > 0) {
    summaryLines.push({
      label: "Discount",
      value: `- ${formatCurrency(order.discount)}`,
      color: colors.success,
    });
  }

  if (order.refundedAmount && Number(order.refundedAmount) > 0) {
    summaryLines.push({
      label: "Refunded (Cancelled)",
      value: `- ${formatCurrency(order.refundedAmount)}`,
      color: colors.danger,
    });
  }

  if (order.returnRefundAmount && Number(order.returnRefundAmount) > 0) {
    summaryLines.push({
      label: "Refunded (Returned)",
      value: `- ${formatCurrency(order.returnRefundAmount)}`,
      color: colors.warning,
    });
  }

  if (order.advanceAmount && Number(order.advanceAmount) > 0) {
    summaryLines.push({
      label: "Advance Paid",
      value: `- ${formatCurrency(order.advanceAmount)}`,
      color: colors.success,
    });
  }

  const headerHeight = 20;
  const labelFontSize = 9;
  const paddingTop = 12;
  const paddingBottom = 12;
  const gapBetweenLines = 6;

  doc.fontSize(labelFontSize);
  let measuredLinesHeight = 0;
  summaryLines.forEach((ln) => {
    const h = doc.heightOfString(ln.label, { width: summaryWidth - 24 });
    measuredLinesHeight += h + gapBetweenLines;
  });

  const dividerExtra = 10;
  const totalLabelHeight = 15;
  const computedHeight =
    paddingTop +
    headerHeight +
    measuredLinesHeight +
    dividerExtra +
    totalLabelHeight +
    paddingBottom;
  const summaryHeight = Math.max(115, computedHeight);

  doc.save();
  doc
    .roundedRect(summaryX + 2, currentY + 2, summaryWidth, summaryHeight, 6)
    .fillOpacity(0.1)
    .fill("#000000");
  doc.restore();

  doc
    .roundedRect(summaryX, currentY, summaryWidth, summaryHeight, 6)
    .lineWidth(0.5)
    .fillAndStroke(colors.lightGray, colors.border);

  let summaryY = currentY + paddingTop;
  const labelX = summaryX + 12;
  const valueX = summaryX + summaryWidth - 12;

  doc
    .fontSize(11)
    .fillColor(colors.primary)
    .text("PAYMENT SUMMARY", labelX, summaryY);
  summaryY += headerHeight;

  summaryLines.forEach((ln) => {
    const lineValueStr = ln.value;
    const lineFontSize = lineValueStr.length > 15 ? 8 : 9;

    doc
      .fontSize(9)
      .fillColor(ln.color || colors.secondary)
      .text(ln.label, labelX, summaryY, { width: summaryWidth - 36 });
    doc
      .fontSize(lineFontSize)
      .fillColor(ln.color || colors.secondary)
      .text(ln.value, valueX - 110, summaryY, { width: 110, align: "right" });
    summaryY +=
      doc.heightOfString(ln.label, { width: summaryWidth - 24 }) +
      gapBetweenLines;
  });

  doc
    .moveTo(labelX, summaryY + 2)
    .lineTo(valueX, summaryY + 2)
    .strokeColor(colors.border)
    .lineWidth(0.5)
    .stroke();
  summaryY += dividerExtra;

  const finalAmount = order.remainingAmount || order.totalAmount || 0;

  // Calculate if amount needs smaller font
  const amountStr = formatCurrency(finalAmount);
  const amountFontSize = amountStr.length > 15 ? 11 : 13;

  doc
    .fontSize(11)
    .fillColor(colors.primary)
    .text("Amount to Pay", labelX, summaryY);
  doc
    .fontSize(amountFontSize)
    .fillColor(colors.accent)
    .text(formatCurrency(finalAmount), valueX - 110, summaryY, {
      width: 110,
      align: "right",
    });

  currentY = currentY + summaryHeight + 12;

  // ========== AMOUNT IN WORDS ==========
  doc
    .fontSize(8)
    .fillColor(colors.secondary)
    .text("Amount in words:", marginLeft, currentY);
  doc
    .fontSize(9)
    .fillColor(colors.primary)
    .text(numberToWords(Math.floor(finalAmount)), marginLeft, currentY + 11, {
      width: pageWidth * 0.7,
      lineGap: 2,
    });

  currentY = doc.y + 18;

  // ========== TERMS & CONDITIONS ==========
  if (currentY > 700) {
    doc.addPage();
    currentY = 40;
  }

  doc
    .fontSize(10)
    .fillColor(colors.primary)
    .text("Terms & Conditions", marginLeft, currentY);
  currentY = doc.y + 8;

  const terms = options.terms || [
    "Payment is due within 30 days of invoice date.",
    "Please include invoice number on your payment.",
    "Refunds for cancelled items will be processed within 5–7 business days.",
    "Returns must be initiated within 7 days of delivery.",
    "Cars once sold are non-returnable and non-refundable.",
    "Late payments may incur additional charges.",
  ];

  doc.fontSize(8).fillColor(colors.secondary);

  terms.forEach((term, index) => {
    doc.text(`${index + 1}. ${term}`, marginLeft, currentY, { lineGap: 1 });
    currentY = doc.y + 3;
  });

  currentY += 12;

  // ========== FOOTER ==========
  doc
    .moveTo(marginLeft, currentY)
    .lineTo(marginRight, currentY)
    .strokeColor(colors.border)
    .lineWidth(0.5)
    .stroke();

  doc
    .fontSize(9)
    .fillColor(colors.secondary)
    .text("Thank you for shopping with LUXCART!", marginLeft, currentY + 8, {
      width: pageWidth,
      align: "center",
    });

  doc
    .fontSize(7)
    .fillColor(colors.secondary)
    .text(
      "This is a system generated invoice and does not require signature.",
      marginLeft,
      currentY + 22,
      { width: pageWidth, align: "center" }
    );

  if (order.paymentStatus) {
    const paymentY = currentY + 36;
    let statusColor = colors.warning;
    let statusText = order.paymentStatus.toUpperCase();

    if (order.paymentStatus === "paid" || order.paymentStatus === "completed") {
      statusColor = colors.success;
    } else if (
      order.paymentStatus === "failed" ||
      order.paymentStatus === "cancelled"
    ) {
      statusColor = colors.danger;
    }

    doc
      .fontSize(8)
      .fillColor(statusColor)
      .text(`Payment Status: ${statusText}`, marginLeft, paymentY, {
        width: pageWidth,
        align: "center",
      });
  }

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on("finish", () => resolve(outputPath));
    stream.on("error", reject);
  });
}

// ========== HELPER: RENDER ITEMS TABLE ==========
function renderItemsTable(
  doc,
  items,
  startY,
  colors,
  marginLeft,
  pageWidth,
  isAdjustment = false,
  adjustmentType = ""
) {
  let currentY = startY;
  const marginRight = marginLeft + pageWidth;

  const tableTop = currentY;
  const descX = marginLeft;
  const qtyX = 175;
  const unitPriceX = 215;
  const taxX = 305;
  const advanceX = 395;
  const totalX = 485;

  const descWidth = qtyX - descX - 8;
  const qtyWidth = 30;
  const unitPriceWidth = 85;
  const taxWidth = 85;
  const advanceWidth = 85;
  const totalWidth = 75;

  // Table header
  let headerBg = colors.headerBg;
  if (adjustmentType === "CANCELLED") headerBg = colors.danger;
  if (adjustmentType === "RETURNED") headerBg = colors.warning;

  doc
    .rect(marginLeft, tableTop, pageWidth, 22)
    .lineWidth(0.5)
    .fillAndStroke(headerBg, headerBg);

  doc
    .fontSize(7)
    .fillColor("#ffffff")
    .text("DESCRIPTION", descX + 6, tableTop + 7)
    .text("QTY", qtyX + 2, tableTop + 7, { width: qtyWidth, align: "center" })
    .text("PRICE", unitPriceX - 5, tableTop + 7, {
      width: unitPriceWidth,
      align: "right",
    })
    .text("TAX", taxX - 5, tableTop + 7, { width: taxWidth, align: "right" })
    .text("ADVANCE", advanceX - 5, tableTop + 7, {
      width: advanceWidth,
      align: "right",
    })
    .text("TOTAL", totalX - 5, tableTop + 7, {
      width: totalWidth,
      align: "right",
    });

  currentY = tableTop + 26;

  let isAlternate = false;

  items.forEach((item) => {
    const description = item.description || item.name || "Item";
    const qty = item.qty || item.quantity || 1;
    const price = item.price || 0;
    const taxAmount = item.tax || 0;
    const total = item.total || 0;
    const status = (item.status || "").toUpperCase().trim();
    const refundAmount = item.refundAmount || 0;
    const advanceAmount = item.advanceAmount || 0;

    const descHeight = doc.heightOfString(description, {
      width: descWidth - 6,
      lineGap: 1,
    });
    const rowHeight = Math.max(descHeight + 16, 28);

    // Check if we need a new page
    if (currentY + rowHeight > 750) {
      doc.addPage();
      currentY = 40;

      // Redraw header on new page
      doc
        .rect(marginLeft, currentY, pageWidth, 22)
        .lineWidth(0.5)
        .fillAndStroke(headerBg, headerBg);

      doc
        .fontSize(7)
        .fillColor("#ffffff")
        .text("DESCRIPTION", descX + 6, currentY + 7)
        .text("QTY", qtyX + 2, currentY + 7, {
          width: qtyWidth,
          align: "center",
        })
        .text("PRICE", unitPriceX - 5, currentY + 7, {
          width: unitPriceWidth,
          align: "right",
        })
        .text("TAX", taxX - 5, currentY + 7, {
          width: taxWidth,
          align: "right",
        })
        .text("ADVANCE", advanceX - 5, currentY + 7, {
          width: advanceWidth,
          align: "right",
        })
        .text("TOTAL", totalX - 5, currentY + 7, {
          width: totalWidth,
          align: "right",
        });

      currentY += 26;
    }

    // Background
    doc.save();
    let bgColor = isAlternate ? colors.lightGray : "#ffffff";
    if (status === "CANCELLED") bgColor = colors.cancelledBg;
    if (status === "RETURNED") bgColor = colors.returnedBg;

    doc
      .rect(marginLeft, currentY - 4, pageWidth, rowHeight)
      .lineWidth(0.25)
      .fillAndStroke(bgColor, colors.border);
    doc.restore();

    isAlternate = !isAlternate;

    // Description
    doc
      .fontSize(8)
      .fillColor(colors.primary)
      .text(description, descX + 6, currentY, {
        width: descWidth - 6,
        lineGap: 1,
      });

    // Quantity
    doc.fontSize(8).text(String(qty), qtyX + 2, currentY, {
      width: qtyWidth,
      align: "center",
    });

    // Unit Price
    doc
      .fontSize(8)
      .fillColor(colors.secondary)
      .text(formatCurrency(price), unitPriceX - 5, currentY, {
        width: unitPriceWidth,
        align: "right",
      });

    // Tax
    doc.text(formatCurrency(taxAmount), taxX - 5, currentY, {
      width: taxWidth,
      align: "right",
    });

    // Advance Amount
    doc
      .fontSize(8)
      .fillColor(colors.secondary)
      .text(formatCurrency(advanceAmount), advanceX - 5, currentY, {
        width: advanceWidth,
        align: "right",
      });

    // Total - Simple display without strikethrough
    if (isAdjustment && refundAmount > 0) {
      doc
        .fontSize(8)
        .fillColor(status === "CANCELLED" ? colors.danger : colors.warning)
        .text(`-${formatCurrency(refundAmount)}`, totalX - 5, currentY, {
          width: totalWidth,
          align: "right",
        });
    } else {
      doc
        .fontSize(8)
        .fillColor(colors.primary)
        .text(formatCurrency(total), totalX - 5, currentY, {
          width: totalWidth,
          align: "right",
        });
    }

    currentY += rowHeight;
  });

  // Bottom border
  doc
    .moveTo(marginLeft, currentY)
    .lineTo(marginRight, currentY)
    .strokeColor(colors.border)
    .lineWidth(0.5)
    .stroke();

  // Return currentY WITHOUT adding extra spacing - let the caller control spacing
  return currentY;
}

module.exports = generateInvoice;
