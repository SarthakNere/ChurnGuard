(() => {
    const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;
    const revealElements = Array.from(document.querySelectorAll(
        "[data-reveal], .landing-page .section > .container > .mb-4, " +
        ".landing-page .section .panel, .landing-page .section .trust-card, " +
        ".landing-page .section .alert, .landing-page .section > .container > .hero, " +
        ".landing-page #performance .metric-card"
    ));
    const counters = Array.from(document.querySelectorAll("[data-count]"));

    function animateCounter(element) {
        const target = Number(element.dataset.count);
        if (!Number.isFinite(target)) return;

        if (reducedMotion) {
            element.textContent = target.toLocaleString();
            return;
        }

        const duration = 900;
        const start = performance.now();

        function update(now) {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 4);
            element.textContent = Math.round(target * eased).toLocaleString();

            if (progress < 1) {
                window.requestAnimationFrame(update);
            }
        }

        window.requestAnimationFrame(update);
    }

    if (!reducedMotion && "IntersectionObserver" in window) {
        document.body.classList.add("motion-ready");

        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.12, rootMargin: "0px 0px -35px 0px" });

        revealElements.forEach((element) => {
            const delay = Number(element.dataset.revealDelay);
            if (Number.isFinite(delay)) {
                element.style.setProperty("--reveal-delay", `${delay}ms`);
            }
            revealObserver.observe(element);
        });

        const counterObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                animateCounter(entry.target);
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.65 });

        counters.forEach((counter) => counterObserver.observe(counter));
    } else {
        revealElements.forEach((element) => element.classList.add("is-visible"));
        counters.forEach(animateCounter);
    }

    const chartCanvas = document.getElementById("churnChart");
    if (!chartCanvas || !window.Chart) return;

    const centerLabel = {
        id: "centerLabel",
        afterDraw(chart) {
            const { ctx, chartArea } = chart;
            if (!chartArea) return;

            const centerX = (chartArea.left + chartArea.right) / 2;
            const centerY = (chartArea.top + chartArea.bottom) / 2;
            ctx.save();
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "#15243b";
            ctx.font = "700 25px Aptos, Segoe UI, sans-serif";
            ctx.fillText("7,043", centerX, centerY - 7);
            ctx.fillStyle = "#687892";
            ctx.font = "500 11px Aptos, Segoe UI, sans-serif";
            ctx.fillText("customers", centerX, centerY + 15);
            ctx.restore();
        }
    };

    new window.Chart(chartCanvas, {
        type: "doughnut",
        data: {
            labels: ["Retained", "Churned"],
            datasets: [{
                data: [5174, 1869],
                backgroundColor: ["#315ce8", "#ed7474"],
                borderColor: "#ffffff",
                borderWidth: 5,
                hoverOffset: 9,
                borderRadius: 5
            }]
        },
        plugins: [centerLabel],
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "73%",
            animation: reducedMotion ? false : {
                animateRotate: true,
                animateScale: true,
                duration: 1100,
                easing: "easeOutQuart"
            },
            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        color: "#53627a",
                        usePointStyle: true,
                        pointStyle: "circle",
                        padding: 24,
                        boxWidth: 8,
                        font: { family: "Aptos, Segoe UI, sans-serif", size: 12 }
                    }
                },
                tooltip: {
                    backgroundColor: "#101b33",
                    padding: 12,
                    cornerRadius: 9,
                    callbacks: {
                        label(context) {
                            const value = context.raw.toLocaleString();
                            const percent = (context.raw / 7043 * 100).toFixed(1);
                            return ` ${context.label}: ${value} (${percent}%)`;
                        }
                    }
                }
            }
        }
    });
})();
