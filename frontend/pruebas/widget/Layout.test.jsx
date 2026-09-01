import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

vi.mock("../../src/componentes/Notificaciones", () => ({
    default: () => ({
        notificaciones: [
            {
                id: 1,
                mensaje: "Nueva tarea asignada",
                fecha: "2026-07-26T10:00:00"
            }
        ],
        hayNuevas: true,
        marcarVistas: vi.fn()
    })
}));

import Layout from "../../src/componentes/Layout";


describe("Layout", () => {

    test("El trabajador no ve opciones de encargado", () => {

        localStorage.setItem(
            "usuario",
            JSON.stringify({
                id: 1,
                rol: "trabajador",
                nombre: "María"
            })
        );

        render(
            <MemoryRouter>
                <Layout />
            </MemoryRouter>
        );

        expect(
            screen.queryByRole("button", { name: /tareas/i })
        ).not.toBeInTheDocument();

        expect(
            screen.queryByRole("button", { name: /equipo/i })
        ).not.toBeInTheDocument();

        expect(
            screen.queryByRole("button", { name: /mapa/i })
        ).not.toBeInTheDocument();

        expect(
            screen.queryByRole("button", { name: /parcelas/i })
        ).not.toBeInTheDocument();

        expect(
            screen.queryByRole("button", { name: /informes/i })
        ).not.toBeInTheDocument();
    });

    test("El encargado ve las opciones de gestión", () => {

        localStorage.setItem(
            "usuario",
            JSON.stringify({
                id: 2,
                rol: "encargado",
                nombre: "Juan"
            })
        );

        render(
            <MemoryRouter>
                <Layout />
            </MemoryRouter>
        );

        expect(
            screen.getByRole("button", { name: /tareas/i })
        ).toBeInTheDocument();

        expect(
            screen.getByRole("button", { name: /equipo/i })
        ).toBeInTheDocument();

        expect(
            screen.getByRole("button", { name: /mapa/i })
        ).toBeInTheDocument();

        expect(
            screen.getByRole("button", { name: /parcelas/i })
        ).toBeInTheDocument();

        expect(
            screen.getByRole("button", { name: /informes/i })
        ).toBeInTheDocument();
    });

    test("Se renderiza una notificación recibida", async () => {

        localStorage.setItem(
            "usuario",
            JSON.stringify({
                id: 1,
                rol: "trabajador",
                nombre: "María"
            })
        );

        const user = userEvent.setup();

        render(
            <MemoryRouter>
                <Layout />
            </MemoryRouter>
        );

        await user.click(
            screen.getByRole("button", { name: /notificaciones/i })
        );

        expect(
            screen.getByText("Nueva tarea asignada")
        ).toBeInTheDocument();
    });

});