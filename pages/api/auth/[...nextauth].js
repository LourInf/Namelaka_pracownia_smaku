// api/auth/[...nextauth].js

import NextAuth, { getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb";
import { Admin } from "@/models/Admin";

async function isAdminEmail(email) {
  return !!(await Admin.findOne({ email }));
}

export const authOptions = {
  providers: [
    // OAuth authentication providers...
    GoogleProvider({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    }),
  ],
  adapter: MongoDBAdapter(clientPromise),
  callbacks: {
    session: async ({ session, token, user }) => {
      if (await isAdminEmail(session?.user?.email)) {
        return session;
      } else {
        return false;
      }
    },
  },
};

export default NextAuth(authOptions);

export async function isAdminRequest(req, res) {
  //we will use it as part of authentication in our api pages.If email won't match it will throw an error
  const session = await getServerSession(req, res, authOptions);
  //console.log(session);
  if (!(await isAdminEmail(session?.user?.email))) {
    res.status(401).json({ error: "Not authorized or not an admin" });
    return; // Using return; right after setting a 401 status halts further code execution in this function, preventing unauthorized access to restricted parts of the API.
  }
}
