// --- U-M THEME CONSTANTS ---
const UM_BLUE = '#00274C';
const UM_MAIZE = '#FFCB05';
const UM_BLUE_LIGHT = '#B0D0DB';
const UM_TEXT_ON_MAIZE = '#00274C'; // Text color for maize backgrounds

// --- ENHANCED ABBREVIATIONS & TAG RULES ---
const abbreviationMap = { 
    // 🆕 ENHANCED: Added common medical abbreviations (your existing + new)
    "OR": "Operating Room", "ER": "Emergency Room", "ICU": "Intensive Care Unit", "CCU": "Critical Care Unit",
    "PACU": "Post Anesthesia Care Unit", "NICU": "Neonatal Intensive Care Unit", "PICU": "Pediatric Intensive Care Unit",
    "ED": "Emergency Department", "L&D": "Labor and Delivery", "OBGYN": "Obstetrics and Gynecology",
    "RT": "Respiratory Therapy", "PT": "Physical Therapy", "OT": "Occupational Therapy",
    "CVS": "Cardiovascular Surgery", "NSG": "Neurosurgery", "ORTH": "Orthopedics",
    "RAD": "Radiology", "CT": "Computed Tomography", "MRI": "Magnetic Resonance Imaging",
    "US": "Ultrasound", "XRAY": "X-Ray", "FLUORO": "Fluoroscopy",
    "LAB": "Laboratory", "PATH": "Pathology", "PHARM": "Pharmacy",
    "REC": "Recovery", "PREP": "Preparation", "CONSULT": "Consultation",
    "ADMIN": "Administration", "CONF": "Conference", "BREAK": "Break Room",
    "STOR": "Storage", "SUPPLY": "Supply", "UTIL": "Utility", "MAINT": "Maintenance",
    
    // 🆕 NEW: Additional medical specialties from your hospital directory
    "ENT": "Otolaryngology", "EAR": "Otolaryngology", "NOSE": "Otolaryngology", "THROAT": "Otolaryngology",
    "HEARING": "Audiology", "AUDIO": "Audiology", "CARDIO": "Cardiology", "HEART": "Cardiology", 
    "EKG": "Electrocardiogram", "ECG": "Electrocardiogram", "ECHO": "Echocardiogram", "CATH": "Catheterization",
    "NEURO": "Neurology", "BRAIN": "Neurology", "NEUROPSYCH": "Neuropsychology", "EEG": "Electroencephalogram",
    "EPILEPSY": "Seizure Disorder", "ONCO": "Oncology", "CANCER": "Oncology", "CHEMO": "Chemotherapy", 
    "BMT": "Bone Marrow Transplant", "HEMATOLOGY": "Blood Disorders", "HEME": "Hematology",
    "PEDS": "Pediatric", "CHILD": "Pediatric", "KIDS": "Pediatric", "NEONATAL": "Newborn",
    "SURG": "Surgery", "OPERATION": "Surgery", "PROCEDURE": "Surgery", "MAXFAC": "Maxillofacial",
    "ORAL SURG": "Oral Surgery", "PLASTIC": "Plastic Surgery", "ORTHO": "Orthopedics", "BONES": "Orthopedics",
    "GI": "Gastroenterology", "GASTRO": "Gastroenterology", "STOMACH": "Gastroenterology",
    "DIGESTIVE": "Gastroenterology", "INTESTINAL": "Gastroenterology", "PULM": "Pulmonary",
    "LUNG": "Pulmonary", "BREATHING": "Pulmonary", "RESPIRATORY": "Pulmonary", "PFT": "Pulmonary Function Test",
    "ENDO": "Endocrinology", "DIABETES": "Endocrinology", "HORMONE": "Endocrinology", "THYROID": "Endocrinology",
    "URO": "Urology", "KIDNEY": "Urology", "BLADDER": "Urology", "DIALYSIS": "Nephrology", "NEPHRO": "Nephrology",
    "OBGYN": "Obstetrics Gynecology", "OB": "Obstetrics", "GYN": "Gynecology", "WOMEN": "Gynecology",
    "PREGNANCY": "Obstetrics", "BIRTH": "Labor and Delivery", "LABOR": "Labor and Delivery",
    "DERM": "Dermatology", "SKIN": "Dermatology", "PSYCH": "Psychiatry", "PSYCHOLOGY": "Psychology", 
    "MENTAL": "Psychiatry", "BEHAVIORAL": "Behavioral Medicine", "AUTISM": "Autism Spectrum Disorder",
    "PHYSICAL": "Physical Therapy", "OCCUPATIONAL": "Occupational Therapy", "SPEECH": "Speech Therapy",
    "ST": "Speech Therapy", "WEIGHT": "Weight Management", "NUTRITION": "Nutrition", "EATING": "Eating Disorders",
    "BLOOD": "Hematology", "DRAW": "Phlebotomy", "LAB WORK": "Laboratory", "BLOOD WORK": "Laboratory",
    "ID": "Infectious Disease", "INFECTION": "Infectious Disease", "PALLIATE": "Palliative Care",
    "COMFORT": "Palliative Care", "END OF LIFE": "Palliative Care", "GENDER": "Gender Clinic",
    "TRANSGENDER": "Gender Clinic", "TRANS": "Gender Clinic", "SLEEP": "Sleep Medicine",
    "SLEEP STUDY": "Sleep Medicine", "SCAN": "Imaging", "IMAGING": "Radiology", "PICTURE": "Radiology",
    "SONO": "Ultrasound", "GENETIC": "Genetics", "GENES": "Genetics", "DNA": "Genetics",
    "RHEUM": "Rheumatology", "ARTHRITIS": "Rheumatology", "JOINT": "Rheumatology",
    "SPORTS": "Sports Medicine", "ATHLETIC": "Sports Medicine", "TRANSPLANT": "Transplant", "ORGAN": "Transplant",
    
    // Room/Space Abbreviations (keeping all your originals)
    "JanClos": "Janitorial Closet", "CleanRm": "Clean Room", "MaintRm": "Maintenance Room", "ExamRm": "Examination Room", "ProcedRm": "Procedure Room", "TrainingRm": "Training Room", "TestRm": "Testing Room", "AnteRm": "Anteroom", "ScrubRm": "Scrub Room", "CallRm": "Call Room", "TubRm": "Tub Room", "ControlRm": "Control Room", "CopyRm": "Copy Room", "StaffRm": "Staff Room", "RecovryRm": "Recovery Room", "StaffLkrRm": "Staff Locker Room", "StrlzerRm": "Sterilizer Room", "StaffShowr": "Staff Shower", "FileRm": "File Room", "ObsrvtnRm": "Observation Room", "PatDress": "Patient Dressing Room", "PatPrep": "Patient Preparation Room", "LockerRm": "Locker Room", "TeamngArea": "Teaming Area", "PatnLounge": "Patient Lounge", "DptLounge": "Department Lounge", "ParntSleep": "Parent Sleep Area", "ParntShwr": "Parent Shower", "NurishmtRm": "Nourishment Room", "PatnKitchn": "Patient Kitchen", "RecepArea": "Reception Area", "OpenWkSta": "Open Workstation", "FlxOpnWkSt": "Flexible Open Workstation", "FlexCubicl": "Flexible Cubicle", "FlexOffice": "Flexible Office", "CompSuppt": "Computer Support", "ReceptWtg": "Reception Waiting", "ReceptClrk": "Reception Clerk", "LobbyVest": "Lobby Vestibule", "MedSupply": "Medical Supply", "PharSupply": "Pharmacy Supply", "SterileStg": "Sterile Storage", "MedGasStrg": "Medical Gas Storage", "VndgWOStg": "Vending with Storage", "SoiledLin": "Soiled Linen", "ClnLin": "Clean Linen", "StrlSoiled": "Sterile Soiled", "StrlStrg": "Sterile Storage", "SupplyRm": "Supply Room", "StorageRm": "Storage Room", "StockRm": "Stock Room", "DptStorage": "Department Storage", "EqmtStrgRm": "Equipment Storage Room", "SuplStgRm": "Supply Storage Room", "ImEquipSup": "Imaging Equipment Supply", "StrlInsSup": "Sterile Instrument Supply", "SrgySupEqm": "Surgery Supply Equipment", "ClnLnMdSup": "Clean Linen Medical Supply", "ClnLin/MdS": "Clean Linen/Medical Supply", "SoiLinSupl": "Soiled Linen Supply", "CServSupp": "Central Service Support", "CentralSup": "Central Supply", "DiagLabSup": "Diagnostic Lab Supply", "DiagTrtmt": "Diagnostic Treatment", "TherTrtmt": "Therapy Treatment", "SurgerySvc": "Surgery Service", "HazardMat": "Hazardous Materials", "AssignCir": "Assigned Circulation", "AssignCirc": "Assigned Circulation", "ExtendStay": "Extended Stay", "InPatnt": "Inpatient", "OutPtToilt": "Outpatient Toilet", "PreOpPtPre": "Pre-Op Patient Prep", "FoodFacSvc": "Food Facility Service", "FoodStPrep": "Food Service Preparation", "Circulat'n": "Circulation", "PublicWait": "Public Waiting", "PubCorr": "Public Corridor", "AsgnToilet": "Assigned Toilet", "StffToilet": "Staff Toilet", "OutPtClsRm": "Outpatient Closet Room", "PubRestRm": "Public Restroom", "AlGnHandic": "All Gender Handicap", "AlGnRestRm": "All Gender Restroom", "Men-Handic": "Men's Handicap", "Wmn-Handic": "Women's Handicap", "DptBreak": "Department Break Room", "DptKitchen": "Department Kitchen", "DptMail": "Department Mail", "Treat/Exam": "Treatment/Examination", "Tr/ExamSvc": "Treatment/Examination Service", "ExamSvc": "Examination Service", "PatienBdrm": "Patient Bedroom", "PatientBth": "Patient Bathroom", "InPatnBth": "In Patient Bathroom", "PatBedSvc": "Patient Bed Service", "NurseStnSr": "Nurse Station Service", "Nurse Stat": "Nurse's Station", "StaffOnCal": "Staff On Call", "StfOnCallS": "Staff On Call Service", "AssemblySv": "Assembly Service", "MerchSvc": "Merchandise Service", "merchandsg": "Merchandising", "MedProdSvc": "Medical Product Service", "RadCT": "Radiology CT", "RadIR": "Radiology Interventional", "RadMRI": "Radiology MRI", "RadNucMed": "Radiology Nuclear Medicine", "RadUltrasd": "Radiology Ultrasound", "RadXRay": "Radiology X-Ray", "DiagSrvLab": "Diagnostic Service Laboratory", "IsotopeRm": "Isotope Room", "FilmPrView": "Film Preview", "BldDrawSta": "Blood Draw Station", "ProsthShop": "Prosthetics Shop", "PhotogSvc": "Photography Service", "ChartFFRm": "Charting/Forms/Files Room", "Decontamin": "Decontamination", "PrepStgRm": "Preparation Staging Room", "ConsultRm": "Consultation Room", "PsychPtIso": "Psychiatric Patient Isolation", "InPatnICU": "Inpatient ICU", "InPatnIso": "Inpatient Isolation", "InPatnPsyc": "Inpatient Psychiatric", "LbrDeliIso": "Labor Delivery Isolation", "LbrDeliv": "Labor Delivery", "NeoICU": "Neonatal ICU", "NeoICUIso": "Neonatal ICU Isolation", "PedInPtPsy": "Pediatric Inpatient Psychiatric", "PedsICU": "Pediatric ICU", "AcThTrtRm": "Acute Therapy Treatment Room", "InPatClsRm": "Inpatient Classroom", "ActPlayRm": "Activity/Play Room", "PatFamAmen": "Patient Family Amenities", "HseOfcrOnC": "House Officer On Call", "MedStuOnC": "Medical Student On Call", "On-CallRm": "On-Call Room", "OnCallClst": "On Call Closet", "OnCallLnge": "On Call Lounge", "OnCllBthrm": "On Call Bathroom", "Ctrl/Obsrv": "Control/Observation", "HVAC": "Heating, Ventilation, and Air Conditioning", "ElectEquip": "Electrical Equipment", "MechEquip": "Mechanical Equipment", "VertShaft": "Vertical Shaft", "Comm": "Communications", "Off.": "Office", "Off": "Office", "Mech.": "Mechanical", "Mech": "Mechanical", "Admin.": "Administration", "Admin": "Administration", "Lab.": "Laboratory", "Lab": "Laboratory", "Stor.": "Storage", "Stor": "Storage", "WC": "Bathroom", "Restroom": "Bathroom", "Corr.": "Corridor", "Corr": "Corridor", 
    
    // Michigan Medicine Departments (keeping all your existing ones) - truncated for space
    "MM CW - Facilities Maintenance": "CW - Facilities Maintenance", "MM - ECT Nursing Services": "ECT Nursing Services", "MM Matl Mgmt - Warehouse Ops": "Material Management - Warehouse Operations", "MM CW Ped Cardiology - Tech": "CW Pediatrics Cardiology - Technical"
    // ... (include all the other MM departments from your original config)
};

