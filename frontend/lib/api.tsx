const API_URL = process.env.API_URL || "";

export const useApi = () => {

    if (API_URL === "")
        throw new Error(`Please set a API_URL in your .env file: API_URL=http://LOCALIP:8000/. 
            If you're having issues, make sure to run the server with uvicorn main:app --host 0.0.0.0 --port 8000,
            make sure your phone and server device are on the same wifi, and make sure your using your WIRELESS LAN Ipv4`)

    const makeRequest = async (endpoint: string, options = {}, apiURL: string = API_URL) => {

        try {

            const response = await fetch(`${apiURL}${endpoint}`, {
                ...options
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.detail || "An error occurred.");
            }

            return response.json();

        }
        catch (error: unknown) {

            console.error(`An error occurred when requesting ${apiURL}${endpoint}.`)
            if (error instanceof Error) {
                console.error(error.message || "An error occurred.");
                return { "error": error.message || "An error occurred." }
            }
            else if (typeof error == "string") {
                console.error(error);
                return { "error": error }
            }
            else {
                console.error("An unkown error occurred.");
                return { "error": "An unkown error occurred." }
            }


        }

    }

    return { makeRequest };

}