import ExcelJS from 'exceljs';
import { pool } from '../../db.js';

// Consulta compartida: un renglón por cliente, con lo que ha comprado
// en órdenes ya COMPLETADAS (no cuenta canastas, ni órdenes pendientes/canceladas).
async function fetchCustomersWithPurchases() {
  const { rows } = await pool.query(
    `SELECT
       u.id,
       u.full_name,
       u.email,
       u.phone,
       COALESCE(
         string_agg(
           DISTINCT (oi.product_name || ' (' || oi.variant_size || ') x' || oi.quantity),
           ', ' ORDER BY (oi.product_name || ' (' || oi.variant_size || ') x' || oi.quantity)
         ),
         'Sin compras completadas'
       ) AS purchased
     FROM users u
     LEFT JOIN orders o ON o.user_id = u.id AND o.status = 'completado'
     LEFT JOIN order_items oi ON oi.order_id = o.id
     WHERE u.role = 'cliente'
     GROUP BY u.id, u.full_name, u.email, u.phone
     ORDER BY u.id`
  );
  return rows;
}

// GET /api/admin/customers — vista en pantalla del panel de administrador
export async function listCustomers(req, res) {
  try {
    const rows = await fetchCustomersWithPurchases();
    res.json({ customers: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al listar los clientes' });
  }
}

// GET /api/admin/customers/export — descarga en formato .xlsx
export async function exportCustomers(req, res) {
  try {
    const rows = await fetchCustomersWithPurchases();

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Clientes');
    sheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Nombre', key: 'full_name', width: 30 },
      { header: 'Correo', key: 'email', width: 30 },
      { header: 'Teléfono', key: 'phone', width: 18 },
      { header: 'Productos comprados', key: 'purchased', width: 70 },
    ];
    sheet.getRow(1).font = { bold: true };
    rows.forEach((r) => sheet.addRow(r));

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', 'attachment; filename="clientes.xlsx"');

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al exportar los clientes' });
  }
}
