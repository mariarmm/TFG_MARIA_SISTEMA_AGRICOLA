import { render, screen } from "@testing-library/react";
import TareaDialog from "../../src/componentes/TareaDialog";

describe("TareaDialog", () => {

    test("Debe mostrar los datos de la tarea en modo edición", () => {

        const tarea = {
            id: 1,
            nombre: "Poda de olivos",
            descripcion: "Poda de la zona norte",
            fecha_planificada: "2026-07-26",
            id_trabajador: 2,
            id_parcela: 3,
            id_maquina: 4
        };

        render(
            <TareaDialog
                open={true}
                tarea={tarea}
                trabajadores={[{ id: 2, nombre: "María" }]}
                parcelas={[{ id: 3, nombre: "Parcela Norte" }]}
                maquinas={[{ id: 4, nombre: "Tractor John Deere" }]}
                onClose={() => {}}
                onSuccess={() => {}}
            />
        );

        expect(screen.getByDisplayValue("Poda de olivos")).toBeInTheDocument();
        expect(screen.getByDisplayValue("Poda de la zona norte")).toBeInTheDocument();
        expect(screen.getByDisplayValue("2026-07-26")).toBeInTheDocument();
    });

});