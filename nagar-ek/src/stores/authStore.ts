import * as SecureStore from "expo-secure-store";
import { ToastAndroid } from "react-native";
import { create } from "zustand";
import * as Location from "expo-location";

export interface AuthStoreInterface {
    isInitialized: boolean;
    isLoggedIn: boolean;
    userId: string | null;
    token: string | null;
    user: {
        name: string;
        email: string;
        phone: string;
        points: number;
    } | null;
    login: (email: string, password: string, router: any) => Promise<any>;
    register: (name: string, email: string, phone: string, password: string, router: any) => Promise<boolean>;
    logout: (router: any) => boolean;
    updateUserLocation: (lat: number, lng: number) => Promise<boolean>;
    fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthStoreInterface>((set, get) => ({
    isInitialized: false,
    isLoggedIn: false,
    userId: null,
    token: null,
    user: null,
    login: async (email: string, password: string, router: any) => {
        if (!email || !password) {
            alert('Please fill all the fields!');
            return false;
        }
        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ identifier: email, password }),
        });
        if (response.ok || response.status === 200) {
            const data = await response.json();
            ToastAndroid.show('Login successful!', ToastAndroid.SHORT);

            const userId = data.user?.id?.toString() ?? null;
            const token = data.token ?? null;
            set({ 
                isLoggedIn: true, 
                userId, 
                token,
                user: {
                    name: data.user?.name || '',
                    email: data.user?.email || '',
                    phone: data.user?.phone || '',
                    points: data.user?.points || 0
                }
            });

            try {
                if (userId) {
                    await SecureStore.setItemAsync('userId', userId);
                }
                if (token) {
                    await SecureStore.setItemAsync('token', token);
                }
            } catch (error) {
                console.warn('Failed to persist credentials', error);
            }

            // Fetch and update location after successful login
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status === 'granted') {
                    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                    await get().updateUserLocation(loc.coords.latitude, loc.coords.longitude);
                }
            } catch (err) {
                console.warn('Failed to update location on login:', err);
            }

            // Navigate to home page or dashboard
            router.replace('/tabs');
            return data;
        } else {
            const errorData = await response.json();
            alert(`Login failed: ${errorData.message}`);
            return false;
        }
    },
    register: async (name: string, email: string, phone: string, password: string, router: any) => {
        if (!name || !email || !phone || !password) {
            alert('Please fill all the fields!');
            return false;
        }
        if (password.length < 6) {
            alert('Password should be at least 6 characters long!');
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert('Please enter a valid email address!');
            return false;
        }
        const phoneRegex = /^\d{10}$/;
        if (!phoneRegex.test(phone)) {
            alert('Please enter a valid phone number!');
            return false;
        }

        let userLocation = null;
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                userLocation = {
                    type: "Point",
                    coordinates: [loc.coords.longitude, loc.coords.latitude] // [longitude, latitude]
                };
            }
        } catch (e) {
            console.warn('Could not retrieve user location for signup', e);
        }

        try {
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, phone, password, location: userLocation }),
            });
            ToastAndroid.show('Processing Signup...', ToastAndroid.SHORT);

            if (response.ok || response.status === 200) {
                alert('Signup successful! Please log in.');
                // Navigate to login page or home page
                router.replace('/');
                return true;
            } else {
                const errorData = await response.json();
                alert(`Signup failed: ${errorData.message}`);
                return false;
            }
        } catch (error) {
            alert(`Signup failed: ${error}`);
            return false;
        }
    },
    logout: (router: any) => {
        set({ isLoggedIn: false, userId: null, token: null, user: null });
        void SecureStore.deleteItemAsync('userId').catch((error) => {
            console.warn('Failed to clear userId', error);
        });
        void SecureStore.deleteItemAsync('token').catch((error) => {
            console.warn('Failed to clear token', error);
        });
        void SecureStore.deleteItemAsync('isLoggedIn').catch((error) => {
            console.warn('Failed to clear isLoggedIn', error);
        });
        void SecureStore.deleteItemAsync('isloggedin').catch((error) => {
            console.warn('Failed to clear isloggedin', error);
        });
        ToastAndroid.show('Logged out successfully!', ToastAndroid.SHORT);
        router.replace('/');
        return true;
    },
    updateUserLocation: async (lat: number, lng: number) => {
        const token = get().token || await SecureStore.getItemAsync('token');
        if (!token) return false;

        try {
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/auth/location`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    location: {
                        type: "Point",
                        coordinates: [lng, lat] // [longitude, latitude]
                    }
                })
            });
            return response.ok;
        } catch (err) {
            console.warn('Could not update location in db:', err);
            return false;
        }
    },
    fetchMe: async () => {
        const token = get().token || await SecureStore.getItemAsync('token');
        if (!token) return;

        try {
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/auth/me`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                set({
                    user: {
                        name: data.name || '',
                        email: data.email || '',
                        phone: data.phone || '',
                        points: data.points || 0
                    }
                });
            }
        } catch (err) {
            console.warn('Failed to fetch user profile details:', err);
        }
    }
}));

void (async () => {
    try {
        const storedUserId = await SecureStore.getItemAsync('userId');
        const storedToken = await SecureStore.getItemAsync('token');
        if (storedUserId) {
            useAuthStore.setState({ isInitialized: true, isLoggedIn: true, userId: storedUserId, token: storedToken });
        } else {
            useAuthStore.setState({ isInitialized: true });
        }
    } catch (error) {
        console.warn('Failed to restore auth state', error);
        useAuthStore.setState({ isInitialized: true });
    }
})();