(() => {
    const form = document.getElementById("prediction-form");
    const progress = document.getElementById("completion-progress");
    const fill = document.getElementById("completion-fill");
    const count = document.getElementById("completion-count");
    const message = document.getElementById("completion-message");
    const submitButton = document.getElementById("predict-button");

    if (!form || !progress || !fill || !count || !message || !submitButton) {
        return;
    }

    const requiredFields = Array.from(form.querySelectorAll("[required]"));

    function updateProgress() {
        const completed = requiredFields.filter((field) => {
            return field.value.trim() !== "";
        }).length;
        const percentage = requiredFields.length
            ? Math.round((completed / requiredFields.length) * 100)
            : 0;

        count.textContent = `${completed} / ${requiredFields.length}`;
        message.textContent = completed === requiredFields.length
            ? "Everything is ready for your assessment."
            : `${requiredFields.length - completed} required ${
                requiredFields.length - completed === 1 ? "field" : "fields"
            } left to complete.`;
        fill.style.width = `${percentage}%`;
        progress.setAttribute("aria-valuemax", String(requiredFields.length));
        progress.setAttribute("aria-valuenow", String(completed));
    }

    requiredFields.forEach((field) => {
        field.addEventListener("input", updateProgress);
        field.addEventListener("change", updateProgress);
    });

    form.addEventListener("submit", () => {
        submitButton.disabled = true;
        submitButton.querySelector("span").textContent = "Assessing customer...";
    });

    updateProgress();
})();
