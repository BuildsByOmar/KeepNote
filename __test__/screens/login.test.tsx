import React from "react";
import { render } from "@testing-library/react-native";
import LoginScreen from "../../app/auth/login";

// Mock du contexte d'authentification
jest.mock("../../contexts/AuthContext", () => ({
  useAuth: () => ({
    signIn: jest.fn(),
    signOut: jest.fn(),
    isLoading: false,
    userToken: null,
    user: null,
  }),
}));

// Mock du router
jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

describe("LoginScreen", () => {
  test("affiche les champs de formulaire", () => {
    const { getByPlaceholderText, getAllByText } = render(<LoginScreen />);

    // Vérifier que les champs de formulaire sont présents
    expect(getByPlaceholderText("Email")).toBeTruthy();
    expect(getByPlaceholderText("Mot de passe")).toBeTruthy();

    // Vérifier que les boutons sont présents
    expect(getAllByText("Connexion").length).toBeGreaterThan(0);
    expect(getAllByText("Scanner un QR Code").length).toBeGreaterThan(0);
  });
});