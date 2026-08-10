import cron from 'node-cron';
import { pool } from '../db.js';

// Cada minuto: cancela las órdenes de transferencia cuya ventana de 10 minutos ya venció.
// Al cambiar el status a 'cancelado', el trigger de la base de datos libera automáticamente
// la reserva de inventario (reserved_quantity) — aquí no hay que tocar el stock a mano.
export function startExpireOrdersJob() {
  cron.schedule('* * * * *', async () => {
    try {
      const { rows } = await pool.query(
        `UPDATE orders SET status = 'cancelado'
         WHERE status = 'pendiente_pago' AND expires_at < NOW() AND payment_proof_url IS NULL
         RETURNING id, order_number, user_id`
      );
      if (rows.length > 0) {
        console.log(
          `[expire-orders] Canceladas ${rows.length} orden(es) vencidas:`,
          rows.map((r) => r.order_number).join(', ')
        );

        // Avisa a cada cliente que su orden se canceló por no completar el pago a tiempo.
        for (const row of rows) {
          await pool.query(
            `INSERT INTO notifications (user_id, order_id, message) VALUES ($1, $2, $3)`,
            [row.user_id, row.id, `Tu orden ${row.order_number} se canceló porque no se recibió el pago a tiempo.`]
          );
        }
      }
    } catch (err) {
      console.error('[expire-orders] Error:', err);
    }
  });
}
