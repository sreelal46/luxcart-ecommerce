// generateInvoice.js - Fixed Version with Correct Offer Price and Amount Calculation
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

function formatCurrency(value) {
  const num = Number(value || 0);
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

  currentY = Math.max(leftY, doc.y) + 15;

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
    if (hasRenderedAnySection) {
      currentY += 15;
    }

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
    if (hasRenderedAnySection) {
      currentY += 15;
    }

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

  // ========== CALCULATE FINAL AMOUNT TO PAY ==========
  const totalAmount = Number(order.totalAmount || 0);
  const advancePaid = Number(order.advanceAmount || 0);
  const refundedCancelled = Number(order.refundedAmount || 0);
  const refundedReturned = Number(order.returnRefundAmount || 0);
  const remainingAmount = Number(order.remainingAmount || 0);

  // Calculate: Total - Advance - Refunds = Amount to Pay
  const calculatedAmountToPay = Math.max(
    0,
    totalAmount - advancePaid - refundedCancelled - refundedReturned
  );
  const finalAmountToPay =
    remainingAmount !== undefined && remainingAmount !== null
      ? Math.max(0, remainingAmount)
      : calculatedAmountToPay;
  // const finalAmountToPay =
  //   totalAmount - advancePaid - refundedCancelled - refundedReturned;

  // ========== ENHANCED PAYMENT SUMMARY ==========
  currentY += 10;

  if (currentY > 600) {
    doc.addPage();
    currentY = 40;
  }

  const summaryX = 325;
  const summaryWidth = 230;

  const summaryLines = [];

  // 1. Subtotal
  summaryLines.push({
    label: "Subtotal",
    value: formatCurrency(order.subtotal || 0),
    color: colors.secondary,
    fontSize: 9,
  });

  // 2. Shipping Charges (if applicable)
  if (order.shippingCharges && Number(order.shippingCharges) > 0) {
    summaryLines.push({
      label: "Shipping Charges",
      value: `+ ${formatCurrency(order.shippingCharges)}`,
      color: colors.secondary,
      fontSize: 9,
    });
  }

  // 3. Tax
  const taxPercent = order.taxPercent || "";
  const taxLabel = taxPercent ? `Tax (${taxPercent}%)` : "Total Tax";
  summaryLines.push({
    label: taxLabel,
    value: `+ ${formatCurrency(order.taxAmount || 0)}`,
    color: colors.secondary,
    fontSize: 9,
  });

  // 4. Coupon Discount (if applied)
  if (order.couponDetails && order.couponDetails.code) {
    const couponLine = {
      label: `Coupon: ${order.couponDetails.code}`,
      value: `- ${formatCurrency(order.couponDetails.couponDiscount)}`,
      color: colors.success,
      fontSize: 9,
      isCoupon: true,
      couponType: order.couponDetails.discountType,
      couponValue: order.couponDetails.discountValue,
    };
    summaryLines.push(couponLine);
  }

  // 5. Additional Discount (if any)
  if (order.discount && Number(order.discount) > 0) {
    summaryLines.push({
      label: "Additional Discount",
      value: `- ${formatCurrency(
        order.couponDetails && order.couponDetails.code
          ? order?.discount - order?.couponDetails?.couponDiscount
          : order?.discount
      )}`,
      color: colors.success,
      fontSize: 9,
    });
  }

  // Divider before total
  summaryLines.push({ isDivider: true });

  // 6. Total Amount
  summaryLines.push({
    label: "Total Amount",
    value: formatCurrency(totalAmount),
    color: colors.primary,
    fontSize: 10,
    isBold: true,
  });

  // Divider before deductions
  summaryLines.push({ isDivider: true });

  // 7. Advance Payment (if any)
  if (advancePaid > 0) {
    summaryLines.push({
      label: "Advance Paid",
      value: `- ${formatCurrency(advancePaid)}`,
      color: colors.accent,
      fontSize: 9,
    });
  }

  // 8. Cancelled Items Refund (if any)
  if (refundedCancelled > 0) {
    summaryLines.push({
      label: "Refunded (Cancelled)",
      value: `- ${formatCurrency(refundedCancelled)}`,
      color: colors.danger,
      fontSize: 9,
    });
  }

  // 9. Returned Items Refund (if any)
  if (refundedReturned > 0) {
    summaryLines.push({
      label: "Refunded (Returned)",
      value: `- ${formatCurrency(refundedReturned)}`,
      color: colors.warning,
      fontSize: 9,
    });
  }

  // Calculate dynamic height
  const headerHeight = 20;
  const labelFontSize = 9;
  const paddingTop = 12;
  const paddingBottom = 12;
  const gapBetweenLines = 7;
  const dividerHeight = 8;

  doc.fontSize(labelFontSize);
  let measuredLinesHeight = 0;
  summaryLines.forEach((ln) => {
    if (ln.isDivider) {
      measuredLinesHeight += dividerHeight;
    } else {
      const h = doc.heightOfString(ln.label, { width: summaryWidth - 24 });
      measuredLinesHeight += h + gapBetweenLines;
    }
  });

  const finalAmountHeight = 18;
  const computedHeight =
    paddingTop +
    headerHeight +
    measuredLinesHeight +
    finalAmountHeight +
    paddingBottom;
  const summaryHeight = Math.max(130, computedHeight);

  // Shadow effect
  doc.save();
  doc
    .roundedRect(summaryX + 2, currentY + 2, summaryWidth, summaryHeight, 6)
    .fillOpacity(0.1)
    .fill("#000000");
  doc.restore();

  // Main box
  doc
    .roundedRect(summaryX, currentY, summaryWidth, summaryHeight, 6)
    .lineWidth(0.5)
    .fillAndStroke(colors.lightGray, colors.border);

  let summaryY = currentY + paddingTop;
  const labelX = summaryX + 12;
  const valueX = summaryX + summaryWidth - 12;

  // Header
  doc
    .fontSize(11)
    .fillColor(colors.primary)
    .text("PAYMENT SUMMARY", labelX, summaryY);
  summaryY += headerHeight;

  // Render each line
  summaryLines.forEach((ln) => {
    if (ln.isDivider) {
      doc
        .moveTo(labelX, summaryY + 2)
        .lineTo(valueX, summaryY + 2)
        .strokeColor(colors.border)
        .lineWidth(0.5)
        .stroke();
      summaryY += dividerHeight;
      return;
    }

    const lineFontSize = ln.fontSize || 9;
    const lineFont = ln.isBold ? "DejaVuBold" : "DejaVu";

    try {
      doc.font(lineFont);
    } catch (e) {
      // Fallback
    }

    // Special styling for coupon
    if (ln.isCoupon) {
      doc.save();
      doc
        .rect(labelX - 4, summaryY - 2, summaryWidth - 16, 16)
        .fillOpacity(0.1)
        .fill(colors.success);
      doc.restore();
    }

    // Label
    doc
      .fontSize(lineFontSize)
      .fillColor(ln.color || colors.secondary)
      .text(ln.label, labelX, summaryY, { width: summaryWidth - 80 });

    // Value
    const valueStr = ln.value;
    const valueFontSize =
      valueStr.length > 15 ? Math.max(7, lineFontSize - 2) : lineFontSize;

    doc
      .fontSize(valueFontSize)
      .fillColor(ln.color || colors.secondary)
      .text(ln.value, valueX - 110, summaryY, { width: 110, align: "right" });

    summaryY +=
      doc.heightOfString(ln.label, { width: summaryWidth - 24 }) +
      gapBetweenLines;
  });

  // Final divider
  doc
    .moveTo(labelX, summaryY + 2)
    .lineTo(valueX, summaryY + 2)
    .strokeColor(colors.border)
    .lineWidth(1)
    .stroke();
  summaryY += 10;

  // Amount to Pay - Highlighted (FIXED CALCULATION)
  const amountStr = formatCurrency(
    remainingAmount ? remainingAmount : finalAmountToPay
  );
  const amountFontSize = amountStr.length > 15 ? 11 : 13;

  try {
    doc.font("DejaVuBold");
  } catch (e) {
    // Fallback
  }

  doc
    .fontSize(11)
    .fillColor(colors.primary)
    .text("Amount to Pay", labelX, summaryY);

  // Highlight box for final amount
  doc.save();
  doc
    .roundedRect(valueX - 115, summaryY - 3, 115, 18, 3)
    .fillOpacity(0.1)
    .fill(colors.accent);
  doc.restore();

  doc
    .fontSize(amountFontSize)
    .fillColor(colors.accent)
    .text(
      formatCurrency(remainingAmount ? remainingAmount : finalAmountToPay),
      valueX - 110,
      summaryY,
      {
        width: 110,
        align: "right",
      }
    );

  currentY = currentY + summaryHeight + 12;

  // ========== PAYMENT METHOD & STATUS INFO ==========
  if (order.paymentMethod || order.paymentId || order.trackingId) {
    doc
      .fontSize(9)
      .fillColor(colors.secondary)
      .text("Payment Details:", marginLeft, currentY);
    currentY += 12;

    if (order.paymentMethod) {
      doc
        .fontSize(8)
        .fillColor(colors.primary)
        .text(`Method: ${order.paymentMethod}`, marginLeft + 10, currentY);
      currentY += 11;
    }

    if (order.paymentId) {
      doc
        .fontSize(8)
        .fillColor(colors.secondary)
        .text(`Payment ID: ${order.paymentId}`, marginLeft + 10, currentY);
      currentY += 11;
    }

    if (order.trackingId) {
      doc
        .fontSize(8)
        .fillColor(colors.secondary)
        .text(`Tracking ID: ${order.trackingId}`, marginLeft + 10, currentY);
      currentY += 11;
    }

    currentY += 8;
  }

  // ========== AMOUNT IN WORDS ==========
  doc
    .fontSize(8)
    .fillColor(colors.secondary)
    .text("Amount in words:", marginLeft, currentY);
  doc
    .fontSize(9)
    .fillColor(colors.primary)
    .text(
      numberToWords(
        Math.floor(remainingAmount ? remainingAmount : finalAmountToPay)
      ),
      marginLeft,
      currentY + 11,
      {
        width: pageWidth * 0.7,
        lineGap: 2,
      }
    );

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

// ========== HELPER: RENDER ITEMS TABLE (FIXED) ==========
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
  const priceX = 215;
  const taxX = 305;
  const advanceX = 395;
  const totalX = 485;

  const descWidth = qtyX - descX - 8;
  const qtyWidth = 30;
  const priceWidth = 85;
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
    .text("PRICE", priceX - 5, tableTop + 7, {
      width: priceWidth,
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
    const offerPrice = item.offerPrice;
    const taxAmount = item.tax || 0;
    const total = item.total || 0;
    const status = (item.status || "").toUpperCase().trim();
    const refundAmount = item.refundAmount || 0;
    const advanceAmount = item.advanceAmount || 0;

    // Determine which price to display
    let displayPrice = price;
    let hasOfferPrice = false;

    if (
      offerPrice !== undefined &&
      offerPrice !== null &&
      offerPrice !== "Null" &&
      offerPrice !== ""
    ) {
      const offerNum = Number(offerPrice);
      if (!isNaN(offerNum) && offerNum > 0) {
        displayPrice = offerNum;
        hasOfferPrice = true;
      }
    }

    const descHeight = doc.heightOfString(description, {
      width: descWidth - 6,
      lineGap: 1,
    });
    const rowHeight = Math.max(descHeight + 16, 28);

    // Check if we need a new page
    if (currentY + rowHeight > 750) {
      doc.addPage();
      currentY = 40;

      // Redraw header
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
        .text("PRICE", priceX - 5, currentY + 7, {
          width: priceWidth,
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

    // Price (with offer price logic)
    if (hasOfferPrice) {
      // Show original price with strikethrough
      doc
        .fontSize(7)
        .fillColor(colors.secondary)
        .text(formatCurrency(price), priceX - 5, currentY - 2, {
          width: priceWidth,
          align: "right",
        });

      // Draw strikethrough line
      const priceText = formatCurrency(price);
      const priceWidth2 = doc.widthOfString(priceText, { fontSize: 7 });
      doc
        .moveTo(priceX + priceWidth - priceWidth2 - 5, currentY + 3)
        .lineTo(priceX + priceWidth - 5, currentY + 3)
        .strokeColor(colors.secondary)
        .lineWidth(0.5)
        .stroke();

      // Show offer price in green
      doc
        .fontSize(8)
        .fillColor(colors.success)
        .text(formatCurrency(displayPrice), priceX - 5, currentY + 8, {
          width: priceWidth,
          align: "right",
        });
    } else {
      // Show regular price
      doc
        .fontSize(8)
        .fillColor(colors.secondary)
        .text(formatCurrency(displayPrice), priceX - 5, currentY, {
          width: priceWidth,
          align: "right",
        });
    }

    // Tax
    doc
      .fontSize(8)
      .fillColor(colors.secondary)
      .text(formatCurrency(taxAmount), taxX - 5, currentY, {
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

    // Total
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

  return currentY;
}

module.exports = generateInvoice;
