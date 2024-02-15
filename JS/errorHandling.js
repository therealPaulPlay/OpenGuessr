//This is being used to better catch and analyze streetview errors. (and any future error messages that could be related to an account system etc.)
export function errorPopup(title, description, errorCode) {
    document.getElementById("popup-title").innerHTML = `<strong>Alert: </strong> ${title}`;
    document.getElementById("popup-description").innerHTML = `<p>${errorCode}</p><p>${description}</p>`;
    document.getElementById("popup-content").style.display = 'flex';
  }

  function closePopup() {
    document.getElementById("popup-content").style.display = 'none';
    location.reload(); 
  }

let closeButton = document.getElementById("popupClose");
closeButton.addEventListener("click", closePopup);

/* errorPopup("Streetview link is invalid","Link: https://errorsareawesome.saidnooneever.ml", "Testerror description"); - this is how you call this function for example */
