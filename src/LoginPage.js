import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signUp, confirmSignUp, signIn } from "./CognitoService";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./LoginPage.css";

const LoginPage = ({ onLogin }) => {
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    gender: "",
    birthdate: "",
    confirmationCode: "",
  });

  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignUp = async () => {
    const { email, password, name, gender, birthdate } = formData;

    if (!email || !password || !name || !gender || !birthdate) {
      toast.error("Please fill in all required fields.");
      return;
    }

    try {
      await signUp(email, password, name, gender, birthdate);
      toast.success("Sign-up successful! Check your email for the confirmation code.");
      setIsSigningUp(false);
      setIsConfirming(true);
    } catch (error) {
      toast.error(error.message || "Sign-up failed.");
    }
  };

  const handleConfirmation = async () => {
    const { email, confirmationCode } = formData;

    if (!confirmationCode) {
      toast.error("Please enter the confirmation code.");
      return;
    }

    try {
      await confirmSignUp(email, confirmationCode);
      toast.success("Email confirmed! You can now sign in.");
      setIsConfirming(false);
    } catch (error) {
      toast.error(error.message || "Confirmation failed.");
    }
  };

  const handleSignIn = async () => {
    const { email, password } = formData;

    if (!email || !password) {
      toast.error("Please enter your email and password.");
      return;
    }

    try {
      await signIn(email, password);
      toast.success("Sign-in successful!");
      onLogin();
      navigate("/home");
    } catch (error) {
      toast.error(
        error.message.includes("User does not exist")
          ? "No account found for this email. Please sign up."
          : error.message.includes("Incorrect username or password")
          ? "Incorrect email or password. Please try again."
          : error.message || "An error occurred during sign-in."
      );
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSigningUp) {
      handleSignUp();
    } else if (isConfirming) {
      handleConfirmation();
    } else {
      handleSignIn();
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="card-title">
          {isSigningUp
            ? "Create an Account"
            : isConfirming
            ? "Confirm Your Email"
            : "Sign In"}
        </h2>
        <form className="login-form" onSubmit={handleSubmit}>
          {isSigningUp && (
            <>
              <input
                type="text"
                name="name"
                className="input-field"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
              <input
                type="text"
                name="gender"
                className="input-field"
                placeholder="Gender"
                value={formData.gender}
                onChange={handleInputChange}
                required
              />
              <input
                type="date"
                name="birthdate"
                className="input-field"
                value={formData.birthdate}
                onChange={handleInputChange}
                required
              />
            </>
          )}
          <input
            type="email"
            name="email"
            className="input-field"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
          {(isSigningUp || !isConfirming) && (
            <input
              type="password"
              name="password"
              className="input-field"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
          )}
          {isConfirming && (
            <input
              type="text"
              name="confirmationCode"
              className="input-field"
              placeholder="Confirmation Code"
              value={formData.confirmationCode}
              onChange={handleInputChange}
              required
            />
          )}
          <div className="buttons-container">
            <button type="submit" className="action-btn">
              {isSigningUp
                ? "Sign Up"
                : isConfirming
                ? "Confirm Email"
                : "Sign In"}
            </button>
          </div>
        </form>
        {!isConfirming && (
          <button
            type="button"
            className="toggle-btn"
            onClick={() => {
              setIsSigningUp(!isSigningUp);
              setIsConfirming(false);
              setFormData({
                email: "",
                password: "",
                name: "",
                gender: "",
                birthdate: "",
                confirmationCode: "",
              });
            }}
          >
            {isSigningUp ? "Back to Sign In" : "Create an Account"}
          </button>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
