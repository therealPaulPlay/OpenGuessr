<svelte:head>
    <title>OpenGuessr - 404</title>
</svelte:head>

<div id="page-content">
    <h1>404 - Page not found.</h1>
    <p>The page you requested does not exist under this domain.</p>
    <a class="returnButton" href="/">Return to OpenGuessr</a>
</div>

<style>
    #page-content {
        height: 100dvh;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    }

    h1 {
        font-size: 70px;
        font-weight: 500;
        word-wrap: break-word;
        color: white;
    }

    p {
        text-align: center;
        margin-top: 40px;
        max-width: 400px;
        font-size: 30px;
        color: white;
    }

    a,
    a:hover,
    a:visited {
        text-decoration: none;
        color: white;
    }

    .returnButton {
        cursor: pointer;
        width: fit-content;
        font-size: 25px;
        padding: 15px 20px;
        text-align: center;
        white-space: nowrap;
        transition: transform 250ms ease;
        border-radius: 10px;
        user-select: none;
        -webkit-user-select: none;
        background-color: var(--brand-color);
        color: white;
        opacity: 100%;
        margin-top: 200px;
    }

    .returnButton:hover {
        transform: scale(1.05);
    }

    @media (max-width: 800px) {
        h1 {
            font-size: 50px;
        }

        .returnButton {
            font-size: 25px;
        }
    }

    @media (max-width: 500px) {
        h1 {
            font-size: 35px;
        }

        p {
            font-size: 15px;
        }

        .returnButton {
            font-size: 15px;
        }
    }
</style>
