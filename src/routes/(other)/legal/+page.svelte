<script>
    import PageBack from "$lib/components/PageBack.svelte";
</script>

<svelte:head>
    <title>Legal</title>
</svelte:head>

<div id="navbar">
    <PageBack />
    <h1 id="navbarTitle">Legal</h1>
</div>

<div class="center">
    <div id="parent">
        <div id="text">
            <h1>Introduction</h1>
            <br />
            <p>
                This page exists to inform the reader about how user data is
                collected, which terms apply when using the game, and how to
                reach out to the developer. By using this website, you accept
                the following agreements and policies. Please note that some
                information is available on different pages linked below. If you
                have any questions regarding these policies, feel free to 
                reach out using the contact form, which you can find linked at
                the bottom of this page.
            </p>
            <br />
            <p>
                Imprint: For imprint and contact information, please refer to <a
                    href="https://paulplay.studio/imprint"
                    target="_blank">this page</a
                >.
            </p>
            <p>
                Terms of Use: For the Terms of Use, please refer to <a
                    href="https://paulplay.studio/terms-of-use"
                    target="_blank">this page</a
                >.
            </p>
            <p>
                EULA: For the End user license agreement (EULA), please refer to <a
                    href="https://paulplay.studio/eula"
                    target="_blank">this page</a
                >.
            </p>
            <br /><br />
            <h1>Privacy Policy</h1>
            <br />
            <p>
                This service is provided by PaulPlay at no cost and is intended
                for use as is. This page is used to inform visitors regarding
                our policies with the collection, use, and disclosure of
                Personal Information if anyone decided to use our Service. If
                you choose to use this Service, then you agree to the collection
                and use of information in relation to this policy. The Personal
                Information that we collect is used for providing and improving
                the Service. We will not use or share your information with
                anyone except as described in this Privacy Policy.
            </p>
            <br />
            <h2>What data we collect</h2>
            <p>
                Our partners (e.g. Google or Stripe) collect details of which
                version of web browser you used and information on how you use
                the site using page tagging techniques. Furthermore, we are
                utilizing Google Maps Streetview for our application which has
                its own <a
                    href="https://policies.google.com/privacy"
                    target="_blank">privacy policy</a
                >. If you provide your consent, we use Google Analytics and our
                own cookies to collect information about how you use OpenGuessr.
                For a better experience, while using our Service, we may require
                you to provide us with certain personally identifiable
                information such as a username. If you create an account we will
                also store account-specific information such as your level or
                experience. By creating an account you accept that we may share
                non-sensitive information (like your username, email address,
                experience or other associated data) with other users.
                <br /> <br />
                Google Analytics processes information about:
                <br />
                - the pages you visit on OpenGuessr
                <br />
                - how long you spend on each page
                <br />
                - how you got to the site
                <br />
                - what you click on while you're visiting the site
                <br /> <br />
                We make sure you cannot be directly identified by Google Analytics
                data. We do this by using Google Analytics' IP address anonymisation
                feature. We will not combine analytics information with other data
                sets in a way that would directly identify who you are.
                <br /><br />
                If you register an account on our website, we will collect your username,
                IP address (to keep multiplayer secure and prevent cheaters) and
                email address that you have provided as well as other account related
                details that you provide at your own choice. Additionally, we save
                game-related information such as, but not limited to, your account
                level.
                <br /><br />
                If you purchase any item in the game/on the site, the data you provide
                might be stored and processed using stripe. Please refer to stripe's
                <a href="https://stripe.com/privacy" target="_blank"
                    >privacy policy</a> for more information.
            </p>
            <br />
            <h2>How we use your data</h2>
            <p>
                The data we collect using Google Analytics is transferred and
                stored with Google where we analyse it with Google Analytics
                software (Google Analytics 4). We do not allow Google to use or
                share this data for their own purposes. We also use your data,
                such as your username, in our multiplayer experiences and may
                share that with other players.
            </p>
            <br />
            <h2>Why we collect data</h2>
            <p>
                We use the information we collect through the explained means to
                see how you use OpenGuessr and to see how well the site performs
                on your device. We also strive to improve our website by
                analysing issues. Furthermore, we use your data to enrich
                multiplayer functionalities.
            </p>
            <br /> <br />
            <h2>How long we keep your data</h2>
            <p>
                We will only retain your personal data for as long as it is
                needed for the purposes set out in this document or for as long
                as the law requires us to.
            </p>
            <br /><br />
            <h2>How we keep your data secure</h2>
            <p>
                We are committed to doing all that we can to keep your data
                secure. We set up systems and processes to prevent unauthorised
                access to or disclosure of the data we collect about you. For
                example, we protect your data using varying levels of
                encryption. All third parties that process personal data for
                OpenGuessr are required to keep that data secure. We also only
                store a hash of your password if you sign up.
            </p>
            <br /><br />
            <h2>Changes to this policy</h2>
            <p>
                We may change this privacy notice. When we make changes to this
                notice, the 'last updated' date below will also change. Any
                changes to this privacy notice will apply to you and your data
                immediately. If these changes affect how your personal data is
                processed, OpenGuessr will take reasonable steps to make sure
                you know.
                <br />
                Last updated: 24 April 2024
            </p>
            <br /><br />
            <h2>Contact</h2>
            <p>
                If you have any questions regarding this policy, do not hesitate
                to contact us via the
                <a href="https://paulplay.studio/legal" target="_blank"
                    >contact form</a>
                on the bottom of this page.
            </p>
        </div>
    </div>
</div>

<style>
    p {
        color: white;
        font-size: 25px;
        margin: 0;
        margin-top: auto;
        margin-bottom: auto;
        box-sizing: border-box;
    }

    .center {
        display: flex;
        justify-content: center;
        align-items: center;
        margin: 20px 0;
    }

    #navbar {
        position: fixed;
        z-index: 100;
        width: 100%;
        align-items: center;
        top: 0;
        display: flex;
        justify-content: space-around;
        height: 100px;
        background-color: rgb(27, 28, 43);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
    }

    #navbarTitle {
        position: absolute;
        left: 50%;
        margin: auto;
        font-size: 50px;
        transform: translateX(-50%);
        color: white;
        padding-inline: 20px;
        text-align: center;
    }

    h1 {
        text-align: center;
        font-family: Barlow, Futura, sans-serif;
        color: rgb(255, 255, 255);
        font-size: 50px;
        margin-bottom: 12px;
    }

    h2 {
        text-align: left;
        font-family: Barlow, Futura, sans-serif;
        color: rgb(255, 255, 255);
        font-size: 35px;
        margin-bottom: 10px;
    }

    #text {
        width: 75%;
        max-width: 1150px;
        padding: 40px 40px;
    }

    #parent {
        display: flex;
        justify-content: center;
        margin-top: 100px;
    }

    @media all and (orientation: portrait) {
        #text {
            width: 80%;
        }

        h1 {
            font-size: 40px !important;
        }

        h2 {
            font-size: 30px;
        }

        p {
            font-size: 22px;
        }
    }
</style>
