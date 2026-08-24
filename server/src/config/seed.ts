import User from "../models/User.js";
import Hospital from "../models/Hospital.js";
import BloodInventory from "../models/BloodInventory.js";

/**
 * Seed initial development data when running on a database instance.
 */
export const seedInitialData = async (): Promise<void> => {
  try {
    // 1. Ensure Primary Admin User (kartiknilekani568@gmail.com) exists with password "Kartik@2005"
    let adminUser = await User.findOne({ email: "kartiknilekani568@gmail.com" });
    if (!adminUser) {
      adminUser = await User.create({
        name: "Kartik Nilekani (Apollo Blood Bank)",
        email: "kartiknilekani568@gmail.com",
        password: "Kartik@2005",
        phone: "9876543211",
        bloodGroup: "O+",
        role: "admin",
        isAvailableDonor: false,
        location: {
          state: "Karnataka",
          district: "Mysore",
          latitude: 12.2958,
          longitude: 76.6394,
        },
      });
    } else {
      // Ensure password matches Kartik@2005
      adminUser.password = "Kartik@2005";
      await adminUser.save();
    }

    // 2. Ensure Regular Donor User exists
    // Either unique identifier may already belong to an existing user. Looking
    // up both prevents repeated startups from trying to insert the same phone.
    const donorUser = await User.findOne({
      $or: [
        { email: "rahul@gmail.com" },
        { phone: "9876543210" },
      ],
    });
    if (!donorUser) {
      try {
        await User.create({
          name: "Rahul Kumar",
          email: "rahul@gmail.com",
          password: "password123",
          phone: "9876543210",
          bloodGroup: "O+",
          role: "user",
          isAvailableDonor: true,
          location: {
            state: "Karnataka",
            district: "Mysore",
            latitude: 12.2958,
            longitude: 76.6394,
          },
        });
      } catch (error: any) {
        // A concurrent startup can still win the race after the lookup. In
        // that case, leave the existing user untouched and continue seeding.
        if (error?.code !== 11000) throw error;
      }
    }

    // 3. Ensure Blood Bank Organization Admin exists
    let apolloAdmin = await User.findOne({ email: "apollo@bloodlink.in" });
    if (!apolloAdmin) {
      apolloAdmin = await User.create({
        name: "Apollo Blood Bank",
        email: "apollo@bloodlink.in",
        password: "password123",
        phone: "1800000000",
        bloodGroup: "B+",
        role: "admin",
        isAvailableDonor: false,
        location: {
          state: "Karnataka",
          district: "Mysore",
          latitude: 12.305,
          longitude: 76.645,
        },
      });
    }

    // 4. Seed Blood Inventory for admins if missing
    const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
    const sampleUnits = [45, 12, 38, 8, 15, 4, 60, 10];

    for (const admin of [adminUser, apolloAdmin]) {
      if (admin) {
        const invCount = await BloodInventory.countDocuments({ bloodBankId: admin._id });
        if (invCount === 0) {
          for (let i = 0; i < bloodGroups.length; i++) {
            await BloodInventory.create({
              bloodBankId: admin._id,
              bloodGroup: bloodGroups[i],
              units: sampleUnits[i],
            });
          }
        }
      }
    }

    // 5. Seed Sample Hospitals
    const hospitalCount = await Hospital.countDocuments();
    if (hospitalCount === 0) {
      await Hospital.create([
        {
          name: "Apollo BGS Hospital",
          address: "Adhichunchanagiri Road, Kuvempunagar",
          state: "Karnataka",
          district: "Mysore",
          phone: "0821-2568888",
          latitude: 12.2958,
          longitude: 76.6394,
        },
        {
          name: "Columbia Asia Hospital",
          address: "Bangalore-Mysore Ring Road",
          state: "Karnataka",
          district: "Mysore",
          phone: "0821-3989898",
          latitude: 12.335,
          longitude: 76.655,
        },
      ]);
    }

    console.log("✅ Initial development accounts and sample data verified & updated.");
  } catch (error) {
    console.error("⚠️ Note on initial data seeding:", error);
  }
};
