import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { login } from '../store/authSlice.js';
import './AuthPage.css';

export function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { status, error } = useSelector((state) => state.auth);

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    const result = await dispatch(login({ identifier, password }));
    if (login.fulfilled.match(result)) {
      const redirectTo = location.state?.from?.pathname || '/';
      navigate(redirectTo, { replace: true });
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1 className="auth-form__title">Iniciar sesión</h1>

        <label className="auth-form__label">
          Correo o teléfono
          <input
            type="text"
            className="auth-form__input"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
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
            required
          />
        </label>

        {error && <p className="auth-form__error">{error}</p>}

        <button type="submit" className="auth-form__submit" disabled={status === 'loading'}>
          {status === 'loading' ? 'Entrando...' : 'Entrar'}
        </button>

        <p className="auth-form__switch">
          ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
        </p>
      </form>
    </div>
  );
}
