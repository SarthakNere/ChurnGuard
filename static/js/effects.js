(() => {
    const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    if (reducedMotion || !canHover) return;

    const root = document.documentElement;
    const trail = document.createElement("div");
    const trailDots = Array.from({ length: 5 }, () => {
        const dot = document.createElement("span");
        trail.appendChild(dot);
        return { element: dot, x: 0, y: 0 };
    });
    let pointer = { x: 0, y: 0 };
    let hasPointer = false;
    let frameRequested = false;

    trail.className = "cursor-trail";
    trail.setAttribute("aria-hidden", "true");
    document.body.appendChild(trail);

    function animateTrail() {
        let isMoving = false;

        trailDots.forEach((dot, index) => {
            const target = index === 0 ? pointer : trailDots[index - 1];
            const easing = index === 0 ? 0.38 : 0.3;
            if (Math.abs(target.x - dot.x) > 0.5 ||
                    Math.abs(target.y - dot.y) > 0.5) {
                isMoving = true;
            }
            dot.x += (target.x - dot.x) * easing;
            dot.y += (target.y - dot.y) * easing;
            dot.element.style.transform =
                `translate3d(${dot.x}px, ${dot.y}px, 0)`;
        });
        frameRequested = false;

        if (hasPointer && isMoving) {
            frameRequested = true;
            window.requestAnimationFrame(animateTrail);
        }
    }

    window.addEventListener("pointermove", (event) => {
        if (event.pointerType === "touch") return;

        pointer = { x: event.clientX, y: event.clientY };
        root.style.setProperty("--pointer-x", `${event.clientX}px`);
        root.style.setProperty("--pointer-y", `${event.clientY}px`);
        root.style.setProperty(
            "--pointer-hue",
            String(190 + (event.clientX / window.innerWidth) * 105)
        );
        trail.classList.add("is-active");

        if (!hasPointer) {
            trailDots.forEach((dot) => {
                dot.x = pointer.x;
                dot.y = pointer.y;
            });
        }
        hasPointer = true;

        if (!frameRequested) {
            frameRequested = true;
            window.requestAnimationFrame(animateTrail);
        }
    }, { passive: true });

    document.documentElement.addEventListener("mouseleave", () => {
        hasPointer = false;
        trail.classList.remove("is-active");
    });

    document.querySelectorAll(
        ".metric-card, .trust-card, .panel, .hero-dashboard"
    ).forEach((card) => {
        card.classList.add("interactive-card");

        card.addEventListener("pointermove", (event) => {
            const bounds = card.getBoundingClientRect();
            const x = (event.clientX - bounds.left) / bounds.width;
            const y = (event.clientY - bounds.top) / bounds.height;
            const tiltX = (0.5 - y) * 3;
            const tiltY = (x - 0.5) * 3;

            card.style.setProperty("--card-x", `${x * 100}%`);
            card.style.setProperty("--card-y", `${y * 100}%`);
            card.style.setProperty("--tilt-x", `${tiltX}deg`);
            card.style.setProperty("--tilt-y", `${tiltY}deg`);
        }, { passive: true });

        card.addEventListener("pointerleave", () => {
            card.style.setProperty("--tilt-x", "0deg");
            card.style.setProperty("--tilt-y", "0deg");
        });
    });
})();
