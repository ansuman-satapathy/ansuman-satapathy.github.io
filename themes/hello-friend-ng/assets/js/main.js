/**
 * Theming.
 *
 * Supports the preferred color scheme of the operation system as well as
 * the theme choice of the user.
 *
 */
const themeToggle = document.querySelector(".theme-toggle");

// Minimal script if any other functionality is needed later.
// Currently theme switching is disabled.

// Add Copy button natively using Prism's hooks API to ensure it runs after the toolbar plugin
if (typeof Prism !== 'undefined') {
    Prism.hooks.add('complete', function(env) {
        const pre = env.element.parentElement;
        if (!pre || pre.nodeName.toLowerCase() !== 'pre') return;

        const wrapper = pre.parentElement;
        if (!wrapper || !wrapper.classList.contains('code-toolbar')) return;

        const toolbar = wrapper.querySelector('.toolbar');
        if (!toolbar || toolbar.querySelector('.copy-to-clipboard-btn')) return;

        const btnContainer = document.createElement('div');
        btnContainer.className = 'toolbar-item';
        
        const button = document.createElement('button');
        button.textContent = 'Copy';
        button.className = 'copy-to-clipboard-btn';
        button.type = 'button';
        
        button.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(env.element.innerText);
                button.textContent = 'Copied!';
                button.classList.add('copied');
                
                setTimeout(() => {
                    button.textContent = 'Copy';
                    button.classList.remove('copied');
                }, 2000);
            } catch (err) {
                console.error('Failed to copy: ', err);
                button.textContent = 'Error';
            }
        });
        
        btnContainer.appendChild(button);
        toolbar.appendChild(btnContainer);
    });
}
