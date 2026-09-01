import { render, screen } from "@testing-library/react";
import FormularioUsuario from "../../src/componentes/FormularioUsuario";

describe("FormularioUsuario", () => {

    test("Debe mostrar todos los campos del formulario", () => {
        render(<FormularioUsuario />);

        expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();

        expect(
            screen.getByRole("button", { label: /guardar/i })
        ).toBeInTheDocument();
    });

});