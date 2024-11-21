import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  ConfirmSignUpCommand,
  InitiateAuthCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const client = new CognitoIdentityProviderClient({
  region: "us-east-1", // Update with your AWS region if different
});

const CLIENT_ID = process.env.CLIENT_ID; // Replace with your Cognito App Client ID

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
    throw new Error(error.message || "Sign-up failed.");
  }
};

// Function to confirm user sign-up with the provided confirmation code
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
    throw new Error(error.message || "Confirmation failed.");
  }
};

// Function to handle user sign-in
export const signIn = async (email, password) => {
  try {
    const command = new InitiateAuthCommand({
      ClientId: CLIENT_ID,
      AuthFlow: "USER_PASSWORD_AUTH",
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    });

    const response = await client.send(command);
    localStorage.setItem("email", email); // Save email for session management
    localStorage.setItem("accessToken", response.AuthenticationResult.AccessToken); // Save access token for authentication
    localStorage.setItem("isAuthenticated", "true"); // Ensure authentication state is saved

    return "Sign-in successful!";
  } catch (error) {
    throw new Error(error.message || "Sign-in failed.");
  }
};

// Function to get the current user based on local storage data
export const getCurrentUser = () => {
  return localStorage.getItem("email") || null;
};

export const signOut = () => {
  localStorage.clear();
  localStorage.setItem("isAuthenticated", "false"); // Explicitly set isAuthenticated to false
};