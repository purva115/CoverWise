export const mockDenialCodes = [
    {
        code: "CO-50",
        reason: "Not Medically Necessary",
        explanation:
            "Your insurance company has determined that this procedure does not meet their criteria for medical necessity based on your diagnosis. This is the most common denial reason and is frequently overturned on appeal when additional clinical notes from your doctor are provided.",
        successProbability: 73,
        deadlineDays: 180,
        requiredDocuments: [
            "Letter of Medical Necessity from your provider",
            "Full clinical chart/visit notes",
        ],
        appealTemplate: `Dear Appeals Department,\n\nI am writing to appeal the denied claim for [Service] on [Date]. The denial reason code was CO-50 (Not Medically Necessary).\n\nEnclosed is a Letter of Medical Necessity from my provider, Dr. [Doctor Name], which clearly outlines why this procedure was essential for treating my condition of [Diagnosis]. Additionally, I have included the clinical notes from my visit that demonstrate conservative treatments were previously attempted and failed.\n\nBased on your own policy guidelines for [Condition], this procedure meets the criteria for coverage. Please reprocess this claim for payment.\n\nSincerely,\n[Your Name]`,
    },
    {
        code: "CO-16",
        reason: "Requires Information",
        explanation:
            "Your insurance company needs more information from your provider to process this claim. This is usually due to a missing modifier, an incomplete diagnosis code, or a request for medical records.",
        successProbability: 85,
        deadlineDays: 90,
        requiredDocuments: ["Requested medical records or corrected claim form code"],
        appealTemplate: `Dear Claims Department,\n\nI am writing regarding the claim for [Service] on [Date], which was denied with code CO-16 requesting additional information.\n\nI have contacted my provider, and they have provided the requested [Name of missing document/information, e.g., clinical notes]. Please find this documentation attached.\n\nPlease review the attached information and reprocess this claim for payment.\n\nSincerely,\n[Your Name]`,
    },
    {
        code: "CO-97",
        reason: "Included in Other Service",
        explanation:
            "Your insurance states this procedure should have been bundled (included) in the payment for another major procedure performed on the same day. This is often a coding error where the provider forgot to use a special 'modifier' to indicate the procedures were distinct and separate.",
        successProbability: 68,
        deadlineDays: 180,
        requiredDocuments: [
            "Corrected claim with Modifier 59 or 25 (if applicable)",
            "Provider explanation of separate procedures",
        ],
        appealTemplate: `Dear Appeals Department,\n\nI am writing to appeal the denial of [Service] on [Date], denied under code CO-97 (Included in Other Service).\n\nWhile [Service] was performed on the same day as [Primary Procedure], these were distinct, separate services. My provider has issued a corrected claim utilizing [Modifier 25/59] to indicate that this service was significant and separately identifiable from the primary procedure.\n\nPlease review the updated coding and clinical notes, and reprocess this claim for payment.\n\nSincerely,\n[Your Name]`,
    },
    {
        code: "CO-197",
        reason: "Precertification/Authorization/Notification Absent",
        explanation:
            "Your insurance denied this claim because your provider did not get prior approval (prior authorization) before performing the service. While primarily the provider's responsibility, this can sometimes be fought by proving a retroactive 'medical emergency' or appealing a provider error.",
        successProbability: 32,
        deadlineDays: 180,
        requiredDocuments: [
            "Proof of emergency admission (if applicable)",
            "Retroactive authorization request from provider",
        ],
        appealTemplate: `Dear Appeals Department,\n\nI am writing to appeal the denial for [Service] on [Date], denied with code CO-197 for lack of prior authorization.\n\n[Choose one line below:]\n[Option 1: Emergency] This service was performed under emergency circumstances where obtaining prior authorization was not feasible. Attached are the ER notes supporting the emergent nature of the visit.\n[Option 2: Provider Error] I was not informed by the facility that prior authorization was not obtained. As the patient, I relied on the facility's administrative staff to secure necessary approvals for in-network care.\n\nPlease review the attached documentation and consider a retroactive authorization or reprocessing of this claim.\n\nSincerely,\n[Your Name]`,
    },
    {
        code: "CO-242",
        reason: "Out of Network Provider",
        explanation:
            "Your insurance denied this or paid at a much lower rate because the provider was not in your network. If you were at an IN-NETWORK hospital but were treated by an OUT-OF-NETWORK doctor (like an ER doctor or anesthesiologist) without your consent, you are protected by the No Surprises Act.",
        successProbability: 88,
        deadlineDays: 180,
        requiredDocuments: [
            "Proof that the facility was In-Network",
            "Mention of the No Surprises Act",
        ],
        appealTemplate: `Dear Appeals Department,\n\nI am appealing the coverage determination for services provided by [Provider Name] on [Date] at [Facility Name].\n\nI intentionally visited an in-network facility ([Facility Name]). I had no choice in the selection of [Provider Name, e.g., the anesthesiologist or ER doctor] who treated me at this facility. Under the federal No Surprises Act, I cannot be held liable for out-of-network balance billing for ancillary services provided at an in-network facility.\n\nTherefore, this claim must be processed at my in-network benefit level, and any balance bill must be canceled.\n\nSincerely,\n[Your Name]`,
    }
];

