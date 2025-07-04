window.Components = {
    loadComponent: async function (componentName, targetElement) {
        try {
            const response = await fetch(`/components/${componentName}.html`);
            const html = await response.text();
            document.querySelector(targetElement).innerHTML = html;
        } catch (error) {
            console.error(`Error loading component ${componentName}:`, error);
        }
    },

    init: function() {
        this.loadComponent('header', '#header-container');
        this.loadComponent('footer', '#footer-container');
        this.initNavigation();
    },

    initNavigation: function() {
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('.nav-link');

        navLinks.forEach(link => {
            if (link.getAttribute('href') === currentPath) {
                link.classList.add('active');
            }
        });
    }
};