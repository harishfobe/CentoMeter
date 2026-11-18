import React, { useState } from "react";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";

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

function GoogleMark() {
  return (
    <svg className="login-google-mark" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.2-3.5 5.7-6.6 7.2l6.3 5.3C37.4 38.4 44 34 44 24c0-1.3-.1-2.7-.4-3.5z"
      />
    </svg>
  );
}

function TextField({ id, label, icon, type = "text", action, ...props }) {
  return (
    <div className="login-input">
      {icon}
      <input id={id} aria-label={label} placeholder={label} type={type} {...props} />
      {action}
    </div>
  );
}

export default function LoginPage({ onSignIn }) {
  const [mode, setMode] = useState("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const creating = mode === "create";

  const switchMode = () => {
    setMode(creating ? "sign-in" : "create");
    setError("");
    setNotice("");
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
      phone: "",
    });
  };

  const reveal = (
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
  );

  return (
    <section className="login-page" aria-label={creating ? "Sign up" : "Log in"}>
      <h1 className="sr-only">{creating ? "Sign up" : "Log in"}</h1>
      <img
        className="login-logo"
        src="/centometer-login-logo.jpg"
        alt="CentoMeter"
        width="1126"
        height="730"
      />
      <form className="login-form" onSubmit={submit} noValidate>
        {creating && (
          <TextField
            label="Name"
            autoComplete="name"
            maxLength={60}
            value={name}
            icon={<User size={18} aria-hidden="true" />}
            onChange={(event) => setName(event.target.value)}
          />
        )}
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          icon={<Mail size={18} aria-hidden="true" />}
          onChange={(event) => setEmail(event.target.value)}
        />
        <TextField
          id="login-password"
          label="Password"
          type={showPassword ? "text" : "password"}
          autoComplete={creating ? "new-password" : "current-password"}
          value={password}
          icon={<Lock size={18} aria-hidden="true" />}
          action={reveal}
          onChange={(event) => setPassword(event.target.value)}
        />
        {creating && (
          <TextField
            label="Confirm password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={confirm}
            icon={<Lock size={18} aria-hidden="true" />}
            onChange={(event) => setConfirm(event.target.value)}
          />
        )}
        {!creating && (
          <div className="login-forgot-row">
            <button
              type="button"
              className="login-forgot"
              onClick={() =>
                setNotice(
                  "This preview doesn’t store a password. Log in with any password of at least 8 characters.",
                )
              }
            >
              Forgot password?
            </button>
          </div>
        )}
        {error ? (
          <p role="alert" className="form-error">
            {error}
          </p>
        ) : null}
        <button className="primary login-submit" type="submit">
          {creating ? "Sign up" : "Log in"}
        </button>
      </form>
      {!creating && (
        <>
          <p className="login-or">or</p>
          <button
            className="login-google"
            type="button"
            onClick={() =>
              setNotice("Google sign-in isn’t connected in this preview.")
            }
          >
            <GoogleMark />
            Continue with Google
          </button>
        </>
      )}
      {notice ? <p className="login-note">{notice}</p> : null}
      <p className="login-switch">
        {creating ? "Already have an account?" : "Don’t have an account?"}{" "}
        <button type="button" onClick={switchMode}>
          {creating ? "Log in" : "Sign up"}
        </button>
      </p>
    </section>
  );
}
