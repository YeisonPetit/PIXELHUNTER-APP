// Configuración de Supabase (igual que en userAuthe.js)
const waitForSupabaseConfig = () => {
    return new Promise((resolve) => {
        if (window.supaConfig) {
            console.log('✅ Supabase config cargado correctamente');
            resolve();
        } else {
            console.log('⏳ Esperando configuración de Supabase...');
            setTimeout(() => waitForSupabaseConfig().then(resolve), 100);
        }
    });
};

// Variable para el cliente de Supabase
let supabaseClient = null;

// Variable global para almacenar info del usuario
let currentUser = null;

// Función para inicializar Supabase client
const initializeSupabaseClient = async () => {
    try {
        await waitForSupabaseConfig();
        
        // Usar la configuración global de config.js
        supabaseClient = supabase.createClient(window.supaConfig.url, window.supaConfig.ApiPublic);
        
        console.log('✅ Cliente Supabase inicializado correctamente');
        return supabaseClient;
        
    } catch (error) {
        console.error('❌ Error inicializando cliente Supabase:', error);
        throw error;
    }
};

// Función para verificar sesión activa
const checkUserSession = async () => {
    try {
        if (!supabaseClient) {
            console.log('Cliente Supabase no inicializado, esperando...');
            return;
        }

        console.log('Verificando sesión del usuario...');

        const { data: { session }, error } = await supabaseClient.auth.getSession();

        if (error) {
            console.error('Error verificando sesión:', error);
            redirectToLogin();
            return;
        }

        if (!session || !session.user) {
            console.log('No hay sesión activa - Redirigiendo al login');
            redirectToLogin();
            return;
        }

        // Sesión válida encontrada
        currentUser = session.user;
        console.log('Sesión válida:', currentUser);
        
        // Mostrar información del usuario en la página
        displayUserInfo(currentUser);
        
        // Opcional: Verificar que el token no esté expirado
        const now = Math.round(Date.now() / 1000);
        if (session.expires_at && session.expires_at < now) {
            console.log('Token expirado - Refrescando...');
            await refreshSession();
        }

    } catch (err) {
        console.error('Error inesperado verificando sesión:', err);
        redirectToLogin();
    }
};

// Función para refrescar la sesión
const refreshSession = async () => {
    try {
        if (!supabaseClient) {
            console.error('Cliente Supabase no disponible para refrescar sesión');
            return;
        }

        const { data, error } = await supabaseClient.auth.refreshSession();
        
        if (error) {
            console.error('Error refrescando sesión:', error);
            redirectToLogin();
            return;
        }

        console.log('Sesión refrescada exitosamente');
        currentUser = data.session.user;
        displayUserInfo(currentUser);

    } catch (err) {
        console.error('Error inesperado refrescando sesión:', err);
        redirectToLogin();
    }
};

// Función para redirigir al login
const redirectToLogin = () => {
    alert('Sesión expirada o no válida. Redirigiendo al login...');
    window.location.href = '/html/userAutent.html';
};

// Función para mostrar información del usuario en la página
const displayUserInfo = (user) => {
    try {
        // Obtener el nombre del usuario
        const userName = user.user_metadata?.name || user.email.split('@')[0];
        const userEmail = user.email;
        const userAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture;

        console.log('Mostrando info del usuario:', { userName, userEmail, userAvatar });

        // Actualizar elementos de la página con la info del usuario
        
        // 1. Mostrar nombre en un elemento con id "user-name"
        const userNameElement = document.getElementById('user-name');
        if (userNameElement) {
            userNameElement.textContent = `${userName}`;
        }

        // 2. Mostrar email en un elemento con id "user-email"
        const userEmailElement = document.getElementById('user-email');
        if (userEmailElement) {
            userEmailElement.textContent = userEmail;
        }

        // 3. Mostrar avatar si existe
        const userAvatarElement = document.getElementById('user-avatar');
        if (userAvatarElement && userAvatar) {
            userAvatarElement.src = userAvatar;
            userAvatarElement.style.display = 'block';
        }

        // 4. Mostrar elementos que requieren autenticación
        const protectedElements = document.querySelectorAll('.protected-content');
        protectedElements.forEach(element => {
            element.style.display = 'block';
        });

        // 5. Ocultar elementos de "guest" (invitado)
        const guestElements = document.querySelectorAll('.guest-only');
        guestElements.forEach(element => {
            element.style.display = 'none';
        });

        console.log('Información del usuario mostrada correctamente');

    } catch (err) {
        console.error('Error mostrando información del usuario:', err);
    }
};

// Función para cerrar sesión
const signOut = async () => {
    try {
        if (!supabaseClient) {
            console.error('Cliente Supabase no disponible para cerrar sesión');
            return;
        }

        const confirmSignOut = confirm('¿Estás seguro de que quieres cerrar sesión?');
        
        if (!confirmSignOut) {
            return;
        }

        console.log('Cerrando sesión...');
        
        const { error } = await supabaseClient.auth.signOut();
        
        if (error) {
            console.error('Error cerrando sesión:', error);
            alert(`Error cerrando sesión: ${error.message}`);
            return;
        }

        console.log('Sesión cerrada exitosamente');
        alert('Sesión cerrada exitosamente');
        
        // Redirigir al login
        window.location.href = '/html/userAutent.html';

    } catch (err) {
        console.error('Error inesperado cerrando sesión:', err);
        alert(`Error inesperado: ${err.message}`);
    }
};

// Función para escuchar cambios en el estado de autenticación
const setupAuthListener = () => {
    if (!supabaseClient) {
        console.error('Cliente Supabase no disponible para configurar listener');
        return;
    }

    supabaseClient.auth.onAuthStateChange((event, session) => {
        console.log('Cambio en estado de auth:', event);

        if (event === 'SIGNED_OUT') {
            console.log('Usuario deslogueado - Redirigiendo...');
            window.location.href = '/html/userAutent.html';
        
        } else if (event === 'TOKEN_REFRESHED' && session) {
            console.log('Token refrescado');
            currentUser = session.user;
            displayUserInfo(currentUser);
        
        } else if (event === 'SIGNED_IN' && session) {
            console.log('Usuario logueado');
            currentUser = session.user;
            displayUserInfo(currentUser);
        }
    });
};

// Función de inicialización que se ejecuta al cargar la página
const initializeAuth = async () => {
    try {
        console.log('Inicializando verificación de autenticación...');
        
        // Inicializar cliente Supabase
        await initializeSupabaseClient();
        
        // Verificar sesión actual
        await checkUserSession();
        
        // Configurar listener para cambios de autenticación
        setupAuthListener();
        
        // Configurar botón de cerrar sesión si existe
        const signOutButton = document.getElementById('sign-out-btn');
        if (signOutButton) {
            signOutButton.addEventListener('click', signOut);
        }
        
        console.log('✅ Autenticación inicializada correctamente');
        
    } catch (error) {
        console.error('❌ Error inicializando autenticación:', error);
    }
};

// Ejecutar cuando la página esté completamente cargada
document.addEventListener('DOMContentLoaded', initializeAuth);

// También ejecutar si la página ya está cargada
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAuth);
} else {
    initializeAuth();
}