// Variables globales
let allGames = [];
let platforms = [];

// Función para inicializar la app cuando config esté listo
const initializeApp = () => {
    if (!window.RawgConfig) {
        console.error("Config no disponible, reintentando...");
        setTimeout(initializeApp, 100);
        return;
    }
    
    console.log("Config cargado correctamente, iniciando aplicación");
    
    // Cargar juegos iniciales
    getGames(40);
    
    // Configurar event listeners
    setTimeout(setupEventListeners, 500);
};

const setupEventListeners = () => {
    // Búsqueda
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.addEventListener("input", searchGames);
        console.log("Event listener agregado al input de búsqueda");
    }
    
    // Grid options
    const grid1Btn = document.getElementById('grid1Btn');
    const grid4Btn = document.getElementById('grid4Btn');
    const gameList = document.getElementById('gameList');

    if (grid1Btn && grid4Btn && gameList) {
        gameList.style.gridTemplateColumns = 'repeat(4, 1fr)';
        grid4Btn.classList.add('active');

        grid1Btn.addEventListener('click', () => {
            gameList.style.gridTemplateColumns = '1fr';
            gameList.classList.add('one-column');
            grid1Btn.classList.add('active');
            grid4Btn.classList.remove('active');
        });

        grid4Btn.addEventListener('click', () => {
            gameList.style.gridTemplateColumns = 'repeat(4, 1fr)';
            gameList.classList.remove('one-column');
            grid4Btn.classList.add('active');
            grid1Btn.classList.remove('active');
        });
    }

    // Modal listeners
    const closeBtn = document.querySelector('.close');
    if (closeBtn) {
        closeBtn.onclick = closeGameModal;
    }

    window.onclick = (event) => {
        const modal = document.getElementById('gameModal');
        if (event.target === modal) {
            closeGameModal();
        }
    };

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeGameModal();
        }
    });
};

// Observer para imágenes (lazy loading)
const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
                img.src = img.dataset.src;
                img.onload = () => {
                    img.style.opacity = '1';
                };
                delete img.dataset.src;
                imageObserver.unobserve(img);
            }
        }
    });
}, {
    rootMargin: '50px',
    threshold: 0.1
});

// Observer para animación de cards
const cardObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
            cardObserver.unobserve(entry.target);
        }
    });
}, {
    rootMargin: '40px',
    threshold: 0.1
});

const displayGames = (games) => {
    const gamesContent = document.getElementById("gameList");

    gamesContent.innerHTML = games.map((game, index) => `
        <li class="game-card animate-on-scroll" style="animation-delay: ${index * 0.1}s">
            <img
                class="lazy-image"
                data-src="${game.background_image || 'https://via.placeholder.com/200x200'}"
                src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect width='200' height='200' fill='%23f0f0f0'/%3E%3C/svg%3E"
                alt="${game.name}"
                height="200"
                style="opacity:0; transition: opacity 0.5s;"
            />
            <div class="game-details">
                <p class="platform">${game.platforms?.map(p => platformsIcon(p.platform.name)).slice(0, 4).join(' ') || ''}</p>
                <span class="game-title">
                    <a class="gameName" href="#" onclick="openGameModal(${game.id})">${game.name}</a>
                </span>
                <p class="release-date">Date: ${game.released || 'TBA'}</p>
                <p class="genre">Genre: ${game.genres?.map(g => g.name).join(', ') || 'Unknown'}</p>
            </div>
        </li>
    `).join('');

    // Aplicar observers
    const newImages = gamesContent.querySelectorAll('.lazy-image[data-src]');
    newImages.forEach(img => imageObserver.observe(img));

    const newCards = gamesContent.querySelectorAll('.animate-on-scroll');
    newCards.forEach(card => cardObserver.observe(card));
}

