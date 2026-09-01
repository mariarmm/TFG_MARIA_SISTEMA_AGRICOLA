
const API_URL = import.meta.env.VITE_API_URL;


/**
 *  Wrapper para las peticiones HTTP del frontend
 */
export const apiFetch = async (path, options = {}) => {

    //Recupera el token de autenticación
    const token = localStorage.getItem("token");

    console.log(`${API_URL}${path}`);

    return fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(token ? {"Authorization": `Bearer ${token}`} : {}),
            ...options.headers, //Permite sobreescribir/añadir headers específicos
        },
    });      

};

//Procesa la respuesta HTTP
export const manejarRespuesta = async (res) => {

    //Intenta parsear JSON, si falla devuelve objeto vacio
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        throw {
            status: res.status,
            message: data.error || data.message || "Error interno"
        };
    }

    return data;
};