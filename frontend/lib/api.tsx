const API_URL = process.env.API_URL || "";

export const useApi = () => {

    if (API_URL === "")
        throw new Error("Please set a API_URL in your .env file. For local testing, you must forward the port 8000 and copy the forwarded address.")

    const makeRequest = async (endpoint: string, options = {}, apiURL: string = API_URL) => {

        const response = await fetch(`${apiURL}${endpoint}`, {
            ...options
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.detail || "An error occured.");
        }

        return response.json();
    }

    return { makeRequest };

}