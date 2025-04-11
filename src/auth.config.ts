import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";
import { Octokit } from "octokit";

export const authConfig: NextAuthConfig = {
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
      authorization: {
        params: {
          scope: 'read:org user:email',
        },
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async signIn({ user, account }) {
      // Only proceed with GitHub accounts
      if (account?.provider !== 'github') {
        return false;
      }
      
      try {
        // Check if user is part of Leonardo-Interactive org in api team
        const octokit = new Octokit({
          auth: account.access_token,
        });

        // ensure they're in the Leonardo-Interactive org
        const emails = await octokit.rest.users.listEmailsForAuthenticatedUser();
        return emails.data.some((email) => email.verified && email.email.endsWith('@leonardo.ai'));
      } catch (error) {
        console.error('Error checking organization membership:', error);
        return false;
      }
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/");
      const isOnAuthPage = nextUrl.pathname.startsWith("/auth/signin");
      
      if (isOnAuthPage) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/", nextUrl));
        }
        return true;
      }
      
      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      } else if (nextUrl.pathname.startsWith("/api")) {
        // Protect API routes as well
        if (isLoggedIn) return true;
        return Response.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }
      return true;
    },
  },
}; 