export const mockServiceRisks = {
    "mri": {
        name: "MRI (Magnetic Resonance Imaging)",
        requiresAuth: true,
        outOfNetworkRisk: "Low",
        costEstimate: {
            low: 400,
            high: 1200,
            average: 800
        },
        warning: "MRIs almost always require Prior Authorization. Call your insurance and ask: 'Has my doctor submitted a prior auth for this MRI, and has it been approved?'",
        alternatives: "Stand-alone imaging centers are usually 40-60% cheaper than hospital imaging centers. Ask your doctor if you can be referred to an independent facility."
    },
    "surgery": {
        name: "General Surgery (e.g., Appendectomy, Knee Scoping)",
        requiresAuth: true,
        outOfNetworkRisk: "High",
        costEstimate: {
            low: 2000,
            high: 8000,
            average: 4500
        },
        warning: "Even if the hospital is in-network, the Anesthesiologist or Assistant Surgeon might be OUT-OF-NETWORK. This is the #1 cause of surprise bills.",
        actionItem: "Call the hospital billing department and ask: 'Are all providers involved in my surgery, including anesthesia and pathology, in-network with my specific plan?'"
    },
    "er": {
        name: "Emergency Room Visit",
        requiresAuth: false,
        outOfNetworkRisk: "High",
        costEstimate: {
            low: 800,
            high: 3000,
            average: 1500
        },
        warning: "Under the No Surprises Act, emergency services must be billed as in-network, even if the hospital is out-of-network. Do not pay out-of-network balance bills for ER visits!",
        actionItem: "If it's not a true life-threatening emergency, Urgent Care is typically $100-$200 compared to $1500+ for the ER."
    },
    "physical therapy": {
        name: "Physical Therapy",
        requiresAuth: true,
        outOfNetworkRisk: "Low",
        costEstimate: {
            low: 75,
            high: 200,
            average: 120
        },
        warning: "Many plans have a hard limit on PT visits (e.g., 20 per year) AND require prior auth after the first 5 visits.",
        actionItem: "Check your plan's 'Visit limit' for PT/OT before starting treatment."
    }
};

export const mockPatientProfile = {
    name: "Emily Chen",
    planName: "BlueCross Core PPO 2026",
    memberId: "ABC123456789",
    financialImpact: {
        totalBilledYTD: 14500,
        patientResponsibility: 4200,
        moneySavedAppeals: 2300,
        pendingAppealsAmount: 850
    },
    activeAppeals: [
        {
            id: "APP-9821A",
            dateFiled: "2026-01-15",
            service: "Shoulder MRI",
            denialReason: "Not Medically Necessary",
            status: "In Review",
            expectedResolution: "2026-03-01",
            amountAtStake: 850
        },
        {
            id: "APP-7732B",
            dateFiled: "2025-11-10",
            service: "Emergency Room Visit",
            denialReason: "Out of Network Provider",
            status: "Won",
            expectedResolution: "Resolved",
            amountAtStake: 2300
        }
    ],
    fsaHsa: {
        type: "FSA",
        balance: 500,
        expirationDate: "2026-04-15",
        daysUntilExpiry: 53,
        suggestedPurchases: [
            "Prescription refills",
            "First aid supplies",
            "Contact lenses / glasses",
            "Over-the-counter medications"
        ]
    },
    creditWarnings: [
        {
            provider: "UNC Health Anesthesia",
            amount: 450,
            dueDate: "2026-02-28",
            daysPastDue: 60,
            warningText: "This bill is 60 days past due. Medical debts over $500 that remain unpaid for 365 days can be reported to credit bureaus. Consider setting up a payment plan to protect your score."
        }
    ]
};

export const mockEOBs = [
    {
        id: "EOB-101",
        date: "2026-02-14",
        provider: "Advanced Imaging Center",
        service: "MRI, Left Shoulder (73221)",
        billedAmount: 1800,
        allowedAmount: 0,
        insurancePaid: 0,
        patientResponsibility: 1800,
        denialCode: "CO-50",
        status: "Denied"
    },
    {
        id: "EOB-102",
        date: "2026-01-05",
        provider: "City Hospital ER",
        service: "Emergency Department Visit (99284)",
        billedAmount: 3200,
        allowedAmount: 1500,
        insurancePaid: 1200,
        patientResponsibility: 300,
        denialCode: null,
        status: "Processed"
    },
    {
        id: "EOB-103",
        date: "2026-01-05",
        provider: "Apex Anesthesia Associates",
        service: "Anesthesia Services (00140)",
        billedAmount: 1200,
        allowedAmount: 400,
        insurancePaid: 0,
        patientResponsibility: 1200,
        denialCode: "CO-242",
        status: "Denied"
    }
];