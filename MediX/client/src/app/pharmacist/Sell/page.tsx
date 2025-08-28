"use client";

import Header from "@/components/pharmacist/header";
import SubHeader from "@/components/pharmacist/subHeader";
import Footer from "@/components/footer";
import Invoice from "@/components/pharmacist/invoice";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SellPage() {
  const [prescriptionId, setPrescriptionId] = useState("");
  const [loading, setLoading] = useState(false);
  const [invoiceDate, setInvoiceDate] = useState<string>("");
  const [invoiceItems, setInvoiceItems] = useState<any[]>([
    {
      qty: "1",
      name: "",
      price: "0",
      discount: "0",
    },
  ]);
  const [customerName, setCustomerName] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const router = useRouter();

  const handleFetchPrescription = async () => {
    if (!prescriptionId) {
      setErrorMessage("Please enter Prescription ID first.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8080/api/prescriptions/${encodeURIComponent(
          prescriptionId
        )}`
      );
      const data = await response.json();
      if (!data.success) {
  setErrorMessage("Prescription not found.");
        setInvoiceDate("");
        setInvoiceItems([{ qty: "1", name: "", price: "0", discount: "0" }]);
        setCustomerName("");
        setPhoneNumber("");
        return;
      }
      setInvoiceDate(data.data.prescriptionDate || "");
      // Fetch unit prices for each medicine
      const medicines = data.data.medicines || [];
      const itemsWithPrices = await Promise.all(
        medicines.map(async (med: any) => {
          let price = "0";
          try {
            const res = await fetch(
              `http://localhost:8080/api/medicines/name/${encodeURIComponent(
                med.medicineName
              )}`
            );
            const medData = await res.json();
            if (medData && medData.unitPrice !== undefined) {
              price = medData.unitPrice.toString();
            }
          } catch (err) {
            // fallback to 0
          }
          const totalDoses =
            (med.morningDose || 0) +
            (med.afternoonDose || 0) +
            (med.eveningDose || 0);
          const days = med.numberOfDays ? parseInt(med.numberOfDays) : 1;
          return {
            qty: (totalDoses * days).toString(),
            name: med.medicineName,
            price,
            discount: "0",
          };
        })
      );
      setInvoiceItems(itemsWithPrices);
      // Fetch patient details
      const patientId = data.data.patientId;
      if (patientId) {
        try {
          const patientRes = await fetch(
            `http://localhost:8080/api/patients/${patientId}`
          );
          const patientData = await patientRes.json();
          if (patientData && patientData.name) {
            setCustomerName(patientData.name);
            setPhoneNumber(patientData.phoneNumber || "");
          } else {
            setCustomerName("");
            setPhoneNumber("");
          }
        } catch (err) {
          setCustomerName("");
          setPhoneNumber("");
        }
      } else {
        setCustomerName("");
        setPhoneNumber("");
      }
    } catch (error) {
      console.error("Error fetching prescription:", error);
  setErrorMessage("Error fetching prescription data.");
      setInvoiceDate("");
      setInvoiceItems([{ qty: "1", name: "", price: "0", discount: "0" }]);
      setCustomerName("");
      setPhoneNumber("");
    } finally {
      setLoading(false);
    }
  };

  // Helper to calculate subtotal, tax, total
  const calculateTotals = (items: any[]) => {
    const subTotal = items.reduce((sum, item) => {
      const qty = item.qty === "" ? 0 : Number(item.qty);
      const price = item.price === "" ? 0 : Number(item.price);
      const discount = item.discount === "" ? 0 : Number(item.discount);
      return sum + (qty * price - discount * qty);
    }, 0);
    const tax = 10; // fixed for now
    const total = subTotal + tax;
    return { subTotal, tax, total };
  };

  const handleFinalize = async () => {
    // Validation: check for empty fields
    if (
      !customerName.trim() ||
      !phoneNumber.trim() ||
      !invoiceDate.trim() ||
      invoiceItems.length === 0 ||
      invoiceItems.some(
        (item) => !item.name.trim() || !item.qty.trim() || !item.price.trim()
      )
    ) {
      setErrorMessage("Please fill in all required fields: Name, Phone, Date, and at least one medicine with all details.");
      return;
    }
    // Calculate totals
    const { subTotal, tax, total } = calculateTotals(invoiceItems);
    // Prepare billItems
    const billItems = invoiceItems.map((item) => ({
      medicineName: item.name,
      quantity: Number(item.qty),
      unitPrice: Number(item.price),
      discount: Number(item.discount),
      total:
        Number(item.qty) * Number(item.price) -
        Number(item.discount) * Number(item.qty),
    }));
    // Prepare payload
    const payload = {
      customerName,
      phoneNumber,
      date: invoiceDate,
      prescriptionId: prescriptionId || null,
      subTotal,
      tax,
      total,
      billItems,
      sellType: !!prescriptionId,
    };
    try {
      const res = await fetch("http://localhost:8080/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Failed to create bill:", res.status, errorText);
        setErrorMessage(
          "Failed to finalize and lock bill. Server responded: " + errorText
        );
        return;
      }
      // Store invoice data in sessionStorage before navigating
      const invoiceData = {
        invoiceDate,
        invoiceItems,
        customerName,
        phoneNumber,
      };
      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          "pharmacist_invoice",
          JSON.stringify(invoiceData)
        );
      }
      router.push("/pharmacist/Sell/Finalize");
    } catch (err) {
      console.error("Error during bill POST:", err);
      setErrorMessage(
        "Failed to finalize and lock bill. " +
          (err instanceof Error ? err.message : "")
      );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-50 via-white to-green-100 text-black">
      <Header />
      <SubHeader />

      <main className="flex flex-col items-center justify-start flex-grow mt-8 px-2 sm:px-4">
        <div className="w-full max-w-4xl sm:max-w-5xl shadow-2xl p-6 sm:p-8 rounded-2xl bg-white/90 border border-green-100 relative">
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-6 text-green-800 flex items-center gap-2">
              <span className="inline-block w-2 h-6 bg-green-600 rounded-full mr-2"></span>
              Prescription Info
            </h2>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="font-medium text-gray-700">
                  Prescription ID
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={prescriptionId}
                    onChange={(e) => setPrescriptionId(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleFetchPrescription();
                      }
                    }}
                    className="border border-green-400 w-80 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-300 bg-white text-black shadow-sm transition"
                    placeholder="Enter Prescription ID"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          </section>

          <div className="my-8 border-t border-green-200"></div>
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-6 text-green-800 flex items-center gap-2">
              <span className="inline-block w-2 h-6 bg-green-600 rounded-full mr-2"></span>
              Receipt Preview
            </h2>
            <div className="bg-white rounded-xl shadow p-4 sm:p-8 border border-green-100">
              <Invoice
                date={invoiceDate}
                setDate={setInvoiceDate}
                items={invoiceItems}
                setItems={setInvoiceItems}
                customerName={customerName}
                setCustomerName={setCustomerName}
                phoneNumber={phoneNumber}
                setPhoneNumber={setPhoneNumber}
              />
            </div>
          </section>

          {errorMessage && (
            <div className="flex justify-center mb-4">
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-lg text-center max-w-xl w-full">
                {errorMessage}
                <button
                  className="ml-4 text-red-500 hover:underline font-bold"
                  onClick={() => setErrorMessage("")}
                  aria-label="Dismiss error"
                >
                  ×
                </button>
              </div>
            </div>
          )}
          <div className="flex justify-center mb-8">
            <button
              onClick={handleFinalize}
              className="bg-gradient-to-r from-green-700 to-green-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:from-green-800 hover:to-green-700 focus:ring-4 focus:ring-green-300 transition text-lg tracking-wide"
            >
              <span className="inline-block align-middle mr-2">🔒</span>{" "}
              Finalize and Lock
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
