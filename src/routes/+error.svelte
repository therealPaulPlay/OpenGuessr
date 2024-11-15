<script>
  import { ArrowLeft } from "lucide-svelte";
  import { page } from "$app/stores";
</script>

<svelte:head>
  <title>OpenGuessr - Error</title>
</svelte:head>

<div id="page-content">
  <h1>{$page.status} - {$page.error.message}</h1>
  <p>The page you requested does not exist or experienced an error.</p>
  <a class="returnButton standardButton" href="/">
    <ArrowLeft size="18" />
    Return to OpenGuessr</a
  >
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
    font-size: 25px;
    padding: 15px 20px;
    border-radius: 10px;
    margin-top: 100px;
    text-decoration: none;
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
      max-width: 250px;
    }

    .returnButton {
      font-size: 15px;
    }
  }
</style>
