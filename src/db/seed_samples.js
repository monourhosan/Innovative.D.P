// ==============================================================================
// Innovative Data Platform - 7 Showcase Projects Seeder
// Creator: Made by Saif for Innovative Research & Consultancy Ltd.
// Purpose: Seeds 7 complete, realistic field survey projects with schemas,
//          supervisors, team members, and submissions for client demonstrations.
// ==============================================================================

const bcrypt = require('bcryptjs');
const db = require('./index');

const SHOWCASE_PROJECTS = [
  {
    title: 'WASH & Household Water Security Census 2026',
    description: 'Comprehensive assessment of drinking water accessibility, sanitation infrastructure, water treatment practices, and hygiene metrics in rural and coastal communities.',
    filename: 'WASH_Water_Security_Census_2026.xlsx',
    schema: {
      mode: 'xlsform',
      mode_label: 'Standard KoboToolbox / XLSForm Mode',
      sheet_name: 'survey',
      total_fields: 10,
      fields: [
        { id: 'household_head', name: 'household_head', label: 'Name of Household Head', type: 'text', required: true, hint: 'Full legal name' },
        { id: 'family_members', name: 'family_members', label: 'Total Members in Household', type: 'number', required: true, hint: 'Count of permanent residents' },
        { 
          id: 'water_source', 
          name: 'water_source', 
          label: 'Primary Drinking Water Source', 
          type: 'select_one', 
          required: true,
          choices: [
            { name: 'tube_well', label: 'Tube Well / Deep Borehole' },
            { name: 'piped_dwelling', label: 'Piped Water to Dwelling' },
            { name: 'protected_well', label: 'Protected Dug Well' },
            { name: 'bottled', label: 'Purified / Bottled Water' },
            { name: 'surface_water', label: 'Surface Water (River / Pond)' }
          ]
        },
        {
          id: 'water_treatment',
          name: 'water_treatment',
          label: 'Household Water Purification Method',
          type: 'select_multiple',
          required: false,
          choices: [
            { name: 'boiling', label: 'Boiling' },
            { name: 'chlorine', label: 'Chlorine / Halazone Tablets' },
            { name: 'ceramic_filter', label: 'Ceramic / Candle Filter' },
            { name: 'none', label: 'No Treatment (Direct Drinking)' }
          ]
        },
        { id: 'collection_time_mins', name: 'collection_time_mins', label: 'Daily Water Collection Time (Minutes)', type: 'number', required: true, hint: 'Round trip walking + queuing time' },
        {
          id: 'latrine_type',
          name: 'latrine_type',
          label: 'Household Sanitation & Latrine Type',
          type: 'select_one',
          required: true,
          choices: [
            { name: 'flush_septic', label: 'Flush Toilet to Septic Tank' },
            { name: 'improved_slab', label: 'Ventilated Pit Latrine with Slab' },
            { name: 'unimproved_pit', label: 'Open Pit without Slab' },
            { name: 'hanging', label: 'Hanging / Direct Canal Toilet' }
          ]
        },
        {
          id: 'soap_present',
          name: 'soap_present',
          label: 'Handwashing Soap & Water Observed',
          type: 'select_one',
          required: true,
          choices: [
            { name: 'observed_both', label: 'Yes - Soap and Running Water Observed' },
            { name: 'soap_only', label: 'Soap Present, Water Stored Nearby' },
            { name: 'none', label: 'No Soap or Dedicated Water Station' }
          ]
        },
        { id: 'survey_date', name: 'survey_date', label: 'Date of Household Visit', type: 'date', required: true },
        { id: 'household_location', name: 'household_location', label: 'GPS Location Coordinates', type: 'gps', required: false, hint: 'Captured via device sensor' },
        { id: 'remarks', name: 'remarks', label: 'Enumerator Field Observations', type: 'textarea', required: false }
      ]
    },
    submissions: [
      {
        memberIdx: 0,
        hoursAgo: 2,
        answers: {
          household_head: 'Anisur Rahman',
          family_members: 6,
          water_source: 'Tube Well / Deep Borehole',
          water_treatment: 'Boiling, Ceramic / Candle Filter',
          collection_time_mins: 15,
          latrine_type: 'Flush Toilet to Septic Tank',
          soap_present: 'Yes - Soap and Running Water Observed',
          survey_date: '2026-10-14',
          household_location: '22.3569, 91.7832',
          remarks: 'Borehole water test verified low arsenic level.'
        }
      },
      {
        memberIdx: 1,
        hoursAgo: 4,
        answers: {
          household_head: 'Nasima Akter',
          family_members: 4,
          water_source: 'Piped Water to Dwelling',
          water_treatment: 'Boiling',
          collection_time_mins: 0,
          latrine_type: 'Flush Toilet to Septic Tank',
          soap_present: 'Yes - Soap and Running Water Observed',
          survey_date: '2026-10-14',
          household_location: '22.3590, 91.7850',
          remarks: 'Reliable municipal piped connection with regular supply.'
        }
      },
      {
        memberIdx: 2,
        hoursAgo: 6,
        answers: {
          household_head: 'Kamal Hossain',
          family_members: 8,
          water_source: 'Protected Dug Well',
          water_treatment: 'Chlorine / Halazone Tablets',
          collection_time_mins: 35,
          latrine_type: 'Ventilated Pit Latrine with Slab',
          soap_present: 'Soap Present, Water Stored Nearby',
          survey_date: '2026-10-14',
          household_location: '22.3610, 91.7810',
          remarks: 'Well is shared with 3 extended family households.'
        }
      },
      {
        memberIdx: 3,
        hoursAgo: 8,
        answers: {
          household_head: 'Rowshan Ara',
          family_members: 5,
          water_source: 'Tube Well / Deep Borehole',
          water_treatment: 'None (Direct Drinking)',
          collection_time_mins: 20,
          latrine_type: 'Ventilated Pit Latrine with Slab',
          soap_present: 'Yes - Soap and Running Water Observed',
          survey_date: '2026-10-13',
          household_location: '22.3520, 91.7790',
          remarks: 'Household requested water quality test kit for iron content.'
        }
      }
    ]
  },
  {
    title: 'Agricultural Livelihoods & Seasonal Crop Yield Study',
    description: 'Baseline study evaluating seasonal cropping patterns, modern irrigation adoption, fertilizer usage, and post-harvest yields for smallholder farmers.',
    filename: 'Agri_Livelihoods_Yield_Study.xlsx',
    schema: {
      mode: 'xlsform',
      mode_label: 'Standard KoboToolbox / XLSForm Mode',
      sheet_name: 'survey',
      total_fields: 9,
      fields: [
        { id: 'farmer_name', name: 'farmer_name', label: 'Full Name of Farmer', type: 'text', required: true },
        { id: 'nid_number', name: 'nid_number', label: 'National ID (NID) Number', type: 'text', required: false },
        { id: 'farm_size_acres', name: 'farm_size_acres', label: 'Total Cultivated Land Size (Acres)', type: 'number', required: true },
        {
          id: 'primary_crop',
          name: 'primary_crop',
          label: 'Primary Crop Cultivated This Season',
          type: 'select_one',
          required: true,
          choices: [
            { name: 'boro_paddy', label: 'Boro High-Yield Paddy' },
            { name: 'aman_paddy', label: 'Transplanted Aman Paddy' },
            { name: 'jute', label: 'Golden Jute' },
            { name: 'maize', label: 'Hybrid Yellow Maize' },
            { name: 'vegetables', label: 'Seasonal Vegetables (Brinjal, Tomato)' },
            { name: 'mustard', label: 'Mustard Seed & Oilseed' }
          ]
        },
        {
          id: 'irrigation_type',
          name: 'irrigation_type',
          label: 'Primary Irrigation Source',
          type: 'select_one',
          required: true,
          choices: [
            { name: 'solar_tubewell', label: 'Solar-Powered Deep Tubewell' },
            { name: 'diesel_llp', label: 'Diesel Low Lift Pump' },
            { name: 'canal_rainfed', label: 'Gravity Canal / Rainfed' },
            { name: 'electric_pump', label: 'Grid-Connected Electric Shallow Pump' }
          ]
        },
        { id: 'estimated_yield_kg', name: 'estimated_yield_kg', label: 'Actual / Expected Crop Yield (kg)', type: 'number', required: true },
        { id: 'annual_farming_income', name: 'annual_farming_income', label: 'Estimated Annual Net Farming Income (BDT)', type: 'number', required: true },
        { id: 'farm_coordinates', name: 'farm_coordinates', label: 'Farm Plot GPS Coordinates', type: 'gps', required: false },
        { id: 'field_notes', name: 'field_notes', label: 'Fertilizer & Climate Observations', type: 'textarea', required: false }
      ]
    },
    submissions: [
      {
        memberIdx: 2,
        hoursAgo: 3,
        answers: {
          farmer_name: 'Moklesur Rahman',
          nid_number: '1978269145890',
          farm_size_acres: 2.5,
          primary_crop: 'Boro High-Yield Paddy',
          irrigation_type: 'Solar-Powered Deep Tubewell',
          estimated_yield_kg: 5200,
          annual_farming_income: 185000,
          farm_coordinates: '24.3636, 88.6241',
          field_notes: 'Solar pump reduced irrigation fuel cost by 40% this season.'
        }
      },
      {
        memberIdx: 3,
        hoursAgo: 5,
        answers: {
          farmer_name: 'Abdul Gafur',
          nid_number: '1984269145112',
          farm_size_acres: 1.8,
          primary_crop: 'Hybrid Yellow Maize',
          irrigation_type: 'Grid-Connected Electric Shallow Pump',
          estimated_yield_kg: 4800,
          annual_farming_income: 160000,
          farm_coordinates: '24.3720, 88.6310',
          field_notes: 'Contract farming agreement signed with regional poultry feed mill.'
        }
      },
      {
        memberIdx: 4,
        hoursAgo: 7,
        answers: {
          farmer_name: 'Sultana Razia',
          nid_number: '1990269145334',
          farm_size_acres: 1.2,
          primary_crop: 'Seasonal Vegetables (Brinjal, Tomato)',
          irrigation_type: 'Solar-Powered Deep Tubewell',
          estimated_yield_kg: 3400,
          annual_farming_income: 195000,
          farm_coordinates: '24.3605, 88.6190',
          field_notes: 'Organic vermicompost used with excellent pest resistance results.'
        }
      }
    ]
  },
  {
    title: 'Maternal & Child Health Care (MNCH) Baseline Census',
    description: 'Field monitoring of antenatal care (ANC) visits, institutional delivery rates, child EPI immunization status, and maternal nutrition in target upazilas.',
    filename: 'Maternal_Child_Health_Census.xlsx',
    schema: {
      mode: 'xlsform',
      mode_label: 'Standard KoboToolbox / XLSForm Mode',
      sheet_name: 'survey',
      total_fields: 9,
      fields: [
        { id: 'mother_name', name: 'mother_name', label: "Mother's Full Name", type: 'text', required: true },
        { id: 'mother_age', name: 'mother_age', label: 'Age in Completed Years', type: 'number', required: true },
        { id: 'children_under_five', name: 'children_under_five', label: 'Children Under 5 Years of Age', type: 'number', required: true },
        {
          id: 'anc_visits_completed',
          name: 'anc_visits_completed',
          label: 'Antenatal Care (ANC) Checkups Completed',
          type: 'select_one',
          required: true,
          choices: [
            { name: 'anc_none', label: '0 Visits (None)' },
            { name: 'anc_1_3', label: '1 to 3 Visits' },
            { name: 'anc_4_plus', label: '4 or More Visits (WHO Recommended Standard)' }
          ]
        },
        {
          id: 'delivery_facility',
          name: 'delivery_facility',
          label: 'Place of Most Recent Child Delivery',
          type: 'select_one',
          required: true,
          choices: [
            { name: 'gov_hospital', label: 'Government Upazila Health Complex / District Hospital' },
            { name: 'community_clinic', label: 'Union Health & Family Welfare Centre / Clinic' },
            { name: 'private_clinic', label: 'Private Maternity Hospital' },
            { name: 'home_tba', label: 'Home Delivery with Traditional Birth Attendant' },
            { name: 'home_csba', label: 'Home Delivery with Certified Skilled Attendant (CSBA)' }
          ]
        },
        {
          id: 'child_immunization',
          name: 'child_immunization',
          label: 'Child EPI Vaccination Status',
          type: 'select_one',
          required: true,
          choices: [
            { name: 'fully_vaccinated', label: 'Fully Vaccinated for Age (EPI Card Verified)' },
            { name: 'partially_vaccinated', label: 'Partially Vaccinated (Some Doses Missing)' },
            { name: 'unvaccinated', label: 'Never Vaccinated' }
          ]
        },
        {
          id: 'iron_folic_acid_intake',
          name: 'iron_folic_acid_intake',
          label: 'Iron-Folic Acid Tablets Consumed During Pregnancy',
          type: 'select_one',
          required: true,
          choices: [
            { name: 'over_90_days', label: 'Yes, 90+ Days' },
            { name: 'less_90_days', label: 'Yes, but less than 90 Days' },
            { name: 'none', label: 'Did Not Take Iron Supplements' }
          ]
        },
        { id: 'clinic_gps', name: 'clinic_gps', label: 'Household / Clinic GPS Coordinates', type: 'gps', required: false },
        { id: 'health_worker_notes', name: 'health_worker_notes', label: 'Health Worker & Nutrition Notes', type: 'textarea', required: false }
      ]
    },
    submissions: [
      {
        memberIdx: 1,
        hoursAgo: 2,
        answers: {
          mother_name: 'Shabana Parvin',
          mother_age: 26,
          children_under_five: 2,
          anc_visits_completed: '4 or More Visits (WHO Recommended Standard)',
          delivery_facility: 'Government Upazila Health Complex / District Hospital',
          child_immunization: 'Fully Vaccinated for Age (EPI Card Verified)',
          iron_folic_acid_intake: 'Yes, 90+ Days',
          clinic_gps: '24.8949, 91.8687',
          health_worker_notes: 'Both mother and infant in healthy condition. Normal growth percentile.'
        }
      },
      {
        memberIdx: 3,
        hoursAgo: 6,
        answers: {
          mother_name: 'Morium Begum',
          mother_age: 22,
          children_under_five: 1,
          anc_visits_completed: '1 to 3 Visits',
          delivery_facility: 'Union Health & Family Welfare Centre / Clinic',
          child_immunization: 'Fully Vaccinated for Age (EPI Card Verified)',
          iron_folic_acid_intake: 'Yes, but less than 90 Days',
          clinic_gps: '24.8990, 91.8720',
          health_worker_notes: 'Mother advised on continued exclusive breastfeeding through 6 months.'
        }
      },
      {
        memberIdx: 5,
        hoursAgo: 9,
        answers: {
          mother_name: 'Farida Yasmin',
          mother_age: 31,
          children_under_five: 1,
          anc_visits_completed: '4 or More Visits (WHO Recommended Standard)',
          delivery_facility: 'Private Maternity Hospital',
          child_immunization: 'Fully Vaccinated for Age (EPI Card Verified)',
          iron_folic_acid_intake: 'Yes, 90+ Days',
          clinic_gps: '24.8910, 91.8630',
          health_worker_notes: 'Institutional Caesarean delivery with complete postnatal follow-up.'
        }
      }
    ]
  },
  {
    title: 'Primary Education & School Infrastructure Audit',
    description: 'Comprehensive educational facility audit measuring student-to-classroom ratios, separate girls sanitation, clean drinking water, and digital equipment readiness.',
    filename: 'Primary_School_Infrastructure_Audit.xlsx',
    schema: {
      mode: 'xlsform',
      mode_label: 'Standard KoboToolbox / XLSForm Mode',
      sheet_name: 'survey',
      total_fields: 9,
      fields: [
        { id: 'school_name', name: 'school_name', label: 'Official School Name', type: 'text', required: true },
        { id: 'emis_code', name: 'emis_code', label: 'EMIS / Government Registration Code', type: 'text', required: true },
        {
          id: 'school_category',
          name: 'school_category',
          label: 'Institution Category',
          type: 'select_one',
          required: true,
          choices: [
            { name: 'government_primary', label: 'Government Primary School (GPS)' },
            { name: 'registered_non_gov', label: 'Registered Non-Gov Primary School' },
            { name: 'ngo_brac', label: 'NGO / BRAC Education Center' },
            { name: 'dakhil_madrasah', label: 'Ebtedayee / Dakhil Madrasah' }
          ]
        },
        { id: 'total_enrolled', name: 'total_enrolled', label: 'Total Enrolled Students', type: 'number', required: true },
        { id: 'female_student_pct', name: 'female_student_pct', label: 'Female Student Ratio (%)', type: 'number', required: true },
        { id: 'usable_classrooms', name: 'usable_classrooms', label: 'Number of Functional Classrooms', type: 'number', required: true },
        {
          id: 'girls_toilet_status',
          name: 'girls_toilet_status',
          label: 'Separate Female Toilet Facilities',
          type: 'select_one',
          required: true,
          choices: [
            { name: 'yes_running_water', label: 'Yes - Dedicated with Running Water & Soap' },
            { name: 'yes_no_water', label: 'Yes - Dedicated but Lacks Piped Water' },
            { name: 'shared_only', label: 'No - Shared Single Facility for All' }
          ]
        },
        {
          id: 'electricity_source',
          name: 'electricity_source',
          label: 'Power Supply Status',
          type: 'select_one',
          required: true,
          choices: [
            { name: 'national_grid', label: 'National Electric Grid Connection' },
            { name: 'solar_rooftop', label: 'Solar Rooftop System' },
            { name: 'no_electricity', label: 'No Electricity Connection' }
          ]
        },
        { id: 'school_coordinates', name: 'school_coordinates', label: 'School Front Gate GPS', type: 'gps', required: false }
      ]
    },
    submissions: [
      {
        memberIdx: 0,
        hoursAgo: 1,
        answers: {
          school_name: 'Charfasson Model Government Primary School',
          emis_code: 'GPS-710291',
          school_category: 'Government Primary School (GPS)',
          total_enrolled: 420,
          female_student_pct: 54,
          usable_classrooms: 8,
          girls_toilet_status: 'Yes - Dedicated with Running Water & Soap',
          electricity_source: 'National Electric Grid Connection',
          school_coordinates: '22.1852, 90.7121'
        }
      },
      {
        memberIdx: 4,
        hoursAgo: 4,
        answers: {
          school_name: 'Patuakhali Coastal Ebtedayee Madrasah',
          emis_code: 'MAD-440192',
          school_category: 'Ebtedayee / Dakhil Madrasah',
          total_enrolled: 260,
          female_student_pct: 48,
          usable_classrooms: 5,
          girls_toilet_status: 'Yes - Dedicated but Lacks Piped Water',
          electricity_source: 'Solar Rooftop System',
          school_coordinates: '22.3592, 90.3291'
        }
      },
      {
        memberIdx: 5,
        hoursAgo: 7,
        answers: {
          school_name: 'Shurjomukhi BRAC Community Learning Center',
          emis_code: 'BRAC-10294',
          school_category: 'NGO / BRAC Education Center',
          total_enrolled: 110,
          female_student_pct: 58,
          usable_classrooms: 3,
          girls_toilet_status: 'Yes - Dedicated with Running Water & Soap',
          electricity_source: 'National Electric Grid Connection',
          school_coordinates: '22.3610, 90.3340'
        }
      }
    ]
  },
  {
    title: 'Climate Resilience & Coastal Disaster Preparedness',
    description: 'Coastal vulnerability assessment tracking cyclone evacuation readiness, early warning reception, embankment integrity, and household survival stocks in tidal zones.',
    filename: 'Climate_Resilience_DRR_Survey.xlsx',
    schema: {
      mode: 'xlsform',
      mode_label: 'Standard KoboToolbox / XLSForm Mode',
      sheet_name: 'survey',
      total_fields: 9,
      fields: [
        { id: 'resident_name', name: 'resident_name', label: 'Household Respondent Name', type: 'text', required: true },
        {
          id: 'coastal_region',
          name: 'coastal_region',
          label: 'Coastal Upazila / Zone',
          type: 'select_one',
          required: true,
          choices: [
            { name: 'satkhira_shyamnagar', label: 'Satkhira - Shyamnagar Upazila' },
            { name: 'barguna_patharghata', label: 'Barguna - Patharghata Coastal Belt' },
            { name: 'bhola_charfasson', label: 'Bhola - Char Fasson Island' },
            { name: 'coxsbazar_kutubdia', label: 'Cox\'s Bazar - Kutubdia Island' }
          ]
        },
        {
          id: 'housing_type',
          name: 'housing_type',
          label: 'Primary Housing Structure Material',
          type: 'select_one',
          required: true,
          choices: [
            { name: 'pucca_concrete', label: 'Pucca (Concrete & Brick Masonry)' },
            { name: 'semi_pucca', label: 'Semi-Pucca (Brick Foundation & Corrugated Tin)' },
            { name: 'kacha_bamboo', label: 'Kacha (Bamboo, Mud & Tin Roof)' },
            { name: 'jhupri_tarpaulin', label: 'Jhupri (Thatch, Reed & Tarpaulin)' }
          ]
        },
        {
          id: 'early_warning_channel',
          name: 'early_warning_channel',
          label: 'Main Channel for Receiving Cyclone Warnings',
          type: 'select_one',
          required: true,
          choices: [
            { name: 'cpp_volunteers', label: 'Cyclone Preparedness Program (CPP) Flag & Megaphone' },
            { name: 'sms_mobile', label: 'Govt Disaster Alert SMS on Mobile' },
            { name: 'community_radio', label: 'Community Radio Broadcast' },
            { name: 'none', label: 'No Early Warning Received' }
          ]
        },
        { id: 'distance_shelter_meters', name: 'distance_shelter_meters', label: 'Distance to Nearest Multi-Purpose Cyclone Shelter (Meters)', type: 'number', required: true },
        { id: 'dry_food_days', name: 'dry_food_days', label: 'Emergency Dry Food Stock Maintained (Days)', type: 'number', required: true },
        {
          id: 'embankment_distance_km',
          name: 'embankment_distance_km',
          label: 'Distance from Coastal Sea Dyke / Embankment (km)',
          type: 'number',
          required: true
        },
        { id: 'house_location_gps', name: 'house_location_gps', label: 'Household GPS Location', type: 'gps', required: false },
        { id: 'vulnerability_notes', name: 'vulnerability_notes', label: 'Elderly, Disabled & Livestock Evacuation Notes', type: 'textarea', required: false }
      ]
    },
    submissions: [
      {
        memberIdx: 2,
        hoursAgo: 2,
        answers: {
          resident_name: 'Subol Chandra Mondol',
          coastal_region: 'Satkhira - Shyamnagar Upazila',
          housing_type: 'Semi-Pucca (Brick Foundation & Corrugated Tin)',
          early_warning_channel: 'Cyclone Preparedness Program (CPP) Flag & Megaphone',
          distance_shelter_meters: 650,
          dry_food_days: 5,
          embankment_distance_km: 1.2,
          house_location_gps: '22.3302, 89.1021',
          vulnerability_notes: 'Family has two elderly members requiring stretcher assistance for evacuation.'
        }
      },
      {
        memberIdx: 3,
        hoursAgo: 5,
        answers: {
          resident_name: 'Rokeya Khatun',
          coastal_region: 'Barguna - Patharghata Coastal Belt',
          housing_type: 'Kacha (Bamboo, Mud & Tin Roof)',
          early_warning_channel: 'Govt Disaster Alert SMS on Mobile',
          distance_shelter_meters: 1100,
          dry_food_days: 3,
          embankment_distance_km: 0.8,
          house_location_gps: '22.0291, 89.9690',
          vulnerability_notes: 'Nearby river embankment suffered partial breach during monsoon high tide.'
        }
      },
      {
        memberIdx: 0,
        hoursAgo: 8,
        answers: {
          resident_name: 'Moniruzzaman Hawlader',
          coastal_region: 'Bhola - Char Fasson Island',
          housing_type: 'Semi-Pucca (Brick Foundation & Corrugated Tin)',
          early_warning_channel: 'Cyclone Preparedness Program (CPP) Flag & Megaphone',
          distance_shelter_meters: 450,
          dry_food_days: 7,
          embankment_distance_km: 2.5,
          house_location_gps: '22.1890, 90.7205',
          vulnerability_notes: 'Livestock kill shelter adjacent to primary school shelter is fully operational.'
        }
      }
    ]
  },
  {
    title: "Microfinance & Women's Economic Empowerment Study",
    description: "Longitudinal study measuring microcredit repayment cycles, enterprise profitability, women's financial decision-making agency, and digital banking literacy.",
    filename: 'Microfinance_Women_Empowerment.xlsx',
    schema: {
      mode: 'xlsform',
      mode_label: 'Standard KoboToolbox / XLSForm Mode',
      sheet_name: 'survey',
      total_fields: 9,
      fields: [
        { id: 'borrower_name', name: 'borrower_name', label: 'Borrower Full Name', type: 'text', required: true },
        { id: 'mfs_wallet', name: 'mfs_wallet', label: 'bKash / Nagad Mobile Wallet Number', type: 'phone', required: false },
        {
          id: 'mfi_provider',
          name: 'mfi_provider',
          label: 'Microfinance Institution (MFI) Partner',
          type: 'select_one',
          required: true,
          choices: [
            { name: 'grameen_bank', label: 'Grameen Bank' },
            { name: 'brac_mfi', label: 'BRAC Microfinance' },
            { name: 'asa_intl', label: 'ASA International' },
            { name: 'buro_bd', label: 'BURO Bangladesh' },
            { name: 'local_coop', label: 'Local Women Cooperative Society' }
          ]
        },
        { id: 'active_loan_amount', name: 'active_loan_amount', label: 'Current Active Loan Principal (BDT)', type: 'number', required: true },
        {
          id: 'enterprise_type',
          name: 'enterprise_type',
          label: 'Micro-Enterprise Activity',
          type: 'select_one',
          required: true,
          choices: [
            { name: 'dairy_poultry', label: 'Dairy Cattle & Poultry Farming' },
            { name: 'handicraft_weaving', label: 'Handicrafts, Nakshi Kantha & Weaving' },
            { name: 'grocery_retail', label: 'Grocery Store / Village Petty Shop' },
            { name: 'tailoring', label: 'Tailoring & Garment Making' },
            { name: 'fisheries', label: 'Freshwater Fish Hatchery & Culture' }
          ]
        },
        { id: 'monthly_profit_bdt', name: 'monthly_profit_bdt', label: 'Average Monthly Net Profit (BDT)', type: 'number', required: true },
        {
          id: 'decision_making_agency',
          name: 'decision_making_agency',
          label: 'Household Financial Decision-Making Control',
          type: 'select_one',
          required: true,
          choices: [
            { name: 'sole_woman', label: 'Woman Borrower Decides Independently' },
            { name: 'joint_decision', label: 'Joint Decision with Spouse' },
            { name: 'husband_dominant', label: 'Husband / Male Relatives Decide' }
          ]
        },
        { id: 'enterprise_gps', name: 'enterprise_gps', label: 'Business / Workshop Location GPS', type: 'gps', required: false },
        { id: 'officer_remarks', name: 'officer_remarks', label: 'Field Credit Officer Assessment', type: 'textarea', required: false }
      ]
    },
    submissions: [
      {
        memberIdx: 1,
        hoursAgo: 1,
        answers: {
          borrower_name: 'Salma Khatun',
          mfs_wallet: '+8801812345678',
          mfi_provider: 'BRAC Microfinance',
          active_loan_amount: 50000,
          enterprise_type: 'Dairy Cattle & Poultry Farming',
          monthly_profit_bdt: 18500,
          decision_making_agency: 'Woman Borrower Decides Independently',
          enterprise_gps: '23.8210, 90.3950',
          officer_remarks: 'Produces 14 liters of fresh milk daily sold directly to milk chilling center.'
        }
      },
      {
        memberIdx: 3,
        hoursAgo: 4,
        answers: {
          borrower_name: 'Ferdousi Begum',
          mfs_wallet: '+8801912345678',
          mfi_provider: 'Grameen Bank',
          active_loan_amount: 40000,
          enterprise_type: 'Tailoring & Garment Making',
          monthly_profit_bdt: 15200,
          decision_making_agency: 'Joint Decision with Spouse',
          enterprise_gps: '23.8290, 90.4010',
          officer_remarks: 'Employs two neighborhood apprentice girls on piecemeal stitching.'
        }
      },
      {
        memberIdx: 5,
        hoursAgo: 7,
        answers: {
          borrower_name: 'Taslima Akter',
          mfs_wallet: '+8801712345678',
          mfi_provider: 'ASA International',
          active_loan_amount: 60000,
          enterprise_type: 'Grocery Store / Village Petty Shop',
          monthly_profit_bdt: 22000,
          decision_making_agency: 'Woman Borrower Decides Independently',
          enterprise_gps: '23.8180, 90.3890',
          officer_remarks: 'Installed bKash agent cash-in cash-out counter adding supplementary revenue.'
        }
      }
    ]
  },
  {
    title: 'Urban Informal Settlements & Slum Habitat Monitor',
    description: 'Municipal survey of high-density informal settlements assessing housing tenure security, drainage, solid waste management, shared amenities, and fire safety.',
    filename: 'Urban_Slum_Living_Conditions.xlsx',
    schema: {
      mode: 'xlsform',
      mode_label: 'Standard KoboToolbox / XLSForm Mode',
      sheet_name: 'survey',
      total_fields: 9,
      fields: [
        { id: 'holding_unit_code', name: 'holding_unit_code', label: 'Dwelling Unit / Holding Code', type: 'text', required: true },
        { id: 'tenant_name', name: 'tenant_name', label: 'Primary Resident / Head of Household', type: 'text', required: true },
        {
          id: 'settlement_community',
          name: 'settlement_community',
          label: 'Informal Settlement / Basti Name',
          type: 'select_one',
          required: true,
          choices: [
            { name: 'korail_basti', label: 'Korail Basti (Mohakhali, Dhaka)' },
            { name: 'bhashantek_mirpur', label: 'Bhashantek Settlement (Mirpur-14, Dhaka)' },
            { name: 'kamrangirchar', label: 'Kamrangirchar Riverbed Settlement' },
            { name: 'sattola_mohakhali', label: 'Sattola TB Gate Basti (Dhaka)' },
            { name: 'rupsha_khulna', label: 'Rupsha Ghat Slum Area (Khulna)' }
          ]
        },
        { id: 'room_size_sqft', name: 'room_size_sqft', label: 'Floor Living Space (Square Feet)', type: 'number', required: true },
        { id: 'monthly_rent_bdt', name: 'monthly_rent_bdt', label: 'Monthly Rent Paid (BDT)', type: 'number', required: true },
        {
          id: 'shared_toilet_ratio',
          name: 'shared_toilet_ratio',
          label: 'Number of Families Sharing Same Latrine',
          type: 'number',
          required: true
        },
        {
          id: 'electricity_service',
          name: 'electricity_service',
          label: 'Electric Connection Legality',
          type: 'select_one',
          required: true,
          choices: [
            { name: 'legal_prepaid', label: 'Legal Utility Pre-paid Digital Meter' },
            { name: 'informal_submeter', label: 'Informal Shared Line via Local Landlord' },
            { name: 'no_meter', label: 'Direct Unmetered Connection' }
          ]
        },
        { id: 'dwelling_gps', name: 'dwelling_gps', label: 'Doorstep GPS Coordinates', type: 'gps', required: false },
        { id: 'surveyor_observations', name: 'surveyor_observations', label: 'Fire Safety & Waterlogging Notes', type: 'textarea', required: false }
      ]
    },
    submissions: [
      {
        memberIdx: 0,
        hoursAgo: 1,
        answers: {
          holding_unit_code: 'KB-Sec3-H42',
          tenant_name: 'Sirajul Islam',
          settlement_community: 'Korail Basti (Mohakhali, Dhaka)',
          room_size_sqft: 110,
          monthly_rent_bdt: 4200,
          shared_toilet_ratio: 6,
          electricity_service: 'Informal Shared Line via Local Landlord',
          dwelling_gps: '23.7781, 90.4072',
          surveyor_observations: 'Tightly packed timber and tin structures. High fire risk; no hydrant within 500m.'
        }
      },
      {
        memberIdx: 1,
        hoursAgo: 3,
        answers: {
          holding_unit_code: 'BT-BlockB-18',
          tenant_name: 'Khaleda Akhter',
          settlement_community: 'Bhashantek Settlement (Mirpur-14, Dhaka)',
          room_size_sqft: 130,
          monthly_rent_bdt: 4800,
          shared_toilet_ratio: 4,
          electricity_service: 'Legal Utility Pre-paid Digital Meter',
          dwelling_gps: '23.8115, 90.3882',
          surveyor_observations: 'Paved alleyway allows municipal waste collection van to reach near gate.'
        }
      },
      {
        memberIdx: 4,
        hoursAgo: 6,
        answers: {
          holding_unit_code: 'KC-East-09',
          tenant_name: 'Matiur Rahman',
          settlement_community: 'Kamrangirchar Riverbed Settlement',
          room_size_sqft: 95,
          monthly_rent_bdt: 3500,
          shared_toilet_ratio: 8,
          electricity_service: 'Informal Shared Line via Local Landlord',
          dwelling_gps: '23.7190, 90.3750',
          surveyor_observations: 'Seasonal waterlogging during monsoon requires elevated wooden walkway.'
        }
      }
    ]
  }
];