// 🆕 NEW: Comprehensive medical misspelling dictionaries
const medicalSpecialtyMisspellings = {
    "cardioligy": "cardiology", "cardiolgoy": "cardiology", "cardiolagy": "cardiology", "cardiologi": "cardiology", 
    "cardiologie": "cardiology", "cardiolgy": "cardiology", "cardiolology": "cardiology", "cardeology": "cardiology",
    "nuerology": "neurology", "neurologoy": "neurology", "neruology": "neurology", "neurolgoy": "neurology", 
    "neuroolgy": "neurology", "nurology": "neurology", "neurolgy": "neurology", "neurallogy": "neurology",
    "orthopaedics": "orthopedics", "orthopaedic": "orthopedic", "orthopedic": "orthopedics", "orthopeadics": "orthopedics", 
    "orthapedics": "orthopedics", "orthopeidcs": "orthopedics", "orthapedic": "orthopedic", "orthopeadic": "orthopedic",
    "gastrenterology": "gastroenterology", "gastroenterolgoy": "gastroenterology", "gastroentrology": "gastroenterology", 
    "gastroentorology": "gastroenterology", "gastroenterolgy": "gastroenterology", "gastrentology": "gastroenterology",
    "dermatolgy": "dermatology", "dermatolgoy": "dermatology", "dermatollogy": "dermatology", "dermotology": "dermatology",
    "opthamology": "ophthalmology", "opthalmology": "ophthalmology", "ophthalmolgoy": "ophthalmology", "opthamalogy": "ophthalmology",
    "otolaryngolgy": "otolaryngology", "otolaryngolgoy": "otolaryngology", "otolaringology": "otolaryngology",
    "rhuematology": "rheumatology", "rheumatolgoy": "rheumatology", "ruematology": "rheumatology", "rheumatolgy": "rheumatology",
    "endocrinoligy": "endocrinology", "endocrinolgoy": "endocrinology", "endocronology": "endocrinology", "endocrinolgy": "endocrinology",
    "oncologoy": "oncology", "oncolgy": "oncology", "oncollogy": "oncology", "onkology": "oncology",
    "hematolgoy": "hematology", "hematollogy": "hematology", "hemataligy": "hematology", "hemotology": "hematology",
    "nephrologoy": "nephrology", "nephrolgoy": "nephrology", "nephrolgy": "nephrology", "nephrollogy": "nephrology",
    "urologoy": "urology", "urolgoy": "urology", "urollogy": "urology", "uroligy": "urology",
    "psychiatrey": "psychiatry", "psychiaty": "psychiatry", "psyciatry": "psychiatry", "psyhiatry": "psychiatry",
    "psychologoy": "psychology", "psycology": "psychology", "psychollogy": "psychology", "psyhology": "psychology"
};

