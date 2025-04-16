// __test__/contexts/MockedAuthContext.test.tsx
import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { Text, Pressable } from "react-native";

// Alternative: Mock complet du contexte d'authentification
jest.mock("../../contexts/AuthContext", () => ({
  useAuth: jest.fn().mockReturnValue({
    userToken: null,
    user: null,
    signIn: jest.fn(),
    signOut: jest.fn(),
    isLoading: false,
  }),
}));

// Importer après le mock
import { useAuth } from "../../contexts/AuthContext";

// Composant simple avec le contexte mocké
const TestComponent = () => {
  const { userToken, signIn, signOut } = useAuth();

  return (
    <>
      <Text testID="status">{userToken ? "Connecté" : "Déconnecté"}</Text>
      <Pressable
        testID="login-button"
        onPress={() =>
          signIn("test-token", {
            id: 1,
            name: "Test",
            email: "test@example.com",
          })
        }
      >
        <Text>Login</Text>
      </Pressable>
      <Pressable testID="logout-button" onPress={signOut}>
        <Text>Logout</Text>
      </Pressable>
    </>
  );
};

describe("AuthContext (Mocké)", () => {
  test("permet d'interagir avec les fonctions d'authentification", () => {
    // Accéder au mock pour pouvoir le modifier
    const mockUseAuth = useAuth as jest.Mock;

    // Configuration initiale - non connecté
    mockUseAuth.mockReturnValue({
      userToken: null,
      user: null,
      signIn: jest.fn().mockImplementation(() => {
        // Mettre à jour la valeur retournée après signIn
        mockUseAuth.mockReturnValue({
          userToken: "test-token",
          user: { id: 1, name: "Test", email: "test@example.com" },
          signIn: jest.fn(),
          signOut: jest.fn().mockImplementation(() => {
            // Retour à l'état déconnecté après signOut
            mockUseAuth.mockReturnValue({
              userToken: null,
              user: null,
              signIn: jest.fn(),
              signOut: jest.fn(),
              isLoading: false,
            });
          }),
          isLoading: false,
        });
      }),
      signOut: jest.fn(),
      isLoading: false,
    });

    // Rendu du composant
    const { getByTestId, rerender } = render(<TestComponent />);

    // 1. Vérifier l'état initial (déconnecté)
    expect(getByTestId("status").props.children).toBe("Déconnecté");

    // 2. Connecter l'utilisateur
    fireEvent.press(getByTestId("login-button"));

    // Forcer le re-rendu
    rerender(<TestComponent />);

    // Vérifier que le statut a changé
    expect(getByTestId("status").props.children).toBe("Connecté");

    // 3. Déconnecter l'utilisateur
    fireEvent.press(getByTestId("logout-button"));

    // Forcer le re-rendu
    rerender(<TestComponent />);

    // Vérifier que le statut est revenu à déconnecté
    expect(getByTestId("status").props.children).toBe("Déconnecté");
  });
});


