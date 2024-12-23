const { createCanvas } = require('canvas');
const Chart = require('chart.js');
const { db } = require('../config/database');

async function generateInventoryChart() {
    return new Promise((resolve, reject) => {
        db.all('SELECT name, quantity, threshold FROM products', [], (err, rows) => {
            if (err) {
                reject(err);
                return;
            }

            const canvas = createCanvas(800, 400);
            const ctx = canvas.getContext('2d');

            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: rows.map(row => row.name),
                    datasets: [
                        {
                            label: '当前库存',
                            data: rows.map(row => row.quantity),
                            backgroundColor: 'rgba(54, 162, 235, 0.5)'
                        },
                        {
                            label: '警戒库存',
                            data: rows.map(row => row.threshold),
                            backgroundColor: 'rgba(255, 99, 132, 0.5)'
                        }
                    ]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });

            resolve(canvas.toBuffer('image/png'));
        });
    });
}

module.exports = {
    generateInventoryChart
}; 