// Generic script loader and initializer
export function loadAndInitializeLibrary(url, globalVar, initFunction) {
    return new Promise((resolve, reject) => {
        if (window[globalVar]) {
            resolve(initFunction(window[globalVar]));
        } else {
            const script = document.createElement('script');
            script.src = url;
            script.async = true;
            script.onload = () => {
                try {
                    resolve(initFunction(window[globalVar]));
                } catch (error) {
                    reject(new Error(`Failed to initialize ${globalVar}: ${error.message}`));
                }
            };
            script.onerror = () => reject(new Error(`Failed to load ${url}`));
            document.head.appendChild(script);
        }
    });
}