function toggleForm() {
    let loginForm = document.getElementById("loginForm");
    let signupForm = document.getElementById("signupForm");

    if (loginForm.style.display == "none") {
        loginForm.style.display = "block";
        signupForm.style.display = "none";
    } else {
        loginForm.style.display = "none";
        signupForm.style.display = "block";
    }
}

let loginSwitch = document.getElementById("loginSwitch");
loginSwitch.addEventListener("click", toggleForm);

let loginSwitchBack = document.getElementById("loginSwitchBack");
loginSwitchBack.addEventListener("click", toggleForm);

//background orbs
document.addEventListener('DOMContentLoaded', function() {
    const orbsContainer = document.createElement('div');
    orbsContainer.classList.add('orbs');
    document.body.appendChild(orbsContainer);

    const numOfOrbs = 10;
    const colors = ['#ff3b30'];

    for (let i = 0; i < numOfOrbs; i++) {
      const orb = document.createElement('div');
      orb.classList.add('orb');
      orb.style.top = `${Math.random() * 100}vh`;
      orb.style.left = `${Math.random() * 100}vw`;
      orb.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      orbsContainer.appendChild(orb);

      let randomSize = Math.random() * 750 + 250 
      orb.style.width = randomSize + "px";
      orb.style.height = randomSize + "px";

      // Randomize animation duration and delay
      orb.style.animationDuration = `${Math.random() * 10 + 5}s`;
      orb.style.animationDelay = `${Math.random() * 5}s`;
    }
  });