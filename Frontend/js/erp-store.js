/**
 * MK ANIMAL HEALTH ERP - CENTRAL DATA & STATE ENGINE (erp-store.js)
 * Implements persistent localStorage data models matching the MySQL schema.
 */

(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.ERPStore = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {

    const STORAGE_KEY = 'MK_ANIMAL_HEALTH_ERP_DATA_V2';
    const SESSION_KEY = 'MK_ERP_SESSION_USER';

    // Helper: generate IDs
    function genId(prefix = 'ID') {
        return prefix + '-' + Math.floor(100000 + Math.random() * 900000);
    }

    // Default Seed Dataset
    const defaultData = {
        settings: {
            companyName: 'MK Animal Health Pvt Ltd',
            tagline: 'Smart Distribution Management System',
            gstNumber: '27AABCM5678Q1Z4',
            dlNumber: 'MH-WZ2-124578',
            panNumber: 'AABCM5678Q',
            email: 'contact@mkanimalhealth.com',
            phone: '+91 98220 12345',
            address: 'Plot 42, MIDC Industrial Area, Jalgaon - 425001, Maharashtra, India',
            currency: '₹',
            defaultGst: 12
        },
        branches: [
            { id: 1, name: 'Pune Central Depot', code: 'BR-PUN', city: 'Pune', manager: 'Sanjay More', contact: '+91 98231 11223', stockCapacity: 15000, currentStock: 8940 },
            { id: 2, name: 'Jalgaon Regional Hub', code: 'BR-JLG', city: 'Jalgaon', manager: 'Ramesh Patil', contact: '+91 94222 33445', stockCapacity: 12000, currentStock: 7420 },
            { id: 3, name: 'Nashik Logistics Hub', code: 'BR-NSK', city: 'Nashik', manager: 'Vikram Joshi', contact: '+91 97654 55667', stockCapacity: 10000, currentStock: 5210 },
            { id: 4, name: 'Kolhapur Distribution Point', code: 'BR-KLP', city: 'Kolhapur', manager: 'Anand Shinde', contact: '+91 98901 77889', stockCapacity: 8000, currentStock: 3890 }
        ],
        products: [
            {
                id: 1,
                code: 'MK-AIC-01',
                name: 'AI Care',
                category: 'Feed Supplement',
                mrp: 600,
                sellingPrice: 540,
                gstRate: 12,
                stock: 75,
                reorderLevel: 25,
                unit: '1000 ml Bottle',
                description: 'Advanced nutritional feed supplement for improving conception rates, uterine health, and overall bovine reproduction.',
                benefits: ['Improves AI conception rates', 'Cleanses uterine environment', 'Enhances fertility cycles'],
                composition: ['Vitamins A, D3, E', 'Organic Zinc & Copper', 'Ashwagandha Extract', 'Shatavari Extract'],
                indications: ['Repeat breeding', 'Delayed heat', 'Post-calving uterine care'],
                dosage: '100 ml daily for 10 consecutive days post-AI',
                imageFolder: 'ai-care',
                images: ['../assets/products/ai-care/1.jpg', '../assets/products/ai-care/2.jpg']
            },
            {
                id: 2,
                code: 'MK-CLF-02',
                name: 'Calf Boost',
                category: 'Feed Supplement',
                mrp: 480,
                sellingPrice: 420,
                gstRate: 12,
                stock: 90,
                reorderLevel: 20,
                unit: '500 ml Bottle',
                description: 'Growth promoter and immune activator designed specifically for newborn and developing calves.',
                benefits: ['Accelerates daily weight gain', 'Prevents early calf mortality', 'Stimulates early rumen development'],
                composition: ['Colostrum peptides', 'Immunoglobulins', 'B-Complex vitamins', 'Chelated minerals'],
                indications: ['Stunted growth', 'Post-diarrhea convalescence', 'Low weaning weight'],
                dosage: '30 ml daily for young calves',
                imageFolder: 'calf-boost',
                images: ['../assets/products/calf-boost/1.jpg', '../assets/products/calf-boost/2.jpg']
            },
            {
                id: 3,
                code: 'MK-CDB-03',
                name: 'Cal-D-Boost Gel',
                category: 'Calcium',
                mrp: 290,
                sellingPrice: 260,
                gstRate: 12,
                stock: 130,
                reorderLevel: 30,
                unit: '300 gm Gel Tube',
                description: 'High energy ionic calcium gel with Vitamin D3 & phosphorus for instantaneous prevention and treatment of Milk Fever.',
                benefits: ['Instant calcium spike', 'Zero risk of aspiration pneumonia', 'Restores smooth muscle tone'],
                composition: ['Ionic Calcium 43.5g', 'Phosphorus 22g', 'Vitamin D3 8000 IU', 'Energy base (Propylene Glycol)'],
                indications: ['Clinical & subclinical Hypocalcemia (Milk Fever)', 'Dystocia', 'Uterine inertia'],
                dosage: 'One tube at onset of calving, repeat after 12-24 hours',
                imageFolder: 'cal-d-boost-gel',
                images: ['../assets/products/cal-d-boost-gel/1.jpg', '../assets/products/cal-d-boost-gel/2.jpg']
            },
            {
                id: 4,
                code: 'MK-BUP-04',
                name: 'Bupalex',
                category: 'Veterinary Medicine',
                mrp: 1450,
                sellingPrice: 1320,
                gstRate: 12,
                stock: 45,
                reorderLevel: 15,
                unit: '20 ml Vial',
                description: 'Potent Buparvaquone injectable suspension for definitive cure of Theileriosis (Tick Fever) in cattle.',
                benefits: ['Single-dose efficacy', 'Rapidly clears schizonts and piroplasms', 'Saves high-yielding crossbred cows'],
                composition: ['Buparvaquone 50 mg/ml'],
                indications: ['Bovine Theileriosis', 'Tick-borne protozoal fevers'],
                dosage: '1 ml per 20 kg body weight IM deep into neck muscle',
                imageFolder: 'bupalex',
                images: ['../assets/products/bupalex/1.jpg', '../assets/products/bupalex/2.jpg']
            },
            {
                id: 5,
                code: 'MK-CFT-05',
                name: 'Ceftim-Tazo',
                category: 'Veterinary Medicine',
                mrp: 650,
                sellingPrice: 580,
                gstRate: 12,
                stock: 80,
                reorderLevel: 25,
                unit: '3.375 gm Vial',
                description: 'Broad-spectrum 4th generation cephalosporin with beta-lactamase inhibitor for severe refractory infections.',
                benefits: ['Overcomes penicillinase resistance', 'Excellent udder tissue penetration', 'Broad coverage against G+ and G- pathogens'],
                composition: ['Ceftriaxone Sodium 3000 mg', 'Tazobactam Sodium 375 mg'],
                indications: ['Severe peracute Mastitis', 'Hemorrhagic Septicemia (HS)', 'Bronchopneumonia', 'Metritis'],
                dosage: '5-10 mg/kg body weight IM or IV daily for 3 days',
                imageFolder: 'ceftim-tazo',
                images: ['../assets/products/ceftim-tazo/1.jpg', '../assets/products/ceftim-tazo/2.jpg']
            },
            {
                id: 6,
                code: 'MK-CFR-06',
                name: 'Ceftur',
                category: 'Veterinary Medicine',
                mrp: 820,
                sellingPrice: 740,
                gstRate: 12,
                stock: 60,
                reorderLevel: 20,
                unit: '1 gm Injection',
                description: 'Ceftiofur crystalline sterile powder for zero-milk-withholding treatment of acute respiratory disease and interdigital necrobacillosis.',
                benefits: ['ZERO milk withdrawal period', 'High bactericidal activity in lung tissues', 'Excellent safety profile in lactating cows'],
                composition: ['Ceftiofur Sodium 1000 mg'],
                indications: ['Bovine Respiratory Disease (Shipping Fever)', 'Acute foot rot', 'Acute post-partum Metritis'],
                dosage: '1.1 to 2.2 mg/kg body weight IM once daily for 3 to 5 days',
                imageFolder: 'ceftur',
                images: ['../assets/products/ceftur/1.jpg', '../assets/products/ceftur/2.jpg']
            },
            {
                id: 7,
                code: 'MK-FNP-07',
                name: 'Fentop Plus',
                category: 'Veterinary Medicine',
                mrp: 340,
                sellingPrice: 300,
                gstRate: 12,
                stock: 110,
                reorderLevel: 30,
                unit: '100 ml Suspension',
                description: 'Comprehensive broad-spectrum dewormer targeting flukes, tapeworms, and roundworms.',
                benefits: ['Broad-spectrum anthelmintic', 'Ovicidal and larvicidal', 'Improves body condition score'],
                composition: ['Fenbendazole 10% w/v', 'Praziquantel 2.5% w/v'],
                indications: ['Fascioliasis', 'Amphistomiasis', 'GI Nematodiasis', 'Cestode infections'],
                dosage: '5-7.5 mg/kg body weight orally',
                imageFolder: 'fentop-plus',
                images: ['../assets/products/fentop-plus/1.jpg', '../assets/products/fentop-plus/2.jpg']
            },
            {
                id: 8,
                code: 'MK-HBP-08',
                name: 'HB Plus',
                category: 'Feed Supplement',
                mrp: 380,
                sellingPrice: 335,
                gstRate: 12,
                stock: 95,
                reorderLevel: 25,
                unit: '1 Litre Bottle',
                description: 'Hematinic tonic enriched with iron, cobalt, copper, and folic acid to combat anemia and weakness.',
                benefits: ['Stimulates erythropoiesis', 'Quickly elevates hemoglobin levels', 'Overcomes nutritional debility'],
                composition: ['Ferrous Gluconate', 'Copper Sulphate', 'Cobalt Chloride', 'Vitamin B12', 'Folic Acid'],
                indications: ['Tick fever convalescence', 'Post-hemorrhagic anemia', 'General unthriftiness'],
                dosage: '50-100 ml daily orally',
                imageFolder: 'hb-plus',
                images: ['../assets/products/hb-plus/1.jpg']
            },
            {
                id: 9,
                code: 'MK-KSV-09',
                name: 'Kasvadh-H',
                category: 'Feed Supplement',
                mrp: 520,
                sellingPrice: 460,
                gstRate: 12,
                stock: 85,
                reorderLevel: 25,
                unit: '500 ml Bottle',
                description: 'Specialized herbal galactagogue that activates mammary alveoli and optimizes milk letdown and peak yield.',
                benefits: ['Increases daily milk yield naturally', 'Improves SNF and fat percentage', 'Relieves stress-induced agalactia'],
                composition: ['Jivanti (Leptadenia reticulata)', 'Shatavari', 'Kamboji', 'Vidarikand', 'Fenugreek'],
                indications: ['Hypogalactia', 'Delayed milk letdown', 'Drop in production after disease'],
                dosage: '50 ml twice daily for 10-15 days',
                imageFolder: 'kasvadh-h',
                images: ['../assets/products/kasvadh-h/1.jpg', '../assets/products/kasvadh-h/2.jpg']
            },
            {
                id: 10,
                code: 'MK-LIV-10',
                name: 'Liv Plus',
                category: 'Feed Supplement',
                mrp: 410,
                sellingPrice: 360,
                gstRate: 12,
                stock: 140,
                reorderLevel: 35,
                unit: '1 Litre Bottle',
                description: 'Advanced hepatoprotective tonic with herbal extracts and choline chloride for fatty liver prevention and appetite stimulation.',
                benefits: ['Restores hepatic glycogen reserves', 'Detoxifies metabolic toxins', 'Sharpens appetite and ruminal activity'],
                composition: ['Tricholine Citrate', 'Liver extract', 'Inositol', 'Vitamin B12', 'Silymarin extract'],
                indications: ['Fatty liver syndrome', 'Ketosis', 'Mycotoxicosis', 'Anorexia'],
                dosage: '50-100 ml daily for 7 days',
                imageFolder: 'liv-plus',
                images: ['../assets/products/liv-plus/1.jpg', '../assets/products/liv-plus/2.jpg']
            },
            {
                id: 11,
                code: 'MK-MST-11',
                name: 'Masti-Out',
                category: 'Veterinary Medicine',
                mrp: 750,
                sellingPrice: 660,
                gstRate: 12,
                stock: 70,
                reorderLevel: 20,
                unit: 'Kit (Oral + Spray)',
                description: 'Comprehensive non-antibiotic supportive kit for clinical and subclinical Mastitis management.',
                benefits: ['Reduces somatic cell count (SCC)', 'Regenerates mammary epithelial cells', 'Dissolves clots and flakes in milk'],
                composition: ['Trisodium Citrate', 'Potassium Iodide', 'Vitamin A & E', 'Copper & Zinc Chelates', 'Serratiopeptidase'],
                indications: ['Subclinical & clinical Mastitis', 'Hard udder syndrome', 'Blood in milk'],
                dosage: 'Entire sachet once daily for 4 days',
                imageFolder: 'masti-out',
                images: ['../assets/products/masti-out/1.jpg', '../assets/products/masti-out/2.jpg']
            },
            {
                id: 12,
                code: 'MK-MLX-12',
                name: 'Meloxi Plus',
                category: 'Veterinary Medicine',
                mrp: 230,
                sellingPrice: 195,
                gstRate: 12,
                stock: 160,
                reorderLevel: 40,
                unit: '100 ml Vial',
                description: 'Potent non-steroidal anti-inflammatory and antipyretic (NSAID) with Paracetamol for pain and high fever.',
                benefits: ['Rapid pain relief', 'Long 24-hr anti-inflammatory action', 'Safe on gastric mucosa'],
                composition: ['Meloxicam 5 mg/ml', 'Paracetamol 150 mg/ml'],
                indications: ['Pyrexia (high fever)', 'Mastitis swelling', 'Musculoskeletal pain', 'Post-operative inflammation'],
                dosage: '0.5 mg/kg body weight IM/IV',
                imageFolder: 'meloxi-plus',
                images: ['../assets/products/meloxi-plus/1.jpg', '../assets/products/meloxi-plus/2.jpg']
            },
            {
                id: 13,
                code: 'MK-MRG-13',
                name: 'Miracal Gold',
                category: 'Calcium',
                mrp: 920,
                sellingPrice: 810,
                gstRate: 12,
                stock: 65,
                reorderLevel: 20,
                unit: '5 Litre Jar',
                description: 'High-potency liquid calcium enriched with organic phosphorus, Zinc, Cobalt, and galactagogue herbs for sustainable high milk yield.',
                benefits: ['Consistent daily milk yield maintenance', 'Prevents peak-yield crashes', 'Improves skeletal strength'],
                composition: ['Calcium 35,000 mg', 'Phosphorus 17,500 mg', 'Vitamin D3 160,000 IU', 'Vitamin B12 2,000 mcg', 'Herbal extracts'],
                indications: ['Lactating high-yielding cows & buffaloes', 'Pregnancy calcium buffer'],
                dosage: '100 ml daily orally',
                imageFolder: 'miracal-gold',
                images: ['../assets/products/miracal-gold/1.jpg', '../assets/products/miracal-gold/2.jpg']
            },
            {
                id: 14,
                code: 'MK-SST-14',
                name: 'Silo Strong',
                category: 'Feed Supplement',
                mrp: 850,
                sellingPrice: 750,
                gstRate: 12,
                stock: 40,
                reorderLevel: 15,
                unit: '1 kg Pouch',
                description: 'Biological silage inoculant with live lactic acid bacteria and enzymes for rapid anaerobic fermentation and green fodder preservation.',
                benefits: ['Preserves green fodder nutrients', 'Minimizes mold and spoilage losses', 'Increases silage palatability'],
                composition: ['Lactobacillus plantarum', 'Pediococcus acidilactici', 'Cellulase & Xylanase enzymes'],
                indications: ['Corn, sorghum, and Napier silage pits', 'Bunker silage treatment'],
                dosage: '1 kg per 50 metric tons of green chopped fodder',
                imageFolder: 'silo-strong',
                images: ['../assets/products/silo-strong/1.jpg', '../assets/products/silo-strong/2.jpg']
            },
            {
                id: 15,
                code: 'MK-SBR-15',
                name: 'Super Boost',
                category: 'Feed Supplement',
                mrp: 620,
                sellingPrice: 550,
                gstRate: 12,
                stock: 55,
                reorderLevel: 20,
                unit: '1 Litre Bottle',
                description: 'High energy gluconeogenic precursor liquid for ketosis reversal and peak metabolic support in transitioning cows.',
                benefits: ['Instant blood glucose elevation', 'Combats negative energy balance (NEB)', 'Reduces body fat mobilization'],
                composition: ['Propylene Glycol 90%', 'Niacinamide 1000 mg', 'Cobalt Sulphate', 'Vitamin B12'],
                indications: ['Subclinical & clinical Ketosis', 'Off-feed transition cows', 'Low dry matter intake'],
                dosage: '200 ml twice daily for 3 days',
                imageFolder: 'super-boost',
                images: ['../assets/products/super-boost/1.jpg', '../assets/products/super-boost/2.jpg']
            },
            {
                id: 16,
                code: 'MK-ZAT-16',
                name: 'Zatakaa',
                category: 'Veterinary Medicine',
                mrp: 280,
                sellingPrice: 240,
                gstRate: 12,
                stock: 120,
                reorderLevel: 30,
                unit: '50 ml Spray',
                description: 'Fly repellent, antiseptic, and maggot wound healing spray with pure herbal essential oils.',
                benefits: ['Kills maggots on contact', 'Forms protective waterproof film', 'Prevents myiasis fly attacks'],
                composition: ['Eucalyptus oil', 'Neem oil', 'Camphor', 'Pinus longifolia extract'],
                indications: ['Maggot wounds', 'Surgical incisions', 'FMD claw lesions', 'Shearing cuts'],
                dosage: 'Spray twice daily on cleaned affected area',
                imageFolder: 'zatakaa',
                images: ['../assets/products/zatakaa/1.jpg']
            }
        ],
        orders: [
            {
                id: 1,
                orderNumber: 'ORD-2026-1001',
                customerName: 'Pune Veterinary Polyclinic',
                customerType: 'DOCTOR',
                branchId: 1,
                branchName: 'Pune Central Depot',
                date: '2026-11-20T10:30:00Z',
                status: 'COMPLETED',
                subtotal: 22857.14,
                taxAmount: 2742.86,
                grandTotal: 25600.00,
                items: [
                    { productId: 5, productName: 'Ceftim-Tazo', quantity: 20, unitPrice: 580, total: 11600 },
                    { productId: 4, productName: 'Bupalex', quantity: 10, unitPrice: 1320, total: 13200 },
                    { productId: 12, productName: 'Meloxi Plus', quantity: 4, unitPrice: 200, total: 800 }
                ]
            },
            {
                id: 2,
                orderNumber: 'ORD-2026-1002',
                customerName: 'Sai Dairy & Animal Pharmacy',
                customerType: 'PHARMACY',
                branchId: 2,
                branchName: 'Jalgaon Regional Hub',
                date: '2026-11-21T09:15:00Z',
                status: 'CONFIRMED',
                subtotal: 16741.07,
                taxAmount: 2008.93,
                grandTotal: 18750.00,
                items: [
                    { productId: 13, productName: 'Miracal Gold', quantity: 15, unitPrice: 810, total: 12150 },
                    { productId: 3, productName: 'Cal-D-Boost Gel', quantity: 20, unitPrice: 260, total: 5200 },
                    { productId: 16, productName: 'Zatakaa', quantity: 6, unitPrice: 233.33, total: 1400 }
                ]
            },
            {
                id: 3,
                orderNumber: 'ORD-2026-1003',
                customerName: 'Kisan Pashu Seva Kendra',
                customerType: 'PHARMACY',
                branchId: 3,
                branchName: 'Nashik Logistics Hub',
                date: '2026-11-21T14:40:00Z',
                status: 'PENDING',
                subtotal: 28928.57,
                taxAmount: 3471.43,
                grandTotal: 32400.00,
                items: [
                    { productId: 1, productName: 'AI Care', quantity: 30, unitPrice: 540, total: 16200 },
                    { productId: 10, productName: 'Liv Plus', quantity: 25, unitPrice: 360, total: 9000 },
                    { productId: 14, productName: 'Silo Strong', quantity: 9.6, unitPrice: 750, total: 7200 }
                ]
            }
        ],
        invoices: [
            {
                id: 1,
                invoiceNumber: 'INV-2026-8801',
                orderNumber: 'ORD-2026-1001',
                buyerName: 'Pune Veterinary Polyclinic',
                buyerType: 'DOCTOR',
                buyerAddress: 'Aundh Camp Road, Pune, Maharashtra 411007',
                buyerGst: '27AALCP1092M1Z2',
                buyerPhone: '+91 98221 44556',
                date: '2026-11-20',
                subtotal: 22857.14,
                cgst: 1371.43,
                sgst: 1371.43,
                igst: 0.00,
                totalTax: 2742.86,
                grandTotal: 25600.00,
                paymentStatus: 'PAID',
                paymentMethod: 'UPI / NEFT',
                paymentRef: 'UPI-AXIS-9920148',
                items: [
                    { name: 'Ceftim-Tazo 3.375g', code: 'MK-CFT-05', qty: 20, price: 580, taxRate: 12, total: 11600 },
                    { name: 'Bupalex 20ml', code: 'MK-BUP-04', qty: 10, price: 1320, taxRate: 12, total: 13200 },
                    { name: 'Meloxi Plus 100ml', code: 'MK-MLX-12', qty: 4, price: 200, taxRate: 12, total: 800 }
                ]
            },
            {
                id: 2,
                invoiceNumber: 'INV-2026-8802',
                orderNumber: 'ORD-2026-1002',
                buyerName: 'Sai Dairy & Animal Pharmacy',
                buyerType: 'PHARMACY',
                buyerAddress: 'Station Road, Chalisgaon, Jalgaon - 424101',
                buyerGst: '27AAMPS4491Q1ZP',
                buyerPhone: '+91 94227 88990',
                date: '2026-11-21',
                subtotal: 16741.07,
                cgst: 1004.47,
                sgst: 1004.47,
                igst: 0.00,
                totalTax: 2008.93,
                grandTotal: 18750.00,
                paymentStatus: 'PARTIAL',
                paymentMethod: 'CHEQUE',
                paymentRef: 'CHQ-HDFC-00124',
                items: [
                    { name: 'Miracal Gold 5L', code: 'MK-MRG-13', qty: 15, price: 810, taxRate: 12, total: 12150 },
                    { name: 'Cal-D-Boost Gel 300g', code: 'MK-CDB-03', qty: 20, price: 260, taxRate: 12, total: 5200 },
                    { name: 'Zatakaa Spray 50ml', code: 'MK-ZAT-16', qty: 6, price: 233.33, taxRate: 12, total: 1400 }
                ]
            }
        ],
        doctors: [
            { id: 1, name: 'Dr. Ramesh Kulkarni', clinic: 'Kulkarni Veterinary Clinic', area: 'Jalgaon North', phone: '+91 98220 11221', targetMonthly: 60000, achieved: 45000, visitsThisMonth: 3 },
            { id: 2, name: 'Dr. Sunita Patil', clinic: 'Gau Seva Polyclinic', area: 'Bhusawal Road', phone: '+91 94221 33442', targetMonthly: 75000, achieved: 62000, visitsThisMonth: 4 },
            { id: 3, name: 'Dr. Vinod Deshmukh', clinic: 'Shivaji Nagar Animal Care', area: 'Jalgaon City', phone: '+91 97654 66778', targetMonthly: 50000, achieved: 32000, visitsThisMonth: 2 },
            { id: 4, name: 'Dr. Anjali Joshi', clinic: 'Krushna Pet & Dairy Hospital', area: 'Pachora', phone: '+91 98901 88990', targetMonthly: 80000, achieved: 71000, visitsThisMonth: 5 },
            { id: 5, name: 'Dr. Prashant Shinde', clinic: 'Shinde Cattle Diagnostic Center', area: 'Amalner', phone: '+91 99234 55667', targetMonthly: 65000, achieved: 41000, visitsThisMonth: 2 }
        ],
        pharmacies: [
            { id: 1, name: 'Sai Veterinary Medicals', owner: 'Mahesh Patil', area: 'Jalgaon Market', phone: '+91 98230 44556', balance: 14200, creditLimit: 100000 },
            { id: 2, name: 'Kisan Pashu Seva Kendra', owner: 'Dnyaneshwar Shinde', area: 'Nashik Naka', phone: '+91 94231 66778', balance: 0, creditLimit: 75000 },
            { id: 3, name: 'Green Valley Dairy Medicos', owner: 'Rajesh Solanki', area: 'Pune Shirur Road', phone: '+91 97632 99001', balance: 28500, creditLimit: 150000 }
        ],
        visits: [
            {
                id: 1,
                doctorName: 'Dr. Ramesh Kulkarni',
                doctorClinic: 'Kulkarni Veterinary Clinic',
                mrName: 'Rahul Deshmukh (MR101)',
                date: '2026-11-20',
                time: '11:15 AM',
                latitude: 21.0077,
                longitude: 75.5626,
                locationAccuracy: '8 meters',
                status: 'COMPLETED',
                productsDiscussed: 'Ceftim-Tazo, Miracal Gold, Cal-D-Boost Gel',
                sampleGiven: 'Yes (2x Cal-D-Boost Gel)',
                orderReceived: 'Yes (ORD-2026-1001)',
                notes: 'Discussed repeat breeding cases in dairy belt. Recommended AI Care protocol.'
            },
            {
                id: 2,
                doctorName: 'Dr. Sunita Patil',
                doctorClinic: 'Gau Seva Polyclinic',
                mrName: 'Rahul Deshmukh (MR101)',
                date: '2026-11-21',
                time: '02:30 PM',
                latitude: 21.0452,
                longitude: 75.8011,
                locationAccuracy: '5 meters',
                status: 'COMPLETED',
                productsDiscussed: 'Masti-Out Kit, Meloxi Plus',
                sampleGiven: 'Yes (1x Masti-Out Kit)',
                orderReceived: 'No',
                notes: 'Doctor reported high incidence of subclinical mastitis in local co-op dairy. Promised order next week.'
            }
        ],
        attendance: [
            { id: 1, name: 'Rahul Patil', role: 'Operations Officer', empCode: 'EMP001', date: '2026-11-21', inTime: '09:02 AM', outTime: '--', status: 'PRESENT', location: 'Pune Office' },
            { id: 2, name: 'Rahul Deshmukh', role: 'Medical Representative', empCode: 'MR101', date: '2026-11-21', inTime: '08:45 AM', outTime: '--', status: 'PRESENT', location: 'Jalgaon Territory (GPS: 21.0077, 75.5626)' },
            { id: 3, name: 'Amit Patil', role: 'Medical Representative', empCode: 'MR102', date: '2026-11-21', inTime: '09:15 AM', outTime: '--', status: 'PRESENT', location: 'Pune Territory' },
            { id: 4, name: 'Sneha More', role: 'Sales Coordinator', empCode: 'EMP002', date: '2026-11-21', inTime: '09:00 AM', outTime: '--', status: 'PRESENT', location: 'Pune Office' }
        ],
        announcements: [
            { id: 1, title: 'Monsoon Special Scheme Active', text: 'Special 5+1 free slab on Miracal Gold and Cal-D-Boost Gel till end of month for all registered veterinary pharmacies.', date: '2026-11-18', tag: 'Sales Scheme', urgent: true },
            { id: 2, title: 'New Formulation Launch: Ceftim-Tazo', text: 'New batch with enhanced stability is now stocked at all 4 central depots. Detailing aids delivered to MR field team.', date: '2026-11-15', tag: 'Product Launch', urgent: false },
            { id: 3, title: 'Monthly Target Review Meeting', text: 'All field representatives and area managers please submit visit logs before 28th for monthly incentive processing.', date: '2026-11-10', tag: 'Administration', urgent: false }
        ]
    };

    // Store Controller
    class StoreController {
        constructor() {
            this.init();
        }

        init() {
            try {
                const existing = localStorage.getItem(STORAGE_KEY);
                if (!existing) {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
                    this.state = defaultData;
                } else {
                    this.state = JSON.parse(existing);
                    // Ensure all keys exist
                    Object.keys(defaultData).forEach(k => {
                        if (!this.state[k]) this.state[k] = defaultData[k];
                    });
                }
            } catch (err) {
                console.warn('LocalStorage error, falling back to memory state:', err);
                this.state = defaultData;
            }
        }

        save() {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
            } catch (err) {
                console.error('Failed to save state to LocalStorage:', err);
            }
        }

        // ==========================================
        // PRODUCTS
        // ==========================================
        getProducts() {
            return this.state.products || [];
        }

        getProductById(id) {
            return this.getProducts().find(p => p.id === Number(id));
        }

        saveProduct(product) {
            if (product.id) {
                const idx = this.state.products.findIndex(p => p.id === Number(product.id));
                if (idx !== -1) {
                    this.state.products[idx] = { ...this.state.products[idx], ...product };
                }
            } else {
                product.id = Date.now();
                if (!product.code) product.code = 'MK-PROD-' + product.id.toString().slice(-4);
                this.state.products.unshift(product);
            }
            this.save();
            this.showToast(`Product "${product.name}" saved successfully!`, 'success');
            return product;
        }

        deleteProduct(id) {
            const idx = this.state.products.findIndex(p => p.id === Number(id));
            if (idx !== -1) {
                const removed = this.state.products.splice(idx, 1)[0];
                this.save();
                this.showToast(`Product "${removed.name}" deleted.`, 'warning');
                return true;
            }
            return false;
        }

        updateStock(productId, delta, reason = 'Adjustment', branchId = 1) {
            const product = this.getProductById(productId);
            if (!product) return false;
            product.stock = Math.max(0, (product.stock || 0) + delta);
            this.save();
            this.showToast(`Stock for ${product.name} updated (${delta >= 0 ? '+' : ''}${delta}). Current: ${product.stock}`, 'info');
            return product.stock;
        }

        // ==========================================
        // BRANCHES & INVENTORY
        // ==========================================
        getBranches() {
            return this.state.branches || [];
        }

        transferStock(productId, fromBranchId, toBranchId, qty) {
            const product = this.getProductById(productId);
            const fromBranch = this.state.branches.find(b => b.id === Number(fromBranchId));
            const toBranch = this.state.branches.find(b => b.id === Number(toBranchId));

            if (!product || !fromBranch || !toBranch) {
                this.showToast('Invalid transfer parameters!', 'error');
                return false;
            }

            fromBranch.currentStock = Math.max(0, fromBranch.currentStock - qty);
            toBranch.currentStock = toBranch.currentStock + qty;
            this.save();
            this.showToast(`Transferred ${qty} units of ${product.name} from ${fromBranch.name} to ${toBranch.name}.`, 'success');
            return true;
        }

        // ==========================================
        // ORDERS & INVOICES
        // ==========================================
        getOrders() {
            return this.state.orders || [];
        }

        getOrderById(id) {
            return this.getOrders().find(o => o.id === Number(id) || o.orderNumber === id);
        }

        createOrder(orderData) {
            const newId = Date.now();
            const orderNum = 'ORD-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
            
            // Calculate totals
            let subtotal = 0;
            const items = (orderData.items || []).map(it => {
                const p = this.getProductById(it.productId);
                const price = it.unitPrice || (p ? p.sellingPrice : 100);
                const lineTotal = price * it.quantity;
                subtotal += lineTotal;
                return {
                    productId: it.productId,
                    productName: it.productName || (p ? p.name : 'Veterinary Item'),
                    quantity: it.quantity,
                    unitPrice: price,
                    total: lineTotal
                };
            });

            const gstRate = orderData.gstRate || this.state.settings.defaultGst || 12;
            const taxAmount = (subtotal * gstRate) / 100;
            const grandTotal = subtotal + taxAmount;

            const order = {
                id: newId,
                orderNumber: orderNum,
                customerName: orderData.customerName || 'Registered Buyer',
                customerType: orderData.customerType || 'DOCTOR',
                branchId: orderData.branchId || 1,
                branchName: orderData.branchName || 'Pune Central Depot',
                date: new Date().toISOString(),
                status: 'CONFIRMED',
                subtotal: parseFloat(subtotal.toFixed(2)),
                taxAmount: parseFloat(taxAmount.toFixed(2)),
                grandTotal: parseFloat(grandTotal.toFixed(2)),
                items
            };

            this.state.orders.unshift(order);

            // Deduct stock for items
            items.forEach(it => {
                const prod = this.getProductById(it.productId);
                if (prod) prod.stock = Math.max(0, prod.stock - it.quantity);
            });

            // Automatically generate corresponding tax invoice
            const invNum = 'INV-' + new Date().getFullYear() + '-' + Math.floor(8000 + Math.random() * 1999);
            const invoice = {
                id: newId,
                invoiceNumber: invNum,
                orderNumber: orderNum,
                buyerName: order.customerName,
                buyerType: order.customerType,
                buyerAddress: orderData.customerAddress || 'Maharashtra, India',
                buyerGst: orderData.customerGst || '27AALCP1092M1Z2',
                buyerPhone: orderData.customerPhone || '+91 98000 00000',
                date: new Date().toISOString().split('T')[0],
                subtotal: order.subtotal,
                cgst: parseFloat((order.taxAmount / 2).toFixed(2)),
                sgst: parseFloat((order.taxAmount / 2).toFixed(2)),
                igst: 0.00,
                totalTax: order.taxAmount,
                grandTotal: order.grandTotal,
                paymentStatus: orderData.paymentStatus || 'UNPAID',
                paymentMethod: orderData.paymentMethod || 'PENDING',
                paymentRef: orderData.paymentRef || 'N/A',
                items: items.map(i => ({
                    name: i.productName,
                    code: 'MK-ITEM',
                    qty: i.quantity,
                    price: i.unitPrice,
                    taxRate: gstRate,
                    total: i.total
                }))
            };

            this.state.invoices.unshift(invoice);
            this.save();
            this.showToast(`Order ${orderNum} and Invoice ${invNum} created successfully!`, 'success');
            return { order, invoice };
        }

        getInvoices() {
            return this.state.invoices || [];
        }

        getInvoiceById(id) {
            return this.getInvoices().find(inv => inv.id === Number(id) || inv.invoiceNumber === id);
        }

        updateInvoicePayment(invoiceId, status, method = 'UPI / NEFT', ref = '') {
            const inv = this.getInvoiceById(invoiceId);
            if (!inv) return false;
            inv.paymentStatus = status;
            inv.paymentMethod = method;
            inv.paymentRef = ref || ('REF-' + Date.now().toString().slice(-6));
            this.save();
            this.showToast(`Invoice ${inv.invoiceNumber} status marked as ${status}.`, 'success');
            return true;
        }

        // ==========================================
        // FIELD MR & VISITS
        // ==========================================
        getDoctors() {
            return this.state.doctors || [];
        }

        getVisits() {
            return this.state.visits || [];
        }

        logVisit(visit) {
            const newVisit = {
                id: Date.now(),
                doctorName: visit.doctorName,
                doctorClinic: visit.doctorClinic || 'Veterinary Clinic',
                mrName: visit.mrName || 'Rahul Deshmukh (MR101)',
                date: visit.date || new Date().toISOString().split('T')[0],
                time: visit.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                latitude: visit.latitude || 21.0077,
                longitude: visit.longitude || 75.5626,
                locationAccuracy: visit.locationAccuracy || '10 meters (GPS)',
                photoPath: visit.photoPath || '',
                status: 'COMPLETED',
                productsDiscussed: visit.productsDiscussed || 'Routine Follow-up',
                sampleGiven: visit.sampleGiven || 'No',
                orderReceived: visit.orderReceived || 'No',
                notes: visit.notes || 'Visit logged successfully.'
            };

            this.state.visits.unshift(newVisit);

            // Increment doctor visit count
            const doc = this.state.doctors.find(d => d.name === visit.doctorName);
            if (doc) doc.visitsThisMonth = (doc.visitsThisMonth || 0) + 1;

            this.save();
            this.showToast(`Visit to ${visit.doctorName} recorded with GPS verification!`, 'success');
            return newVisit;
        }

        // ==========================================
        // ATTENDANCE & STAFF
        // ==========================================
        getAttendance() {
            return this.state.attendance || [];
        }

        punchAttendance(name, role, empCode, location = 'Office') {
            const today = new Date().toISOString().split('T')[0];
            const existing = this.state.attendance.find(a => a.empCode === empCode && a.date === today);

            if (existing) {
                if (existing.outTime === '--') {
                    existing.outTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    this.save();
                    this.showToast(`Punch-Out recorded for ${name} at ${existing.outTime}`, 'info');
                    return existing;
                } else {
                    this.showToast(`You have already completed punch-in and punch-out for today!`, 'warning');
                    return existing;
                }
            }

            const newRecord = {
                id: Date.now(),
                name,
                role,
                empCode,
                date: today,
                inTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                outTime: '--',
                status: 'PRESENT',
                location
            };

            this.state.attendance.unshift(newRecord);
            this.save();
            this.showToast(`Punch-In recorded for ${name} at ${newRecord.inTime}!`, 'success');
            return newRecord;
        }

        // ==========================================
        // ANNOUNCEMENTS
        // ==========================================
        getAnnouncements() {
            return this.state.announcements || [];
        }

        addAnnouncement(ann) {
            const newAnn = {
                id: Date.now(),
                title: ann.title,
                text: ann.text,
                date: new Date().toISOString().split('T')[0],
                tag: ann.tag || 'General',
                urgent: !!ann.urgent
            };
            this.state.announcements.unshift(newAnn);
            this.save();
            this.showToast('Announcement posted to all ERP portals!', 'success');
            return newAnn;
        }

        // ==========================================
        // SETTINGS & PROFILE
        // ==========================================
        getSettings() {
            return this.state.settings;
        }

        saveSettings(newSettings) {
            this.state.settings = { ...this.state.settings, ...newSettings };
            this.save();
            this.showToast('System configuration & company profile updated!', 'success');
            return this.state.settings;
        }

        // ==========================================
        // AUTHENTICATION & SESSION
        // ==========================================
        login(username, password, role) {
            const credentials = {
                ADMIN: { u: 'admin100', p: '1234500', name: 'Administrator', portal: 'admin/dashboard.html' },
                MR: { u: 'mr100', p: '1234', name: 'Rahul Deshmukh (MR)', portal: 'mr/MR-dashboard.html' },
                DOCTOR: { u: 'doc100', p: '567800', name: 'Dr. Ramesh Kulkarni', portal: 'doctor/doc-dashboard.html' },
                PHARMACY: { u: 'pharma100', p: '5678', name: 'Sai Veterinary Chemist', portal: 'chemist/pharma-dashboard.html' },
                EMPLOYEE: { u: 'emp100', p: '12345', name: 'Rahul Patil (Staff)', portal: 'Employees/employee-dashboard.html' }
            };

            const cred = credentials[role];
            if (!cred) return { success: false, message: 'Invalid role specified.' };

            if (username === cred.u && password === cred.p) {
                const sessionUser = {
                    username,
                    role,
                    name: cred.name,
                    loggedInAt: new Date().toISOString()
                };
                sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
                return { success: true, redirect: cred.portal, user: sessionUser };
            }

            return { success: false, message: 'Invalid User ID or Password. Check demo credentials.' };
        }

        getCurrentUser() {
            try {
                return JSON.parse(sessionStorage.getItem(SESSION_KEY));
            } catch (e) {
                return null;
            }
        }

        logout(redirectTo = '../index.html') {
            sessionStorage.removeItem(SESSION_KEY);
            window.location.href = redirectTo;
        }

        // ==========================================
        // UI HELPERS (Toast Notifications & Invoice Modal)
        // ==========================================
        showToast(message, type = 'success') {
            let container = document.getElementById('erpToastContainer');
            if (!container) {
                container = document.createElement('div');
                container.id = 'erpToastContainer';
                document.body.appendChild(container);
            }

            const icons = {
                success: 'fa-circle-check',
                error: 'fa-circle-exclamation',
                warning: 'fa-triangle-exclamation',
                info: 'fa-circle-info'
            };

            const toast = document.createElement('div');
            toast.className = `erp-toast ${type}`;
            toast.innerHTML = `
                <div class="erp-toast-icon">
                    <i class="fa-solid ${icons[type] || icons.info}"></i>
                </div>
                <div class="erp-toast-msg">${message}</div>
                <button class="erp-toast-close" onclick="this.parentElement.remove()">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            `;

            container.appendChild(toast);

            setTimeout(() => {
                toast.style.animation = 'erpToastFadeOut 0.3s forwards';
                setTimeout(() => toast.remove(), 300);
            }, 4000);
        }

        // Print/Download Tax Invoice Dialog
        printInvoice(invoiceId) {
            const inv = this.getInvoiceById(invoiceId);
            if (!inv) {
                this.showToast('Invoice not found!', 'error');
                return;
            }

            const s = this.getSettings();
            const printWindow = window.open('', '_blank', 'width=850,height=900');
            if (!printWindow) {
                alert('Please allow popups to view and print tax invoices.');
                return;
            }

            const itemsRows = (inv.items || []).map((it, idx) => `
                <tr>
                    <td style="padding:10px; border-bottom:1px solid #e2e8f0; text-align:center;">${idx + 1}</td>
                    <td style="padding:10px; border-bottom:1px solid #e2e8f0;"><strong>${it.name}</strong><br><small style="color:#64748b;">Code: ${it.code || 'MK-ITEM'}</small></td>
                    <td style="padding:10px; border-bottom:1px solid #e2e8f0; text-align:center;">${it.qty}</td>
                    <td style="padding:10px; border-bottom:1px solid #e2e8f0; text-align:right;">₹${parseFloat(it.price).toFixed(2)}</td>
                    <td style="padding:10px; border-bottom:1px solid #e2e8f0; text-align:center;">${it.taxRate || 12}%</td>
                    <td style="padding:10px; border-bottom:1px solid #e2e8f0; text-align:right;"><strong>₹${parseFloat(it.total).toFixed(2)}</strong></td>
                </tr>
            `).join('');

            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Tax Invoice - ${inv.invoiceNumber}</title>
                    <style>
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; padding: 40px; margin: 0; }
                        .inv-box { max-width: 800px; margin: auto; border: 1px solid #cbd5e1; padding: 35px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.06); }
                        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #123f82; padding-bottom: 20px; }
                        .logo h1 { margin: 0; color: #123f82; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
                        .logo p { margin: 4px 0 0; color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase; }
                        .inv-title { text-align: right; }
                        .inv-title h2 { margin: 0; color: #0f172a; font-size: 24px; }
                        .badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: bold; background: #e0f2fe; color: #0369a1; margin-top: 6px; }
                        .addresses { display: flex; justify-content: space-between; margin: 25px 0; font-size: 14px; line-height: 1.6; }
                        .table { width: 100%; border-collapse: collapse; margin: 25px 0; font-size: 14px; }
                        .table th { background: #f8fafc; border-bottom: 2px solid #cbd5e1; padding: 12px 10px; color: #334155; font-weight: 700; text-align: left; }
                        .totals { margin-left: auto; width: 340px; font-size: 14px; }
                        .totals table { width: 100%; }
                        .totals td { padding: 6px 0; }
                        .totals tr.grand-total td { font-size: 18px; font-weight: 800; color: #123f82; border-top: 2px solid #123f82; padding-top: 10px; }
                        .footer { margin-top: 40px; border-top: 1px dashed #cbd5e1; padding-top: 20px; text-align: center; font-size: 12px; color: #64748b; }
                        @media print {
                            body { padding: 0; }
                            .inv-box { border: none; box-shadow: none; padding: 0; }
                            .no-print { display: none; }
                        }
                    </style>
                </head>
                <body>
                    <div class="inv-box">
                        <div class="no-print" style="margin-bottom:20px; text-align:right;">
                            <button onclick="window.print()" style="background:#123f82; color:white; border:none; padding:10px 20px; font-size:14px; font-weight:bold; border-radius:6px; cursor:pointer;">🖨️ Print / Save as PDF</button>
                        </div>
                        <div class="header">
                            <div class="logo">
                                <h1>MK ANIMAL HEALTH</h1>
                                <p>${s.tagline}</p>
                                <small style="color:#475569;">${s.address}</small><br>
                                <small style="color:#475569;"><strong>GSTIN:</strong> ${s.gstNumber} | <strong>DL:</strong> ${s.dlNumber}</small>
                            </div>
                            <div class="inv-title">
                                <h2>TAX INVOICE</h2>
                                <p style="margin:4px 0 0; font-size:14px;"><strong>Invoice No:</strong> ${inv.invoiceNumber}</p>
                                <p style="margin:2px 0 0; font-size:13px; color:#64748b;"><strong>Date:</strong> ${inv.date}</p>
                                <span class="badge">${inv.paymentStatus}</span>
                            </div>
                        </div>

                        <div class="addresses">
                            <div style="width:48%;">
                                <h4 style="margin:0 0 6px; color:#123f82;">Billed To (Customer):</h4>
                                <strong>${inv.buyerName}</strong> (${inv.buyerType})<br>
                                ${inv.buyerAddress}<br>
                                <strong>Phone:</strong> ${inv.buyerPhone}<br>
                                <strong>GSTIN:</strong> ${inv.buyerGst}
                            </div>
                            <div style="width:48%; text-align:right;">
                                <h4 style="margin:0 0 6px; color:#123f82;">Order & Dispatch Details:</h4>
                                <strong>Order Ref:</strong> ${inv.orderNumber}<br>
                                <strong>Dispatch Mode:</strong> Direct Transport / Courier<br>
                                <strong>Payment Ref:</strong> ${inv.paymentRef}<br>
                                <strong>Payment Mode:</strong> ${inv.paymentMethod}
                            </div>
                        </div>

                        <table class="table">
                            <thead>
                                <tr>
                                    <th style="text-align:center; width:40px;">#</th>
                                    <th>Item Description</th>
                                    <th style="text-align:center; width:60px;">Qty</th>
                                    <th style="text-align:right; width:100px;">Rate (₹)</th>
                                    <th style="text-align:center; width:70px;">GST %</th>
                                    <th style="text-align:right; width:110px;">Amount (₹)</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itemsRows}
                            </tbody>
                        </table>

                        <div class="totals">
                            <table>
                                <tr>
                                    <td>Taxable Amount:</td>
                                    <td style="text-align:right;">₹${parseFloat(inv.subtotal).toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td>CGST (6%):</td>
                                    <td style="text-align:right;">₹${parseFloat(inv.cgst).toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td>SGST (6%):</td>
                                    <td style="text-align:right;">₹${parseFloat(inv.sgst).toFixed(2)}</td>
                                </tr>
                                <tr class="grand-total">
                                    <td>Grand Total:</td>
                                    <td style="text-align:right;">₹${parseFloat(inv.grandTotal).toFixed(2)}</td>
                                </tr>
                            </table>
                        </div>

                        <div class="footer">
                            <p>This is a computer generated tax invoice. Goods once sold will not be taken back without valid batch verification.</p>
                            <p><strong>Thank you for choosing MK Animal Health products!</strong></p>
                        </div>
                    </div>
                </body>
                </html>
            `);
            printWindow.document.close();
        }
    }

    return new StoreController();
}));
