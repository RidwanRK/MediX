"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/admin/header";
import Footer from "@/components/footer";

// Types for API data
type Specialization = {
  id: number;
  name: string;
};

type Qualification = {
  id: number;
  name: string;
};

export default function AddUserPage() {
  const router = useRouter();
  // State for basic user information
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [address, setAddress] = useState("");
  const [role, setRole] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  // Doctor specific fields
  const [experience, setExperience] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseDigits, setLicenseDigits] = useState(""); // For the numeric part only
  const [availableDays, setAvailableDays] = useState<string[]>([]);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  // State for specializations and qualifications from API
  const [selectedSpecializationIds, setSelectedSpecializationIds] = useState<
    number[]
  >([]);
  const [selectedQualificationIds, setSelectedQualificationIds] = useState<
    number[]
  >([]);

  // API data states
  const [allSpecializations, setAllSpecializations] = useState<
    Specialization[]
  >([]);
  const [allQualifications, setAllQualifications] = useState<Qualification[]>(
    []
  );
  const [specializationsLoading, setSpecializationsLoading] = useState(false);
  const [qualificationsLoading, setQualificationsLoading] = useState(false);

  // State for adding new specializations/qualifications
  const [showNewSpecInput, setShowNewSpecInput] = useState(false);
  const [newSpecName, setNewSpecName] = useState("");
  const [addingSpecialization, setAddingSpecialization] = useState(false);
  const [showNewQualInput, setShowNewQualInput] = useState(false);
  const [newQualName, setNewQualName] = useState("");
  const [addingQualification, setAddingQualification] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");

  // Helper function to convert 12-hour format to 24-hour format for input
  const convertTo24Hour = (time12h: string): string => {
    const [time, modifier] = time12h.trim().split(" ");
    let [hours, minutes] = time.split(":");

    if (hours === "12") {
      hours = "00";
    }
    if (modifier?.toUpperCase() === "PM") {
      hours = (parseInt(hours, 10) + 12).toString();
    }

    return `${hours.padStart(2, "0")}:${minutes || "00"}`;
  };

  // Helper function to convert 24-hour format to 12-hour format for display
  const convertTo12Hour = (time24h: string): string => {
    const [hours, minutes] = time24h.split(":");
    const hour12 = parseInt(hours, 10) % 12 || 12;
    const ampm = parseInt(hours, 10) >= 12 ? "PM" : "AM";
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Handle BMDC registration number input (A-XXXXXX format)
  const handleLicenseDigitsChange = (value: string) => {
    // Remove any non-digit characters
    const digitsOnly = value.replace(/\D/g, "");

    // Limit to 6 digits maximum
    const limitedDigits = digitsOnly.slice(0, 6);

    setLicenseDigits(limitedDigits);

    // Update the full license number with A- prefix
    if (limitedDigits.length >= 5) {
      setLicenseNumber(`A-${limitedDigits}`);
    } else {
      setLicenseNumber("");
    }
  };

  // Fetch specializations and qualifications when role is Doctor
  useEffect(() => {
    if (role === "Doctor") {
      fetchSpecializations();
      fetchQualifications();
    }
  }, [role]);

  const fetchSpecializations = async () => {
    setSpecializationsLoading(true);
    try {
      const response = await fetch("http://localhost:8080/api/specializations");
      if (!response.ok) throw new Error(`Status ${response.status}`);
      const data = await response.json();
      setAllSpecializations(data);
    } catch (err: any) {
      setMessage(`Failed to fetch specializations: ${err.message}`);
      setMessageType("error");
    } finally {
      setSpecializationsLoading(false);
    }
  };

  const fetchQualifications = async () => {
    setQualificationsLoading(true);
    try {
      const response = await fetch("http://localhost:8080/api/qualifications");
      if (!response.ok) throw new Error(`Status ${response.status}`);
      const data = await response.json();
      setAllQualifications(data);
    } catch (err: any) {
      setMessage(`Failed to fetch qualifications: ${err.message}`);
      setMessageType("error");
    } finally {
      setQualificationsLoading(false);
    }
  };

  const handleSpecializationToggle = (specId: number) => {
    setSelectedSpecializationIds((prev) =>
      prev.includes(specId)
        ? prev.filter((id) => id !== specId)
        : [...prev, specId]
    );
  };

  const handleQualificationToggle = (qualId: number) => {
    setSelectedQualificationIds((prev) =>
      prev.includes(qualId)
        ? prev.filter((id) => id !== qualId)
        : [...prev, qualId]
    );
  };

  const createNewSpecialization = async () => {
    if (!newSpecName.trim()) {
      setMessage("Specialization name is required");
      setMessageType("error");
      return;
    }

    setAddingSpecialization(true);
    try {
      const response = await fetch(
        "http://localhost:8080/api/specializations",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: newSpecName.trim() }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Status ${response.status}`);
      }

      const newSpec = await response.json();

      // Add to the list of all specializations
      setAllSpecializations((prev) => [...prev, newSpec]);

      // Auto-select the newly created specialization
      setSelectedSpecializationIds((prev) => [...prev, newSpec.id]);

      // Reset the form
      setNewSpecName("");
      setShowNewSpecInput(false);

      setMessage(`Specialization "${newSpec.name}" created successfully!`);
      setMessageType("success");

      // Clear success message after 3 seconds
      setTimeout(() => {
        setMessage("");
        setMessageType("");
      }, 3000);
    } catch (err: any) {
      setMessage(`Failed to create specialization: ${err.message}`);
      setMessageType("error");
    } finally {
      setAddingSpecialization(false);
    }
  };

  const createNewQualification = async () => {
    if (!newQualName.trim()) {
      setMessage("Qualification name is required");
      setMessageType("error");
      return;
    }

    setAddingQualification(true);
    try {
      const response = await fetch("http://localhost:8080/api/qualifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newQualName.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Status ${response.status}`);
      }

      const newQual = await response.json();

      // Add to the list of all qualifications
      setAllQualifications((prev) => [...prev, newQual]);

      // Auto-select the newly created qualification
      setSelectedQualificationIds((prev) => [...prev, newQual.id]);

      // Reset the form
      setNewQualName("");
      setShowNewQualInput(false);

      setMessage(`Qualification "${newQual.name}" created successfully!`);
      setMessageType("success");

      // Clear success message after 3 seconds
      setTimeout(() => {
        setMessage("");
        setMessageType("");
      }, 3000);
    } catch (err: any) {
      setMessage(`Failed to create qualification: ${err.message}`);
      setMessageType("error");
    } finally {
      setAddingQualification(false);
    }
  };

  const createDoctor = async () => {
  const userData = {
    user: {
      name,
      email,
      phoneNumber: phone,
      password,
      address,
    },
    doctor: {
      // Dynamically generate doctorId as the next available integer
      doctorId: Date.now(),
      yearsOfExperience: experience,
      availableDays: availableDays.join(","),
      availableTimes: `${startTime}-${endTime}`,
      licenseNumber: licenseNumber,
    },
    qualificationIds: selectedQualificationIds,
    specializationIds: selectedSpecializationIds,
  };

  console.log("User data submitted:", userData);

  try {
    const response = await fetch("http://localhost:8080/api/doctors", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Status ${response.status}`);
    }

    const result = await response.json();
    setMessage("Doctor created successfully!");
    setMessageType("success");

    // Reset form fields after successful submission
    resetForm();
    setTimeout(() => {
      router.push("/admin");
    }, 4000);
  } catch (error) {
    const errorMsg =
      error && typeof error === "object" && "message" in error
        ? (error as { message: string }).message
        : String(error);
    setMessage("Failed to create doctor: " + errorMsg);
    setMessageType("error");
  } finally {
    setLoading(false);
  }
};

// Helper function to reset the form fields
const resetForm = () => {
  setName("");
  setEmail("");
  setPhone("");
  setPassword("");
  setAddress("");
  setRole("");
  setGender("");
  setAge("");
  setExperience("");
  setLicenseNumber("");
  setLicenseDigits("");
  setAvailableDays([]);
  setStartTime("");
  setEndTime("");
  setSelectedSpecializationIds([]);
  setSelectedQualificationIds([]);
};


  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setMessage("");
  setMessageType("");


  if (role === "Doctor") {
    await createDoctor();
  }
  // Pharmacist creation logic
  else if (role === "Pharmacist") {
    const pharmacistData = {
      name,
      email,
      phoneNumber: phone,
      password,
      address,
    };
    try {
      const response = await fetch("http://localhost:8080/api/pharmacists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(pharmacistData),
      });
      if (response.ok) {
        const result = await response.json();
        setMessage("Pharmacist created successfully!");
        setMessageType("success");
        resetForm();
        setTimeout(() => {
          router.push("/admin");
        }, 4000);
      } else {
        const errorData = await response.json();
        setMessage(
          "Failed to create pharmacist: " + (errorData.error || "Unknown error")
        );
        setMessageType("error");
      }
    } catch (error) {
      setMessage("Network error occurred while creating pharmacist");
      setMessageType("error");
    }
  }
  // Receptionist creation logic
  else if (role === "Receptionist") {
    const receptionistData = {
      name,
      email,
      phoneNumber: phone,
      password,
      address,
    };
    try {
      const response = await fetch("http://localhost:8080/api/receptionists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(receptionistData),
      });
      if (response.ok) {
        const result = await response.json();
        setMessage("Receptionist created successfully!");
        setMessageType("success");
        resetForm();
        setTimeout(() => {
          router.push("/admin");
        }, 4000);
      } else {
        const errorData = await response.json();
        setMessage(
          "Failed to create receptionist: " + (errorData.error || "Unknown error")
        );
        setMessageType("error");
      }
    } catch (error) {
      setMessage("Network error occurred while creating receptionist");
      setMessageType("error");
    }
  } else {
    setMessage("User role '" + role + "' creation not implemented yet");
    setMessageType("error");
  }

  setLoading(false);
};


  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-grow p-8">
        <div className="max-w-5xl mx-auto bg-white shadow-xl rounded-xl p-10">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
              <div className="flex flex-col space-y-4 w-full items-center justify-center">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm text-gray-700 font-semibold"
                  >
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-[32rem] max-w-full mx-auto p-4 mt-2 rounded-xl border border-gray-300 shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 text-black placeholder-black"
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm text-gray-700 font-semibold"
                  >
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-[32rem] max-w-full mx-auto p-4 mt-2 rounded-xl border border-gray-300 shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 text-black placeholder-black"
                  />
                </div>
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm text-gray-700 font-semibold"
                  >
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="w-[32rem] max-w-full mx-auto p-4 mt-2 rounded-xl border border-gray-300 shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 text-black placeholder-black"
                  />
                </div>
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm text-gray-700 font-semibold"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-[32rem] max-w-full mx-auto p-4 mt-2 rounded-xl border border-gray-300 shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 text-black placeholder-black"
                  />
                </div>
                <div>
                  <label
                    htmlFor="address"
                    className="block text-sm text-gray-700 font-semibold"
                  >
                    Address
                  </label>
                  <textarea
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    className="w-[32rem] max-w-full mx-auto p-4 mt-2 rounded-xl border border-gray-300 shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 text-black placeholder-black"
                    rows={3}
                    placeholder="Street, City, State, ZIP"
                  />
                </div>
                <div>
                  <label
                    htmlFor="role"
                    className="block text-sm text-gray-700 font-semibold"
                  >
                    Role
                  </label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    required
                    className="w-[32rem] max-w-full mx-auto p-4 mt-2 rounded-xl border border-gray-300 shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 text-black"
                  >
                    <option value="">Select Role</option>
                    <option value="Doctor">Doctor</option>
                    <option value="Pharmacist">Pharmacist</option>
                    <option value="Receptionist">Receptionist</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="gender"
                    className="block text-sm text-gray-700 font-semibold"
                  >
                    Gender
                  </label>
                  <select
                    id="gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    required
                    className="w-[32rem] max-w-full mx-auto p-4 mt-2 rounded-xl border border-gray-300 shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 text-black"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="age"
                    className="block text-sm text-gray-700 font-semibold"
                  >
                    Age
                  </label>
                  <input
                    id="age"
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    min="20"
                    max="89"
                    required
                    className="w-[32rem] max-w-full mx-auto p-4 mt-2 rounded-xl border border-gray-300 shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 text-black placeholder-gray-500"
                  />
                  {age && (parseInt(age) < 20 || parseInt(age) > 89) && (
                    <p className="text-red-500 text-sm mt-1 text-center">
                      Age must be between 20 and 89 years
                    </p>
                  )}
                </div>
              </div>
            </div>
            {role === "Doctor" && (
              <div className="bg-gray-50 p-6 rounded-xl shadow-md space-y-4 mt-6">
                <h2 className="text-lg text-gray-700 font-semibold mb-4">
                  Doctor Specific Information
                </h2>
                <div>
                  <label
                    htmlFor="experience"
                    className="block text-sm text-gray-700 font-semibold"
                  >
                    Years of Experience
                  </label>
                  <input
                    id="experience"
                    type="number"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    className="w-[32rem] max-w-full mx-auto p-4 mt-2 rounded-xl border border-gray-300 shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 text-black placeholder-black"
                  />
                </div>
                <div>
                  <label
                    htmlFor="licenseNumber"
                    className="block text-sm text-gray-700 font-semibold"
                  >
                    BMDC Registration Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-gray-500 font-medium mt-1.5 ml-2">
                        A-
                      </span>
                    </div>
                    <input
                      id="licenseNumber"
                      type="text"
                      value={licenseDigits}
                      onChange={(e) =>
                        handleLicenseDigitsChange(e.target.value)
                      }
                      placeholder="123456"
                      className="w-[32rem] max-w-full mx-auto p-4 pl-12 mt-2 rounded-xl border border-gray-300 shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 text-black placeholder-gray-400"
                      maxLength={6}
                    />
                  </div>
                  {licenseDigits.length > 0 && licenseDigits.length < 5 && (
                    <p className="text-red-500 text-sm mt-1 text-center">
                      Registration number must be 5-6 digits
                    </p>
                  )}
                  {licenseDigits.length >= 5 && (
                    <p className="text-green-600 text-sm mt-1 text-center">
                      Format: A-{licenseDigits}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-gray-700 font-semibold mb-2">
                    Available Days
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Monday",
                      "Tuesday",
                      "Wednesday",
                      "Thursday",
                      "Friday",
                      "Saturday",
                      "Sunday",
                    ].map((day) => {
                      const selected = availableDays.includes(day);
                      return (
                        <button
                          type="button"
                          key={day}
                          onClick={() =>
                            setAvailableDays((prev) =>
                              prev.includes(day)
                                ? prev.filter((d) => d !== day)
                                : [...prev, day]
                            )
                          }
                          className={`px-4 py-2 rounded-lg font-semibold border transition-colors duration-150 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 ${
                            selected
                              ? "bg-green-600 text-white border-green-700"
                              : "bg-white text-green-700 border-green-400 hover:bg-green-50"
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 font-semibold mb-4">
                    Available Times <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm text-black mb-2">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full px-4 py-3 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-2">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full px-4 py-3 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Time Preview */}
                  {startTime && endTime && (
                    <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      <span className="text-sm text-green-700 font-medium">
                        Preview: {convertTo12Hour(startTime)} -{" "}
                        {convertTo12Hour(endTime)}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-gray-700 font-semibold mb-2">
                    Specializations
                  </label>
                  {specializationsLoading ? (
                    <div className="text-center py-4 text-gray-500">
                      Loading specializations...
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {allSpecializations.map((spec) => (
                        <button
                          key={spec.id}
                          type="button"
                          onClick={() => handleSpecializationToggle(spec.id)}
                          className={`px-4 py-3 rounded-lg border-2 transition duration-200 font-medium text-left ${
                            selectedSpecializationIds.includes(spec.id)
                              ? "bg-blue-600 border-blue-600 text-white shadow-md"
                              : "bg-white border-gray-300 text-gray-700 hover:border-blue-300 hover:bg-blue-50"
                          }`}
                        >
                          {spec.name}
                        </button>
                      ))}

                      {/* Add New Specialization Button */}
                      {!showNewSpecInput ? (
                        <button
                          type="button"
                          onClick={() => setShowNewSpecInput(true)}
                          className="px-4 py-3 rounded-lg border-2 border-dashed border-blue-300 text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition duration-200 font-medium flex items-center justify-center"
                        >
                          <span className="text-2xl mr-2">+</span>
                          Add New
                        </button>
                      ) : (
                        <div className="px-4 py-3 rounded-lg border-2 border-blue-300 bg-blue-50">
                          <div className="flex flex-col gap-2">
                            <input
                              type="text"
                              value={newSpecName}
                              onChange={(e) => setNewSpecName(e.target.value)}
                              placeholder="Enter specialization name"
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                              onKeyPress={(e) => {
                                if (e.key === "Enter") {
                                  createNewSpecialization();
                                }
                              }}
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={createNewSpecialization}
                                disabled={
                                  addingSpecialization || !newSpecName.trim()
                                }
                                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                              >
                                {addingSpecialization ? "Adding..." : "Add"}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowNewSpecInput(false);
                                  setNewSpecName("");
                                }}
                                className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Selected Specializations Preview */}
                  {selectedSpecializationIds.length > 0 && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <span className="text-sm text-blue-700 font-medium">
                        Selected:{" "}
                        {allSpecializations
                          .filter((s) =>
                            selectedSpecializationIds.includes(s.id)
                          )
                          .map((s) => s.name)
                          .join(", ")}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-gray-700 font-semibold mb-2">
                    Qualifications
                  </label>
                  {qualificationsLoading ? (
                    <div className="text-center py-4 text-gray-500">
                      Loading qualifications...
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {allQualifications.map((qual) => (
                        <button
                          key={qual.id}
                          type="button"
                          onClick={() => handleQualificationToggle(qual.id)}
                          className={`px-4 py-3 rounded-lg border-2 transition duration-200 font-medium text-left ${
                            selectedQualificationIds.includes(qual.id)
                              ? "bg-purple-600 border-purple-600 text-white shadow-md"
                              : "bg-white border-gray-300 text-gray-700 hover:border-purple-300 hover:bg-purple-50"
                          }`}
                        >
                          {qual.name}
                        </button>
                      ))}

                      {/* Add New Qualification Button */}
                      {!showNewQualInput ? (
                        <button
                          type="button"
                          onClick={() => setShowNewQualInput(true)}
                          className="px-4 py-3 rounded-lg border-2 border-dashed border-purple-300 text-purple-600 hover:border-purple-400 hover:bg-purple-50 transition duration-200 font-medium flex items-center justify-center"
                        >
                          <span className="text-2xl mr-2">+</span>
                          Add New
                        </button>
                      ) : (
                        <div className="px-4 py-3 rounded-lg border-2 border-purple-300 bg-purple-50">
                          <div className="flex flex-col gap-2">
                            <input
                              type="text"
                              value={newQualName}
                              onChange={(e) => setNewQualName(e.target.value)}
                              placeholder="Enter qualification name"
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                              onKeyPress={(e) => {
                                if (e.key === "Enter") {
                                  createNewQualification();
                                }
                              }}
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={createNewQualification}
                                disabled={
                                  addingQualification || !newQualName.trim()
                                }
                                className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                              >
                                {addingQualification ? "Adding..." : "Add"}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowNewQualInput(false);
                                  setNewQualName("");
                                }}
                                className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Selected Qualifications Preview */}
                  {selectedQualificationIds.length > 0 && (
                    <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <span className="text-sm text-purple-700 font-medium">
                        Selected:{" "}
                        {allQualifications
                          .filter((q) =>
                            selectedQualificationIds.includes(q.id)
                          )
                          .map((q) => q.name)
                          .join(", ")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={loading}
                className={`px-8 py-4 rounded-xl shadow-md transition duration-200 ${
                  loading
                    ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                    : "bg-green-800 text-white hover:bg-green-700"
                }`}
              >
                {loading ? "Creating User..." : "Add User"}
              </button>
            </div>
          </form>
          {message && (
            <div className="mt-6">
              <div
                className={`p-6 rounded-xl text-center font-semibold text-lg shadow-lg border-2 ${
                  messageType === "success"
                    ? "bg-gradient-to-r from-green-50 to-green-100 text-green-800 border-green-300 shadow-green-200"
                    : "bg-gradient-to-r from-red-50 to-red-100 text-red-800 border-red-300 shadow-red-200"
                }`}
              >
                <div className="flex items-center justify-center space-x-3">
                  {messageType === "success" ? (
                    <svg
                      className="w-8 h-8 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      ></path>
                    </svg>
                  ) : (
                    <svg
                      className="w-8 h-8 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M6 18L18 6M6 6l12 12"
                      ></path>
                    </svg>
                  )}
                  <span>{message}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
