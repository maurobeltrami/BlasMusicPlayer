// ui/router.js

export function navigateTo(targetViewId) {
    // Hide all views
    document.querySelectorAll('.page-view').forEach(view => {
        view.classList.add('hidden');
        view.classList.remove('block');
    });

    // Show target view
    const targetView = document.getElementById(targetViewId);
    if (targetView) {
        targetView.classList.remove('hidden');
        targetView.classList.add('block');
    }

    // Mostra/nasconde il mini-player sticky in base alla vista corrente
    const bottomPlayer = document.getElementById('bottom-player');
    if (targetViewId === 'view-home') {
        bottomPlayer.classList.add('hidden');
        bottomPlayer.classList.remove('flex');
    } else {
        bottomPlayer.classList.remove('hidden');
        bottomPlayer.classList.add('flex');
    }

    window.dispatchEvent(new CustomEvent('view-changed', { detail: { view: targetViewId } }));
}

export function setupRouter() {
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-target');
            if (target) {
                navigateTo(target);
            }
        });
    });
}
