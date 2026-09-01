import { test, expect } from "@playwright/test";

test("Un trabajador puede iniciar sesión correctamente", async ({ page }) => {

    await page.goto("/");

    await page.getByLabel("Email").fill(process.env.TRABAJADOR_EMAIL);
    await page.getByLabel("Contraseña").fill(process.env.TRABAJADOR_PASSWORD);

    await page.getByRole("button", { name: "Entrar" }).click();
    
    // Comprobar que se ha redirigido a la pantalla principal
    await expect(page).toHaveURL(/tareas/);

    // Comprobar que aparece algún elemento de la aplicación
    await expect(page.getByText("Pendiente")).toBeVisible();
});

test("Cuando un trabajador se equivoca introduciendo sus credenciales aparece un error", async ({ page }) => {

    await page.goto("/");

    await page.getByLabel("Email").fill(process.env.TRABAJADOR_EMAIL);
    await page.getByLabel("Contraseña").fill("contraseñacontraseña");

    await page.getByRole("button", { name: "Entrar" }).click();
    
    // Sigue en la página de login
    await expect(page).toHaveURL("/");

    // Se muestra el mensaje de error
    await expect(page.getByText("La contraseña no es correcta")).toBeVisible();
});