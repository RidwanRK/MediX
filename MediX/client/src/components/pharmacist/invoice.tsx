"use client";

import { useState, useRef, useEffect } from "react";
// Helper: fetch all medicine names
async function fetchMedicineNames() {
  try {
    const res = await fetch("http://localhost:8080/api/medicines");
    const data = await res.json();
    if (Array.isArray(data)) {
      return data.map((m: any) => m.name || m.medicineName || "").filter(Boolean);
    } else if (Array.isArray(data.data)) {
      return data.data.map((m: any) => m.name || m.medicineName || "").filter(Boolean);
    }
    return [];
  } catch {
    return [];
  }
}

type Item = {
  qty: string;
  name: string;
  price: string;
  discount: string;
};

interface InvoiceProps {
  date?: string;
  setDate?: (date: string) => void;
  items?: Array<{
    qty: string;
    name: string;
    price: string;
    discount: string;
  }>;
  setItems?: (items: Item[]) => void;
  customerName?: string;
  setCustomerName?: (name: string) => void;
  phoneNumber?: string;
  setPhoneNumber?: (phone: string) => void;
}

export default function Invoice({ date: propDate, setDate, items: propItems, setItems, customerName: propCustomerName, setCustomerName, phoneNumber: propPhoneNumber, setPhoneNumber }: InvoiceProps) {
  // Autocomplete state
  const [medicineNames, setMedicineNames] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<{[key:number]: string[]}>({});
  const [showSuggestions, setShowSuggestions] = useState<{[key:number]: boolean}>({});
  // Fetch medicine names on mount
  useEffect(() => {
    fetchMedicineNames().then(setMedicineNames);
  }, []);
  // refs for table inputs: [row][col]
  const inputRefs = useRef<Array<Array<HTMLInputElement | null>>>([]);

  // If setters are provided, use props as source of truth, else fallback to local state (for backward compatibility)
  const [localCustomerName, localSetCustomerName] = useState(propCustomerName || "");
  const [localPhoneNumber, localSetPhoneNumber] = useState(propPhoneNumber || "");
  const [localDate, localSetDate] = useState<string>(propDate || new Date().toISOString().split("T")[0]);
  const [localItems, localSetItems] = useState<Item[]>(
    propItems && propItems.length > 0
      ? propItems
      : [{ qty: "1", name: "", price: "0", discount: "0" }]
  );

  // Sync local state with props if they change
  useEffect(() => {
    if (propCustomerName !== undefined) localSetCustomerName(propCustomerName);
  }, [propCustomerName]);
  useEffect(() => {
    if (propPhoneNumber !== undefined) localSetPhoneNumber(propPhoneNumber);
  }, [propPhoneNumber]);
  useEffect(() => {
    if (propDate) localSetDate(propDate);
  }, [propDate]);
  useEffect(() => {
    if (propItems && propItems.length > 0) localSetItems(propItems);
  }, [propItems]);
  const [companyName, setCompanyName] = useState("");
  const [address, setAddress] = useState("");
  
  // Set the default date to the current date
  // Use prop setters if provided, else local state
  const date = propDate !== undefined ? propDate : localDate;
  const items = propItems !== undefined ? propItems : localItems;
  const customerName = propCustomerName !== undefined ? propCustomerName : localCustomerName;
  const phoneNumber = propPhoneNumber !== undefined ? propPhoneNumber : localPhoneNumber;

  // Ensure refs array matches items
  useEffect(() => {
    inputRefs.current = items.map((item: Item, rowIdx: number) =>
      [0, 1, 2, 3, 4].map((colIdx: number) => inputRefs.current[rowIdx]?.[colIdx] || null)
    );
  }, [items]);

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      [field]: (field === "price" || field === "qty" || field === "discount") ? value.replace(/^0+(?!$)/, "") : value,
    };
    if (setItems) setItems(updated);
    else localSetItems(updated);

    // Autocomplete: update suggestions for name field (case-insensitive)
    if (field === "name") {
      const input = value.trim().toLowerCase();
      if (input.length > 0) {
        const filtered = medicineNames.filter((n) => n.toLowerCase().includes(input));
        setSuggestions((prev) => ({ ...prev, [index]: filtered }));
        setShowSuggestions((prev) => ({ ...prev, [index]: true }));
      } else {
        setSuggestions((prev) => ({ ...prev, [index]: medicineNames }));
        setShowSuggestions((prev) => ({ ...prev, [index]: false }));
      }
    }
  };
  // When user selects a suggestion
  // Fetch unit price for a medicine name
  const fetchUnitPrice = async (medicineName: string) => {
    try {
      const res = await fetch(`http://localhost:8080/api/medicines/name/${encodeURIComponent(medicineName)}`);
      const data = await res.json();
      if (data && data.unitPrice !== undefined) {
        return data.unitPrice.toString();
      }
    } catch {}
    return "0";
  };

  // When user selects a suggestion
  const handleSelectSuggestion = async (rowIdx: number, name: string) => {
    // Find the actual medicine name from the list (case-insensitive match)
    const actualName = medicineNames.find((n) => n.toLowerCase() === name.toLowerCase()) || name;
    // Fetch unit price and update both name and price
    const price = await fetchUnitPrice(actualName);
    const updated = [...items];
    updated[rowIdx] = { ...updated[rowIdx], name: actualName, price };
    if (setItems) setItems(updated);
    else localSetItems(updated);
    setShowSuggestions((prev) => ({ ...prev, [rowIdx]: false }));
  };

  const addItem = () => {
    const newItems = [...items, { qty: "1", name: "", price: "0", discount: "0" }];
    if (setItems) setItems(newItems);
    else localSetItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    if (setItems) setItems(newItems);
    else localSetItems(newItems);
  };

  const subtotal = items.reduce((sum, item) => {
    const qty = item.qty === "" ? 0 : Number(item.qty);
    const price = item.price === "" ? 0 : Number(item.price);
    const discount = item.discount === "" ? 0 : Number(item.discount);
    const itemTotal = qty * price - discount * qty;
    return sum + itemTotal;
  }, 0);
  const tax = 10;
  const total = subtotal + tax;

  const handleKeyDown = (rowIdx: number, colIdx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      let nextRow = rowIdx;
      let nextCol = colIdx + 1;
      if (nextCol > 4) {
        nextRow = rowIdx + 1;
        nextCol = 0;
      }
      if (inputRefs.current[nextRow]?.[nextCol]) {
        inputRefs.current[nextRow][nextCol]?.focus();
      }
    }
  };

  return (
    <div className="bg-white p-8 shadow-xl max-w-4xl mx-auto my-10 border border-gray-200">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold text-green-700">INVOICE</h1>
        </div>
        <div className="text-right">
          <h2 className="text-lg font-bold text-gray-700">Hikmah Hospital</h2>
          <p className="text-sm text-green-600">
            We provide the very best pharmacy solutions.
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 text-sm text-gray-800">
        <div>
          <p className="font-bold text-lg">Billed to</p>
          <label className="block mt-2 font-semibold">Customer Name</label>
          <input
            value={customerName}
            onChange={(e) => (setCustomerName ? setCustomerName(e.target.value) : localSetCustomerName(e.target.value))}
            className="w-full border px-2 py-1 rounded"
          />
        </div>

        <div>
          <label className="block mt-9 font-semibold">Phone Number</label>
          <input
            value={phoneNumber}
            onChange={(e) => (setPhoneNumber ? setPhoneNumber(e.target.value) : localSetPhoneNumber(e.target.value))}
            className="w-full border px-2 py-1 rounded"
          />
        </div>

        <div>
          <label className="block mt-2 font-semibold">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => (setDate ? setDate(e.target.value) : localSetDate(e.target.value))}
            className="w-full border px-2 py-1 rounded"
          />
        </div>
      </div>

      <table className="w-full mt-8 text-sm border">
        <thead className="bg-green-900 text-white">
          <tr>
            <th className="p-2 border">Qty.</th>
            <th className="p-2 border">Name</th>
            <th className="p-2 border">Price</th>
            <th className="p-2 border">Discount</th>
            <th className="p-2 border">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx} className="text-center">
              <td className="p-2 border">
                <input
                  type="number"
                  value={item.qty}
                  onChange={(e) => handleItemChange(idx, "qty", e.target.value)}
                  className="w-16 border rounded px-1"
                  min=""
                  ref={el => {
                    inputRefs.current[idx] = inputRefs.current[idx] || [];
                    inputRefs.current[idx][0] = el;
                  }}
                  onKeyDown={e => handleKeyDown(idx, 0, e)}
                />
              </td>
              <td className="p-2 border">
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    value={item.name}
                    onChange={e => {
                      // Only allow values from medicineNames
                      handleItemChange(idx, "name", e.target.value);
                    }}
                    className="w-full border rounded px-1"
                    ref={el => {
                      inputRefs.current[idx] = inputRefs.current[idx] || [];
                      inputRefs.current[idx][1] = el;
                    }}
                    onKeyDown={e => {
                      if (e.key === "Enter" && suggestions[idx]?.length) {
                        handleSelectSuggestion(idx, suggestions[idx][0]);
                        e.preventDefault();
                      } else {
                        handleKeyDown(idx, 1, e);
                      }
                    }}
                    onFocus={() => {
                      if (item.name) {
                        const filtered = medicineNames.filter((n) => n.toLowerCase().includes(item.name.toLowerCase()));
                        setSuggestions((prev) => ({ ...prev, [idx]: filtered }));
                        setShowSuggestions((prev) => ({ ...prev, [idx]: true }));
                      } else {
                        setSuggestions((prev) => ({ ...prev, [idx]: medicineNames }));
                        setShowSuggestions((prev) => ({ ...prev, [idx]: true }));
                      }
                    }}
                    onBlur={() => {
                      setTimeout(() => setShowSuggestions((prev) => ({ ...prev, [idx]: false })), 100);
                    }}
                    list={`medicines-list-${idx}`}
                    autoComplete="off"
                  />
                  {/* Suggestions dropdown */}
                  {showSuggestions[idx] && suggestions[idx]?.length > 0 && (
                    <ul
                      style={{
                        position: "absolute",
                        zIndex: 20,
                        background: "#fff",
                        border: "1px solid #4ade80",
                        width: "100%",
                        maxHeight: 180,
                        overflowY: "auto",
                        margin: 0,
                        padding: 0,
                        listStyle: "none",
                        boxShadow: "0 4px 16px 0 rgba(34,197,94,0.15)",
                        borderRadius: 8,
                        animation: 'fadeIn 0.2s',
                      }}
                    >
                      {suggestions[idx].map((option, sidx) => (
                        <li
                          key={option}
                          style={{
                            padding: "10px 16px",
                            cursor: "pointer",
                            borderBottom: sidx !== suggestions[idx].length - 1 ? "1px solid #e5e7eb" : "none",
                            background: option === item.name ? "#bbf7d0" : "#fff",
                            color: option === item.name ? "#166534" : "#222",
                            fontWeight: option === item.name ? 600 : 400,
                            transition: "background 0.15s, color 0.15s",
                          }}
                          onMouseDown={() => handleSelectSuggestion(idx, option)}
                          onMouseEnter={e => {
                            // Optionally highlight on hover
                          }}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <svg width="18" height="18" fill="#4ade80" style={{ marginRight: 4 }} viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" fill="#bbf7d0" /><text x="10" y="15" textAnchor="middle" fontSize="10" fill="#166534">💊</text></svg>
                            {option}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {/* Only allow selection from available medicine names */}
                {item.name && !medicineNames.some((n) => n.toLowerCase() === item.name.toLowerCase()) && (
                  <div className="text-xs text-red-600">Please select a valid medicine name.</div>
                )}
              </td>
              <td className="p-2 border">
                <input
                  type="number"
                  value={item.price}
                  onChange={(e) => handleItemChange(idx, "price", e.target.value)}
                  className="w-20 border rounded px-1"
                  min=""
                  ref={el => {
                    inputRefs.current[idx] = inputRefs.current[idx] || [];
                    inputRefs.current[idx][2] = el;
                  }}
                  onKeyDown={e => handleKeyDown(idx, 2, e)}
                  onFocus={async () => {
                    // When price field is focused, fetch price if name is valid (case-insensitive)
                    const name = item.name;
                    if (!name) return;
                    const actualName = medicineNames.find((n) => n.toLowerCase() === name.toLowerCase());
                    if (actualName) {
                      const price = await fetchUnitPrice(actualName);
                      if (price !== item.price) {
                        handleItemChange(idx, "price", price);
                      }
                    }
                  }}
                />
              </td>
              <td className="p-2 border">
                <input
                  type="number"
                  value={item.discount}
                  onChange={(e) => handleItemChange(idx, "discount", e.target.value)}
                  className="w-20 border rounded px-1"
                  min="0"
                  ref={el => {
                    inputRefs.current[idx] = inputRefs.current[idx] || [];
                    inputRefs.current[idx][3] = el;
                  }}
                  onKeyDown={e => handleKeyDown(idx, 3, e)}
                />
              </td>
              <td className="p-2 border font-semibold text-right pr-4 flex items-center justify-between">
                <span>${((item.qty === "" ? 0 : Number(item.qty)) * (item.price === "" ? 0 : Number(item.price)) - (item.discount === "" ? 0 : Number(item.discount)) * Number(item.qty)).toFixed(2)}</span>
                <button onClick={() => handleRemoveItem(idx)} title="Remove item" className="ml-2 text-red-600 hover:text-red-800 text-lg font-bold" style={{ lineHeight: 1 }}>
                  &times;
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button
        onClick={addItem}
        className="mt-4 text-sm text-green-700 hover:underline"
      >
        + Add another item
      </button>

      <div className="grid grid-cols-2 gap-4 mt-8">
        <div>
          <h3 className="font-bold text-gray-700">Payment info</h3>
          <p>Best Bank</p>
          <p>Account no. 56–67892</p>
          <p>Ref : 0145 76590</p>

          <h3 className="font-bold text-gray-700 mt-4">Terms and Conditions</h3>
          <p className="text-sm text-gray-600">
            The origins of the first constellations date back to prehistoric
            times. Their purpose was to tell stories of their beliefs,
            experiences, creations.
          </p>
        </div>

        <div className="text-right space-y-2 text-sm">
          <p className="flex justify-between border-b py-1">
            <span className="font-semibold">Subtotal</span>{" "}
            <span>৳{subtotal.toFixed(2)}</span>
          </p>
          <p className="flex justify-between border-b py-1">
            <span className="font-semibold">Tax</span>{" "}
            <span>৳{tax.toFixed(2)}</span>
          </p>
          <p className="flex justify-between text-lg bg-lime-400 p-2 font-bold text-green-900 rounded">
            <span>Total</span> <span>৳{total.toFixed(2)}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
