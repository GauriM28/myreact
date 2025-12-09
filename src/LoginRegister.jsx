import { useState } from "react";
import "./LoginRegister.css";

export default function LoginRegister() {
  const [isLogin, setIsLogin] = useState(true);
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpEmail, setOtpEmail] = useState("");

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

 
  async function submit(e) {
    e.preventDefault();

    if (isLogin) {
      
      const response = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      alert(data.message || data.error);
      return;
    }

    
    const payload = { username, email, password };

    const response = await fetch("http://localhost:5000/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    alert(data.message || data.error);

    if (data.message) {
      
      setOtpEmail(email);
      setIsOtpStep(true);
    }
  }

  
  async function verifyOtp(e) {
    e.preventDefault();

    const response = await fetch("http://localhost:5000/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: otpEmail, otp }),
    });

    const data = await response.json();
    alert(data.message || data.error);

    if (data.message) {
      
      setIsOtpStep(false);
      setIsLogin(true);
      setOtp("");
      setEmail("");
      setPassword("");
    }
  }

  
  return (
    <div className="container">
      <div className="form-box">

        
        {isOtpStep ? (
          <>
            <h2>Enter OTP</h2>
            <p>OTP sent to: <b>{otpEmail}</b></p>

            <form onSubmit={verifyOtp}>
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                maxLength="6"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
              <button type="submit">Verify OTP</button>
            </form>

            
            <p
              className="toggle-text"
              onClick={() => {
                setIsOtpStep(false);
                setIsLogin(true);   
                setOtp("");          
              }}
            >
              Back to Login
            </p>
          </>
        ) : (
          <>
            <h2>{isLogin ? "LOGIN" : "REGISTER"}</h2>

            <form onSubmit={submit}>
              {!isLogin && (
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              )}

              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <button type="submit">
                {isLogin ? "Login" : "Register"}
              </button>
            </form>

            <p
              className="toggle-text"
              onClick={() => {
                setIsLogin(!isLogin);
                setOtp("");
              }}
            >
              {isLogin
                ? "Don't have an account? Register"
                : "Already have an account? Login"}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
