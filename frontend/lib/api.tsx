import { config } from "./env";
import * as SecureStore from "expo-secure-store";

const API_URL = config.API_URL || "";

export const useApi = () => {
	if (API_URL === "")
		throw new Error(`Please set a API_URL in the env.tsx file: API_URL=http://LOCALIP:8000/. 
            If you're having issues, make sure to run the server with uvicorn main:app --host 0.0.0.0 --port 8000,
            make sure your phone and server device are on the same wifi, and make sure your using your WIRELESS LAN Ipv4.`);

	const makeRequest = async (
		endpoint: string,
		options = {},
		apiURL: string = API_URL
	): Promise<any> => {
		try {
			const response = await fetch(`${apiURL}${endpoint}`, {
				...options,
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => null);
				return { error: errorData?.detail || "An error occurred.", status: response.status };
			}

			const data = await response.json();
			const payload = data !== null && typeof data === "object" && !Array.isArray(data) ? data : {};
			return { ...payload, status: response.status };
			
		} catch (error: unknown) {
			console.error(`An error occurred when requesting ${apiURL}${endpoint}.`);
			if (error instanceof Error) {
				console.error(error.name || "An error occurred.");
				return { error: error.name || "An error occurred." };
			} else if (typeof error == "string") {
				console.error(error);
				return { error: error };
			} else {
				console.error("An unknown error occurred.");
				return { error: "An unknown error occurred." };
			}
		}
	};
	return { makeRequest };
};

export const useAuthApi = () => {
	if (API_URL === "")
		throw new Error(`Please set a API_URL in the env.tsx file: API_URL=http://LOCALIP:8000/. 
            If you're having issues, make sure to run the server with uvicorn main:app --host 0.0.0.0 --port 8000,
            make sure your phone and server device are on the same wifi, and make sure your using your WIRELESS LAN Ipv4.`);

	const makeRequest = async (
		endpoint: string,
		options: any = {},
		apiURL: string = API_URL
	): Promise<any> => {
		try {
			const authStore = await SecureStore.getItemAsync("auth");
			if (!authStore) {
				return { error: "No authentication token found", status: 401 };
			}

			const auth = JSON.parse(authStore);
			const headers = {
				...(options.headers || {}),
				"Authorization": `Bearer ${auth.accessToken}`,
				"Content-Type": "application/json"
			};

			const response = await fetch(`${apiURL}${endpoint}`, {
				...options,
				headers,
			});

			if (!response.ok) {
				if (response.status === 401) {
					try {
						const refreshedAuth = await refreshToken(auth, apiURL);
						if (refreshedAuth) {
							const retryHeaders = {
								...(options.headers || {}),
								"Authorization": `Bearer ${refreshedAuth.accessToken}`,
								"Content-Type": "application/json"
							};

							const retryResponse = await fetch(`${apiURL}${endpoint}`, {
								...options,
								headers: retryHeaders,
							});

							if (!retryResponse.ok) {
								const errorData = await retryResponse.json().catch(() => null);
								return { error: errorData?.detail || "An error occurred.", status: retryResponse.status };
							}

							const data = await retryResponse.json();
							const payload = data !== null && typeof data === "object" && !Array.isArray(data) ? data : {};
							return { ...payload, status: retryResponse.status };
						} else {
							return { error: "Token refresh failed", status: 401 };
						}
					} catch (refreshError) {
						return { error: "Token refresh failed", status: 401 };
					}
				}

				const errorData = await response.json().catch(() => null);
				return { error: errorData?.detail || "An error occurred.", status: response.status };
			}

			const data = await response.json();
			const payload = data !== null && typeof data === "object" && !Array.isArray(data) ? data : {};
			return { ...payload, status: response.status };
			
		} catch (error: unknown) {
			console.error(`An error occurred when requesting ${apiURL}${endpoint}.`);
			if (error instanceof Error) {
				console.error(error.name || "An error occurred.");
				return { error: error.name || "An error occurred." };
			} else if (typeof error == "string") {
				console.error(error);
				return { error: error };
			} else {
				console.error("An unknown error occurred.");
				return { error: "An unknown error occurred." };
			}
		}
	};
	return { makeRequest };
};

const refreshToken = async (auth: any, apiURL: string): Promise<any> => {
	try {
		const response = await fetch(`${apiURL}auth/refresh`, {
			method: "POST",
			headers: {
				"Authorization": `Bearer ${auth.refreshToken}`,
				"Content-Type": "application/json"
			},
		});

		if (!response.ok) {
			return null;
		}

		const data = await response.json();
		
		const updatedAuth = {
			...auth,
			accessToken: data.access_token,
			refreshToken: data.refresh_token || auth.refreshToken
		};

		await SecureStore.setItemAsync("auth", JSON.stringify(updatedAuth));
		return updatedAuth;
	} catch (error) {
		console.error("Token refresh error:", error);
		return null;
	}
};
