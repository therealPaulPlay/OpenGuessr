import { deleteUser } from "$lib/logic/userAPI";
import { profilePopup } from "$lib/stores/uiStore";
import { errorPopup } from "$lib/utils/errorHandling";
import { checkAuthenticationStatus, resetLocalSave } from "$lib/logic/accountLogic";

export async function submitAccountDeletion(password) {
    let successState = await deleteUser(localStorage.getItem("id"), password, "index");
    // If success, continue (errors are caught and displayed in deleteUser)
    if (successState) {
        resetLocalSave();
        checkAuthenticationStatus();

        setTimeout(() => {
            profilePopup.set(false); // Close profile popup
            errorPopup("Account deleted successfully", "You have deleted your OpenGuessr account.", "Successfully deleted.", false, true);
        }, 250);
    }
}