const medicalProcedureMisspellings = {
    "xray": "x-ray", "x ray": "x-ray", "exray": "x-ray", "ultrasond": "ultrasound", "utrasound": "ultrasound",
    "mamogram": "mammogram", "mamograph": "mammogram", "colonscopy": "colonoscopy", "coloscopy": "colonoscopy",
    "phisical therapy": "physical therapy", "fisical therapy": "physical therapy", "speach therapy": "speech therapy",
    "blod work": "blood work", "bloodwork": "blood work", "surgury": "surgery", "surgerie": "surgery"
};

const medicalConditionMisspellings = {
    "diabetis": "diabetes", "diabeties": "diabetes", "diabetese": "diabetes", "hypertention": "hypertension",
    "arthitis": "arthritis", "arthitus": "arthritis", "pnemonia": "pneumonia", "asma": "asthma",
    "alzheimers": "alzheimer", "alzhiemers": "alzheimer", "parkinsons": "parkinson", "depresion": "depression",
    "anxeity": "anxiety", "anxety": "anxiety", "epilepsi": "epilepsy", "epelepsy": "epilepsy"
};

const anatomyMisspellings = {
    "stomache": "stomach", "stomack": "stomach", "hart": "heart", "herat": "heart", "brane": "brain",
    "brian": "brain", "kidny": "kidney", "kidnies": "kidney", "lever": "liver", "livr": "liver",
    "thyroids": "thyroid", "thyriod": "thyroid", "tyroid": "thyroid"
};

