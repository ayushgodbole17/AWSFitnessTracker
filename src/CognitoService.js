import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  ConfirmSignUpCommand,
  InitiateAuthCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const client = new CognitoIdentityProviderClient({
  region: "us-east-1",
});

const CLIENT_ID = process.env.REACT_APP_CLIENT_ID; // Cognito App Client ID

// Function to handle user sign-up
export const signUp = async (email, password, name, gender, birthdate) => {
  try {
    const command = new SignUpCommand({
      ClientId: CLIENT_ID,
      Username: email,
      Password: password,
      UserAttributes: [
        { Name: "email", Value: email },
        { Name: "name", Value: name },
        { Name: "gender", Value: gender },
        { Name: "birthdate", Value: birthdate },
      ],
    });

    await client.send(command);
    return "Sign-up successful! Please check your email for the confirmation code.";
  } catch (error) {
    console.error("Sign-Up Error:", JSON.stringify(error, null, 2));
    throw new Error(error.message || "Sign-up failed.");
  }
};

// Function to confirm user sign-up
export const confirmSignUp = async (email, confirmationCode) => {
  try {
    const command = new ConfirmSignUpCommand({
      ClientId: CLIENT_ID,
      Username: email,
      ConfirmationCode: confirmationCode,
    });

    await client.send(command);
    return "Confirmation successful! You can now log in.";
  } catch (error) {
    console.error("Confirmation Error:", JSON.stringify(error, null, 2));
    throw new Error(error.message || "Confirmation failed.");
  }
};

// Function to handle user sign-in
export const signIn = async (email, password) => {
  try {
    if (!email || !password) {
      throw new Error("Email and password are required.");
    }

    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!validateEmail(email)) {
      throw new Error("Invalid email format.");
    }

    console.log("Sign-In Parameters:", { email, CLIENT_ID });

    if (!CLIENT_ID) {
      throw new Error("CLIENT_ID is missing or undefined. Check your .env file.");
    }

    const command = new InitiateAuthCommand({
      ClientId: CLIENT_ID,
      AuthFlow: "USER_PASSWORD_AUTH",
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    });

    const response = await client.send(command);
    localStorage.setItem("email", email);
    localStorage.setItem("accessToken", response.AuthenticationResult.AccessToken);
    localStorage.setItem("isAuthenticated", "true");

    return "Sign-in successful!";
  } catch (error) {
    console.error("Sign-In Error:", JSON.stringify(error, null, 2));
    throw new Error(error.message || "Sign-in failed.");
  }
};


// Get the current user
export const getCurrentUser = () => {
  return localStorage.getItem("email") || null;
};

// Log out the current user
export const signOut = () => {
  localStorage.clear();
  localStorage.setItem("isAuthenticated", "false");
};
