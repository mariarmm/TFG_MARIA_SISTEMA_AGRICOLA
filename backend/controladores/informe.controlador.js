const puppeteer = require("puppeteer");

const InformeModelo = require('../modelos/informe.modelo');
const FichajeModelo = require("../modelos/fichaje.modelo");
const TareasModelo = require('../modelos/tareas.modelo');
const SesionTrabajoModelo = require('../modelos/sesion_trabajo.modelo');

class InformeControlador {

    // Método para calcular el rango de fechas de la semana a partir de una fecha dada
    static #calcularRangoSemana(fecha) {

        const d = new Date(fecha);
        const dia = d.getDay();
        
        const diferencia = d.getDate() - ((dia + 6) % 7);

        const lunes = new Date(d);
        lunes.setDate(diferencia);
        lunes.setHours(0, 0, 0, 0);

        const domingo = new Date(lunes);
        domingo.setDate(lunes.getDate() + 6);
        domingo.setHours(23, 59, 59, 999);

        return { lunes, domingo };
    }

    //Método para generar el contenido del informe en formato HTML para la generación del PDF
    static #generarHTML(data) {
        const {encargado, semana, observacion, informe} = data;

        let contenido = "";

        const semanaFormateada = {
            lunes: new Date(semana.lunes),
            domingo: new Date(semana.domingo)
        };

        for (const dia in informe) {
            contenido += `<h2>${dia}</h2>`;

            for (const trabajador in informe[dia]) {
                const info = informe[dia][trabajador];

                contenido += `
                    <div style="margin-bottom:10px;">
                    <h3>${trabajador}</h3>
                    <p><b>Horas:</b> ${parseFloat(info.horas).toFixed(2)}</p>
                    <p><b>Tareas:</b></p>
                    <ul>
                `;

                info.tareas.forEach(t => {
                    contenido += `
                        <li style="margin-bottom: 15px;">
                            <b>${t.nombre}</b>: ${t.descripcion || ""}
                    `;

                    if (t.sesiones && t.sesiones.length > 0) {
                        t.sesiones.forEach(s => {
                            contenido += `
                                <div style="margin-left: 15px; color: #555;">
                                    <b>Máquina:</b> ${s.maquina || "No especificada"}
                                    &nbsp;·&nbsp;
                                    <b>Duración:</b> ${parseFloat(s.duracion).toFixed(2)} h
                                </div>
                            `;
                        });
                    }

                    contenido += `</li>`;
                });

                contenido += `</ul></div>`;
            }
        }

        return `
            <html>
            <head>
                <style>
                body {
                    font-family: Arial;
                    padding: 30px;
                }
                h1 {
                    text-align: center;
                }
                h2 {
                    background: #eee;
                    padding: 8px;
                }
                h3 {
                    margin-bottom: 5px;
                }
                </style>
            </head>
            <body>
                <h1>Informe semanal</h1>

                <p><b>Semana:</b> ${semanaFormateada.lunes.toLocaleDateString()} - ${semanaFormateada.domingo.toLocaleDateString()}</p>
                <p><b>ID Encargado:</b> ${encargado}</p>

                ${observacion ? `<div style="margin-bottom:20px;">
                                    <h2>Observaciones</h2>
                                    <p>${observacion.replace(/\n/g, "<br>")}</p>
                                </div>` 
                            : ""
                }

                ${contenido}
            </body>
            </html>
            `;
    }

    //Método para obtener el informe semanal de un encargado, con opción de generar PDF
    static async obtenerInformeSemanal(req, res) {

        const { fecha, pdf } = req.query;
        const { id, rol } = req.usuario;

        let id_encargado;

        //Se calcula el intervalo correspondiente a la semana indicada
        const { lunes, domingo } = InformeControlador.#calcularRangoSemana(fecha);

        //Si el usuario es encargado, se toma su propio id
        if(rol === "encargado"){
            id_encargado = id;
        }
        // Si es un administrador, debe indicar el id_encargado cuyo informe quiere consultar
        else if(rol === "admin"){
            id_encargado = req.query.id_encargado;
        }

        if(!id_encargado){
            return res.status(400).json({error: "Falta id_encargado"});
        }


        try {

            //Se obtienen los fichajes, tareas e información asociada al informe de la semana
            const fichajes = await FichajeModelo.obtenerFichajesSemana(lunes, domingo, id_encargado);
            const tareas = await TareasModelo.obtenerTareasSemana(lunes, domingo, id_encargado);
            const sesiones_trabajo = await SesionTrabajoModelo.obtenerSesionesSemana(id_encargado, lunes, domingo);
            const informeBD = await InformeModelo.obtenerInforme(lunes, domingo, id_encargado);

            //Estructura que almacenará la información
            const informe = {};

            //Se procesan los fichajes para obtener las horas trabajadas por cada trabajador en cada día.
            fichajes.forEach(f => {

                //Obtiene el día de la semana (lunes, martes, ...)
                const diaKey = new Date(f.fecha).toLocaleDateString("es-ES", { weekday: "long" });

                //Crea el día si aún no existe en el informe
                if (!informe[diaKey]) {
                    informe[diaKey] = {};
                }

                //Crea el trabajador si aún no existe en el día correspondiente
                if (!informe[diaKey][f.trabajador]) {
                    informe[diaKey][f.trabajador] = {
                        horas: 0,
                        tareas: [],
                    };                
                }

                //Añade las horas del fichaje
                informe[diaKey][f.trabajador].horas += f.total_horas;
            });

            //Se procesan las tareas para asociarlas a los trabajadores y días correspondientes
            tareas.forEach(t => {

                //Obtiene el día de la tarea (lunes, martes, ...)
                const diaKey = new Date(t.fecha_ini).toLocaleDateString(
                    "es-ES",
                    { weekday: "long" }
                );

                //Si no existe en el informe, crea el día
                if (!informe[diaKey]) {
                    informe[diaKey] = {};
                }

                //Si no existe el trabajador en ese día, lo crea con horas 0 y tareas vacías
                if (!informe[diaKey][t.trabajador]) {
                    informe[diaKey][t.trabajador] = {
                        horas: 0,
                        tareas: []
                    };
                }

                //Añade la tarea al trabajador en el día correspondiente
                informe[diaKey][t.trabajador].tareas.push({
                    id: t.id,
                    nombre: t.nombre,
                    descripcion: t.descripcion,
                    sesiones: []
                });
            });

            //Crea un mapa de tareas por id para poder asociar las sesiones de trabajo a las tareas correspondientes
            const tareasPorId = new Map();

            //Recorre todas las
            Object.values(informe).forEach(dia => {
                Object.values(dia).forEach(trabajador => {
                    trabajador.tareas.forEach(tarea => {
                        tareasPorId.set(Number(tarea.id), tarea);
                    });
                });
            });

            //Se procesan las sesiones de trabajo para asociarlas a las tareas correspondientes y calcular la duración de cada sesión
            sesiones_trabajo.forEach(s => {

                //Obtiene el día de la sesión (lunes, martes, ...)
                const diaKey = new Date(s.fecha_ini).toLocaleDateString(
                    "es-ES",
                    { weekday: "long" }
                );

                //Si no existe el día en el informe, lo crea
                if (!informe[diaKey]) {
                    informe[diaKey] = {};
                }

                //Si no existe el trabajador en ese día, lo crea con horas 0 y tareas vacías
                if (!informe[diaKey][s.trabajador]) {
                    informe[diaKey][s.trabajador] = {
                        horas: 0,
                        tareas: []
                    };
                }

                // Calcula la duración de la sesión en horas.
                const fechaFin = s.fecha_fin ? new Date(s.fecha_fin) : new Date();
                const fechaIni = new Date(s.fecha_ini);
                const duracionHoras = (fechaFin - fechaIni) / (1000 * 60 * 60);

                //Busca la tarea correspondiente
                const tarea = tareasPorId.get(Number(s.id_tarea));

                //Añade la sesión a la tarea si existe
                if (tarea) {
                    tarea.sesiones.push({
                        maquina: s.maquina,
                        duracion: duracionHoras
                    });
                }
            });

            //Si se solicita el informe en PDF, se prepara la información necesaria.
            if(pdf){

                const datosInforme = {
                    encargado: id_encargado,
                    semana: { lunes, domingo },
                    observacion: informeBD?.observacion || null,
                    informe
                };

                //Se genera el contenido HTML del informe
                const html = InformeControlador.#generarHTML(datosInforme);

                //Se inicia Chromium mediante Puppeteer para generar el PDF a partir del HTML
                const browser = await puppeteer.launch({
                    headless: "new",
                    executablePath: "/usr/bin/chromium-browser", // ruta de chromium instalado

                    args: [
                        "--no-sandbox",
                        "--disable-setuid-sandbox"
                    ]
                });

                const page = await browser.newPage();

                //Se carga el HTML generado
                await page.setContent(html, {waitUntil: "networkidle0"});

                //Se genera el documento PDF con formato A4 y márgenes definidos
                const PDF = await page.pdf({
                    format: "A4",
                    printBackground: true,
                    margin: {
                        top: "20mm",
                        bottom: "20mm",
                        left: "15mm",
                        right: "15mm"
                    }
                });

                await browser.close();

                //Se indica al navegador que se trata de un archivo PDF para descargar, con el nombre "informe-semanal.pdf"
                res.setHeader("Content-Type", "application/pdf");
                res.setHeader("Content-Disposition", "attachment; filename=informe-semanal.pdf");

                res.send(PDF);
            }
            else{

                //Si no se solicita PDF, se devuelve la información del informe en formato JSON
                res.json({
                    encargado: id_encargado,
                    semana: { lunes, domingo },
                    observacion: informeBD?.observacion || null,
                    informe
                });
            }
        } catch (err) {
            console.error("Error obteniendo el informe: ", err.message);
            res.status(500).json({ error: "Error obteniendo el informe semanal" });
        }
    }

    //Método para actualizar la observación de un informe semanal
    static async actualizarObservacion(req, res) {

        const { fecha, id_encargado, observacion } = req.body;

        const { lunes, domingo } = InformeControlador.#calcularRangoSemana(fecha);

        if(!observacion || observacion.trim()===""){
            return res.status(400).json({error: "Falta la observación."});
        }

        try{

            //Obtiene el informe registrado en la bd para esa semana y encargado (si existe)
            let informeBD = await InformeModelo.obtenerInforme(lunes, domingo, id_encargado);

            //Si no existe el informe en la bd, se crea con la nueva observación.
            if(!informeBD){
                informeBD = await InformeModelo.registrarInforme(id_encargado, lunes, domingo, observacion);
                res.json(informeBD);
            }
            else { //Si ya existe el informe, se actualiza la observación concatenando la nueva observación con la antigua

                const nuevaObservacion = informeBD.observacion ? informeBD.observacion + "\n" + observacion : observacion;
                
                //Actualiza la observación del informe en la base de datos
                const observacionActualizada = await InformeModelo.aniadirObservacion(informeBD.id, nuevaObservacion);
                res.json(observacionActualizada);   
            }
        }catch(err){
            console.error("Error actualizando la observación: ", err.message);
            res.status(500).json({ error: "Error actualizando la observación" });
        }
    }
}

module.exports = InformeControlador;