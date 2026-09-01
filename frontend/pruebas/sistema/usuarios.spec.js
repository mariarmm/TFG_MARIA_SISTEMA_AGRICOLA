import { test, expect } from "@playwright/test";

test("Un administrador crea un usuario y aparece en el listado", async ({ page }) => {

    const nombre = `Usuario ${Date.now()}`;
    const email = `usuario${Date.now()}@test.com`;
    const nombreModificado = `Usuario Modificado ${Date.now()}`

    // Login
    await page.goto("/");

    await page.getByLabel("Email").fill(process.env.ADMIN_EMAIL);
    await page.getByLabel("Contraseña").fill(process.env.ADMIN_PASSWORD);

    await page.getByRole("button", { name: "Entrar" }).click();

    // Ir a Usuarios
    await page.getByLabel("Equipo").click();

    // Nuevo usuario
    await page.getByRole("button", { name: /nuevo usuario/i }).click();

    // Formulario
    await page.getByLabel("Nombre").fill(nombre);
    await page.getByLabel("Email").fill(email);

    // Seleccionar rol
    await page.getByRole("combobox").nth(0).click();
    await page.getByRole("option", { name: "Trabajador" }).click();

    //Indicar ID del encargado
    await page.locator('[aria-label="ID Encargado"] input').fill("12");

    // Guardar
    await page.getByRole("button", { name: /crear/i }).click();

    // Comprobar que aparece
    await expect(page.getByText(nombre)).toBeVisible();

    
    //Localiza la tarjeta del usuario
    let tarjeta = page.locator(".MuiPaper-root").filter({
        hasText: nombre,
    });

    //Editar
    await tarjeta.getByRole("button", { name: "Editar usuario" }).click();
    await page.getByLabel("Nombre").fill(nombreModificado);
    await page.getByRole("button", { name: /guardar/i }).click();

    //Comprobar modificación
    await expect(page.getByText(nombreModificado)).toHaveCount(1);

    //Buscar el usuario con el nuevo nombre
    tarjeta = page.locator(".MuiPaper-root").filter({
        hasText: nombreModificado,
    });

    //Eliminar
    page.once("dialog", dialog => dialog.accept());
    await tarjeta.getByRole("button", { name: "Eliminar usuario" }).click();

    //Comprobar que ya no existe
    await expect(page.getByText(nombreModificado)).toHaveCount(0);
});