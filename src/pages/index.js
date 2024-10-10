// src/pages/index.js
import { useState, useEffect } from 'react';
import Confetti from 'react-confetti';

export default function Home() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [timer, setTimer] = useState(10);
  const [showConfetti, setShowConfetti] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.captchaRequired) {
        setMessage(data.message);
        setCaptchaRequired(true);
        setTimer(10);
      } else if (data.success) {
        setMessage('Inicio de sesión exitoso');
        setShowConfetti(true);
      } else {
        setMessage('Error en el inicio de sesión');
      }
    } catch (error) {
      setMessage('Error en la solicitud: ' + error.message);
    }
  };

  const handleCaptchaResolved = async () => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resolveCaptcha: true }),
      });

      const data = await response.json();
      if (data.success) {
        setMessage('Inicio de sesión completado después del captcha');
        setShowConfetti(true);
      } else {
        setMessage('Error al continuar el inicio de sesión: ' + data.error);
      }
    } catch (error) {
      setMessage('Error al resolver el captcha: ' + error.message);
    }
  };

  useEffect(() => {
    let interval;
    if (captchaRequired && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [captchaRequired, timer]);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center">
      {showConfetti && <Confetti width={window.innerWidth} height={window.innerHeight} />}
      <h1>Iniciar sesión en TikTok</h1>
      <form onSubmit={handleSubmit} className="flex flex-col items-center space-y-4">
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="p-2 border rounded"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="p-2 border rounded"
        />
        <button type="submit" className="bg-yellow-200 p-2 rounded">Login</button>
      </form>
      <p className="mt-4">{message}</p>
      {captchaRequired && (
        <div className="mt-4">
          <p className="bg-red-400 p-2 rounded">
            Por favor, completa el captcha manualmente en el navegador y luego haz clic en continuar:
          </p>
          <button
            onClick={handleCaptchaResolved}
            disabled={timer > 0}
            className={`bg-blue-500 p-2 mt-2 rounded ${timer > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {timer > 0 ? `Espera ${timer} segundos` : 'Continuar'}
          </button>
        </div>
      )}
      {showConfetti && (
        <div className="absolute inset-0 flex items-center justify-center">
          <h2 className="text-4xl font-bold text-green-600">¡Sesión iniciada!</h2>
        </div>
      )}
    </div>
  );
}