// Función para abrir modal con detalles del juego
const openGameModal = async (gameId) => {
    try {
        if (!window.RawgConfig) {
            console.error('RawgConfig no está disponible');
            return;
        }

        const modal = document.getElementById('gameModal');
        const gameDetails = document.getElementById('gameDetails');

        gameDetails.innerHTML = `
            <div style="text-align: center; padding: 50px;">
                <h3>Loading game details...</h3>
                <div class="loading-spinner"></div>
            </div>
        `;

        modal.style.display = 'block';

        const gameData = await getGameDetails(gameId);

        if (gameData) {
            displayGameModal(gameData);
        }

    } catch (error) {
        console.error('Error loading game details:', error);
        document.getElementById('gameDetails').innerHTML = `
            <div style="text-align: center; padding: 50px;">
                <h3>Error loading game details</h3>
                <p>Please try again later</p>
            </div>
        `;
    }
}

// Función para obtener detalles específicos del juego
const getGameDetails = async (gameId) => {
    try {
        const url = `https://api.rawg.io/api/games/${gameId}?key=${window.RawgConfig.rawgKey}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();

    } catch (error) {
        console.error('Error fetching game details:', error);
        return null;
    }
}

// Función para mostrar los detalles en el modal
const displayGameModal = (game) => {
    const gameDetails = document.getElementById('gameDetails');

    gameDetails.innerHTML = `
        <div class="game-modal-header">
            <img src="${game.background_image}" alt="${game.name}" style="width: 100%; max-height: 300px; object-fit: cover; border-radius: 10px;">
            <h2>${game.name}</h2>
        </div>
        
        <div class="game-modal-info">
            <div class="info-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
                <div>
                    <h4>Rating</h4>
                    <p>⭐ ${game.rating}/5 (${game.ratings_count} reviews)</p>
                </div>
                <div>
                    <h4>Released</h4>
                    <p>${game.released || 'TBA'}</p>
                </div>
                <div>
                    <h4>Genres</h4>
                    <p>${game.genres?.map(g => g.name).join(', ') || 'Unknown'}</p>
                </div>
                <div>
                    <h4>Platforms</h4>
                    <p>${game.platforms?.map(p => p.platform.name).join(', ') || 'Unknown'}</p>
                </div>
                <div>
                    <h4>Developer</h4>
                    <p>${game.developers?.map(d => d.name).join(', ') || 'Unknown'}</p>
                </div>
                <div>
                    <h4>Playtime</h4>
                    <p>${game.playtime ? game.playtime + ' hours' : 'Unknown'}</p>
                </div>
            </div>
            
            ${game.description_raw ? `
                <div class="game-description">
                    <h4>Description</h4>
                    <p style="line-height: 1.6; max-height: 150px; overflow-y: auto;">${game.description_raw}</p>
                </div>
            ` : ''}
            
            <div class="game-actions" style="margin-top: 30px; text-align: center;">
                <button onclick="addToWishlist(${game.id})" style="padding: 10px 20px; margin: 0 10px; background: #ff6b35; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Add to Wishlist
                </button>
                <button onclick="viewScreenshots(${game.id})" style="padding: 10px 20px; margin: 0 10px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Screenshots
                </button>
            </div>
        </div>
    `;
}

// Función para cerrar modal
const closeGameModal = () => {
    document.getElementById('gameModal').style.display = 'none';
}

// Funciones adicionales
const addToWishlist = (gameId) => {
    console.log(`Adding game ${gameId} to wishlist`);
    alert('Game added to wishlist!');
    localStorage.setItem('wishlist', JSON.stringify([...JSON.parse(localStorage.getItem('wishlist') || '[]'), gameId]));
}

const viewScreenshots = async (gameId) => {
    try {
        const url = `https://api.rawg.io/api/games/${gameId}/screenshots?key=${window.RawgConfig.rawgKey}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.results && data.results.length > 0) {
            const screenshotsHTML = data.results.map(screenshot => `
                <img src="${screenshot.image}" style="width: 100%; margin: 10px 0; border-radius: 5px;" onclick="window.open('${screenshot.image}', '_blank')">
            `).join('');

            document.getElementById('gameDetails').innerHTML = `
                <h3>Screenshots - ${document.querySelector('#gameDetails h2').textContent}</h3>
                <button onclick="history.back()" style="margin-bottom: 20px; padding: 5px 15px;">← Back to Details</button>
                <div style="max-height: 400px; overflow-y: auto;">
                    ${screenshotsHTML}
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading screenshots:', error);
    }
}

const getGames = async (pageSize = 40) => {
    try {
        if (!window.RawgConfig) {
            console.error('RawgConfig no está disponible');
            return null;
        }

        const url = `${window.RawgConfig.rawgPublic}?key=${window.RawgConfig.rawgKey}&page_size=${pageSize}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();
        allGames = data.results;
        platforms = data.results.flatMap(game => game.platforms?.map(p => p.platform.name) || []);
        console.log("Juegos cargados:", allGames);
        
        displayGames(data.results);
        return data;

    } catch (error) {
        console.error("Error completo:", error);
        return null;
    }
}

