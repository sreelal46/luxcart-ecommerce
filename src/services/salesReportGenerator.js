const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");
const Order = require("../models/user/OrderModel");

function formatCurrency(value) {
  const num = Number(value || 0);

  // Indian number format
  const formatted = num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `₹${formatted}`;
}

const generateSalesReportPDF = async (req, res, next) => {
  try {
    const {
      search = "",
      category,
      dateFrom,
      dateTo,
      minTotal,
      maxTotal,
    } = req.query;

    const orders = await Order.find({}).sort({ createdAt: -1 }).lean();

    let sales = [];
    let totalRevenue = 0;
    let totalOrders = 0;
    let totalItemsSold = 0;

    orders.forEach((order) => {
      if (order.paymentStatus === "Paid") {
        totalRevenue += order.totalAmount;
        totalOrders++;
      }

      order.items.forEach((item) => {
        if (item.fulfillmentStatus.status !== "delivered") return;

        const itemCategory = item.carId
          ? "Car"
          : item.accessoryId
            ? "Accessories"
            : "Other";

        totalItemsSold += item.quantity;

        sales.push({
          orderId: order.orderId,
          buyer: order.address?.name || "N/A",
          product: item.productName,
          quantity: item.quantity,
          price: item.offerPrice || item.price,
          category: itemCategory,
          total: item.totalItemAmount,
          createdAt: order.createdAt,
          paymentMethod: order.paymentMethod,
        });
      });
    });

    /* SEARCH */
    if (search) {
      const regex = new RegExp(search, "i");
      sales = sales.filter(
        (s) =>
          regex.test(s.buyer) ||
          regex.test(s.product) ||
          regex.test(s.category) ||
          regex.test(s.orderId),
      );
    }

    /* FILTER */
    if (category) sales = sales.filter((s) => s.category === category);
    if (dateFrom)
      sales = sales.filter((s) => new Date(s.createdAt) >= new Date(dateFrom));
    if (dateTo)
      sales = sales.filter((s) => new Date(s.createdAt) <= new Date(dateTo));
    if (minTotal) sales = sales.filter((s) => s.total >= Number(minTotal));
    if (maxTotal) sales = sales.filter((s) => s.total <= Number(maxTotal));

    // Calculate filtered totals
    const filteredRevenue = sales.reduce((sum, s) => sum + s.total, 0);
    const filteredItemsSold = sales.reduce((sum, s) => sum + s.quantity, 0);

    /* PDF SETUP */
    const docOptions = {
      size: "A4",
      margin: 40,
      bufferPages: true,
      autoFirstPage: true,
      info: {
        Title: "Sales Report",
        Author: "LUXCART",
        Subject: "Sales Report",
        Creator: "LUXCART Reporting System",
        CreationDate: new Date(),
      },
    };

    const doc = new PDFDocument(docOptions);

    // Register fonts
    const fontPath = path.join(__dirname, "../font/DejaVuSans.ttf");
    const fontBoldPath = path.join(__dirname, "../font/DejaVuSans-Bold.ttf");

    if (fs.existsSync(fontPath)) doc.registerFont("DejaVu", fontPath);
    if (fs.existsSync(fontBoldPath))
      doc.registerFont("DejaVuBold", fontBoldPath);

    try {
      doc.font("DejaVu");
    } catch (e) {
      // Fallback to default font
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=sales-report.pdf",
    );

    doc.pipe(res);

    const marginLeft = 40;
    const marginRight = 555;
    const pageWidth = 515;

    const colors = {
      primary: "#1a1a1a",
      secondary: "#666666",
      accent: "#2563eb",
      lightGray: "#f8f9fa",
      border: "#dee2e6",
      success: "#10b981",
      danger: "#ef4444",
      warning: "#f59e0b",
      headerBg: "#1e40af",
    };

    let currentY = 40;

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
      .text(
        "Premium Car & Accessories Detailing",
        marginLeft + 65,
        currentY + 26,
      )
      .text("www.luxcart.com", marginLeft + 65, currentY + 38);

    // Report info box
    const infoBoxX = 380;
    const infoBoxWidth = 175;

    doc
      .roundedRect(infoBoxX, currentY, infoBoxWidth, 50, 4)
      .lineWidth(0.5)
      .fillAndStroke(colors.lightGray, colors.border);

    doc
      .fontSize(14)
      .fillColor(colors.accent)
      .text("SALES REPORT", infoBoxX + 10, currentY + 8);
    doc
      .fontSize(8)
      .fillColor(colors.secondary)
      .text(
        `Generated: ${new Date().toLocaleDateString("en-IN")}`,
        infoBoxX + 10,
        currentY + 28,
      )
      .text(
        `Time: ${new Date().toLocaleTimeString("en-IN")}`,
        infoBoxX + 10,
        currentY + 40,
      );

    currentY += 65;

    doc
      .moveTo(marginLeft, currentY)
      .lineTo(marginRight, currentY)
      .strokeColor(colors.border)
      .lineWidth(0.5)
      .stroke();

    currentY += 20;

    // ========== SUMMARY CARDS ==========
    const cardWidth = 120;
    const cardHeight = 65;
    const cardGap = 13;
    const cardsStartX = marginLeft;

    const summaryCards = [
      {
        label: "Total Revenue",
        value: formatCurrency(filteredRevenue),
        icon: "₹",
        color: colors.success,
      },
      {
        label: "Total Orders",
        value: sales.length.toString(),
        icon: "#",
        color: colors.accent,
      },
      {
        label: "Items Sold",
        value: filteredItemsSold.toString(),
        icon: "□",
        color: colors.warning,
      },
      {
        label: "Avg Order Value",
        value: formatCurrency(
          sales.length > 0 ? filteredRevenue / sales.length : 0,
        ),
        icon: "~",
        color: colors.primary,
      },
    ];

    summaryCards.forEach((card, index) => {
      const cardX = cardsStartX + index * (cardWidth + cardGap);

      // Shadow
      doc.save();
      doc
        .roundedRect(cardX + 2, currentY + 2, cardWidth, cardHeight, 6)
        .fillOpacity(0.1)
        .fill("#000000");
      doc.restore();

      // Card background
      doc
        .roundedRect(cardX, currentY, cardWidth, cardHeight, 6)
        .lineWidth(0.5)
        .fillAndStroke(colors.lightGray, colors.border);

      // Icon circle
      doc.save();
      doc
        .circle(cardX + 15, currentY + 15, 10)
        .fillOpacity(0.15)
        .fill(card.color);
      doc.restore();

      doc
        .fontSize(12)
        .fillColor(card.color)
        .text(card.icon, cardX + 11, currentY + 9);

      // Label
      doc
        .fontSize(8)
        .fillColor(colors.secondary)
        .text(card.label, cardX + 10, currentY + 32, {
          width: cardWidth - 20,
          align: "left",
        });

      // Value
      const valueSize = card.value.length > 12 ? 10 : 12;
      try {
        doc.font("DejaVuBold");
      } catch (e) {}
      doc
        .fontSize(valueSize)
        .fillColor(colors.primary)
        .text(card.value, cardX + 10, currentY + 45, {
          width: cardWidth - 20,
          align: "left",
        });
      try {
        doc.font("DejaVu");
      } catch (e) {}
    });

    currentY += cardHeight + 25;

    // ========== FILTER INFORMATION ==========
    if (search || category || dateFrom || dateTo || minTotal || maxTotal) {
      doc
        .fontSize(10)
        .fillColor(colors.accent)
        .text("Applied Filters:", marginLeft, currentY);
      currentY += 14;

      doc.fontSize(8).fillColor(colors.secondary);

      if (search) {
        doc.text(`• Search: "${search}"`, marginLeft + 10, currentY);
        currentY += 11;
      }
      if (category) {
        doc.text(`• Category: ${category}`, marginLeft + 10, currentY);
        currentY += 11;
      }
      if (dateFrom) {
        doc.text(
          `• From: ${new Date(dateFrom).toLocaleDateString("en-IN")}`,
          marginLeft + 10,
          currentY,
        );
        currentY += 11;
      }
      if (dateTo) {
        doc.text(
          `• To: ${new Date(dateTo).toLocaleDateString("en-IN")}`,
          marginLeft + 10,
          currentY,
        );
        currentY += 11;
      }
      if (minTotal) {
        doc.text(
          `• Min Total: ${formatCurrency(minTotal)}`,
          marginLeft + 10,
          currentY,
        );
        currentY += 11;
      }
      if (maxTotal) {
        doc.text(
          `• Max Total: ${formatCurrency(maxTotal)}`,
          marginLeft + 10,
          currentY,
        );
        currentY += 11;
      }

      currentY += 10;
    }

    // ========== SALES TABLE ==========
    doc
      .fontSize(11)
      .fillColor(colors.primary)
      .text("DETAILED SALES", marginLeft, currentY);
    currentY += 18;

    currentY = renderSalesTable(
      doc,
      sales,
      currentY,
      colors,
      marginLeft,
      pageWidth,
    );

    // ========== FOOTER ==========
    currentY += 15;

    doc
      .moveTo(marginLeft, currentY)
      .lineTo(marginRight, currentY)
      .strokeColor(colors.border)
      .lineWidth(0.5)
      .stroke();

    doc
      .fontSize(9)
      .fillColor(colors.secondary)
      .text(
        "This report is generated by LUXCART Sales System",
        marginLeft,
        currentY + 8,
        { width: pageWidth, align: "center" },
      );

    doc
      .fontSize(7)
      .fillColor(colors.secondary)
      .text(
        "For inquiries, contact: support@luxcart.com",
        marginLeft,
        currentY + 22,
        { width: pageWidth, align: "center" },
      );

    doc.end();
  } catch (error) {
    next(error);
  }
};

