import React, { useState } from "react";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";

export const SAMPLE_ACCOUNT = {
  name: "Aarav Sharma",
  email: "aarav@example.com",
  phone: "",
};

const emailOk = (value) => /^\S+@\S+\.\S+$/.test(value.trim());

function nameFromEmail(email) {
  if (email.trim().toLowerCase() === SAMPLE_ACCOUNT.email) return SAMPLE_ACCOUNT.name;
  const local = email
    .split("@")[0]
    .replace(/[._-]+/g, " ")
    .trim();
  if (!local) return "CentoMeter member";
  return local.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function phoneOk(value) {
  const digits = value.replace(/\D/g, "").replace(/^91/, "");
  return digits.length === 10 && /^[6-9]/.test(digits);
}

export default function LoginPage({ onBack, onSignIn, onContinue }) {
  const [mode, setMode] = useState("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const creating = mode === "create";

  const switchMode = () => {
    setMode(creating ? "sign-in" : "create");
    setError("");
    setPassword("");
    setConfirm("");
    setShowPassword(false);
  };

  const submit = (event) => {
    event.preventDefault();
    const trimmedEmail = email.trim();
    if (creating && name.trim().length < 2) {
      setError("Enter the name you want on your profile.");
      return;
    }
    if (!emailOk(trimmedEmail)) {
      setError("Enter a valid email address.");
      return;
    }
    if (creating && phone.trim() && !phoneOk(phone)) {
      setError("Enter a 10-digit mobile number, or leave it blank.");
      return;
    }
    if (password.length < 8) {
      setError("Use at least 8 characters for the password.");
      return;
    }
    if (creating && confirm !== password) {
      setError("Those passwords don’t match.");
      return;
    }
    setError("");
    onSignIn({
      name: creating ? name.trim() : nameFromEmail(trimmedEmail),
      email: trimmedEmail,
      phone: creating ? phone.trim() : "",
    });
  };

  return (
    <section className="login-page" aria-label={creating ? "Create account" : "Sign in"}>
      <button
        type="button"
        className="login-back"
        onClick={onBack}
        aria-label="Back"
      >
        <ArrowLeft size={22} aria-hidden="true" />
      </button>
      <div className="login-brand">
        <img
          className="login-logo"
          src="/centometer-login-logo.jpg"
          alt="CentoMeter"
          width="1158"
          height="762"
        />
      </div>
      <p className="eyebrow">{creating ? "CREATE ACCOUNT" : "SIGN IN"}</p>
      <h1>{creating ? "Start with CentoMeter." : "Welcome back."}</h1>
      <p className="login-lead">
        {creating
          ? "Create a profile for this device. Nothing is sent to a server."
          : "Sign in to the profile saved on this device. Your password is not stored."}
      </p>
      <form className="form-stack login-form" onSubmit={submit} noValidate>
        {creating && (
          <label>
            Name
            <input
              name="name"
              autoComplete="name"
              value={name}
              maxLength={60}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
        )}
        <label>
          Email
          <input
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        {creating && (
          <label>
            Mobile number
            <small>Optional</small>
            <input
              name="phone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              placeholder="10-digit mobile"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </label>
        )}
        <div className="login-field">
          <label htmlFor="login-password">Password</label>
          <span className="login-password">
            <input
              id="login-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete={creating ? "new-password" : "current-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button
              type="button"
              className="login-reveal"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((open) => !open)}
            >
              {showPassword ? (
                <EyeOff size={18} aria-hidden="true" />
              ) : (
                <Eye size={18} aria-hidden="true" />
              )}
            </button>
          </span>
        </div>
        {creating && (
          <label>
            Confirm password
            <input
              name="confirm"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
            />
          </label>
        )}
        {error ? (
          <p role="alert" className="form-error">
            {error}
          </p>
        ) : null}
        <div className="login-actions">
          <button className="primary" type="submit">
            {creating ? "Create account" : "Sign in"}
          </button>
          {!creating && (
            <>
              <p className="login-or">or</p>
              <button
                className="secondary"
                type="button"
                onClick={() => onSignIn(SAMPLE_ACCOUNT)}
              >
                Continue with the sample account
              </button>
            </>
          )}
        </div>
      </form>
      <p className="login-switch">
        {creating ? "Already have a profile?" : "New here?"}{" "}
        <button type="button" onClick={switchMode}>
          {creating ? "Sign in" : "Create an account"}
        </button>
      </p>
      <button type="button" className="text-button login-guest" onClick={onContinue}>
        Continue without an account
      </button>
    </section>
  );
}
