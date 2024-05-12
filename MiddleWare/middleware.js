import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";
import dotenv from "dotenv";
dotenv.config();
const { CLERK_SECRET_KEY, CLERK_PUBLISHABLE_KEY } = process.env;
export const requireAuth = ClerkExpressRequireAuth({
  authorizedParties: [
    "https://snapgramapp.vercel.app",
    "http://localhost:3000",
  ],
  secretKey: CLERK_SECRET_KEY,
  publishableKeyType: CLERK_PUBLISHABLE_KEY,
  onError: (error) => {
    console.log(error);
  },
});