// 🆕 NEW: Medical condition to specialty mapping
const conditionToSpecialty = {
    "headache": ["neurology", "pain management"], "seizure": ["neurology", "epilepsy"],
    "heart problems": ["cardiology"], "chest pain": ["cardiology", "emergency"],
    "breathing problems": ["pulmonary", "respiratory"], "stomach pain": ["gastroenterology", "emergency"],
    "joint pain": ["rheumatology", "orthopedics"], "back pain": ["orthopedics", "pain management", "physical therapy"],
    "skin problems": ["dermatology"], "eye problems": ["ophthalmology"], "ear problems": ["otolaryngology", "ent"],
    "hearing loss": ["audiology", "ent"], "pregnancy": ["obstetrics", "ob"], "diabetes": ["endocrinology"],
    "cancer": ["oncology", "hematology"], "blood disorder": ["hematology"], "kidney problems": ["nephrology", "urology"],
    "depression": ["psychiatry", "psychology"], "anxiety": ["psychiatry", "psychology"],
    "eating disorder": ["eating disorders", "psychiatry"], "autism": ["autism", "developmental"],
    "sleep problems": ["sleep medicine"], "weight loss": ["weight management", "nutrition"],
    "hormone problems": ["endocrinology"], "infection": ["infectious disease"], "broken bone": ["orthopedics", "emergency"]
};

