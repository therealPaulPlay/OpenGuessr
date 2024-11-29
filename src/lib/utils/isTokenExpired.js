// Check if the JWT is expired

/* this should decode the token and return expired (true/false) - only works if the token is not encrypted,
otherwise we will need a jwt token verifier (with public key) */

export function isTokenExpired(token) {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
        atob(base64)
            .split("")
            .map(function (c) {
                return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
            })
            .join("")
    );

    try {
        const { exp } = JSON.parse(jsonPayload);
        const expired = Date.now() >= exp * 1000;
        return expired;
    }

    catch {
        expired = false;
        return expired;
    }

}