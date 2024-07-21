//This is being used to better catch and analyze streetview errors. (and any future error messages that could be related to an account system etc.)

let showErrors = true;

export function errorPopup(title, description, errorCode, reload, hideDontShowAgainOption) {
  if (hideDontShowAgainOption) {
    document.getElementById("errorPopupDisable").style.display = "none";
  } else {
    document.getElementById("errorPopupDisable").style.display = "flex";
  }

  if (showErrors || reload) { // if errors should be shown or it is a critical error that needs a reload, show the popup
    document.getElementById("errorTitle").innerHTML = `<h2>${title}</h2>`;
    document.getElementById("popup-description").innerHTML = `<p class="slightBottomMargin">${description}</p>`;
   
    if (errorCode) {
      document.getElementById("popup-description").innerHTML += `<p class="errorCode">${errorCode}</p>`;
    }

    document.getElementById("errorPopup").style.display = "flex";

    if (!reload) {
      document.getElementById("popupClose").innerHTML = "Close";
    } else {
      document.getElementById("popupClose").innerHTML = "Reload";
    }
  }
}

export function closePopup() {
  document.getElementById("errorPopup").style.display = "none";
  if (document.getElementById("popupClose").innerHTML != "Close") {
    localStorage.setItem("selectedCategory", "standard");
    location.reload();
  }
}

try {
  let checkbox = document.getElementById("hideErrors");
  checkbox.checked = false;

  checkbox.addEventListener("change", (e => {
    showErrors = !e.currentTarget.checked;
  }));
} catch (err) {
  console.warn("Error checkbox does not exist on this page");
}

// errorPopup("Streetview link is invalid","Link: https://errorsareawesome.saidnooneever.ml", "Testerror description", false);
