(function () {
    'use strict';

    const rawConfig = document.documentElement.dataset.focuzConfig;
    if (!rawConfig) return;
    const config = JSON.parse(rawConfig);
    delete document.documentElement.dataset.focuzConfig;

    if (config.blockFocus) {
        const aeProxyHandler = {
            apply(target, thisArg, args) {
                if (["blur", "focus", "focusin", "focusout", "unload"].includes(args[0])) {
                    return;
                }
                return Reflect.apply(target, thisArg, args);
            }
        };

        Window.prototype.addEventListener = new Proxy(Window.prototype.addEventListener, aeProxyHandler);
        Document.prototype.addEventListener = new Proxy(Document.prototype.addEventListener, aeProxyHandler);
        Element.prototype.addEventListener = new Proxy(Element.prototype.addEventListener, aeProxyHandler);

        window.onblur = null;
        window.onfocus = null;
        document.onblur = null;
        document.onfocus = null;
        document.onfocusin = null;
        document.onfocusout = null;

        const blockInlineProp = (proto, prop) => {
            Object.defineProperty(proto, prop, {
                set(val) { },
                get() { return null; },
                configurable: true
            });
        };

        const focusEvents = ['onblur', 'onfocus', 'onfocusin', 'onfocusout'];
        focusEvents.forEach(evt => {
            blockInlineProp(HTMLElement.prototype, evt);
            blockInlineProp(SVGElement.prototype, evt);
        });
    }

    if (config.blockVisibility) {
        Object.defineProperty(document, "hidden", { get: () => false, configurable: true });
        Object.defineProperty(document, "visibilityState", { get: () => "visible", configurable: true });
        Object.defineProperty(document, "webkitVisibilityState", { get: () => "visible", configurable: true });

        document.addEventListener("visibilitychange", e => e.stopImmediatePropagation(), true);
        document.addEventListener("webkitvisibilitychange", e => e.stopImmediatePropagation(), true);
        document.addEventListener("mozvisibilitychange", e => e.stopImmediatePropagation(), true);
        document.addEventListener("pagehide", e => e.stopImmediatePropagation(), true);
    }

    if (config.blockMouse) {
        document.addEventListener("mouseleave", e => e.stopImmediatePropagation(), true);
        document.addEventListener("mouseenter", e => e.stopImmediatePropagation(), true);
    }

    if (config.spoofRaf) {
        const originalRaf = window.requestAnimationFrame;
        const callbacks = new Map();
        let idCounter = 0;
        let timerId = null;
        const loopInterval = 1000 / config.fpsLimit;

        function customLoop() {
            const now = performance.now();
            const currentCallbacks = Array.from(callbacks.entries());
            callbacks.clear();
            timerId = null;

            for (const [id, callback] of currentCallbacks) {
                try { callback(now); } catch (err) { console.error(err); }
            }

            if (callbacks.size > 0 && !timerId) {
                timerId = setTimeout(customLoop, loopInterval);
            }
        }

        window.requestAnimationFrame = function (callback) {
            idCounter++;
            callbacks.set(idCounter, callback);
            if (!timerId) {
                timerId = setTimeout(customLoop, loopInterval);
            }
            return idCounter;
        };

        window.cancelAnimationFrame = function (id) {
            callbacks.delete(id);
            if (callbacks.size === 0 && timerId) {
                clearTimeout(timerId);
                timerId = null;
            }
        };
    }
})();