let searchTimeout;

const searchGames = (event) => {
    clearTimeout(searchTimeout);

    searchTimeout = setTimeout(() => {
        const searchInput = document.getElementById("searchInput");
        const filter = searchInput.value.trim().toLowerCase();

        if (!filter) {
            displayGames(allGames);
            return;
        }

        const filteredGames = allGames.filter(game =>
            game.name.toLowerCase().includes(filter)
        );

        displayGames(filteredGames);
    }, 300);
};

const getDateRange = (period) => {
    const now = new Date();
    let startDate;

    switch (period) {
        case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        case 'year':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
    }

    return `${startDate.toISOString().split('T')[0]},${now.toISOString().split('T')[0]}`;
}

// Función principal para Top Games
const getTopGames = async (period = 'week', pageSize = 40) => {
    try {
        if (!window.RawgConfig) {
            console.error('RawgConfig no está disponible');
            return [];
        }

        let url;
        const baseUrl = `${window.RawgConfig.rawgPublic}?key=${window.RawgConfig.rawgKey}&page_size=${pageSize}`;

        switch (period) {
            case 'week':
                const thisWeek = getDateRange('week');
                url = `${baseUrl}&dates=${thisWeek}&ordering=-added`;
                break;
            case 'month':
                const thisMonth = getDateRange('month');
                url = `${baseUrl}&dates=${thisMonth}&ordering=-rating`;
                break;
            case 'year':
                const thisYear = getDateRange('year');
                url = `${baseUrl}&dates=${thisYear}&ordering=-rating`;
                break;
            case 'all-time':
                url = `${baseUrl}&ordering=-rating&rating=4,5`;
                break;
            case 'trending':
                url = `${baseUrl}&ordering=-updated`;
                break;
            default:
                url = `${baseUrl}&ordering=-rating`;
        }

        console.log(`Cargando ${period} games:`, url);

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();
        allGames = data.results;
        displayTopGames(data.results, period);

        return data.results;

    } catch (error) {
        console.error(`Error cargando ${period} games:`, error);

        const gamesContent = document.getElementById("gameList");
        if (gamesContent) {
            gamesContent.innerHTML = `
                <li style="text-align: center; padding: 40px; color: #666; list-style: none;">
                    <h3>Error loading ${period} games</h3>
                    <p>Please try again later</p>
                    <button onclick="getGames(40)" style="margin-top: 15px; padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        Back to All Games
                    </button>
                </li>
            `;
        }

        return [];
    }
}

