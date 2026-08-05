import ExcelJS from 'exceljs';
import { pool } from '../../db.js';

// Para la vista en pantalla del panel (una fila por cliente, resumen en texto)
async function fetchCustomersWithPurchases() {
  const { rows } = await pool.query(
    `SELECT
       u.id,
       u.full_name,
       u.email,
       u.phone,
       COALESCE(
         string_agg(
           DISTINCT (oi.product_name || ' (' || oi.variant_size || ') x' || oi.quantity || ' — $' || oi.unit_price || ' c/u'),
           ', ' ORDER BY (oi.product_name || ' (' || oi.variant_size || ') x' || oi.quantity || ' — $' || oi.unit_price || ' c/u')
         ),
         'Sin compras completadas'
       ) AS purchased,
       COALESCE(spent.total_spent, 0) AS total_spent
     FROM users u
     LEFT JOIN orders o ON o.user_id = u.id AND o.status = 'completado'
     LEFT JOIN order_items oi ON oi.order_id = o.id
     LEFT JOIN (
       SELECT user_id, SUM(total) AS total_spent
       FROM orders
       WHERE status = 'completado'
       GROUP BY user_id
     ) spent ON spent.user_id = u.id
     WHERE u.role = 'cliente'
     GROUP BY u.id, u.full_name, u.email, u.phone, spent.total_spent
     ORDER BY u.id`
  );
  return rows;
}

// Para el Excel (una fila por producto comprado, con sus propias columnas)
async function fetchCustomerPurchaseLines() {
  const { rows } = await pool.query(
    `SELECT
       u.id,
       u.full_name,
       u.email,
       u.phone,
       oi.product_name,
       oi.variant_size,
       oi.quantity,
       oi.unit_price,
       CASE WHEN oi.id IS NOT NULL THEN oi.quantity * oi.unit_price END AS subtotal,
       COALESCE(spent.total_spent, 0) AS total_spent
     FROM users u
     LEFT JOIN orders o ON o.user_id = u.id AND o.status = 'completado'
     LEFT JOIN order_items oi ON oi.order_id = o.id
     LEFT JOIN (
       SELECT user_id, SUM(total) AS total_spent
       FROM orders
       WHERE status = 'completado'
       GROUP BY user_id
     ) spent ON spent.user_id = u.id
     WHERE u.role = 'cliente'
     ORDER BY u.id, oi.id`
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
// Una fila por producto comprado: cantidad, precio unitario y subtotal en
// columnas separadas, y el total gastado del cliente repetido en cada una
// de sus líneas (para que sea fácil de leer o filtrar en Excel).
export async function exportCustomers(req, res) {
  try {
    const rows = await fetchCustomerPurchaseLines();

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Clientes');
    sheet.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Nombre', key: 'full_name', width: 26 },
      { header: 'Correo', key: 'email', width: 26 },
      { header: 'Teléfono', key: 'phone', width: 16 },
      { header: 'Producto', key: 'product_name', width: 28 },
      { header: 'Talla', key: 'variant_size', width: 10 },
      { header: 'Cantidad', key: 'quantity', width: 12 },
      { header: 'Precio unitario', key: 'unit_price', width: 16 },
      { header: 'Subtotal', key: 'subtotal', width: 16 },
      { header: 'Total gastado (cliente)', key: 'total_spent', width: 20 },
    ];
    sheet.getRow(1).font = { bold: true };

    rows.forEach((r) => {
      sheet.addRow({
        id: r.id,
        full_name: r.full_name,
        email: r.email,
        phone: r.phone,
        product_name: r.product_name || 'Sin compras completadas',
        variant_size: r.variant_size || '',
        quantity: r.quantity || '',
        unit_price: r.unit_price || '',
        subtotal: r.subtotal || '',
        total_spent: r.total_spent,
      });
    });

    sheet.getColumn('unit_price').numFmt = '$#,##0.00';
    sheet.getColumn('subtotal').numFmt = '$#,##0.00';
    sheet.getColumn('total_spent').numFmt = '$#,##0.00';

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
