import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signUp, confirmSignUp, signIn } from "./CognitoService";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./LoginPage.css";

// Regex to ensure strong passwords:
//  - At least 8 characters
//  - At least 1 uppercase letter
//  - At least 1 lowercase letter
//  - At least 1 digit
//  - At least 1 special character (@$!%*?&#)
const strongPasswordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&#]).{8,}$/;

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

  // Handle input changes
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Validate email using simple regex
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Validate birthdate in YYYY-MM-DD format
  const validateBirthdate = (birthdate) =>
    /^\d{4}-\d{2}-\d{2}$/.test(birthdate);

  // Sign-up handler
  const handleSignUp = async () => {
    const { email, password, name, gender, birthdate } = formData;

    // Check required fields
    if (!email || !password || !name || !gender || !birthdate) {
      toast.error("Please fill in all required fields.");
      return;
    }

    // Validate email
    if (!validateEmail(email)) {
      toast.error("Invalid email format.");
      return;
    }

    // Check if password is strong
    if (!strongPasswordRegex.test(password)) {
      toast.error(
        "Password must have at least 8 characters, " +
          "including uppercase, lowercase, a number, and a special character."
      );
      return;
    }

    // Validate birthdate
    if (!validateBirthdate(birthdate)) {
      toast.error("Birthdate must be in YYYY-MM-DD format.");
      return;
    }

    // Attempt Cognito sign-up
    try {
      await signUp(email, password, name, gender, birthdate);
      localStorage.setItem("pendingEmail", email);
      toast.success("Sign-up successful! Check your email for the confirmation code.");
      setIsSigningUp(false);
      setIsConfirming(true);
    } catch (error) {
      toast.error(error.message || "Sign-up failed.");
    }
  };

  // Confirmation handler
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

  // Sign-in handler
  const handleSignIn = async () => {
    const { email, password } = formData;

    if (!email || !password) {
      toast.error("Please enter your email and password.");
      return;
    }

    try {
      await signIn(email, password);
      toast.success("Sign-in successful!");
      onLogin(); // e.g., sets auth state in parent
      navigate("/home");
    } catch (error) {
      // Display user-friendly errors
      toast.error(
        error.message.includes("User does not exist")
          ? "No account found for this email. Please sign up."
          : error.message.includes("Incorrect username or password")
          ? "Incorrect email or password. Please try again."
          : error.message || "An error occurred during sign-in."
      );
    }
  };

  // Master form submit
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
          {/* Show name, gender, birthdate only if signing up */}
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

              <select
                name="gender"
                className="input-field"
                value={formData.gender}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Gender</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>

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

          {/* Always show email input */}
          <input
            type="email"
            name="email"
            className="input-field"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleInputChange}
            required
          />

          {/* Password if not confirming */}
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

          {/* Confirmation code if confirming */}
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

          {/* Buttons */}
          <div className="button-container">
            <button type="submit" className="action-btn">
              {isSigningUp
                ? "Sign Up"
                : isConfirming
                ? "Confirm Email"
                : "Sign In"}
            </button>

            {/* Toggle between sign-up and sign-in if not confirming */}
            {!isConfirming && (
              <button
                type="button"
                className="create-account-btn"
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
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
