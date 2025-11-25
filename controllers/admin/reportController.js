import { generateSalesReport } from "../../services/admin/reportService.js";
import PDFDocument from 'pdfkit';

const getReportPage = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const reportData = await generateSalesReport(startDate, endDate);
        return res.render("admin/adminReport", { reportData, startDate, endDate });
    } catch (error) {
        console.error("Error loading report page:", error);
        throw new Error(error.message);
    }
};

const formatCurrency = (amount) => {
    return Number(amount).toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
};

const generateReportPdf = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const reportData = await generateSalesReport(startDate, endDate);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=SalesReport.pdf');

        const doc = new PDFDocument({ margin: 50 });
        doc.pipe(res);
        buildPdfContent(doc, reportData, startDate, endDate);
        doc.end();

    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).send("Could not generate report PDF due to an internal error.");
    }
};

const buildPdfContent = (doc, data, startDate, endDate) => {
    doc.fontSize(25).text('Admin Sales Report', { align: 'center' });
    doc.moveDown(0.5);
    
    const startDisplay = startDate ? new Date(startDate).toLocaleDateString() : 'Start of Time';
    const endDisplay = endDate ? new Date(endDate).toLocaleDateString() : 'Current Date';
    
    doc.fontSize(12).text(`Report Period: ${startDisplay} - ${endDisplay}`);
    doc.moveDown();

    doc.fontSize(16).text('1. Overall Sales Metrics', { underline: true });
    doc.moveDown(0.5);

    const metricsData = [
        ['Metric', 'Value'],
        ['Total Gross Revenue', formatCurrency(data.totalRevenue)],
        ['Total Orders', data.totalOrders],
        ['Total Product Discounts', formatCurrency(data.overallDiscount)],
        ['Total Coupon Deductions', formatCurrency(data.couponDeduction)],
        ['**NET REVENUE**', `**${formatCurrency(data.netRevenue)}**`],
    ];
    
    drawTable(doc, metricsData, doc.y, 400); 
    doc.moveDown(2);

    doc.fontSize(16).text('2. Top 5 Products by Units Sold', { underline: true });
    doc.moveDown(0.5);
    
    const productHeaders = ['Product Name', 'Category', 'Units Sold', 'Gross Revenue'];
    const productRows = data.topProducts.map(p => [
        p.name, 
        p.category, 
        p.unitsSold, 
        formatCurrency(p.grossRevenue)
    ]);
    const topProductsData = [productHeaders, ...productRows];
    
    drawTable(doc, topProductsData, doc.y, doc.page.width - 100); 
    doc.moveDown(2);

    doc.fontSize(16).text('3. Sales by Category', { underline: true });
    doc.moveDown(0.5);

    const categoryHeaders = ['Category', 'Net Sales', 'Share (%)'];
    const categoryRows = data.salesByCategory.map(c => [
        c.name, 
        formatCurrency(c.sales), 
        `${c.percentage.toFixed(2)}%`
    ]);
    const categoryData = [categoryHeaders, ...categoryRows];
    
    drawTable(doc, categoryData, doc.y, 400); 
    doc.moveDown(2);

    doc.fontSize(10).text(`Generated on ${new Date().toLocaleString()}`, 50, doc.page.height - 30, { align: 'right' });
};

function drawTable(doc, tableData, startY, width) {
    const startX = 50;
    const rowHeight = 25;
    const tableTop = startY;
    const cellPadding = 5;
    
    if (tableTop + (tableData.length * rowHeight) > doc.page.height - 50) {
        doc.addPage();
        startY = 50;
    }
    
    const numColumns = tableData[0].length;
    const colWidth = width / numColumns;

    doc.fillColor('#CCCCCC').rect(startX, tableTop, width, rowHeight).fill();
    doc.fillColor('#000000').font('Helvetica-Bold').fontSize(10);
    tableData[0].forEach((header, i) => {
        doc.text(header, startX + i * colWidth + cellPadding, tableTop + cellPadding, {
            width: colWidth - 2 * cellPadding,
            align: 'left'
        });
    });

    doc.font('Helvetica').fontSize(10);
    tableData.slice(1).forEach((row, rowIndex) => {
        const rowTop = tableTop + (rowIndex + 1) * rowHeight;
        
        if (rowIndex % 2 === 0) {
            doc.fillColor('#EEEEEE').rect(startX, rowTop, width, rowHeight).fill();
        } else {
            doc.fillColor('#FFFFFF').rect(startX, rowTop, width, rowHeight).fill();
        }

        doc.fillColor('#000000');
        
        row.forEach((cell, colIndex) => {
            if (String(cell).startsWith('**') && String(cell).endsWith('**')) {
                doc.font('Helvetica-Bold');
                cell = String(cell).replace(/\*\*/g, '');
            } else {
                doc.font('Helvetica');
            }
            
            doc.text(cell, startX + colIndex * colWidth + cellPadding, rowTop + cellPadding, {
                width: colWidth - 2 * cellPadding,
                align: 'left'
            });
        });
    });

    doc.y = tableTop + tableData.length * rowHeight;
}

export { getReportPage, generateReportPdf };