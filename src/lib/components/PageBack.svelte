<script>
    import inIframe from "$lib/utils/checkIframe";

    function goBack() {
        if (inIframe()) {
            window.parent.postMessage("close", "*");
        } else {
            if (document.referrer) {
                window.history.back();
            } else {
                window.location.href = "/"; // Fallback if no referrer
            }
        }
    }
</script>

<button class="backButton" onclick={goBack}>
    <img
        src="/img/arrow_icon.png"
        alt="Expand or close arrow"
        class="backButtonArrowIcon" />
    Back</button>

<style>
    .backButton {
        cursor: pointer;
        transition: filter 250ms ease;
        font-family: Barlow;
        opacity: 100%;
        padding: 10px 20px;
        font-size: 25px;
        color: black;
        width: fit-content;
        height: 50px;
        line-height: 20px;
        background-color: white;
        border-radius: 10px;
        margin: 20px 20px;
        margin-right: auto;
        user-select: none;
    }

    .backButtonArrowIcon {
        width: 25px;
        height: 25px;
        filter: invert();
        transform: rotate(90deg);
        vertical-align: -4px;
    }

    .backButton:hover {
        filter: brightness(0.7);
    }
</style>
