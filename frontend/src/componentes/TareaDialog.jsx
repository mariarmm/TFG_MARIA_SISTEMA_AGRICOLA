import { useEffect, useState } from "react";    //Importa useState para manejar el estado del formulario
import { apiFetch } from "../api";  //Funcion auxiliar para realizar peticiones al backend

// Componentes de Material UI
import {Dialog,DialogTitle,DialogContent,DialogActions,TextField,MenuItem,Button,Box} from "@mui/material";

// Componente TareaDialog para crear o editar tareas
const TareaDialog = ({open, onClose, onSuccess, tarea, trabajadores = [],parcelas = [], maquinas = []}) => {

    const esEdicion = Boolean(tarea);

    const formularioVacio = {
        nombre: "",
        descripcion: "",
        fecha_planificada: "",
        id_trabajador: "",
        id_parcela: "",
        id_maquina: ""
    };

    //Estado del formulario
    const [form, setForm] = useState(formularioVacio);

    //Rellenar formulario cuando se abre el dialog
    useEffect(() => {
        if (!open) return;

        setForm(tarea ? {
            nombre: tarea.nombre || "",
            descripcion: tarea.descripcion || "",
            fecha_planificada: tarea.fecha_planificada || "",
            id_trabajador: tarea.id_trabajador || "",
            id_parcela: tarea.id_parcela || "",
            id_maquina: tarea.id_maquina || ""
        } : formularioVacio);

    }, [open]);

    // Maneja los cambios en los campos del formulario
    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    // Gestiona el envío del formulario para crear o editar una tarea
    const handleSubmit = async () => {
        try {
            // Validación básica
            if (!form.nombre || !form.fecha_planificada || !form.id_trabajador) {
                alert("Faltan campos obligatorios");
                return;
            }

            const payload = {
                ...form,
            };

            const url = esEdicion ? `/tareas/${tarea.id}` : "/tareas";
            const method = esEdicion ? "PATCH" : "POST";

            // Petición al backend para crear o editar la tarea
            const res = await apiFetch(url, {
                method,
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok) {
                console.log("ERROR:", data);
                alert(data.error || "Error al guardar tarea");
                return;
            }

            onSuccess?.();
            onClose();

        } catch (err) {
            console.error(err);
            alert("Error de conexión");
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">

            {/* Título del diálogo */}
            <DialogTitle>
                {esEdicion ? "Editar tarea" : "Nueva tarea"}
            </DialogTitle>

            {/* Contenido del diálogo */}
            <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
                
                {/* Campo de nombre */}
                <TextField
                    name="nombre"
                    label="Nombre"
                    value={form.nombre}
                    onChange={handleChange}
                    fullWidth
                />

                {/* Campo de descripción */}
                <TextField
                    name="descripcion"
                    label="Descripción"
                    value={form.descripcion}
                    onChange={handleChange}
                    fullWidth
                    multiline
                    rows={3}
                />

                {/* Campo de fecha planificada */}
                <TextField
                    name="fecha_planificada"
                    label="Fecha planificada"
                    type="date"
                    value={form.fecha_planificada}
                    onChange={handleChange}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                />

                {/* Campo de selección de trabajador */}
                <TextField
                    select
                    name="id_trabajador"
                    label="Trabajador"
                    aria-label="Trabajador"
                    value={form.id_trabajador}
                    onChange={handleChange}
                    fullWidth
                >
                    {trabajadores.map((t) => (
                        <MenuItem key={t.id} value={t.id}>
                            {t.nombre}
                        </MenuItem>
                    ))}
                </TextField>

                {/* Campo de selección de parcela */}
                <TextField
                    select
                    name="id_parcela"
                    label="Parcela"
                    aria-label="Parcela"
                    value={form.id_parcela}
                    onChange={handleChange}
                    fullWidth
                >
                    {parcelas.map((p) => (
                        <MenuItem key={p.id} value={p.id}>
                            {p.nombre}
                        </MenuItem>
                    ))}
                </TextField>

                {/* Campo de selección de máquina */}
                <TextField
                    select
                    name="id_maquina"
                    label="Máquina"
                    value={form.id_maquina}
                    onChange={handleChange}
                    fullWidth
                >
                    {maquinas.map((m) => (
                        <MenuItem key={m.id} value={m.id}>
                            {m.nombre}
                        </MenuItem>
                    ))}
                </TextField>

            </DialogContent>

            {/* Acciones del diálogo */}
            <DialogActions>

                {/* Botón de cancelar */}
                <Button onClick={onClose}>
                    Cancelar
                </Button>

                {/* Botón de guardar */}
                <Button variant="contained" onClick={handleSubmit}>
                    {esEdicion ? "Guardar cambios" : "Crear"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default TareaDialog;