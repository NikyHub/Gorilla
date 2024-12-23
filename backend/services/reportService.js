const PDFDocument = require('pdfkit');
const moment = require('moment');
const { db } = require('../config/database');

async function generateMonthlyReport() {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument();
        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));

        doc.fontSize(20).text('月度库存报表', {
            align: 'center'
        });

        doc.moveDown();
        doc.fontSize(12);

        const startDate = moment().startOf('month').format('YYYY-MM-DD');
        const endDate = moment().endOf('month').format('YYYY-MM-DD');

        db.all(`
            SELECT 
                p.name,
                p.quantity,
                p.threshold,
                SUM(CASE WHEN ir.type = 'IN' THEN ir.quantity ELSE 0 END) as total_in,
                SUM(CASE WHEN ir.type = 'OUT' THEN ir.quantity ELSE 0 END) as total_out
            FROM products p
            LEFT JOIN inventory_records ir ON p.id = ir.product_id
            WHERE ir.date BETWEEN ? AND ?
            GROUP BY p.id
        `, [startDate, endDate], (err, rows) => {
            if (err) {
                reject(err);
                return;
            }

            // 绘制表格
            const tableTop = 150;
            doc.text('商品名称', 50, tableTop);
            doc.text('当前库存', 150, tableTop);
            doc.text('入库总量', 250, tableTop);
            doc.text('出库总量', 350, tableTop);
            doc.text('警戒值', 450, tableTop);

            rows.forEach((row, i) => {
                const y = tableTop + 30 + (i * 30);
                doc.text(row.name, 50, y);
                doc.text(row.quantity.toString(), 150, y);
                doc.text(row.total_in.toString(), 250, y);
                doc.text(row.total_out.toString(), 350, y);
                doc.text(row.threshold.toString(), 450, y);
            });

            doc.end();
        });
    });
}

module.exports = {
    generateMonthlyReport
}; 