// ========== HELPER: RENDER SALES TABLE ==========
function renderSalesTable(doc, sales, startY, colors, marginLeft, pageWidth) {
  let currentY = startY;
  const marginRight = marginLeft + pageWidth;

  const tableTop = currentY;
  const orderIdX = marginLeft;
  const buyerX = 85;
  const productX = 165;
  const qtyX = 300;
  const priceX = 345;
  const categoryX = 420;
  const totalX = 485;

  const orderIdWidth = 70;
  const buyerWidth = 75;
  const productWidth = 130;
  const qtyWidth = 35;
  const priceWidth = 70;
  const categoryWidth = 60;
  const totalWidth = 70;

  // Table header
  doc
    .rect(marginLeft, tableTop, pageWidth, 24)
    .lineWidth(0.5)
    .fillAndStroke(colors.headerBg, colors.headerBg);

  doc
    .fontSize(7)
    .fillColor("#ffffff")
    .text("ORDER ID", orderIdX + 4, tableTop + 8, {
      width: orderIdWidth,
      align: "left",
    })
    .text("BUYER", buyerX + 4, tableTop + 8, {
      width: buyerWidth,
      align: "left",
    })
    .text("PRODUCT", productX + 4, tableTop + 8, {
      width: productWidth,
      align: "left",
    })
    .text("QTY", qtyX, tableTop + 8, { width: qtyWidth, align: "center" })
    .text("PRICE", priceX - 5, tableTop + 8, {
      width: priceWidth,
      align: "right",
    })
    .text("CATEGORY", categoryX - 5, tableTop + 8, {
      width: categoryWidth,
      align: "right",
    })
    .text("TOTAL", totalX - 5, tableTop + 8, {
      width: totalWidth,
      align: "right",
    });

  currentY = tableTop + 28;

  let isAlternate = false;
  let pageTotal = 0;

  sales.forEach((sale, index) => {
    const rowHeight = 24;

    // Check if we need a new page
    if (currentY + rowHeight > 750) {
      // Draw subtotal for current page
      if (pageTotal > 0) {
        doc
          .fontSize(8)
          .fillColor(colors.secondary)
          .text(
            `Page Subtotal: ${formatCurrency(pageTotal)}`,
            marginLeft,
            currentY + 5,
            { align: "right" },
          );
      }

      doc.addPage();
      currentY = 40;
      pageTotal = 0;

      // Redraw header
      doc
        .rect(marginLeft, currentY, pageWidth, 24)
        .lineWidth(0.5)
        .fillAndStroke(colors.headerBg, colors.headerBg);

      doc
        .fontSize(7)
        .fillColor("#ffffff")
        .text("ORDER ID", orderIdX + 4, currentY + 8, {
          width: orderIdWidth,
          align: "left",
        })
        .text("BUYER", buyerX + 4, currentY + 8, {
          width: buyerWidth,
          align: "left",
        })
        .text("PRODUCT", productX + 4, currentY + 8, {
          width: productWidth,
          align: "left",
        })
        .text("QTY", qtyX, currentY + 8, { width: qtyWidth, align: "center" })
        .text("PRICE", priceX - 5, currentY + 8, {
          width: priceWidth,
          align: "right",
        })
        .text("CATEGORY", categoryX - 5, currentY + 8, {
          width: categoryWidth,
          align: "right",
        })
        .text("TOTAL", totalX - 5, currentY + 8, {
          width: totalWidth,
          align: "right",
        });

      currentY += 28;
    }

    // Alternate row background
    const bgColor = isAlternate ? colors.lightGray : "#ffffff";
    doc
      .rect(marginLeft, currentY - 2, pageWidth, rowHeight)
      .lineWidth(0.25)
      .fillAndStroke(bgColor, colors.border);

    isAlternate = !isAlternate;

    // Order ID
    doc
      .fontSize(7)
      .fillColor(colors.secondary)
      .text(sale.orderId, orderIdX + 4, currentY + 6, {
        width: orderIdWidth - 8,
        ellipsis: true,
      });

    // Buyer
    doc
      .fontSize(7)
      .fillColor(colors.primary)
      .text(sale.buyer, buyerX + 4, currentY + 6, {
        width: buyerWidth - 8,
        ellipsis: true,
      });

    // Product
    doc
      .fontSize(7)
      .fillColor(colors.primary)
      .text(sale.product, productX + 4, currentY + 6, {
        width: productWidth - 8,
        ellipsis: true,
      });

    // Quantity
    doc
      .fontSize(7)
      .fillColor(colors.secondary)
      .text(String(sale.quantity), qtyX, currentY + 6, {
        width: qtyWidth,
        align: "center",
      });

    // Price
    doc
      .fontSize(7)
      .fillColor(colors.secondary)
      .text(formatCurrency(sale.price), priceX - 5, currentY + 6, {
        width: priceWidth,
        align: "right",
      });

    // Category
    let categoryColor = colors.secondary;
    if (sale.category === "Car") categoryColor = colors.accent;
    else if (sale.category === "Accessories") categoryColor = colors.success;

    doc
      .fontSize(7)
      .fillColor(categoryColor)
      .text(sale.category, categoryX - 5, currentY + 6, {
        width: categoryWidth,
        align: "right",
      });

    // Total
    doc
      .fontSize(7)
      .fillColor(colors.primary)
      .text(formatCurrency(sale.total), totalX - 5, currentY + 6, {
        width: totalWidth,
        align: "right",
      });

    pageTotal += sale.total;
    currentY += rowHeight;
  });

  // Bottom border
  doc
    .moveTo(marginLeft, currentY)
    .lineTo(marginRight, currentY)
    .strokeColor(colors.border)
    .lineWidth(0.5)
    .stroke();

  // Grand Total
  currentY += 10;
  doc
    .fontSize(9)
    .fillColor(colors.primary)
    .text("GRAND TOTAL:", totalX - 130, currentY, {
      width: 100,
      align: "right",
    });

  try {
    doc.font("DejaVuBold");
  } catch (e) {}
  doc
    .fontSize(10)
    .fillColor(colors.success)
    .text(
      formatCurrency(sales.reduce((sum, s) => sum + s.total, 0)),
      totalX - 5,
      currentY,
      { width: totalWidth, align: "right" },
    );
  try {
    doc.font("DejaVu");
  } catch (e) {}

  return currentY + 15;
}

module.exports = { generateSalesReportPDF };
