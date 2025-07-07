document.addEventListener('DOMContentLoaded', function() {
    // Inicializar componentes
    Components.init();
    
    // Estadísticas animadas
    updateVehicleStats();
    
    // Efectos de parallax suaves
    //initScrollEffects();
});

async function updateVehicleStats() {
    try {
        const response = await fetch('/api/vehicle/count');
        const data = await response.json();

        if (data.success) {
            const vehicleStatElement = document.querySelector(".stat-number[data-type='vehicles']");
            vehicleStatElement.setAttribute("data-target", data.count);
            animateNumber(vehicleStatElement, data.count);
        }
    } catch (error) {
        console.error("Error al obtener estadísticas:", error);
    }
}

function animateNumber(element, target) {
    let current = 0;
    const increment = target / 50;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 30);
}

// function initScrollEffects() {
//     window.addEventListener('scroll', () => {
//         const scrolled = window.pageYOffset;
//         const parallax = document.querySelector('.hero-section');
        
//         if (parallax) {
//             parallax.style.transform = `translateY(${scrolled * 0.5}px)`;
//         }
//     });
// }