// 🆕 NEW: Procedure/test to specialty mapping  
const procedureToSpecialty = {
    "blood draw": ["laboratory", "phlebotomy"], "blood test": ["laboratory"], "x-ray": ["radiology", "imaging"],
    "mri": ["radiology", "imaging"], "ct scan": ["radiology", "imaging"], "ultrasound": ["radiology", "imaging"],
    "ekg": ["cardiology"], "ecg": ["cardiology"], "echo": ["cardiology"], "eeg": ["neurology"],
    "colonoscopy": ["gastroenterology"], "endoscopy": ["gastroenterology"], "biopsy": ["pathology", "surgery"],
    "surgery": ["surgery"], "physical therapy": ["physical therapy", "rehabilitation"],
    "occupational therapy": ["occupational therapy"], "speech therapy": ["speech therapy"],
    "chemotherapy": ["oncology", "infusion"], "radiation": ["radiation oncology"], "dialysis": ["nephrology"],
    "sleep study": ["sleep medicine"], "stress test": ["cardiology"], "pulmonary function": ["pulmonary"],
    "allergy test": ["allergy", "immunology"]
};

// 🆕 NEW: Reverse abbreviation map for bidirectional search
const reverseAbbreviationMap = {};
Object.entries(abbreviationMap).forEach(([abbr, full]) => {
    const fullLower = full.toLowerCase();
    const abbrLower = abbr.toLowerCase();
    
    reverseAbbreviationMap[fullLower] = abbrLower;
    
    const words = fullLower.split(/[\s\-\/]+/);
    if (words.length > 1) {
        const firstTwo = words.slice(0, 2).join(' ');
        if (firstTwo.length > 3) {
            reverseAbbreviationMap[firstTwo] = abbrLower;
        }
        
        words.forEach(word => {
            if (word.length > 3 && !reverseAbbreviationMap[word]) {
                reverseAbbreviationMap[word] = abbrLower;
            }
        });
    }
});

// 🆕 NEW: Comprehensive misspelling correction system
class MedicalSpellingCorrector {
    constructor() {
        this.corrections = {
            ...medicalSpecialtyMisspellings,
            ...medicalProcedureMisspellings, 
            ...medicalConditionMisspellings,
            ...anatomyMisspellings
        };
        
        this.correctWords = new Set(Object.values(this.corrections));
        this.misspelledWords = new Set(Object.keys(this.corrections));
    }
    
    correctSpelling(word) {
        const lowercase = word.toLowerCase();
        return this.corrections[lowercase] || word;
    }
    
    findClosestMatch(word, maxDistance = 2) {
        const lowercase = word.toLowerCase();
        
        if (this.corrections[lowercase]) {
            return this.corrections[lowercase];
        }
        
        let bestMatch = word;
        let bestDistance = maxDistance + 1;
        
        for (let correctWord of this.correctWords) {
            const distance = this.levenshteinDistance(lowercase, correctWord);
            if (distance <= maxDistance && distance < bestDistance) {
                bestMatch = correctWord;
                bestDistance = distance;
            }
        }
        
        for (let misspelled of this.misspelledWords) {
            const distance = this.levenshteinDistance(lowercase, misspelled);
            if (distance <= 1 && distance < bestDistance) {
                bestMatch = this.corrections[misspelled];
                bestDistance = distance;
            }
        }
        
        return bestMatch;
    }
    
    levenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }
    
    correctSearchQuery(query) {
        const words = query.toLowerCase().split(/\s+/);
        const correctedWords = words.map(word => {
            let corrected = this.correctSpelling(word);
            
            if (corrected === word && word.length > 4) {
                corrected = this.findClosestMatch(word);
            }
            
            return corrected;
        });
        
        const correctedQuery = correctedWords.join(' ');
        
        if (correctedQuery !== query.toLowerCase()) {
            console.log(`🔤 Spelling correction: "${query}" → "${correctedQuery}"`);
        }
        
        return correctedQuery;
    }
}

// 🆕 NEW: Enhanced bidirectional search function
function findBidirectionalMatches(searchTerm) {
    const term = searchTerm.toLowerCase().trim();
    const matches = new Set();
    
    if (abbreviationMap[searchTerm.toUpperCase()]) {
        matches.add(abbreviationMap[searchTerm.toUpperCase()].toLowerCase());
        matches.add(searchTerm.toLowerCase());
    }
    
    if (reverseAbbreviationMap[term]) {
        matches.add(reverseAbbreviationMap[term]);
        matches.add(term);
    }
    
    Object.entries(abbreviationMap).forEach(([abbr, full]) => {
        const fullLower = full.toLowerCase();
        const abbrLower = abbr.toLowerCase();
        
        if (fullLower.includes(term) && term.length > 2) {
            matches.add(abbrLower);
            matches.add(fullLower);
        }
        
        if (abbrLower.includes(term) && term.length > 1) {
            matches.add(abbrLower);
            matches.add(fullLower);
        }
    });
    
    return Array.from(matches);
}

// 🆕 NEW: Enhanced search expansion with spelling correction
function enhancedSearchExpansionWithSpelling(query) {
    const spellChecker = new MedicalSpellingCorrector();
    const correctedQuery = spellChecker.correctSearchQuery(query);
    const normalizedQuery = correctedQuery.toLowerCase().trim();
    const expansions = new Set([normalizedQuery, query.toLowerCase().trim()]);
    
    const bidirectional = findBidirectionalMatches(normalizedQuery);
    bidirectional.forEach(match => expansions.add(match));
    
    Object.entries(conditionToSpecialty).forEach(([condition, specialties]) => {
        if (normalizedQuery.includes(condition)) {
            specialties.forEach(specialty => expansions.add(specialty));
        }
    });
    
    Object.entries(procedureToSpecialty).forEach(([procedure, specialties]) => {
        if (normalizedQuery.includes(procedure)) {
            specialties.forEach(specialty => expansions.add(specialty));
        }
    });
    
    return Array.from(expansions);
}

const fullReplacements = { 
    "Circulation Public Corridor": "Corridor", "Circulation Lobby Vestibule": "Lobby", 
    "Circulation Stair": "Stairwell", "Circulation Elevator": "Elevator", "Circulation Dock": "Loading Dock", 
    "Public Toilet Uni-Sex": "Unisex Public Bathroom", "Public Toilet Men": "Men's Public Bathroom", 
    "Public Toilet Women": "Women's Public Bathroom", "OutPtToilt": "Public Bathroom", 
    "Mechanical Electrical Equipment": "Electrical Room", "Mechanical Mechanical Equipment": "Mechanical Room", 
    "Mechanical HVAC": "HVAC Room", "Mechanical Vertical Shaft": "Vertical Shaft", 
    "Mechanical Communications": "Communications Room", "HazardMat HazardMat": "Hazardous Materials Storage", 
    "Conference Conference": "Conference Room", "Office Office": "Office", "Surgery Operating": "Operating Room" 
};

