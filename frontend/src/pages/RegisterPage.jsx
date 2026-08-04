import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../store/authSlice.js';
import './AuthPage.css';

export function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error } = useSelector((state) => state.auth);

  const [fullName, setFullName] = useState('');
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Un solo campo de contacto: si parece correo, se manda como email;
    // si no, se manda como teléfono. Así no se le pide "nombre de usuario".
    const isEmail = contact.includes('@');
    const payload = {
      full_name: fullName,
      password,
      ...(isEmail ? { email: contact } : { phone: contact }),
    };

    const result = await dispatch(register(payload));
    if (register.fulfilled.match(result)) {
      navigate('/', { replace: true });
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1 className="auth-form__title">Crear cuenta</h1>

        <label className="auth-form__label">
          Nombre completo
          <input
            type="text"
            className="auth-form__input"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            required
          />
        </label>

        <label className="auth-form__label">
          Correo electrónico o teléfono
          <input
            type="text"
            className="auth-form__input"
            value={contact}
            onChange={(event) => setContact(event.target.value)}
            required
          />
        </label>

        <label className="auth-form__label">
          Contraseña
          <input
            type="password"
            className="auth-form__input"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            required
          />
        </label>

        {error && <p className="auth-form__error">{error}</p>}

        <button type="submit" className="auth-form__submit" disabled={status === 'loading'}>
          {status === 'loading' ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>

        <p className="auth-form__switch">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </form>
    </div>
  );
}