function seedShowcaseData() {
  console.log('[Seed] Starting 7-Project Showcase Seeder for Innovative Research & Consultancy Ltd....');

  const adminUser = db.queryOne("SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1");
  const adminId = adminUser ? adminUser.id : 1;
  const salt = bcrypt.genSaltSync(10);

  // 1. Create 3 Supervisors if missing
  const supervisorsList = [
    { user_id: 'SUP-1042', name: 'Saif Al-Islam (Lead Field Director)', pass: 'supervisor123' },
    { user_id: 'SUP-1043', name: 'Tahmina Kabir (Senior M&E Specialist)', pass: 'supervisor123' },
    { user_id: 'SUP-1044', name: 'Zubair Faruq (Regional Ops Manager)', pass: 'supervisor123' }
  ];

  const supervisorIds = [];
  for (const s of supervisorsList) {
    let existingSup = db.queryOne('SELECT id FROM users WHERE user_id = ?', s.user_id);
    if (!existingSup) {
      const hash = bcrypt.hashSync(s.pass, salt);
      const res = db.execute(`
        INSERT INTO users (user_id, password_hash, plain_password, full_name, role, created_by, is_active)
        VALUES (?, ?, ?, ?, 'SUPERVISOR', ?, 1)
      `, s.user_id, hash, s.pass, s.name, adminId);
      supervisorIds.push(res.lastInsertRowid);
      console.log(`[Seed] Created Supervisor: ${s.user_id} (${s.name})`);
    } else {
      supervisorIds.push(existingSup.id);
    }
  }

  // 2. Create 6 Field Team Members if missing
  const teamMembersList = [
    { user_id: 'TM-2001', name: 'Rahim Ahmed (Senior Enumerator)', supIdx: 0 },
    { user_id: 'TM-2002', name: 'Fatima Begum (Field Surveyor)', supIdx: 0 },
    { user_id: 'TM-2003', name: 'Tareq Rahman (Health Data Specialist)', supIdx: 1 },
    { user_id: 'TM-2004', name: 'Amina Khatun (Socio-Economic Surveyor)', supIdx: 1 },
    { user_id: 'TM-2005', name: 'Hasan Mahmud (GIS & Urban Enumerator)', supIdx: 2 },
    { user_id: 'TM-2006', name: 'Nusrat Jahan (Community Researcher)', supIdx: 2 }
  ];

  const memberIds = [];
  for (const tm of teamMembersList) {
    let existingTm = db.queryOne('SELECT id FROM users WHERE user_id = ?', tm.user_id);
    const supId = supervisorIds[tm.supIdx] || supervisorIds[0];
    if (!existingTm) {
      const hash = bcrypt.hashSync('member123', salt);
      const res = db.execute(`
        INSERT INTO users (user_id, password_hash, plain_password, full_name, role, created_by, is_active)
        VALUES (?, ?, ?, ?, 'TEAM_MEMBER', ?, 1)
      `, tm.user_id, hash, 'member123', tm.name, supId);
      memberIds.push(res.lastInsertRowid);
      console.log(`[Seed] Created Team Member: ${tm.user_id} (${tm.name})`);
    } else {
      memberIds.push(existingTm.id);
    }
  }

  // 3. Insert each of the 7 Showcase Projects if not already present
  for (let i = 0; i < SHOWCASE_PROJECTS.length; i++) {
    const p = SHOWCASE_PROJECTS[i];
    let existingProj = db.queryOne('SELECT id FROM projects WHERE title = ?', p.title);

    let projectId;
    if (!existingProj) {
      const res = db.execute(`
        INSERT INTO projects (title, description, form_schema_json, original_xlsx_filename, status)
        VALUES (?, ?, ?, ?, 'ACTIVE')
      `, p.title, p.description, JSON.stringify(p.schema), p.filename);
      projectId = res.lastInsertRowid;
      console.log(`[Seed] Created Showcase Project ${i + 1}/7: ${p.title}`);
    } else {
      projectId = existingProj.id;
    }

    // Assign project to all 3 supervisors
    for (const supId of supervisorIds) {
      try {
        db.execute('INSERT OR IGNORE INTO project_assignments (project_id, user_id) VALUES (?, ?)', projectId, supId);
      } catch (e) {}
    }

    // Assign project to all 6 team members
    for (const memId of memberIds) {
      try {
        db.execute('INSERT OR IGNORE INTO project_assignments (project_id, user_id) VALUES (?, ?)', projectId, memId);
      } catch (e) {}
    }

    // Insert submissions if project has fewer than 2 submissions
    const subCount = db.queryOne('SELECT COUNT(*) as count FROM submissions WHERE project_id = ?', projectId);
    if (!subCount || subCount.count === 0) {
      for (const sub of p.submissions) {
        const memId = memberIds[sub.memberIdx] || memberIds[0];
        const assignedSup = db.queryOne('SELECT created_by FROM users WHERE id = ?', memId);
        const supId = assignedSup && assignedSup.created_by ? assignedSup.created_by : supervisorIds[0];

        db.execute(`
          INSERT INTO submissions (project_id, team_member_id, supervisor_id, answers_json, client_timestamp, server_timestamp)
          VALUES (?, ?, ?, ?, datetime('now', '-${sub.hoursAgo || 1} hours', 'localtime'), datetime('now', '-${sub.hoursAgo || 1} hours', 'localtime'))
        `, projectId, memId, supId, JSON.stringify(sub.answers));
      }
      console.log(`       Added ${p.submissions.length} sample field submissions for Project ${i + 1}`);
    }
  }

  console.log('========================================================================');
  console.log('🎉 7 Showcase Projects Successfully Populated!');
  console.log('   Ready for Client Demonstrations (Innovative Research & Consultancy Ltd.)');
  console.log('========================================================================');
}

if (require.main === module) {
  // Wait for DB ready if needed
  if (db.ensureReady) {
    db.ensureReady().then(() => {
      seedShowcaseData();
    });
  } else {
    seedShowcaseData();
  }
}

module.exports = seedShowcaseData;
