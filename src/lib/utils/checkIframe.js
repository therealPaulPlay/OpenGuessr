export default function inIframe() {
    try {
        return window.self !== window.parent;
    } catch {
        return true;
    }
}