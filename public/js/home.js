document.addEventListener('DOMContentLoaded', function() {
    // Inicializar componentes
    Components.init();
    
    // Estadísticas animadas
    animateStats();
    
    // Efectos de parallax suaves
    initScrollEffects();
});

function animateStats() {
    const stats = document.querySelectorAll('.stat-number');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = parseInt(entry.target.getAttribute('data-target'));
                animateNumber(entry.target, target);
            }
        });
    });

    stats.forEach(stat => {
        observer.observe(stat);
    });
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