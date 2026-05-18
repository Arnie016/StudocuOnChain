export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "/api";

export class ApiError extends Error {
    constructor(status, message, details = undefined) {
        super(message);
        this.status = status;
        this.details = details;
    }
}

export const apiRequest = async (path, {
    token,
    method = "GET",
    body,
    headers = {}
} = {}) => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...headers
        },
        body: body ? JSON.stringify(body) : undefined
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new ApiError(response.status, payload.error || "API request failed", payload.details);
    }

    return payload;
};

export const createAuthNonce = (walletAddress) => apiRequest("/auth/nonce", {
    method: "POST",
    body: { walletAddress }
});

export const verifySiwe = ({ message, signature }) => apiRequest("/auth/verify-siwe", {
    method: "POST",
    body: { message, signature }
});

export const fetchListings = (search = "") => apiRequest(`/listings${search ? `?search=${encodeURIComponent(search)}` : ""}`);
