//This is being used to better catch and analyze streetview errors. (and any future error messages that could be related to an account system etc.)
let alreadyPopupOpen = false;

export function errorPopup(title, description, errorCode, reload) {
    alreadyPopupOpen = document.getElementById("blackBackground").style.visibility == "visible" ? true : false;
    document.getElementById("popup-title").innerHTML = `<strong>Alert: </strong> ${title}`;
    document.getElementById("popup-description").innerHTML = `<p>${description}</p><p>Code: ${errorCode}</p>`;
    document.getElementById("popup-content").style.display = 'flex';
    document.getElementById("blackBackground").style.visibility = "visible";
    if (!reload) {
      document.getElementById("popupClose").innerHTML = "Close";
    } else {
      document.getElementById("popupClose").innerHTML = "Reload";
    }
  }

  export function closePopup() {
    document.getElementById("popup-content").style.display = 'none';
    if (!alreadyPopupOpen) {
      document.getElementById("blackBackground").style.visibility = "hidden";
    }
    if (document.getElementById("popupClose").innerHTML != "Close") {
    localStorage.setItem("selectedCategory", "standard");
    location.reload(); 
    }
  }

//errorPopup("Streetview link is invalid","Link: https://errorsareawesome.saidnooneever.ml", "Testerror description", false);
