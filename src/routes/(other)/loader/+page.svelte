<svelte:head>
    <title>Loading Error</title>
</svelte:head>

<div>
    <h1>No panorama loaded.</h1>
</div>

<style>
    h1 {
        text-align: center;
        font-family: Barlow;
        width: 70%;
        color: #686161;
        font-weight: 500;
        font-size: 30px;
    }

    div {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100dvh;
    }

    @media (orientation: portrait) {
        div {
            align-items: baseline;
        }

        h1 {
            margin-top: 300px;
        }
    }
</style>
