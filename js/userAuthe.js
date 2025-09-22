// userAuthe.js
const supaConfig = {
    ApiPublic: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqZnpqdm9vcnhzYm5paW5xZG9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MTQ2NzcsImV4cCI6MjA3MjA5MDY3N30.llrfMsDd8cfOb6uOpm95MKAxMRf27r-G5TlsrbnAeLw',
    url: 'https://rjfzjvoorxsbniinqdoi.supabase.co',
};



window.supaConfig = supaConfig;

console.log("Script loaded");

// Verificar que Supabase esté disponible
if (typeof supabase === 'undefined') {
    console.error('Supabase no está disponible');
} else {
    console.log('Supabase disponible:', supabase);
}

// Verificar que config esté disponible - USAR window.supaConfig
if (typeof window.supaConfig === 'undefined') {
    console.error('Config no está disponible');
} else {
    console.log('Config disponible:', window.supaConfig);  // CAMBIÉ supaConfig por window.supaConfig
}

// Crear cliente Supabase
const supabaseClient = supabase.createClient(supaConfig.url, supaConfig.ApiPublic);
console.log("Cliente Supabase creado:", supabaseClient);

// UI Elements
const signUpButton = document.getElementById('signUp');
const signInButton = document.getElementById('signIn');
const container = document.getElementById('container');

// Panel switching
if (signUpButton) {
    signUpButton.addEventListener('click', () => {
        container.classList.add("right-panel-active");
    });
}

if (signInButton) {
    signInButton.addEventListener('click', () => {
        container.classList.remove("right-panel-active");
    });
}

// Authentication function
const signIn = async () => {
    try {
        // AGREGAR VALIDACIÓN AQUÍ
        const emailInput = document.getElementById('email-signin');
        const passwordInput = document.getElementById('password-signin');

        if (!emailInput || !passwordInput) {
            alert('Error: No se encontraron los campos de email y contraseña');
            return;
        }

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (!email || !password) {
            alert('Por favor, completa todos los campos');
            return;
        }

        if (!email.includes('@')) {
            alert('Por favor, ingresa un email válido');
            return;
        }

        if (password.length < 6) {
            alert('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        console.log("Iniciando proceso de login con:", email);
        alert("Starting sign in process...");

        // Usar los datos del formulario en lugar de datos hardcodeados
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,  // Datos reales del formulario
            password: password  // Datos reales del formulario
        });

        if (error) {
            console.error('Sign in error:', error);
            alert(`Sign in failed: ${error.message}`);
            return;
        }

        console.log('Sign in successful:', data);
        alert("Sign in successful!");

        // Redirigir después del login exitoso
        if (data.user) {
            window.location.href = '/index.html';
        }

        email.value = '';
        password.value = '';

    } catch (err) {
        console.error('Unexpected error:', err);
        alert(`Unexpected error: ${err.message}`);
    }
}

//CREATE AN ACCOUNT
const signUp = async () => {
    try {
        console.log("Iniciando proceso de registro...");

        // USAR LOS IDs CORRECTOS DEL SIGNUP
        const emailInput = document.getElementById('email-signUp');
        const passwordInput = document.getElementById('password-signUp');
        const nameInput = document.getElementById('name-signUp');
        const confirmInput = document.getElementById('password-confirm-signUp');

        // VERIFICAR SI EXISTEN LOS ELEMENTOS
        if (!emailInput || !passwordInput || !nameInput || !confirmInput) {
            alert('Error: No se encontraron todos los campos necesarios');
            console.error('Campos faltantes:', { emailInput, passwordInput, nameInput, confirmInput });
            return;
        }

        // OBTENER VALORES
        const email = emailInput.value.trim();
        const name = nameInput.value.trim();
        const password = passwordInput.value.trim();
        const confirm = confirmInput.value.trim();

        // VERIFICAR SI ESTÁN VACÍOS
        if (!email || !password || !name || !confirm) {
            alert('Por favor, completa todos los campos');
            return;
        }

        // VERIFICAR SI TIENE @ (CORREGIR LÓGICA)
        if (!email.includes("@")) {
            alert("Por favor ingrese un email válido");
            return;
        }

        // VERIFICAR LONGITUD DE CONTRASEÑA
        if (password.length < 6) {
            alert('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        // VERIFICAR SI AMBAS CONTRASEÑAS COINCIDEN
        if (password !== confirm) {
            alert('Ambas contraseñas deben coincidir');
            return;
        }

        console.log("Validaciones pasadas, enviando registro...");

        let { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    name: name  // Guardar el nombre en los metadatos del usuario
                }
            }
        });

        if (error) {
            console.error('Error en registro:', error);
            alert(`Error en registro: ${error.message}`);
            return;
        }

        console.log('Registro exitoso:', data);
        alert('¡Registro exitoso! Revisa tu email para confirmar la cuenta.');

        // Limpiar formulario
        emailInput.value = '';
        passwordInput.value = '';
        nameInput.value = '';
        confirmInput.value = '';

        // OPCIONAL: Redirigir al login para que confirme su email
        setTimeout(() => {
            window.location.href = 'userAutent.html'; // mantener en login
        }, 2000);

        // if (data.user) {
        //     window.location.href = '/index.html';
        // }

    } catch (err) {
        console.error("Error inesperado:", err);
        alert(`Error inesperado: ${err.message}`);
    }
}

const googleSignIn = async () => {
    try {
        console.log("iniciando autentificacion con google🚀🚀")

        const { data, error } = await supabaseClient.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + '/index.html' // Redirect after successful login
            }
        });

        if (error) {
            console.error('Error en registro:', error);
            alert(`Error en registro: ${error.message}`);
            return;
        }

    } catch (error) {
        console.error("Error inesperado:", err);
        alert(`Error inesperado: ${err.message}`);
    }

}

// const resetInputs = () => {
//         const emailInput = document.getElementById('email-signUp');
//         const passwordInput = document.getElementById('password-signUp');
    
//         let email = emailInput.value.trim();
//         let password = passwordInput.value.trim();

//     email = '';
//     password = '';
// }

// document.addEventListener("DOMContentLoaded", resetInputs)

// // También ejecutar si la página ya está cargada
// if (document.readyState === 'loading') {
//     document.addEventListener('DOMContentLoaded', resetInputs);
// } else {
//     resetInputs();
//}

// Hacer función global para onclick
window.signIn = signIn;
window.signUp = signUp
window.googleSignIn = googleSignIn

// name: 'yei',
//     email: 'someone2@email.com',
// password: 'dzfCuGZrpyhYmAJTEMnn