const tagRules = [ 
    { pattern: /operating|surgery|or\b/i, tag: "surgery", priority: 10 },
    { pattern: /icu|intensive|critical/i, tag: "critical-care", priority: 10 },
    { pattern: /emergency|er\b|trauma/i, tag: "emergency", priority: 10 },
    { pattern: /labor|delivery|birth|maternity/i, tag: "maternity", priority: 9 },
    { pattern: /pediatric|peds|child|nicu|picu/i, tag: "pediatric", priority: 9 },
    { pattern: /exam|treatment|therapy|medical|nurse|clinic/i, tag: "clinical", priority: 8 },
    { pattern: /radiology|imaging|ct|mri|xray|ultrasound/i, tag: "imaging", priority: 8 },
    { pattern: /laboratory|lab|pathology|blood/i, tag: "laboratory", priority: 8 },
    { pattern: /pharmacy|medication|drug/i, tag: "pharmacy", priority: 7 },
    { pattern: /patient|bed|room|family|visitor/i, tag: "patient-care", priority: 7 },
    { pattern: /recovery|pacu|post.*anesthesia/i, tag: "recovery", priority: 7 },
    { pattern: /outpatient toilet|public toilet|pub.*restroom/i, tag: "public-restroom", priority: 7 },
    { pattern: /toilet|bathroom|shower|restroom|wc/i, tag: "restroom", priority: 6 },
    { pattern: /security|access|control|monitor/i, tag: "security", priority: 6 },
    { pattern: /handicap|accessible|disability/i, tag: "accessible", priority: 6 },
    { pattern: /office|admin|conference|meeting|lounge/i, tag: "administration", priority: 5 },
    { pattern: /staff.*only|restricted|authorized/i, tag: "restricted", priority: 5 },
    { pattern: /storage|supply|equipment|closet/i, tag: "storage", priority: 4 },
    { pattern: /kitchen|food|dining|nutrition/i, tag: "food-service", priority: 4 },
    { pattern: /mechanical|electrical|maintenance|hvac|communications/i, tag: "infrastructure", priority: 3 },
    { pattern: /corridor|stair|elevator|lobby|circulation/i, tag: "circulation", priority: 2 }
];

const roomPriorityMap = {
    "surgery": 10, "critical-care": 10, "emergency": 10,
    "maternity": 9, "pediatric": 9,
    "clinical": 8, "imaging": 8, "laboratory": 8,
    "patient-care": 7, "recovery": 7, "pharmacy": 7, "public-restroom": 7,
    "restroom": 6, "security": 6, "accessible": 6,
    "administration": 5, "restricted": 5,
    "storage": 4, "food-service": 4,
    "infrastructure": 3,
    "circulation": 2
};

const searchShortcuts = {
    "or": "surgery operating room", "icu": "intensive care critical", "er": "emergency",
    "lab": "laboratory", "rad": "radiology imaging", "pharmacy": "pharmacy medication",
    "bathroom": "restroom toilet", "office": "administration office", "pacu": "recovery post anesthesia",
    "nicu": "pediatric neonatal intensive", "picu": "pediatric intensive care", "ct": "imaging computed tomography",
    "mri": "imaging magnetic resonance", "storage": "storage supply equipment"
};

// 🆕 NEW: Initialize global spell checker instance
const medicalSpellChecker = new MedicalSpellingCorrector();

// 🆕 NEW: Easy-to-use spelling correction function
function correctMedicalSpelling(query) {
    return medicalSpellChecker.correctSearchQuery(query);
}

// 🆕 NEW: Export all functions globally for use in other scripts
if (typeof window !== 'undefined') {
    window.findBidirectionalMatches = findBidirectionalMatches;
    window.enhancedSearchExpansionWithSpelling = enhancedSearchExpansionWithSpelling;
    window.reverseAbbreviationMap = reverseAbbreviationMap;
    window.MedicalSpellingCorrector = MedicalSpellingCorrector;
    window.medicalSpellChecker = medicalSpellChecker;
    window.correctMedicalSpelling = correctMedicalSpelling;
    window.conditionToSpecialty = conditionToSpecialty;
    window.procedureToSpecialty = procedureToSpecialty;
}

// 🆕 NEW: Enhanced search function that combines everything
function intelligentMedicalSearch(query) {
    // Step 1: Correct spelling
    const correctedQuery = correctMedicalSpelling(query);
    
    // Step 2: Expand search terms
    const expandedTerms = enhancedSearchExpansionWithSpelling(correctedQuery);
    
    // Step 3: Find bidirectional matches
    const bidirectionalMatches = findBidirectionalMatches(correctedQuery);
    
    // Step 4: Combine all results
    const allTerms = new Set([...expandedTerms, ...bidirectionalMatches]);
    
    return {
        originalQuery: query,
        correctedQuery: correctedQuery,
        searchTerms: Array.from(allTerms),
        spellingCorrected: correctedQuery !== query.toLowerCase()
    };
}
