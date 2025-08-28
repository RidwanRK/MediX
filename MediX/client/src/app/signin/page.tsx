"use client";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useDarkMode } from "@/contexts/DarkModeContext";

export default function SignIn() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [clicked, setClicked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { darkMode, toggleDarkMode } = useDarkMode();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Trigger button press animation
    setClicked(true);
    setTimeout(() => setClicked(false), 150); // Reset animation

    try {
      if (!email.trim() || !password.trim()) {
        setError("Email and password cannot be empty.");
        return;
      } else if (
        email.trim() === "admin@admin.com" &&
        password.trim() === "admin"
      ) {
        router.push("/admin");
        return;
      }

      const resDoctors = await fetch("http://localhost:8080/api/doctors");
      let doctor = null;
      if (resDoctors.ok) {
        const doctors = await resDoctors.json();
        doctor = doctors.find(
          (d: any) =>
            d.user.email === email.trim() && d.user.password === password.trim()
        );
      }
      if (doctor) {
        router.push(`/doctor?email=${encodeURIComponent(email)}`);
        return;
      }


      // Pharmacist login (check before receptionist)
      const resPharmacist = await fetch(
        "http://localhost:8080/api/pharmacists/by-email",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            password: password.trim(),
          }),
        }
      );
      if (resPharmacist.ok) {
        const pharmacistResponse = await resPharmacist.json();
        if (pharmacistResponse.success) {
          // Store pharmacist data in localStorage
          const pharmacistData = pharmacistResponse.data;
          localStorage.setItem("pharmacistId", pharmacistData.id.toString());
          localStorage.setItem("pharmacistName", pharmacistData.name);
          localStorage.setItem("pharmacistEmail", pharmacistData.email);
          localStorage.setItem("pharmacistPhoneNumber", pharmacistData.phoneNumber);
          localStorage.setItem("pharmacistPassword", pharmacistData.password);
          localStorage.setItem("pharmacistAddress", pharmacistData.address);
          localStorage.setItem("pharmacistData", JSON.stringify(pharmacistData));
          router.push(`/pharmacist?email=${encodeURIComponent(email)}`);
          return;
        }
      }

      // Receptionist login
      const resReception = await fetch(
        "http://localhost:8080/api/receptionists/by-email",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            password: password.trim(),
          }),
        }
      );
      if (resReception.ok) {
        const receptionistResponse = await resReception.json();
        if (receptionistResponse.success) {
          // Store receptionist data in localStorage
          const receptionistData = receptionistResponse.data;
          localStorage.setItem(
            "receptionistId",
            receptionistData.id.toString()
          );
          localStorage.setItem("receptionistName", receptionistData.name);
          localStorage.setItem("receptionistEmail", receptionistData.email);
          localStorage.setItem(
            "receptionistPhoneNumber",
            receptionistData.phoneNumber
          );
          localStorage.setItem(
            "receptionistPassword",
            receptionistData.password
          );
          localStorage.setItem("receptionistAddress", receptionistData.address);

          // Optionally, store the entire data object as JSON
          localStorage.setItem(
            "receptionistData",
            JSON.stringify(receptionistData)
          );

          router.push(`/receptionist?email=${encodeURIComponent(email)}`);
          return;
        }
      }

      setError("Invalid credentials.");
    } catch (err) {
      console.error(err);
      setError("Invalid credentials.");
    }
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center px-4 transition-colors duration-300 ${
        darkMode
          ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
          : "bg-[#e6f2ec]"
      }`}
    >
      {/* Dark Mode Toggle */}
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleDarkMode}
          className={`p-3 rounded-full transition-all duration-200 transform hover:scale-105 ${
            darkMode
              ? "bg-gray-700 hover:bg-gray-600 text-yellow-400"
              : "bg-white hover:bg-gray-100 text-gray-600 shadow-lg"
          }`}
          aria-label="Toggle dark mode"
        >
          {darkMode ? (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
          )}
        </button>
      </div>

      <div className="absolute top-4 left-4">
        <Link
          href="/"
          className={`flex items-center transition-colors duration-200 ${
            darkMode
              ? "text-green-400 hover:text-green-300"
              : "text-green-700 hover:text-green-900"
          }`}
        >
          <svg
            className="w-6 h-6 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Home
        </Link>
      </div>

      <div
        className={`w-full max-w-md rounded-3xl p-10 transition-all duration-300 ${
          darkMode
            ? "bg-gray-800 shadow-2xl border border-gray-700"
            : "bg-[#e6f2ec] shadow-[10px_10px_30px_#c2d0c8,-10px_-10px_30px_#ffffff]"
        }`}
      >
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Image
            src="/lo.png"
            alt="MediX Logo"
            width={100}
            height={80}
            className="rounded-xl"
            priority
          />
        </div>

        {/* Title */}
        <h1
          className={`text-3xl font-extrabold text-center mb-2 transition-colors duration-300 ${
            darkMode ? "text-gray-100" : "text-gray-800"
          }`}
        >
          Welcome to{" "}
          <span className={darkMode ? "text-green-400" : "text-green-700"}>
            Medi
            <span className={darkMode ? "text-gray-200" : "text-black"}>X</span>
          </span>
        </h1>
        <p
          className={`text-center mb-8 text-sm transition-colors duration-300 ${
            darkMode ? "text-gray-400" : "text-gray-600"
          }`}
        >
          Please sign in to continue
        </p>

        {/* Error Message */}
        {error && (
          <div
            className={`mb-4 p-3 border rounded-lg text-sm transition-colors duration-300 ${
              darkMode
                ? "bg-red-900/50 border-red-700 text-red-300"
                : "bg-red-100 border-red-400 text-red-700"
            }`}
          >
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div className="relative">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-4 py-3 rounded-2xl transition-all duration-200 ${
                darkMode
                  ? "bg-gray-700 text-gray-100 placeholder-gray-400 border border-gray-600 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-400/20"
                  : "bg-[#e6f2ec] text-gray-700 placeholder-gray-500 shadow-[inset_8px_8px_16px_#c2d0c8,inset_-8px_-8px_16px_#ffffff] focus:outline-none focus:shadow-[inset_6px_6px_12px_#c2d0c8,inset_-6px_-6px_12px_#ffffff]"
              }`}
              required
            />
          </div>

          {/* Password Field */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-4 py-3 pr-12 rounded-2xl transition-all duration-200 ${
                darkMode
                  ? "bg-gray-700 text-gray-100 placeholder-gray-400 border border-gray-600 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-400/20"
                  : "bg-[#e6f2ec] text-gray-700 placeholder-gray-500 shadow-[inset_8px_8px_16px_#c2d0c8,inset_-8px_-8px_16px_#ffffff] focus:outline-none focus:shadow-[inset_6px_6px_12px_#c2d0c8,inset_-6px_-6px_12px_#ffffff]"
              }`}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={`absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors duration-200 ${
                darkMode
                  ? "text-gray-400 hover:text-gray-200"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {showPassword ? "👁️" : "👁️‍🗨️"}
            </button>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className={`w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-2xl shadow-lg transition-all duration-200 transform ${
              clicked ? "scale-95" : "scale-100"
            } hover:shadow-xl`}
          >
            Sign In
          </button>
        </form>

        {/* Additional Links */}
        <div className="mt-6 text-center">
          <p
            className={`text-sm transition-colors duration-300 ${
              darkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Need an appointment?{" "}
            <Link
              href="/request-appointment"
              className={`font-semibold transition-colors duration-200 ${
                darkMode
                  ? "text-green-400 hover:text-green-300"
                  : "text-green-600 hover:text-green-800"
              }`}
            >
              Request here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
