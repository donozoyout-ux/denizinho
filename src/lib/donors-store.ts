import fs from "fs";
import path from "path";

export interface Donation {
  id: string;
  type: "Para" | "Ürün" | "Hizmet" | "Diğer";
  amount: number;
  details: string;
  date: string;
}

export interface Donor {
  id: string;
  name: string;
  type: "Bireysel" | "Kurumsal";
  email: string;
  phone: string;
  address: string;
  status: "Aktif" | "Pasif";
  last_contact: string;
  total_donated: number;
  donations: Donation[];
}

const filePath = path.join(process.cwd(), "src", "data", "donors.json");

export function getDonors(): Donor[] {
  try {
    if (!fs.existsSync(filePath)) {
      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, "[]", "utf8");
      return [];
    }
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading donors store:", error);
    return [];
  }
}

export function saveDonors(donors: Donor[]): boolean {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(donors, null, 2), "utf8");
    return true;
  } catch (error) {
    console.error("Error saving donors store:", error);
    return false;
  }
}

export function addDonor(donorData: Omit<Donor, "id" | "total_donated" | "donations" | "last_contact"> & { donation?: Omit<Donation, "id"> }): Donor {
  const donors = getDonors();
  const newId = `donor-${Date.now()}`;
  
  const donations: Donation[] = [];
  let totalDonated = 0;
  const today = new Date().toISOString().split("T")[0];
  
  if (donorData.donation) {
    const donId = `don-${Date.now()}-1`;
    const newDonation: Donation = {
      id: donId,
      type: donorData.donation.type,
      amount: Number(donorData.donation.amount) || 0,
      details: donorData.donation.details || "",
      date: donorData.donation.date || today
    };
    donations.push(newDonation);
    totalDonated = newDonation.amount;
  }

  const newDonor: Donor = {
    id: newId,
    name: donorData.name,
    type: donorData.type,
    email: donorData.email || "",
    phone: donorData.phone || "",
    address: donorData.address || "",
    status: donorData.status || "Aktif",
    last_contact: donorData.donation?.date || today,
    total_donated: totalDonated,
    donations: donations
  };

  donors.unshift(newDonor);
  saveDonors(donors);
  return newDonor;
}

export function addDonation(donorId: string, donationData: Omit<Donation, "id">): Donation | null {
  const donors = getDonors();
  const donorIndex = donors.findIndex(d => d.id === donorId);
  if (donorIndex === -1) return null;

  const donor = donors[donorIndex];
  const newDonationId = `don-${Date.now()}-${Math.floor(Math.random() * 100)}`;
  const newDonation: Donation = {
    id: newDonationId,
    type: donationData.type,
    amount: Number(donationData.amount) || 0,
    details: donationData.details || "",
    date: donationData.date || new Date().toISOString().split("T")[0]
  };

  donor.donations.unshift(newDonation);
  donor.total_donated = donor.donations.reduce((sum, d) => sum + d.amount, 0);
  
  // Update last_contact if the new donation is more recent
  if (!donor.last_contact || new Date(newDonation.date) > new Date(donor.last_contact)) {
    donor.last_contact = newDonation.date;
  }

  donors[donorIndex] = donor;
  saveDonors(donors);
  return newDonation;
}