// Función para mostrar con rankings
const displayTopGames = (games, period) => {
    const titles = {
        'week': '🔥 Top Games This Week',
        'month': '📈 Popular This Month',
        'year': '🏆 Best of This Year',
        'all-time': '👑 Greatest Games Ever',
        'trending': '📈 Trending Now',
        'default': 'Top Picks',
        'reviews': '⭐ Top Reviewed Games'
    };

    const gamesContent = document.getElementById("gameList");

    if (!games || games.length === 0) {
        gamesContent.innerHTML = `
            <li style="text-align: center; padding: 40px; color: #666; list-style: none;">
                <h3>🎮 No ${period} games found</h3>
                <p>Try a different time period</p>
            </li>
        `;
        return;
    }

    gamesContent.innerHTML = games.map((game, index) => `
        <li class="game-card animate-on-scroll" style="animation-delay: ${index * 0.1}s; position: relative;">
            
            <!-- Ranking badge -->
            <div style="position: absolute; top: 10px; left: 10px; background: linear-gradient(45deg, #ff6b35, #ff8e53); color: white; padding: 5px 10px; border-radius: 15px; font-weight: bold; font-size: 0.9em; z-index: 10; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
                #${index + 1}
            </div>
            
            <img
                class="lazy-image"
                data-src="${game.background_image || 'https://via.placeholder.com/200x200'}"
                src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect width='200' height='200' fill='%23f0f0f0'/%3E%3C/svg%3E"
                alt="${game.name}"
                height="200"
                style="opacity:0; transition: opacity 0.5s;"
            />
            
            <div class="game-details">
                <p class="platform"></p>
                <span class="game-title">
                    <a class="gameName" href="#" onclick="openGameModal(${game.id})">${game.name}</a>
                </span>
                <p class="release-date">Date: ${game.released || 'TBA'}</p>
                <p class="genre">Genre: ${game.genres?.map(g => g.name).slice(0, 2).join(', ') || 'Unknown'}</p>
                
                <p style="color: #ff6b35; font-weight: bold; margin: 8px 0;">
                    ⭐ ${game.rating}/5 (${game.ratings_count || 0} reviews)
                </p>
            </div>
        </li>
    `).join('');

    // Aplicar observers
    const newImages = gamesContent.querySelectorAll('.lazy-image[data-src]');
    newImages.forEach(img => imageObserver.observe(img));

    const newCards = gamesContent.querySelectorAll('.animate-on-scroll');
    newCards.forEach(card => cardObserver.observe(card));

    // Actualizar título
    const sectionTitle = document.querySelector('#content h1, .main-content h1');
    if (sectionTitle) {
        sectionTitle.textContent = titles[period] || 'Top Picks';
    }
}

// Funciones de utilidad para reviews
const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('es-ES', options);
}

const generateStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return '⭐'.repeat(fullStars) +
        (hasHalfStar ? '🌟' : '') +
        '☆'.repeat(emptyStars);
}

const expandReview = (button) => {
    const reviewCard = button.closest('.review-card');
    const shortText = reviewCard.querySelector('.review-text');
    const fullText = reviewCard.querySelector('.review-text-full');

    if (fullText.style.display === 'none') {
        shortText.style.display = 'none';
        fullText.style.display = 'block';
        button.textContent = 'Leer menos';
    } else {
        shortText.style.display = 'block';
        fullText.style.display = 'none';
        button.textContent = 'Leer más';
    }
}

