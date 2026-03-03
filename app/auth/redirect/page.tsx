"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface SessionData {
  userId: string;
  role: string;
}

export default function AuthRedirectPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSessionAndRedirect() {
      try {
        const response = await fetch("/api/auth/session");

        if (!response.ok) {
          router.push("/login");
          return;
        }

        const data: SessionData = await response.json();

        // Redirect based on role
        if (data.role === "doctor") {
          router.push("/doctor/dashboard");
        } else if (data.role === "frontdesk") {
          router.push("/frontdesk/dashboard");
        } else {
          setError("Unknown role. Please contact support.");
        }
      } catch (err) {
        console.error("Session fetch error:", err);
        router.push("/login");
      }
    }

    fetchSessionAndRedirect();
  }, [router]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => router.push("/login")}
            className="mt-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p>Redirecting...</p>
    </div>
  );
}
