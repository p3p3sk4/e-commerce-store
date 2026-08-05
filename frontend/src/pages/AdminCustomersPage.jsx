import { useEffect, useState } from 'react';
import { downloadCustomersExport, fetchCustomersAdmin } from '../api/customers.js';
import './AdminCustomersPage.css';

export function AdminCustomersPage() {
  const [customers, setCustomers] = useState(null);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchCustomersAdmin()
      .then(setCustomers)
      .catch((err) => setError(err.message));
  }, []);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadCustomersExport();
    } catch (err) {
      setError(err.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="admin-customers">
      <div className="admin-customers__header">
        <h1>Clientes</h1>
        <button type="button" className="admin-btn admin-btn--primary" onClick={handleDownload} disabled={downloading}>
          {downloading ? 'Descargando...' : 'Descargar Excel'}
        </button>
      </div>

      {error && <p className="admin-customers__error">{error}</p>}
      {!customers && <p>Cargando clientes...</p>}

      {customers && (
        <table className="admin-customers__table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Teléfono</th>
              <th>Productos comprados</th>
              <th>Total gastado</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td>{customer.id}</td>
                <td>{customer.full_name}</td>
                <td>{customer.email || '—'}</td>
                <td>{customer.phone || '—'}</td>
                <td>{customer.purchased}</td>
                <td>${Number(customer.total_spent).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
