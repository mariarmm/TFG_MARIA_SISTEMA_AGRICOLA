# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: fichaje.spec.js >> Un administrador crea un usuario y le asigna una tarea. El usuario inicia su jornada, realiza la tarea y finaliza su jornada. Finalmente el encargado elimina el usuario
- Location: pruebas/sistema/fichaje.spec.js:18:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: 'boton_jornada' })

```

# Page snapshot

```yaml
- generic [ref=f2e3]:
  - banner [ref=f2e4]:
    - generic [ref=f2e5]:
      - button [ref=f2e6] [cursor=pointer]
      - button "Notificaciones" [ref=f2e10] [cursor=pointer]
      - button "cerrar_sesion" [ref=f2e15] [cursor=pointer]
  - generic [ref=f2e21]:
    - button "boton_finalizar_jornada" [ref=f2e23] [cursor=pointer]: Finalizar jornada
    - heading "Gestión de tareas" [level=5] [ref=f2e24]
    - group [ref=f2e26]:
      - button "tareas_proceso" [ref=f2e27] [cursor=pointer]: En proceso
      - button "tareas_pendientes" [ref=f2e28] [cursor=pointer]: Pendiente
      - button "tareas_completadas" [ref=f2e29] [cursor=pointer]: Completada
    - paragraph [ref=f2e30]: No hay tareas registradas
```

# Test source

```ts
  1   | import { test, expect, request } from "@playwright/test";
  2   | 
  3   | test.beforeAll(async () => {
  4   | 
  5   |     const api = await request.newContext({
  6   |         baseURL: "http://localhost:3000"
  7   |     });
  8   | 
  9   |     await api.post("/test/reset-trabajador", {
  10  |         data: {
  11  |             idTrabajador: 11
  12  |         }
  13  |     });
  14  | 
  15  |     await api.dispose();
  16  | });
  17  | 
  18  | test("Un administrador crea un usuario y le asigna una tarea. El usuario inicia su jornada, realiza la tarea y finaliza su jornada. Finalmente el encargado elimina el usuario", async ({ page }) => {
  19  | 
  20  |     const timestamp = Date.now();
  21  | 
  22  |     const nombreTrabajador = `Trabajador PW ${timestamp}`;
  23  |     const emailTrabajador = `trabajadorpw${timestamp}@test.com`;
  24  |     const passwordTrabajador = "Password123";
  25  | 
  26  |     const nombreTarea = `Tarea PW ${timestamp}`;
  27  | 
  28  |     //Login como encargado
  29  |         await page.goto("/");
  30  | 
  31  |         await page.getByLabel("Email").fill(process.env.ADMIN_EMAIL);
  32  |         await page.getByLabel("Contraseña").fill(process.env.ADMIN_PASSWORD);
  33  | 
  34  |         await page.getByRole("button", { name: "Entrar" }).click();
  35  | 
  36  |     //Crea una tarea 
  37  |         await page.getByLabel("Tareas").click();
  38  | 
  39  |         // Abrir formulario de nueva tarea
  40  |         await page.getByLabel("nueva_tarea").click();
  41  | 
  42  |         // Rellenar formulario
  43  |         await page.getByLabel("Nombre").fill(nombreTarea);
  44  |         await page.getByLabel("Descripción").fill("Prueba automática");
  45  | 
  46  |         await page.getByLabel("Fecha planificada").fill(new Date().toISOString().split("T")[0]);
  47  | 
  48  |         // Seleccionar trabajador
  49  |         await page.getByRole("combobox").nth(0).click();
  50  |         await page.getByRole("option", { name: "Trabajador Prueba" }).click();
  51  | 
  52  |         // Seleccionar parcela
  53  |         await page.getByRole("combobox").nth(1).click();
  54  |         await page.getByRole("option", { name: "Parcela Prueba" }).click();
  55  | 
  56  |         // Crear la tarea
  57  |         await page.getByRole("button", { name: "Crear" }).click();
  58  | 
  59  |         // Esperar a que se cierre el diálogo
  60  |         await expect(page.getByRole("dialog")).toBeHidden();
  61  | 
  62  |         //Cerrar sesión
  63  |         await page.getByLabel("cerrar_sesion").click();
  64  |    
  65  |     //Login como trabajador
  66  |         await page.getByLabel("Email").fill(process.env.TRABAJADOR_EMAIL);
  67  |         await page.getByLabel("Contraseña").fill(process.env.TRABAJADOR_PASSWORD);
  68  | 
  69  |         await page.getByRole("button", { name: "Entrar" }).click();
  70  | 
  71  |         //Iniciar jornada
> 72  |         await page.getByRole("button", { name: "boton_jornada" }).click();
      |                                                                   ^ Error: locator.click: Test timeout of 30000ms exceeded.
  73  | 
  74  |         //Ir a tareas pendientes
  75  |         await page.getByRole("button", { name: "tareas_pendientes"}).click();
  76  | 
  77  | 
  78  |         //Encontrar la tarea
  79  |         const tarjeta = page.locator(".MuiPaper-root").filter({
  80  |             hasText: nombreTarea,
  81  |         });
  82  | 
  83  |         //Iniciar tarea
  84  |         await tarjeta.getByRole("button", { name: "boton_iniciar_tarea" }).click();
  85  | 
  86  |         // Confirmar el cambio de estado
  87  |         await page.getByRole("button", { name: "cambiar_estado" }).click();
  88  | 
  89  |         //Ir a tareas en proceso
  90  |         await page.getByRole("button", { name: "tareas_proceso"}).click();
  91  | 
  92  |         //Encontrar la tarea
  93  |         const tarjeta2 = page.locator(".MuiPaper-root").filter({
  94  |             hasText: nombreTarea,
  95  |         });
  96  | 
  97  |         //Terminar tarea
  98  |         await tarjeta2.getByRole("button", { name: "boton_finalizar_tarea" }).click();
  99  | 
  100 |         // Confirmar el cambio de estado
  101 |         await page.getByRole("button", { name: "cambiar_estado" }).click();
  102 | 
  103 |         //Finalizar jornada
  104 |         await page.getByRole("button", { name: "boton_finalizar_jornada" }).click();
  105 | });
```