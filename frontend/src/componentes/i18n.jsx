import i18n from "i18next"; // Importa la librería i18next para la traducción
import { initReactI18next } from "react-i18next";

// Importa los archivos de traducción para cada idioma
import es from "../traducciones/es/traduccion.json";
import en from "../traducciones/en/traduccion.json";
import ro from "../traducciones/ro/traduccion.json";
import ar from "../traducciones/ar/traduccion.json";

// Inicializa i18next con los recursos de traducción y la configuración
i18n
  .use(initReactI18next)
  .init({
    resources: {
      es: { translation: es },
      en: { translation: en },
      ro: { translation: ro },
      ar: { translation: ar }
    },
    lng: localStorage.getItem("lang") || "es", // español es el idioma por defecto
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;