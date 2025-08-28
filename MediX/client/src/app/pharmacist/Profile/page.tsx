"use client";
import Header from "@/components/pharmacist/header";
import Footer from "@/components/footer";
import React, { useEffect, useState } from "react";

interface PharmacistProfile {
  name: string;
  gender: string;
  age: number;
  id: string;
  role: string;
  degree: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
}


export default function ProfilePage() {
  const [pharmacistProfile, setPharmacistProfile] = useState<PharmacistProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState<PharmacistProfile | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);

  useEffect(() => {
    const pharmacistId = typeof window !== 'undefined' ? localStorage.getItem('pharmacistId') : null;
    if (!pharmacistId) {
      setError('Pharmacist ID not found. Please login again.');
      setLoading(false);
      return;
    }
    fetch(`http://localhost:8080/api/pharmacists/${pharmacistId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to fetch pharmacist profile');
        const data = await res.json();
        setPharmacistProfile(data);
        setLoading(false);
      })
      .catch((err) => {
        setError('Could not load profile.');
        setLoading(false);
      });
  }, []);

  const handleEditOpen = () => {
    setEditData(pharmacistProfile);
    setEditOpen(true);
    setEditError(null);
    setEditSuccess(null);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!editData) return;
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editData) return;
    setEditLoading(true);
    setEditError(null);
    setEditSuccess(null);
    try {
      const res = await fetch(`http://localhost:8080/api/pharmacists/${editData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      const updated = await res.json();
      setPharmacistProfile(updated);
      setEditSuccess("Profile updated successfully!");
      setEditOpen(false);
    } catch (err) {
      setEditError("Could not update profile.");
    } finally {
      setEditLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-lg text-gray-600">Loading profile...</span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-lg text-red-600">{error}</span>
      </div>
    );
  }
  if (!pharmacistProfile) return null;

  return (
    <div className="min-h-screen flex flex-col ">
      <Header />
      <main className="flex-grow p-10">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-green-800 mb-2">
              Pharmacist Profile
            </h1>
            <p className="text-gray-600">Manage your profile information</p>
          </div>

          {/* Profile Card */}
          <div className="bg-gray-800 rounded-3xl shadow-2xl overflow-hidden">
            {/* Profile Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 p-8 text-white text-center">
              <div className="w-32 h-32 bg-white rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
                <span className="text-6xl text-green-600">👤</span>
              </div>
              <h2 className="text-3xl font-bold">{pharmacistProfile.name}</h2>
              <p className="text-green-100 text-lg">{pharmacistProfile.role}</p>
            </div>

            {/* Profile Content */}
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                  <div className="bg-green-50 rounded-xl p-6 border-l-4 border-green-500">
                    <h3 className="text-xl font-medium text-green-600 uppercase tracking-wide mb-2 text-center font-bold">
                      Personal Information
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Name:</span>
                        <span className="text-gray-900 font-semibold">
                          {pharmacistProfile.name}
                        </span>
                      </div>
                      {/* Gender and Age removed as requested */}
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Email:</span>
                        <span className="text-gray-900 font-semibold">
                          {pharmacistProfile.email || '-'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Phone:</span>
                        <span className="text-gray-900 font-semibold">
                          {pharmacistProfile.phoneNumber || '-'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Address:</span>
                        <span className="text-gray-900 font-semibold">
                          {pharmacistProfile.address || '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  <div className="bg-blue-50 rounded-xl p-6 border-l-4 border-blue-500">
                    <h3 className="text-xl font-medium text-blue-600 uppercase tracking-wide mb-2 text-center">
                      Work Information
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Employee ID:</span>
                        <span className="text-gray-900 font-semibold">
                          {pharmacistProfile.id}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Role:</span>
                        <span className="text-gray-900 font-semibold">
                          Pharmacist
                        </span>
                      </div>
                      {/* Degree removed as requested */}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center gap-4 mt-8 pt-6 border-t border-gray-200">
                <button
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-semibold transition duration-200 shadow-lg hover:shadow-xl"
                  onClick={handleEditOpen}
                  type="button"
                >
                  Edit Profile
                </button>
                <button className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-8 py-3 rounded-xl font-semibold transition duration-200 shadow-lg hover:shadow-xl">
                  Change Password
                </button>
              </div>

              {/* Edit Profile Modal */}
              {editOpen && editData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
                  <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 relative animate-fadeIn">
                    <button
                      className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold"
                      onClick={() => setEditOpen(false)}
                      aria-label="Close"
                    >
                      &times;
                    </button>
                    <h2 className="text-2xl font-bold text-green-700 mb-6 text-center">Edit Profile</h2>
                    {editError && <div className="mb-4 text-red-600 text-center">{editError}</div>}
                    <form onSubmit={handleEditSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-gray-700 font-medium mb-1">Name</label>
                          <input
                            type="text"
                            name="name"
                            value={editData.name}
                            onChange={handleEditChange}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 font-medium mb-1">Email</label>
                          <input
                            type="email"
                            name="email"
                            value={editData.email || ''}
                            onChange={handleEditChange}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 font-medium mb-1">Phone</label>
                          <input
                            type="text"
                            name="phoneNumber"
                            value={editData.phoneNumber || ''}
                            onChange={handleEditChange}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-gray-700 font-medium mb-1">Address</label>
                          <input
                            type="text"
                            name="address"
                            value={editData.address || ''}
                            onChange={handleEditChange}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none"
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="w-full mt-4 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-200"
                        disabled={editLoading}
                      >
                        {editLoading ? "Saving..." : "Save Changes"}
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
