export function getBaseUrl() {
    return window.location.hostname == "space-bots.longwelwind.net"
        ? "https://api.space-bots.longwelwind.net"
        : "";
}
