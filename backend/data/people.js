// 20 users, 20 admins and 20 delivery partners for the demo world.
// Passwords follow "<firstname>123" so the README credentials table stays
// predictable. All accounts are emailVerified so they can log in.

const CITIES = [
  ["Mumbai", "Maharashtra", "400001"],
  ["Delhi", "Delhi", "110001"],
  ["Bengaluru", "Karnataka", "560001"],
  ["Chennai", "Tamil Nadu", "600001"],
  ["Hyderabad", "Telangana", "500001"],
  ["Pune", "Maharashtra", "411001"],
  ["Jaipur", "Rajasthan", "302001"],
  ["Kolkata", "West Bengal", "700001"],
  ["Ahmedabad", "Gujarat", "380001"],
  ["Lucknow", "Uttar Pradesh", "226001"],
  ["Kochi", "Kerala", "682001"],
  ["Indore", "Madhya Pradesh", "452001"],
];

const USER_NAMES = [
  ["Aditi Verma", "aditi@example.com", "aditi123"],
  ["Rahul Nair", "rahul@example.com", "rahul123"],
  ["Priya Sharma", "priya.sharma@example.com", "priya123"],
  ["Arjun Mehta", "arjun.mehta@example.com", "arjun123"],
  ["Sneha Iyer", "sneha.iyer@example.com", "sneha123"],
  ["Vikram Singh", "vikram.singh@example.com", "vikram123"],
  ["Ananya Das", "ananya.das@example.com", "ananya123"],
  ["Karthik Reddy", "karthik.reddy@example.com", "karthik123"],
  ["Ishita Banerjee", "ishita.banerjee@example.com", "ishita123"],
  ["Rohan Kulkarni", "rohan.kulkarni@example.com", "rohan123"],
  ["Meera Pillai", "meera.pillai@example.com", "meera123"],
  ["Aakash Gupta", "aakash.gupta@example.com", "aakash123"],
  ["Divya Menon", "divya.menon@example.com", "divya123"],
  ["Siddharth Joshi", "siddharth.joshi@example.com", "siddharth123"],
  ["Nisha Agarwal", "nisha.agarwal@example.com", "nisha123"],
  ["Farhan Khan", "farhan.khan@example.com", "farhan123"],
  ["Lakshmi Raman", "lakshmi.raman@example.com", "lakshmi123"],
  ["Dev Patel", "dev.patel@example.com", "dev12345"],
  ["Tanvi Deshpande", "tanvi.deshpande@example.com", "tanvi123"],
  ["Harpreet Kaur", "harpreet.kaur@example.com", "harpreet123"],
];

const ADMINS = [
  ["Platform Admin", "admin@shopsphere.com", "admin1234", "Platform Administrator"],
  ["Rajesh Khanna", "rajesh.ops@shopsphere.com", "rajesh123", "Operations Admin"],
  ["Sunita Rao", "sunita.catalog@shopsphere.com", "sunita123", "Catalog Moderator"],
  ["Amit Bhatt", "amit.catalog@shopsphere.com", "amit1234", "Catalog Moderator"],
  ["Kavya Nambiar", "kavya.refunds@shopsphere.com", "kavya123", "Refund & Dispute Officer"],
  ["Manoj Tiwari", "manoj.refunds@shopsphere.com", "manoj123", "Refund & Dispute Officer"],
  ["Pooja Hegde", "pooja.logistics@shopsphere.com", "pooja123", "Logistics Coordinator"],
  ["Sanjay Dutt", "sanjay.logistics@shopsphere.com", "sanjay123", "Logistics Coordinator"],
  ["Ritika Malhotra", "ritika.sellers@shopsphere.com", "ritika123", "Seller-Verification Officer"],
  ["Deepak Chopra", "deepak.sellers@shopsphere.com", "deepak123", "Seller-Verification Officer"],
  ["Neha Kapoor", "neha.support@shopsphere.com", "neha1234", "Support Lead"],
  ["Vivek Oberoi", "vivek.support@shopsphere.com", "vivek123", "Support Lead"],
  ["Shruti Haasan", "shruti.reviews@shopsphere.com", "shruti123", "Review Moderator"],
  ["Gaurav Taneja", "gaurav.fraud@shopsphere.com", "gaurav123", "Fraud & Risk Analyst"],
  ["Asha Bhonsle", "asha.payments@shopsphere.com", "asha1234", "Payments Officer"],
  ["Nikhil Chinapa", "nikhil.growth@shopsphere.com", "nikhil123", "Growth & Promotions Admin"],
  ["Swati Mohan", "swati.data@shopsphere.com", "swati123", "Data & Analytics Admin"],
  ["Imran Qureshi", "imran.delivery@shopsphere.com", "imran123", "Delivery Network Manager"],
  ["Rekha Jain", "rekha.compliance@shopsphere.com", "rekha123", "Compliance Officer"],
  ["Arvind Swamy", "arvind.escalations@shopsphere.com", "arvind123", "Escalations Manager"],
];

