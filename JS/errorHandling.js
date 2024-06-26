//This is being used to better catch and analyze streetview errors. (and any future error messages that could be related to an account system etc.)

let showErrors = true;

export function errorPopup(title, description, errorCode, reload) {
  if (showErrors || reload) { // if errors should be shown or it is a critical error that needs a reload, show the popup
    document.getElementById("popup-title").innerHTML = `<h2>Error: ${title}</h2>`;
    document.getElementById("popup-description").innerHTML = `<p class="slightBottomMargin">${description}</p><p class="errorCode">${errorCode}</p>`;
    document.getElementById("errorPopup").style.display = 'flex';
    document.getElementById("blackBackground").style.visibility = "visible";
    if (!reload) {
      document.getElementById("popupClose").innerHTML = "Close";
    } else {
      document.getElementById("popupClose").innerHTML = "Reload";
    }
  }
}

export function closePopup() {
  document.getElementById("errorPopup").style.display = 'none';
  document.getElementById("blackBackground").style.visibility = "hidden";
  if (document.getElementById("popupClose").innerHTML != "Close") {
    localStorage.setItem("selectedCategory", "standard");
    location.reload();
  }
}

let checkbox = document.getElementById("hideErrors");
checkbox.checked = false;

checkbox.addEventListener("change", (e => {
  showErrors = !e.currentTarget.checked;
}));

//errorPopup("Streetview link is invalid","Link: https://errorsareawesome.saidnooneever.ml", "Testerror description", false);
