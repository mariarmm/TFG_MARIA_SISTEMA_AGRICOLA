import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Login from "../../src/paginas/Login";

describe("Login", () => {

    test("Debe renderizar correctamente el formulario de inicio de sesión", () => {
        render(<Login />);

        expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: /Entrar/i })
        ).toBeInTheDocument();
    });

    test("Debe mostrar un error al enviar el formulario con los campos vacíos", async () => {
        const user = userEvent.setup();

        render(<Login />);

        // Pulsar el botón sin rellenar los campos
        await user.click(screen.getByRole("button", { name: /Entrar/i }));

        // Comprobar que aparece el mensaje de error
        expect(
            screen.getByText(/debes introducir el email y la contraseña/i)
        ).toBeInTheDocument();
    });


});