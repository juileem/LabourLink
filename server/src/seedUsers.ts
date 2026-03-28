import { db } from "./db.js";

function randomPhone() {
  return "9" + Math.floor(100000000 + Math.random() * 900000000);
}

function seedUsers() {
  const insertUser = db.prepare(`
    INSERT INTO users (name, phone, role, location, skill, preferred_days, company_name, rating)
    VALUES (@name, @phone, @role, @location, @skill, @preferred_days, @company_name, @rating)
  `);

  const skills = ["Mason", "Painter", "Electrician", "Plumber", "Carpenter"];

  console.log("Seeding 5 workers...");
  for (let i = 1; i <= 5; i++) {
    const phone = randomPhone();
    insertUser.run({
      name: `Worker ${i}`,
      phone: phone,
      role: "worker",
      location: "Bengaluru",
      skill: skills[i - 1] || "Mason",
      preferred_days: "Mon, Tue, Wed, Thu, Fri",
      company_name: null,
      rating: 4.0 + Math.random()
    });
    console.log(`Created Worker ${i} with phone: ${phone} (Role: worker) - Use OTP 1234 to login`);
  }

  console.log("Seeding 5 contractors...");
  for (let i = 1; i <= 5; i++) {
    const phone = randomPhone();
    insertUser.run({
      name: `Contractor ${i}`,
      phone: phone,
      role: "contractor",
      location: "Bengaluru",
      skill: null,
      preferred_days: "",
      company_name: `BuildCo ${i}`,
      rating: 4.0 + Math.random()
    });
    console.log(`Created Contractor ${i} with phone: ${phone} (Role: contractor) - Use OTP 1234 to login`);
  }

  console.log("Seeding complete.");
}

seedUsers();