const PARTNERS = [
  ["Ravi Kumar", "ravi.delivery@shopsphere.com", "ravi123", "Bike", "Chennai", "Active"],
  ["Sunita Sharma", "sunita.delivery@shopsphere.com", "sunita123", "Van", "Chennai", "Active"],
  ["Mohammed Irfan", "irfan.delivery@shopsphere.com", "irfan123", "Bike", "Mumbai", "On Delivery"],
  ["Ganesh Yadav", "ganesh.delivery@shopsphere.com", "ganesh123", "Bike", "Mumbai", "Active"],
  ["Lakhan Singh", "lakhan.delivery@shopsphere.com", "lakhan123", "Truck", "Delhi", "Active"],
  ["Prakash Jha", "prakash.delivery@shopsphere.com", "prakash123", "Bike", "Delhi", "Offline"],
  ["Suresh Babu", "suresh.delivery@shopsphere.com", "suresh123", "Van", "Bengaluru", "Active"],
  ["Anil Kumble", "anil.delivery@shopsphere.com", "anil1234", "Bike", "Bengaluru", "On Delivery"],
  ["Ramesh Iyer", "ramesh.delivery@shopsphere.com", "ramesh123", "Bike", "Hyderabad", "Active"],
  ["Vijay Antony", "vijay.delivery@shopsphere.com", "vijay123", "Van", "Hyderabad", "Active"],
  ["Santosh Pawar", "santosh.delivery@shopsphere.com", "santosh123", "Bike", "Pune", "Active"],
  ["Kiran Rathod", "kiran.delivery@shopsphere.com", "kiran123", "Bike", "Pune", "Offline"],
  ["Bhavesh Solanki", "bhavesh.delivery@shopsphere.com", "bhavesh123", "Van", "Ahmedabad", "Active"],
  ["Dinesh Meena", "dinesh.delivery@shopsphere.com", "dinesh123", "Bike", "Jaipur", "Active"],
  ["Sourav Ganguly", "sourav.delivery@shopsphere.com", "sourav123", "Bike", "Kolkata", "On Delivery"],
  ["Alok Verma", "alok.delivery@shopsphere.com", "alok1234", "Truck", "Lucknow", "Active"],
  ["Joseph Thomas", "joseph.delivery@shopsphere.com", "joseph123", "Bike", "Kochi", "Active"],
  ["Narendra Rawat", "narendra.delivery@shopsphere.com", "narendra123", "Van", "Indore", "Active"],
  ["Salim Sheikh", "salim.delivery@shopsphere.com", "salim123", "Bike", "Mumbai", "Active"],
  ["Tara Chand", "tara.delivery@shopsphere.com", "tara1234", "Bike", "Delhi", "Active"],
];

function addressFor(index, name) {
  const [city, state, pincode] = CITIES[index % CITIES.length];
  return {
    label: "Home",
    line1: `${5 + index * 3} ${["Lake View Road", "MG Road", "Nehru Street", "Gandhi Marg", "Station Road"][index % 5]}`,
    line2: ["Sector 4", "Anna Nagar", "Koramangala", "Bandra West", "Civil Lines"][index % 5],
    city,
    state,
    pincode,
    phone: `+91 9${String(700000000 + index * 9137).slice(0, 9)}`,
    isDefault: true,
  };
}

function userAccounts() {
  return USER_NAMES.map(([name, email, password], idx) => {
    const account = {
      id: `user-${idx + 1}`,
      name,
      email,
      password,
      role: "user",
      phone: `+91 9${String(800000000 + idx * 7211).slice(0, 9)}`,
      emailVerified: true,
      status: "active",
      addresses: [addressFor(idx, name)],
      loyaltyPoints: (idx * 17) % 120,
      createdAt: new Date(Date.UTC(2026, 4, 1 + (idx * 3) % 60, 9, 0, 0)),
    };
    // a second saved address for a third of the users
    if (idx % 3 === 0) {
      account.addresses.push({ ...addressFor(idx + 5, name), label: "Office", isDefault: false });
    }
    // half the users have saved payment methods
    if (idx % 2 === 0) {
      account.paymentMethods = [
        { type: "card", label: "Personal Card", last4: String(4000 + idx * 37).slice(-4), isDefault: true },
        { type: "upi", label: "UPI", upiId: `${email.split("@")[0]}@okbank` },
      ];
    }
    return account;
  });
}

function adminAccounts() {
  return ADMINS.map(([name, email, password, jobTitle], idx) => ({
    id: `admin-${idx + 1}`,
    name,
    email,
    password,
    role: "admin",
    phone: `+91 9${String(900000000 + idx * 4159).slice(0, 9)}`,
    emailVerified: true,
    status: "active",
    jobTitle,
    createdAt: new Date(Date.UTC(2026, 3, 1 + idx, 10, 0, 0)),
  }));
}

function deliveryPartners() {
  return PARTNERS.map(([name, email, password, vehicle, zone, status], idx) => ({
    id: `partner-${idx + 1}`,
    name,
    email,
    password,
    phone: `9${String(870000000 + idx * 6733).slice(0, 9)}`,
    vehicle,
    zone,
    status,
  }));
}

module.exports = { userAccounts, adminAccounts, deliveryPartners, USER_NAMES, ADMINS, PARTNERS };
