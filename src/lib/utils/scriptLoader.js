// Generic script loader and initializer
export function loadAndInitializeLibrary(url, globalVar, initFunction) {
    return new Promise((resolve, reject) => {

        // Caching - Use the cached global variable if available
        if (window[`__cached_${globalVar}`]) {
            resolve(window[`__cached_${globalVar}`]);
            return;
        }

        const script = document.createElement('script');
        script.src = url;
        script.async = true;

        script.onload = () => {
            try {
                // Cache and resolve the initialized library
                const initialized = initFunction(window[globalVar]);
                window[`__cached_${globalVar}`] = initialized;
                resolve(initialized);
            } catch (error) {
                reject(new Error(`Failed to initialize ${globalVar}: ${error.message}`));
            }
        };

        script.onerror = () => reject(new Error(`Failed to load ${url}`));
        document.head.appendChild(script);
    });
}