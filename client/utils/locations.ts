export interface StateLocation {
  state: string;
  districts: string[];
}

export const INDIAN_STATES_AND_DISTRICTS: StateLocation[] = [
  {
    state: "Andhra Pradesh",
    districts: [
      "Alluri Sitharama Raju", "Anakapalli", "Ananthapuramu (Anantapur)", "Annamayya", "Bapatla",
      "Chittoor", "Dr. B.R. Ambedkar Konaseema", "East Godavari", "Eluru", "Guntur",
      "Kakinada", "Krishna", "Kurnool", "Nandyal", "NTR (Vijayawada)", "Palnadu",
      "Parvathipuram Manyam", "Prakasam", "Sri Potti Sriramulu Nellore", "Sri Sathya Sai",
      "Srikakulam", "Tirupati", "Visakhapatnam", "Vizianagaram", "West Godavari", "YSR Kadapa"
    ],
  },
  {
    state: "Arunachal Pradesh",
    districts: [
      "Anjaw", "Changlang", "Dibang Valley", "East Kameng", "East Siang",
      "Kamle", "Kra Daadi", "Kurung Kumey", "Lepa Rada", "Lohit",
      "Longding", "Lower Dibang Valley", "Lower Siang", "Lower Subansiri", "Namsai",
      "Pakke Kessang", "Papum Pare (Itanagar)", "Shi Yomi", "Siang", "Tawang",
      "Tirap", "Upper Siang", "Upper Subansiri", "West Kameng", "West Siang"
    ],
  },
  {
    state: "Assam",
    districts: [
      "Baksa", "Barpeta", "Biswanath", "Bongaigaon", "Cachar (Silchar)",
      "Charaideo", "Chirang", "Darrang", "Dhemaji", "Dhubri",
      "Dibrugarh", "Dima Hasao", "Goalpara", "Golaghat", "Hailakandi",
      "Hojai", "Jorhat", "Kamrup", "Kamrup Metropolitan (Guwahati)", "Karbi Anglong",
      "Karimganj", "Kokrajhar", "Lakhimpur", "Majuli", "Morigaon",
      "Nagaon", "Nalbari", "Sivasagar", "Sonitpur", "South Salmara-Mankachar",
      "Tamulpur", "Tinsukia", "Udalguri", "West Karbi Anglong"
    ],
  },
  {
    state: "Bihar",
    districts: [
      "Araria", "Arwal", "Aurangabad", "Banka", "Begusarai", "Bhagalpur",
      "Bhojpur (Arrah)", "Buxar", "Darbhanga", "East Champaran (Motihari)", "Gaya",
      "Gopalganj", "Jamui", "Jehanabad", "Kaimur (Bhabua)", "Katihar",
      "Khagaria", "Kishanganj", "Lakhisarai", "Madhepura", "Madhubani",
      "Munger", "Muzaffarpur", "Nalanda (Bihar Sharif)", "Nawada", "Patna",
      "Purnia", "Rohtas (Sasaram)", "Saharsa", "Samastipur", "Saran (Chhapra)",
      "Sheikhpura", "Sheohar", "Sitamarhi", "Siwan", "Supaul", "Vaishali (Hajipur)", "West Champaran (Bettiah)"
    ],
  },
  {
    state: "Chhattisgarh",
    districts: [
      "Balod", "Baloda Bazar", "Balrampur", "Bastar (Jagdalpur)", "Bemetara",
      "Bijapur", "Bilaspur", "Dantewada", "Dhamtari", "Durg",
      "Gariaband", "Gaurela-Pendra-Marwahi", "Janjgir-Champa", "Jashpur", "Kabirdham (Kawardha)",
      "Kanker", "Khairagarh", "Kondagaon", "Korba", "Koriya",
      "Mahasamund", "Manendragarh", "Mohla-Manpur", "Mungeli", "Narayanpur",
      "Raigarh", "Raipur", "Rajnandgaon", "Sarangarh-Bilaigarh", "Shakti",
      "Sukma", "Surajpur", "Surguja (Ambikapur)"
    ],
  },
  {
    state: "Delhi",
    districts: [
      "Central Delhi", "East Delhi", "New Delhi", "North Delhi", "North East Delhi",
      "North West Delhi", "Shahdara", "South Delhi", "South East Delhi", "South West Delhi", "West Delhi"
    ],
  },
  {
    state: "Goa",
    districts: ["North Goa (Panaji)", "South Goa (Margao)"],
  },
  {
    state: "Gujarat",
    districts: [
      "Ahmedabad", "Amreli", "Anand", "Aravalli", "Banaskantha (Palanpur)",
      "Bharuch", "Bhavnagar", "Botad", "Chhota Udaipur", "Dahod",
      "Dang", "Devbhoomi Dwarka", "Gandhinagar", "Gir Somnath", "Jamnagar",
      "Junagadh", "Kheda (Nadiad)", "Kutch (Bhuj)", "Mahisagar", "Mehsana",
      "Morbi", "Narmada (Rajpipla)", "Navsari", "Panchmahal (Godhra)", "Patan",
      "Porbandar", "Rajkot", "Sabarkantha (Himmatnagar)", "Surat", "Surendranagar",
      "Tapi (Vyara)", "Vadodara", "Valsad"
    ],
  },
  {
    state: "Haryana",
    districts: [
      "Ambala", "Bhiwani", "Charkhi Dadri", "Faridabad", "Fatehabad",
      "Gurugram (Gurgaon)", "Hisar", "Jhajjar", "Jind", "Kaithal",
      "Karnal", "Kurukshetra", "Mahendragarh (Narnaul)", "Nuh (Mewat)", "Palwal",
      "Panchkula", "Panipat", "Rewari", "Rohtak", "Sirsa",
      "Sonipat", "Yamunanagar"
    ],
  },
  {
    state: "Himachal Pradesh",
    districts: [
      "Bilaspur", "Chamba", "Hamirpur", "Kangra (Dharamshala)", "Kinnaur",
      "Kullu", "Lahaul and Spiti", "Mandi", "Shimla", "Sirmaur (Nahan)", "Solan", "Una"
    ],
  },
  {
    state: "Jammu and Kashmir",
    districts: [
      "Anantnag", "Bandipora", "Baramulla", "Budgam", "Doda",
      "Ganderbal", "Jammu", "Kathua", "Kishtwar", "Kulgam",
      "Kupwara", "Poonch", "Pulwama", "Rajouri", "Ramban",
      "Reasi", "Samba", "Shopian", "Srinagar", "Udhampur"
    ],
  },
  {
    state: "Jharkhand",
    districts: [
      "Bokaro", "Chatra", "Deoghar", "Dhanbad", "Dumka",
      "East Singhbhum (Jamshedpur)", "Garhwa", "Giridih", "Godda", "Gumla",
      "Hazaribagh", "Jamtara", "Khunti", "Koderma", "Latehar",
      "Lohardaga", "Pakur", "Palamu (Daltonganj)", "Ramgarh", "Ranchi",
      "Sahibganj", "Seraikela Kharsawan", "Simdega", "West Singhbhum (Chaibasa)"
    ],
  },
  {
    state: "Karnataka",
    districts: [
      "Bagalkot", "Ballari (Bellary)", "Belagavi (Belgaum)", "Bengaluru Rural", "Bengaluru Urban",
      "Bidar", "Chamarajanagar", "Chikkaballapur", "Chikkamagaluru (Chikmagalur)", "Chitradurga",
      "Dakshina Kannada (Mangalore)", "Davanagere", "Dharwad (Hubli)", "Gadag", "Hassan",
      "Haveri", "Kalaburagi (Gulbarga)", "Kodagu (Madikeri)", "Kolar", "Koppal",
      "Mandya", "Mysuru (Mysore)", "Raichur", "Ramanagara", "Shivamogga (Shimoga)",
      "Tumakuru (Tumkur)", "Udupi", "Uttara Kannada (Karwar)", "Vijayanagara", "Vijayapura (Bijapur)", "Yadgir"
    ],
  },
  {
    state: "Kerala",
    districts: [
      "Alappuzha", "Ernakulam (Kochi)", "Idukki", "Kannur", "Kasaragod",
      "Kollam", "Kottayam", "Kozhikode (Calicut)", "Malappuram", "Palakkad",
      "Pathanamthitta", "Thiruvananthapuram (Trivandrum)", "Thrissur", "Wayanad"
    ],
  },
  {
    state: "Madhya Pradesh",
    districts: [
      "Agar Malwa", "Alirajpur", "Anuppur", "Ashoknagar", "Balaghat",
      "Barwani", "Betul", "Bhind", "Bhopal", "Burhanpur",
      "Chhatarpur", "Chhindwara", "Damoh", "Datia", "Dewas",
      "Dhar", "Dindori", "Guna", "Gwalior", "Harda",
      "Hoshangabad (Narmadapuram)", "Indore", "Jabalpur", "Jhabua", "Katni",
      "Khandwa", "Khargone", "Mandla", "Mandsaur", "Morena",
      "Narsinghpur", "Neemuch", "Panna", "Raisen", "Rajgarh",
      "Ratlam", "Rewa", "Sagar", "Satna", "Sehore",
      "Seoni", "Shahdol", "Shajapur", "Sheopur", "Shivpuri",
      "Sidhi", "Singrauli", "Tikamgarh", "Ujjain", "Umaria", "Vidisha"
    ],
  },
  {
    state: "Maharashtra",
    districts: [
      "Ahmednagar (Ahilyanagar)", "Akola", "Amravati", "Aurangabad (Chhatrapati Sambhajinagar)", "Beed",
      "Bhandara", "Buldhana", "Chandrapur", "Dhule", "Gadchiroli",
      "Gondia", "Hingoli", "Jalgaon", "Jalna", "Kolhapur",
      "Latur", "Mumbai City", "Mumbai Suburban", "Nagpur", "Nanded",
      "Nandurbar", "Nashik", "Osmanabad (Dharashiv)", "Palghar", "Parbhani",
      "Pune", "Raigad (Alibag)", "Ratnagiri", "Sangli", "Satara",
      "Sindhudurg", "Solapur", "Thane", "Wardha", "Washim", "Yavatmal"
    ],
  },
  {
    state: "Manipur",
    districts: [
      "Bishnupur", "Chandel", "Churachandpur", "Imphal East", "Imphal West",
      "Jiribam", "Kakching", "Kamjong", "Kangpokpi", "Noney",
      "Pherzawl", "Senapati", "Tamenglong", "Tengnoupal", "Thoubal", "Ukhrul"
    ],
  },
  {
    state: "Meghalaya",
    districts: [
      "East Garo Hills", "East Jaintia Hills", "East Khasi Hills (Shillong)", "Eastern West Khasi Hills",
      "North Garo Hills", "Ri Bhoi", "South Garo Hills", "South West Garo Hills",
      "South West Khasi Hills", "West Garo Hills (Tura)", "West Jaintia Hills (Jowai)", "West Khasi Hills"
    ],
  },
  {
    state: "Mizoram",
    districts: [
      "Aizawl", "Champhai", "Hnahthial", "Khawzawl", "Kolasib",
      "Lawngtlai", "Lunglei", "Mamit", "Saitual", "Serchhip", "Siaha"
    ],
  },
  {
    state: "Nagaland",
    districts: [
      "Chumoukedima", "Dimapur", "Kiphire", "Kohima", "Longleng",
      "Mokokchung", "Mon", "Niuland", "Noklak", "Peren",
      "Phek", "Shamator", "Tseminyu", "Tuensang", "Wokha", "Zunheboto"
    ],
  },
  {
    state: "Odisha",
    districts: [
      "Angul", "Balangir", "Balasore (Baleswar)", "Bargarh", "Bhadrak",
      "Boudh", "Cuttack", "Deogarh", "Dhenkanal", "Gajapati",
      "Ganjam (Berhampur)", "Jagatsinghpur", "Jajpur", "Jharsuguda", "Kalahandi",
      "Kandhamal", "Kendrapara", "Kendujhar (Keonjhar)", "Khordha (Bhubaneswar)", "Koraput",
      "Malkangiri", "Mayurbhanj (Baripada)", "Nabarangpur", "Nayagarh", "Nuapada",
      "Puri", "Rayagada", "Sambalpur", "Subarnapur (Sonepur)", "Sundargarh (Rourkela)"
    ],
  },
  {
    state: "Punjab",
    districts: [
      "Amritsar", "Barnala", "Bathinda", "Faridkot", "Fatehgarh Sahib",
      "Fazilka", "Ferozepur", "Gurdaspur", "Hoshiarpur", "Jalandhar",
      "Kapurthala", "Ludhiana", "Malerkotla", "Mansa", "Moga",
      "Pathankot", "Patiala", "Rupnagar (Ropar)", "Sahibzada Ajit Singh Nagar (Mohali)", "Sangrur",
      "Shahid Bhagat Singh Nagar (Nawanshahr)", "Sri Muktsar Sahib", "Tarn Taran"
    ],
  },
  {
    state: "Rajasthan",
    districts: [
      "Ajmer", "Alwar", "Banswara", "Baran", "Barmer",
      "Bharatpur", "Bhilwara", "Bikaner", "Bundi", "Chittorgarh",
      "Churu", "Dausa", "Dholpur", "Dungarpur", "Hanumangarh",
      "Jaipur", "Jaisalmer", "Jalore", "Jhalawar", "Jhunjhunu",
      "Jodhpur", "Karauli", "Kota", "Nagaur", "Pali",
      "Pratapgarh", "Rajsamand", "Sawai Madhopur", "Sikar", "Sirohi",
      "Sri Ganganagar", "Tonk", "Udaipur"
    ],
  },
  {
    state: "Sikkim",
    districts: ["Gangtok", "Gyalshing", "Mangan", "Namchi", "Pakyong", "Soreng"],
  },
  {
    state: "Tamil Nadu",
    districts: [
      "Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore",
      "Dharmapuri", "Dindigul", "Erode", "Kallakurichi", "Kanchipuram",
      "Kanyakumari (Nagercoil)", "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai",
      "Nagapattinam", "Namakkal", "Nilgiris (Ooty)", "Perambalur", "Pudukkottai",
      "Ramanathapuram", "Ranipet", "Salem", "Sivaganga", "Tenkasi",
      "Thanjavur", "Theni", "Thoothukudi (Tuticorin)", "Tiruchirappalli (Trichy)", "Tirunelveli",
      "Tirupathur", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur",
      "Vellore", "Viluppuram", "Virudhunagar"
    ],
  },
  {
    state: "Telangana",
    districts: [
      "Adilabad", "Bhadradri Kothagudem", "Hanamkonda", "Hyderabad", "Jagtial",
      "Jangaon", "Jayashankar Bhupalpally", "Jogulamba Gadwal", "Kamareddy", "Karimnagar",
      "Khammam", "Kumuram Bheem Asifabad", "Mahabubabad", "Mahabubnagar", "Mancherial",
      "Medak", "Medchal-Malkajgiri", "Mulugu", "Nagarkurnool", "Nalgonda",
      "Narayanpet", "Nirmal", "Nizamabad", "Peddapalli", "Rajanna Sircilla",
      "Rangareddy", "Sangareddy", "Siddipet", "Suryapet", "Vikarabad",
      "Wanaparthy", "Warangal", "Yadadri Bhuvanagiri"
    ],
  },
  {
    state: "Tripura",
    districts: [
      "Dhalai", "Gomati", "Khowai", "North Tripura", "Sepahijala",
      "South Tripura", "Unakoti", "West Tripura (Agartala)"
    ],
  },
  {
    state: "Uttar Pradesh",
    districts: [
      "Agra", "Aligarh", "Ambedkar Nagar", "Amethi", "Amroha",
      "Auraiya", "Ayodhya (Faizabad)", "Azamgarh", "Baghpat", "Bahraich",
      "Ballia", "Balrampur", "Banda", "Barabanki", "Bareilly",
      "Basti", "Bhadohi", "Bijnor", "Budaun", "Bulandshahr",
      "Chandauli", "Chitrakoot", "Deoria", "Etah", "Etawah",
      "Farrukhabad", "Fatehpur", "Firozabad", "Gautam Buddha Nagar (Noida)", "Ghaziabad",
      "Ghazipur", "Gonda", "Gorakhpur", "Hamirpur", "Hapur",
      "Hardoi", "Hathras", "Jalaun", "Jaunpur", "Jhansi",
      "Kannauj", "Kanpur Dehat", "Kanpur Nagar", "Kasganj", "Kaushambi",
      "Kushinagar", "Lakhimpur Kheri", "Lalitpur", "Lucknow", "Maharajganj",
      "Mahoba", "Mainpuri", "Mathura", "Mau", "Meerut",
      "Mirzapur", "Moradabad", "Muzaffarnagar", "Pilibhit", "Pratapgarh",
      "Prayagraj (Allahabad)", "Raebareli", "Rampur", "Saharanpur", "Sambhal",
      "Sant Kabir Nagar", "Shahjahanpur", "Shamli", "Shravasti", "Siddharthnagar",
      "Sitapur", "Sonbhadra", "Sultanpur", "Unnao", "Varanasi (Kashi)"
    ],
  },
  {
    state: "Uttarakhand",
    districts: [
      "Almora", "Bageshwar", "Chamoli", "Champawat", "Dehradun",
      "Haridwar", "Nainital", "Pauri Garhwal", "Pithoragarh", "Rudraprayag",
      "Tehri Garhwal", "Udham Singh Nagar", "Uttarkashi"
    ],
  },
  {
    state: "West Bengal",
    districts: [
      "Alipurduar", "Bankura", "Birbhum", "Cooch Behar", "Dakshin Dinajpur",
      "Darjeeling", "Hooghly", "Howrah", "Jalpaiguri", "Jhargram",
      "Kalimpong", "Kolkata", "Malda", "Murshidabad", "Nadia",
      "North 24 Parganas", "Paschim Bardhaman", "Paschim Medinipur", "Purba Bardhaman", "Purba Medinipur",
      "Purulia", "South 24 Parganas", "Uttar Dinajpur"
    ],
  },
  {
    state: "Union Territories (Other)",
    districts: [
      "Andaman and Nicobar Islands (Port Blair)",
      "Chandigarh",
      "Dadra and Nagar Haveli and Daman and Diu",
      "Ladakh (Leh & Kargil)",
      "Lakshadweep (Kavaratti)",
      "Puducherry (Pondicherry)"
    ],
  },
];

export const ALL_STATES: string[] = INDIAN_STATES_AND_DISTRICTS.map((item) => item.state);

export function getDistrictsByState(stateName: string): string[] {
  const matched = INDIAN_STATES_AND_DISTRICTS.find(
    (item) => item.state.toLowerCase() === stateName.toLowerCase().trim()
  );
  return matched ? matched.districts : [];
}
