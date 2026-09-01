import { test, expect, request } from "@playwright/test";

test.beforeAll(async () => {

    const api = await request.newContext({
        baseURL: "http://localhost:3000"
    });

    await api.post("/test/reset-trabajador", {
        data: {
            idTrabajador: 11
        }
    });

    await api.dispose();
});

test("Un administrador crea un usuario y le asigna una tarea. El usuario inicia su jornada, realiza la tarea y finaliza su jornada. Finalmente el encargado elimina el usuario", async ({ page }) => {

    const timestamp = Date.now();

    const nombreTrabajador = `Trabajador PW ${timestamp}`;
    const emailTrabajador = `trabajadorpw${timestamp}@test.com`;
    const passwordTrabajador = "Password123";

    const nombreTarea = `Tarea PW ${timestamp}`;

    //Login como encargado
        await page.goto("/");

        await page.getByLabel("Email").fill(process.env.ADMIN_EMAIL);
        await page.getByLabel("Contraseña").fill(process.env.ADMIN_PASSWORD);

        await page.getByRole("button", { name: "Entrar" }).click();

    //Crea una tarea 
        await page.getByLabel("Tareas").click();

        // Abrir formulario de nueva tarea
        await page.getByLabel("nueva_tarea").click();

        // Rellenar formulario
        await page.getByLabel("Nombre").fill(nombreTarea);
        await page.getByLabel("Descripción").fill("Prueba automática");

        await page.getByLabel("Fecha planificada").fill(new Date().toISOString().split("T")[0]);

        // Seleccionar trabajador
        await page.getByRole("combobox").nth(0).click();
        await page.getByRole("option", { name: "Trabajador Prueba" }).click();

        // Seleccionar parcela
        await page.getByRole("combobox").nth(1).click();
        await page.getByRole("option", { name: "Parcela Prueba" }).click();

        // Crear la tarea
        await page.getByRole("button", { name: "Crear" }).click();

        // Esperar a que se cierre el diálogo
        await expect(page.getByRole("dialog")).toBeHidden();

        //Cerrar sesión
        await page.getByLabel("cerrar_sesion").click();
   
    //Login como trabajador
        await page.getByLabel("Email").fill(process.env.TRABAJADOR_EMAIL);
        await page.getByLabel("Contraseña").fill(process.env.TRABAJADOR_PASSWORD);

        await page.getByRole("button", { name: "Entrar" }).click();

        //Iniciar jornada
        await page.getByRole("button", { name: "boton_jornada" }).click();

        //Ir a tareas pendientes
        await page.getByRole("button", { name: "tareas_pendientes"}).click();


        //Encontrar la tarea
        const tarjeta = page.locator(".MuiPaper-root").filter({
            hasText: nombreTarea,
        });

        //Iniciar tarea
        await tarjeta.getByRole("button", { name: "boton_iniciar_tarea" }).click();

        // Confirmar el cambio de estado
        await page.getByRole("button", { name: "cambiar_estado" }).click();

        //Ir a tareas en proceso
        await page.getByRole("button", { name: "tareas_proceso"}).click();

        //Encontrar la tarea
        const tarjeta2 = page.locator(".MuiPaper-root").filter({
            hasText: nombreTarea,
        });

        //Terminar tarea
        await tarjeta2.getByRole("button", { name: "boton_finalizar_tarea" }).click();

        // Confirmar el cambio de estado
        await page.getByRole("button", { name: "cambiar_estado" }).click();

        //Finalizar jornada
        await page.getByRole("button", { name: "boton_finalizar_jornada" }).click();
});