const getGameReviews = async (gameId, page = 1, pageSize = 20) => {
    try {
        if (!window.RawgConfig) {
            console.error('RawgConfig no está disponible');
            return {
                reviews: [],
                totalCount: 0,
                nextPage: null,
                hasMore: false
            };
        }

        const url = `https://api.rawg.io/api/games/${gameId}/reviews?key=${window.RawgConfig.rawgKey}&page=${page}&page_size=${pageSize}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();

        return {
            reviews: data.results || [],
            totalCount: data.count || 0,
            nextPage: data.next,
            hasMore: !!data.next
        };

    } catch (error) {
        console.error(`Error obteniendo reviews para game ${gameId}:`, error);
        return {
            reviews: [],
            totalCount: 0,
            nextPage: null,
            hasMore: false
        };
    }
}

const displayReviews = (reviews) => {
    const reviewsList = document.getElementById("gameList");

    if (!reviews || reviews.length === 0) {
        showReviewsError();
        return;
    }

    const reviewsHTML = reviews.map((review, index) => `
        <li class="review-card animate-on-scroll" style="animation-delay: ${index * 0.1}s; list-style: none; margin-bottom: 20px; padding: 25px; background: white; border-radius: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border-left: 4px solid #667eea;">
            ${review.gameName ? `
                <div style="background: linear-gradient(45deg, #667eea, #764ba2); color: white; padding: 8px 15px; border-radius: 20px; display: inline-block; font-size: 12px; font-weight: bold; margin-bottom: 15px;">
                    🎮 ${review.gameName}
                </div>
            ` : ''}
            
            <div class="review-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
                <div class="reviewer-info" style="display: flex; align-items: center; gap: 12px;">
                    <img 
                        class="lazy-image reviewer-avatar" 
                        data-src="${review.user?.avatar || 'https://via.placeholder.com/50x50/667eea/white?text=👤'}"
                        alt="${review.user?.username || 'Usuario'}"
                        style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; opacity: 0; transition: opacity 0.3s;"
                    />
                    <div class="reviewer-details">
                        <h4 style="margin: 0; color: #2c3e50; font-size: 16px;">${review.user?.username || 'Anónimo'}</h4>
                        <span class="review-date" style="color: #666; font-size: 12px;">${formatDate(review.created)}</span>
                    </div>
                </div>
                <div class="review-rating" style="display: flex; flex-direction: column; align-items: flex-end; gap: 5px;">
                    <div class="stars" style="font-size: 18px;">
                        ${generateStars(review.rating)}
                    </div>
                    <span class="rating-text" style="font-size: 14px; font-weight: bold; color: #667eea;">${review.rating}/5</span>
                </div>
            </div>
            
            <div class="review-content" style="margin: 15px 0;">
                <p class="review-text" style="line-height: 1.6; color: #333; margin: 0; font-size: 15px;">
                    ${review.text?.length > 300 ?
            review.text.substring(0, 300) + '...' :
            review.text || 'Review sin texto disponible'
        }
                </p>
                ${review.text?.length > 300 ?
            `<button class="expand-btn" onclick="expandReview(this)" style="background: none; border: none; color: #667eea; cursor: pointer; font-weight: 500; margin-top: 10px; padding: 5px 0;">📖 Leer más</button>
                     <p class="review-text-full" style="display: none; line-height: 1.6; color: #333; margin: 10px 0 0 0; font-size: 15px;">${review.text}</p>` :
            ''
        }
            </div>
            
            <div class="review-actions" style="display: flex; gap: 15px; margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee; flex-wrap: wrap;">
                <button class="action-btn like-btn" style="background: #f8f9fa; border: 1px solid #e9ecef; padding: 8px 15px; border-radius: 20px; cursor: pointer; font-size: 13px; transition: all 0.3s ease;">
                    👍 Útil (${review.reactions?.like || Math.floor(Math.random() * 50)})
                </button>
                <button class="action-btn dislike-btn" style="background: #f8f9fa; border: 1px solid #e9ecef; padding: 8px 15px; border-radius: 20px; cursor: pointer; font-size: 13px; transition: all 0.3s ease;">
                    👎 No útil (${review.reactions?.dislike || Math.floor(Math.random() * 10)})
                </button>
            </div>
        </li>
    `).join('');

    reviewsList.innerHTML = reviewsHTML;

    // Aplicar observers
    const newReviews = reviewsList.querySelectorAll('.animate-on-scroll');
    newReviews.forEach(review => cardObserver.observe(review));

    const newAvatars = reviewsList.querySelectorAll('.lazy-image');
    newAvatars.forEach(img => imageObserver.observe(img));
}

const showReviewsError = () => {
    const gamesList = document.getElementById("gameList");
    gamesList.innerHTML = `
        <li style="text-align: center; padding: 60px; color: #666; list-style: none; background: white; border-radius: 15px; margin: 20px;">
            <div style="font-size: 4rem; margin-bottom: 20px;">😔</div>
            <h3 style="color: #2c3e50; margin-bottom: 15px;">Reviews no disponibles</h3>
            <p style="margin-bottom: 20px; line-height: 1.6;">
                Los reviews no están disponibles en este momento. <br>
                Esto puede ser debido a limitaciones de la API o falta de datos.
            </p>
            <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                <button onclick="loadAllGames()" 
                        style="padding: 12px 24px; background: #007bff; color: white; border: none; border-radius: 25px; cursor: pointer; font-weight: 500;">
                    🎮 Ver Todos los Juegos
                </button>
                <button onclick="loadAllTime()" 
                        style="padding: 12px 24px; background: #28a745; color: white; border: none; border-radius: 25px; cursor: pointer; font-weight: 500;">
                    🏆 Mejores de Todos los Tiempos
                </button>
            </div>
        </li>
    `;
}

const loadReviews = async () => {
    try {
        const testResult = await getGameReviews(3498, 1, 60);

        if (testResult.reviews.length > 0) {
            displayReviews(testResult.reviews);
        } else {
            showReviewsError();
        }

    } catch (error) {
        console.error('Error in loadReviews:', error);
        showReviewsError();
    }
}

// Función para volver a todos los juegos
const loadAllGames = () => {
    getGames(40);

    const sectionTitle = document.querySelector('#content h1, .main-content h1');
    if (sectionTitle) {
        sectionTitle.textContent = 'Top Picks';
    }
}

const loadMoreGames = () => {
    const currentCount = allGames.length;
    getGames(currentCount + 40);
}

const platformsIcon = (platform) => {
    const p = platform.toLowerCase();

    // PC/Desktop - Iconos específicos por OS
    if (p.includes('windows')) return '<i class="fa-brands fa-windows"></i>';
    if (p.includes('mac') || p.includes('macos')) return '<i class="fa-brands fa-apple"></i>';
    if (p.includes('linux')) return '<i class="fa-brands fa-linux"></i>';
    if (p.includes('pc')) return '<i class="fa-brands fa-windows"></i>';

    // PlayStation - Iconos específicos por generación
    if (p.includes('ps5') || p.includes('playstation 5')) return '<i class="fa-brands fa-playstation"></i> 5';
    if (p.includes('ps4') || p.includes('playstation 4')) return '<i class="fa-brands fa-playstation"></i> 4';
    if (p.includes('playstation') || p.includes('ps3')) return '<i class="fa-brands fa-playstation"></i>';

    // Xbox
    if (p.includes('xbox series')) return '<i class="fa-brands fa-xbox"></i> Series';
    if (p.includes('xbox one')) return '<i class="fa-brands fa-xbox"></i> One';
    if (p.includes('xbox')) return '<i class="fa-brands fa-xbox"></i>';

    // Nintendo
    if (p.includes('switch')) return '<i class="fa-brands fa-nintendo-switch"></i>';
    if (p.includes('nintendo')) return '<i class="fab fa-nintendo-switch"></i>';

    // Mobile
    if (p.includes('ios')) return '<i class="fa-brands fa-apple"></i>';
    if (p.includes('android')) return '<i class="fa-brands fa-android"></i>';
    if (p.includes('mobile')) return '<i class="fa-solid fa-mobile"></i>';

    // VR
    if (p.includes('vr') || p.includes('oculus')) return '<i class="fa-solid fa-vr-cardboard"></i>';

    // Web/Browser
    if (p.includes('web') || p.includes('browser')) return '<i class="fa-solid fa-globe"></i>';

    // Default
    return '';
}

// Funciones simples para los onclick del sidebar
const loadThisWeek = () => getTopGames('week');
const loadThisMonth = () => getTopGames('month');
const loadThisYear = () => getTopGames('year');
const loadAllTime = () => getTopGames('all-time');
const loadTrending = () => getTopGames('trending');

// Hacer funciones disponibles globalmente
window.getGameReviews = getGameReviews;
window.loadReviews = loadReviews;
window.displayReviews = displayReviews;
window.formatDate = formatDate;
window.generateStars = generateStars;
window.expandReview = expandReview;
window.showReviewsError = showReviewsError;

// Inicializar cuando DOM esté listo
document.addEventListener('DOMContentLoaded', initializeApp);