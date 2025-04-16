import { saveToken } from "../utils/api-utils";
import fetch from "node-fetch";

describe("API Auth", () => {
    test("Vérifie que le token est enregistré", async () => {
        try {
            console.log("Début du test d'enregistrement du token");

            const response = await fetch("https://keep.kevindupas.com/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({
                    email: 'test@test.com',
                    password: 'password',
                }),
            });

            expect(response.ok).toBe(true);

            const rawText = await response.text();
            console.log("Réponse brute:", rawText.substring(0, 50), "...");

            const data = JSON.parse(rawText);

            expect(data.access_token).toBeDefined();
            expect(typeof data.access_token).toBe("string");

            expect(data.user).toBeDefined();
            expect(data.user.email).toBe("test@test.com");

            saveToken(data.access_token);
            console.log("Token enregistré avec succès", data.access_token);
        } catch (error) {
            console.error("Erreur lors de la récupération du token:", error);
            throw error;
        }
    }, 10000); // Timeout de 10 secondes

});