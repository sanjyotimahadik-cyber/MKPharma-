import { useNavigate } from 'react-router';
import './Splash.css';

export default function Splash() {
  const navigate = useNavigate();
  return (
    <div className="pg-splash">
      <img src="/assets/logo.png" className="logo" alt="MK Animal Health" />
      <div className="company">
        <h1>MK ANIMAL HEALTH</h1>
        <p>Smart Distribution Management System</p>
      </div>
      <button className="enter-btn" onClick={() => navigate('/login')}>
        LOGIN <span>→</span>
      </button>
    </div>
  );
}
