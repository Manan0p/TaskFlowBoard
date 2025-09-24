import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Home() {
  const [, navigate] = useLocation();

  useEffect(() => {
    // Redirect authenticated users to dashboard
    navigate("/dashboard");
  }, [navigate]);

  return null;
}
