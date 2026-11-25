const GovernmentService = require("../models/government.model");

const sampleServices = [
  {
    name: "Department of Passports",
    description: "Apply for new passport or renew your existing passport.",
    location: "Tripureshwor, Kathmandu",
    hours: "Mon - Fri (10:00 AM - 5:00 PM)",
    mapQuery: "Department of Passports, Tripureshwor, Kathmandu",
    iconType: "passport",
    providedServices: [
      {
        name: "New Passport Issuance",
        documentsRequired: [
          "Original Citizenship Certificate",
          "National Identity Card (NID) with Number",
          "Marriage Certificate (if applicable)",
          "Online application form printout"
        ]
      },
      {
        name: "Passport Renewal",
        documentsRequired: [
          "Old Original Passport",
          "Original Citizenship Certificate",
          "National Identity Card (NID) Number",
          "Police report (if lost)"
        ]
      }
    ]
  },
  {
    name: "Kathmandu Metropolitan City Office",
    description: "Access local services, pay taxes and get citizen support.",
    location: "Bagdurbar, Kathmandu",
    hours: "Mon - Fri (10:00 AM - 5:00 PM)",
    mapQuery: "Kathmandu Metropolitan City Office, Bagdurbar, Kathmandu",
    iconType: "city",
    providedServices: [
      {
        name: "Birth Registration",
        documentsRequired: [
          "Hospital birth certificate",
          "Parents' citizenship certificates",
          "Marriage certificate of parents"
        ]
      },
      {
        name: "Property Tax Payment",
        documentsRequired: [
          "Land ownership certificate (Lalpurja)",
          "Previous year's tax clearance receipt",
          "Citizenship certificate of owner"
        ]
      }
    ]
  },
  {
    name: "Department of Transport Management",
    description: "Apply for driving license, vehicle registration and more.",
    location: "Ekantakuna, Lalitpur",
    hours: "Mon - Fri (10:00 AM - 5:00 PM)",
    mapQuery: "Department of Transport Management, Ekantakuna, Lalitpur",
    iconType: "transport",
    providedServices: [
      {
        name: "New Driving License",
        documentsRequired: [
          "Original Citizenship Certificate",
          "Citizenship photocopy",
          "Blood group card",
          "Medical fitness certificate",
          "Online application printout"
        ]
      },
      {
        name: "Vehicle Registration",
        documentsRequired: [
          "Customs clearance documents",
          "VAT bill from seller",
          "Citizenship certificate",
          "Insurance policy document"
        ]
      }
    ]
  },
  {
    name: "Department of Consular Services",
    description: "Services related to visas, attestation and citizenship.",
    location: "Tripureshwor, Kathmandu",
    hours: "Mon - Fri (10:00 AM - 5:00 PM)",
    mapQuery: "Department of Consular Services, Tripureshwor, Kathmandu",
    iconType: "consular",
    providedServices: [
      {
        name: "Document Attestation",
        documentsRequired: [
          "Original document to be attested",
          "Citizenship certificate",
          "Passport copy (if for abroad use)"
        ]
      },
      {
        name: "Police Clearance Attestation",
        documentsRequired: [
          "Original police clearance report",
          "Citizenship certificate",
          "Passport copy"
        ]
      }
    ]
  }
];

const getGovernmentServices = async (req, res) => {
  try {
    const services = await GovernmentService.find();
    res.json(services);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch government services", error: err.message });
  }
};

const getGovernmentServiceById = async (req, res) => {
  try {
    const service = await GovernmentService.findById(req.params.id);
    if (!service) return res.status(404).json({ message: "Service not found" });
    res.json(service);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch service details", error: err.message });
  }
};

const seedGovernmentServices = async (req, res) => {
  try {
    await GovernmentService.deleteMany({});
    const services = await GovernmentService.insertMany(sampleServices);
    res.json({ seededCount: services.length });
  } catch (err) {
    res.status(500).json({ message: "Failed to seed government services", error: err.message });
  }
};

module.exports = {
  getGovernmentServices,
  getGovernmentServiceById,
  seedGovernmentServices
};
