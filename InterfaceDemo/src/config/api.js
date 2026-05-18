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

export const fetchCurrentUser = (token) => apiRequest("/me", { token });

export const fetchCreatorListings = (token) => apiRequest("/creator/listings", { token });

export const fetchCreatorEarnings = (token) => apiRequest("/creator/earnings", { token });

export const createListing = (token, input) => apiRequest("/listings", {
    token,
    method: "POST",
    body: input
});

export const createListingUploadUrl = (token, listingId, contentType) => apiRequest(`/listings/${listingId}/upload-url`, {
    token,
    method: "POST",
    body: { contentType }
});

export const submitListingForReview = (token, listingId) => apiRequest(`/listings/${listingId}/submit-for-review`, {
    token,
    method: "POST"
});

export const uploadFileToSignedUrl = async ({ uploadUrl, file, contentType }) => {
    const response = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
            "Content-Type": contentType || file.type || "application/octet-stream"
        },
        body: file
    });

    if (!response.ok) {
        throw new ApiError(response.status, "File upload failed");
    }

    return true;
};
