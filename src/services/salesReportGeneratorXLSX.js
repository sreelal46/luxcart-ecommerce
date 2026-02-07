const ExcelJS = require("exceljs");
const Order = require("../models/user/OrderModel");

function formatCurrency(value) {
  const num = Number(value || 0);
  const formatted = num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `₹${formatted}`;
}

const generateSalesReportXLSX = async (req, res, next) => {
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

    /* EXCEL SETUP */
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "LUXCART";
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.properties.date1904 = false;

    const worksheet = workbook.addWorksheet("Sales Report", {
      pageSetup: {
        paperSize: 9, // A4
        orientation: "landscape",
        fitToPage: true,
        fitToWidth: 1,
        margins: {
          left: 0.5,
          right: 0.5,
          top: 0.75,
          bottom: 0.75,
          header: 0.3,
          footer: 0.3,
        },
      },
    });

    // Set column widths
    worksheet.columns = [
      { width: 15 }, // A - Order ID
      { width: 18 }, // B - Buyer
      { width: 30 }, // C - Product
      { width: 8 }, // D - Qty
      { width: 14 }, // E - Price
      { width: 14 }, // F - Category
      { width: 14 }, // G - Total
    ];

    let currentRow = 1;

    // ========== HEADER SECTION ==========
    // Logo placeholder
    worksheet.getCell(`A${currentRow}`).value = "LUXCART";
    worksheet.getCell(`A${currentRow}`).font = {
      name: "Arial",
      size: 20,
      bold: true,
      color: { argb: "FF1a1a1a" },
    };
    worksheet.getCell(`A${currentRow}`).alignment = {
      vertical: "middle",
      horizontal: "left",
    };

    // Company tagline
    worksheet.getCell(`A${currentRow + 1}`).value =
      "Premium Car & Accessories Detailing";
    worksheet.getCell(`A${currentRow + 1}`).font = {
      name: "Arial",
      size: 9,
      color: { argb: "FF666666" },
    };

    // Report title and date
    worksheet.getCell(`E${currentRow}`).value = "SALES REPORT";
    worksheet.getCell(`E${currentRow}`).font = {
      name: "Arial",
      size: 14,
      bold: true,
      color: { argb: "FF2563eb" },
    };
    worksheet.getCell(`E${currentRow}`).alignment = {
      horizontal: "right",
    };

    worksheet.getCell(`E${currentRow + 1}`).value =
      `Generated: ${new Date().toLocaleDateString("en-IN")} ${new Date().toLocaleTimeString("en-IN")}`;
    worksheet.getCell(`E${currentRow + 1}`).font = {
      name: "Arial",
      size: 8,
      color: { argb: "FF666666" },
    };
    worksheet.getCell(`E${currentRow + 1}`).alignment = {
      horizontal: "right",
    };

    currentRow += 4;

    // ========== SUMMARY CARDS ==========
    const summaryData = [
      ["Total Revenue", formatCurrency(filteredRevenue)],
      ["Total Orders", sales.length],
      ["Items Sold", filteredItemsSold],
      [
        "Avg Order Value",
        formatCurrency(sales.length > 0 ? filteredRevenue / sales.length : 0),
      ],
    ];

    summaryData.forEach((item, index) => {
      const col = String.fromCharCode(65 + Math.floor(index * 1.75)); // A, B, D, F
      worksheet.getCell(`${col}${currentRow}`).value = item[0];
      worksheet.getCell(`${col}${currentRow}`).font = {
        name: "Arial",
        size: 9,
        bold: true,
        color: { argb: "FF666666" },
      };
      worksheet.getCell(`${col}${currentRow}`).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF8F9FA" },
      };
      worksheet.getCell(`${col}${currentRow}`).border = {
        top: { style: "thin", color: { argb: "FFDEE2E6" } },
        left: { style: "thin", color: { argb: "FFDEE2E6" } },
        bottom: { style: "thin", color: { argb: "FFDEE2E6" } },
        right: { style: "thin", color: { argb: "FFDEE2E6" } },
      };

      worksheet.getCell(`${col}${currentRow + 1}`).value = item[1];
      worksheet.getCell(`${col}${currentRow + 1}`).font = {
        name: "Arial",
        size: 12,
        bold: true,
        color: { argb: "FF1a1a1a" },
      };
      worksheet.getCell(`${col}${currentRow + 1}`).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF8F9FA" },
      };
      worksheet.getCell(`${col}${currentRow + 1}`).border = {
        top: { style: "thin", color: { argb: "FFDEE2E6" } },
        left: { style: "thin", color: { argb: "FFDEE2E6" } },
        bottom: { style: "thin", color: { argb: "FFDEE2E6" } },
        right: { style: "thin", color: { argb: "FFDEE2E6" } },
      };
    });

    currentRow += 4;

    // ========== FILTER INFORMATION ==========
    if (search || category || dateFrom || dateTo || minTotal || maxTotal) {
      worksheet.getCell(`A${currentRow}`).value = "Applied Filters:";
      worksheet.getCell(`A${currentRow}`).font = {
        name: "Arial",
        size: 10,
        bold: true,
        color: { argb: "FF2563eb" },
      };
      currentRow++;

      const filters = [];
      if (search) filters.push(`Search: "${search}"`);
      if (category) filters.push(`Category: ${category}`);
      if (dateFrom)
        filters.push(`From: ${new Date(dateFrom).toLocaleDateString("en-IN")}`);
      if (dateTo)
        filters.push(`To: ${new Date(dateTo).toLocaleDateString("en-IN")}`);
      if (minTotal) filters.push(`Min Total: ${formatCurrency(minTotal)}`);
      if (maxTotal) filters.push(`Max Total: ${formatCurrency(maxTotal)}`);

      filters.forEach((filter) => {
        worksheet.getCell(`A${currentRow}`).value = `• ${filter}`;
        worksheet.getCell(`A${currentRow}`).font = {
          name: "Arial",
          size: 8,
          color: { argb: "FF666666" },
        };
        currentRow++;
      });

      currentRow += 1;
    }

    // ========== SALES TABLE ==========
    worksheet.getCell(`A${currentRow}`).value = "DETAILED SALES";
    worksheet.getCell(`A${currentRow}`).font = {
      name: "Arial",
      size: 11,
      bold: true,
      color: { argb: "FF1a1a1a" },
    };
    currentRow += 2;

    // Table headers
    const headers = [
      "ORDER ID",
      "BUYER",
      "PRODUCT",
      "QTY",
      "PRICE",
      "CATEGORY",
      "TOTAL",
    ];

    const headerRow = currentRow;
    headers.forEach((header, index) => {
      const col = String.fromCharCode(65 + index);
      const cell = worksheet.getCell(`${col}${headerRow}`);
      cell.value = header;
      cell.font = {
        name: "Arial",
        size: 9,
        bold: true,
        color: { argb: "FFFFFFFF" },
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF1e40af" },
      };
      cell.alignment = {
        vertical: "middle",
        horizontal: "center",
      };
      cell.border = {
        top: { style: "thin", color: { argb: "FF1e40af" } },
        left: { style: "thin", color: { argb: "FF1e40af" } },
        bottom: { style: "thin", color: { argb: "FF1e40af" } },
        right: { style: "thin", color: { argb: "FF1e40af" } },
      };
    });

    currentRow++;

    // Table data
    sales.forEach((sale, index) => {
      const isAlternate = index % 2 === 0;
      const bgColor = isAlternate ? "FFF8F9FA" : "FFFFFFFF";

      const rowData = [
        sale.orderId,
        sale.buyer,
        sale.product,
        sale.quantity,
        sale.price,
        sale.category,
        sale.total,
      ];

      rowData.forEach((value, colIndex) => {
        const col = String.fromCharCode(65 + colIndex);
        const cell = worksheet.getCell(`${col}${currentRow}`);

        if (colIndex === 4 || colIndex === 6) {
          // Price and Total columns
          cell.value = value;
          cell.numFmt = "₹#,##0.00";
        } else {
          cell.value = value;
        }

        cell.font = {
          name: "Arial",
          size: 8,
          color: {
            argb: colIndex === 5 ? getCategoryColor(sale.category) : "FF1a1a1a",
          },
        };

        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: bgColor },
        };

        cell.border = {
          top: { style: "thin", color: { argb: "FFDEE2E6" } },
          left: { style: "thin", color: { argb: "FFDEE2E6" } },
          bottom: { style: "thin", color: { argb: "FFDEE2E6" } },
          right: { style: "thin", color: { argb: "FFDEE2E6" } },
        };

        cell.alignment = {
          vertical: "middle",
          horizontal:
            colIndex === 3 ? "center" : colIndex >= 4 ? "right" : "left",
        };
      });

      currentRow++;
    });

    // Grand Total
    currentRow += 1;
    worksheet.getCell(`F${currentRow}`).value = "GRAND TOTAL:";
    worksheet.getCell(`F${currentRow}`).font = {
      name: "Arial",
      size: 10,
      bold: true,
      color: { argb: "FF1a1a1a" },
    };
    worksheet.getCell(`F${currentRow}`).alignment = {
      horizontal: "right",
    };

    worksheet.getCell(`G${currentRow}`).value = filteredRevenue;
    worksheet.getCell(`G${currentRow}`).numFmt = "₹#,##0.00";
    worksheet.getCell(`G${currentRow}`).font = {
      name: "Arial",
      size: 11,
      bold: true,
      color: { argb: "FF10b981" },
    };
    worksheet.getCell(`G${currentRow}`).alignment = {
      horizontal: "right",
    };

    currentRow += 3;

    // ========== FOOTER ==========
    worksheet.getCell(`A${currentRow}`).value =
      "This report is generated by LUXCART Sales System";
    worksheet.getCell(`A${currentRow}`).font = {
      name: "Arial",
      size: 9,
      color: { argb: "FF666666" },
    };
    worksheet.getCell(`A${currentRow}`).alignment = {
      horizontal: "center",
    };
    worksheet.mergeCells(`A${currentRow}:G${currentRow}`);

    currentRow++;
    worksheet.getCell(`A${currentRow}`).value =
      "For inquiries, contact: support@luxcart.com";
    worksheet.getCell(`A${currentRow}`).font = {
      name: "Arial",
      size: 8,
      color: { argb: "FF666666" },
    };
    worksheet.getCell(`A${currentRow}`).alignment = {
      horizontal: "center",
    };
    worksheet.mergeCells(`A${currentRow}:G${currentRow}`);

    // Send file
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=sales-report.xlsx",
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};

function getCategoryColor(category) {
  if (category === "Car") return "FF2563eb";
  if (category === "Accessories") return "FF10b981";
  return "FF666666";
}

module.exports = { generateSalesReportXLSX };
