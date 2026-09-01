import { test, expect } from "@playwright/test";

test("Un encargado crea una tarea, aparece en el listado, la borra y desaparece", async ({ page }) => {

    // Login
    await page.goto("/");

    await page.getByLabel("Email").fill(process.env.ENCARGADO_EMAIL);
    await page.getByLabel("Contraseña").fill(process.env.ENCARGADO_PASSWORD);

    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/mapa/);

    await page.getByLabel("Tareas").click();

    // Abrir formulario de nueva tarea
    await page.getByLabel("nueva_tarea").click();

    // Rellenar formulario
    const nombreTarea = `Tarea Playwright ${Date.now()}`;
    await page.getByLabel("Nombre").fill(nombreTarea);
    await page.getByLabel("Descripción").fill("Prueba automática");

    await page.getByLabel("Fecha planificada").fill("2026-09-01");

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

    // Cambiar los filtros de fecha y estado
    await page.getByLabel("Fecha desde").fill("2026-09-01");
    await page.getByLabel("Fecha hasta").fill("2026-09-01");
    await page.getByRole("combobox").nth(0).click();
    await page.getByRole("option", { name: "Pendiente" }).click();


    // Comprobar que aparece la tarea
    await expect(page.getByText(nombreTarea)).toBeVisible();

    //Seleccionar el botón de eliminar tarea
    const tarjeta = page.locator(".MuiPaper-root").filter({
        hasText: nombreTarea,
    });

    await tarjeta.getByRole("button", { name: "Eliminar tarea" }).click();

    //Confirmar la acción
    page.once("dialog", dialog => dialog.accept());
    await tarjeta.getByRole("button", { name: "Eliminar tarea" }).click();

    //Comprobar que desaparece
    await expect(page.getByText(nombreTarea)).toHaveCount(0);
});