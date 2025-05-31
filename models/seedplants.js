require("dotenv").config();
const pool = require("../config/db");
console.log("Loaded Environment Variables:", process.env);


// Array of plant data to add to PostgreSQL
const plants = [
  {
    commonName: "Tomato",
    scientificName: "Solanum lycopersicum",
    bloomingStart: "June",
    bloomingEnd: "August",
    flowerColor: "Yellow",
    waterFrequency: "WEEKLY",
    harvestStart: "July",
    harvestEnd: "September",
    yield: "20",
    edibleParts: "Fruit",
    sunLight: "FULL_SUN",
    minTemperature: 15,
    maxTemperature: 35,
    height: 100,
    width: 60,
    fertilizerType: "Organic compost",
    plantingStart: "March",
    plantingEnd: "April",
    neededMoisture: "Moist",
  },
  {
    commonName: "Rose",
    scientificName: "Rosa",
    bloomingStart: "May",
    bloomingEnd: "October",
    flowerColor: "Red",
    waterFrequency: "WEEKLY",
    harvestStart: null,
    harvestEnd: null,
    yield: null,
    edibleParts: null,
    sunLight: "PARTIAL_SUN",
    minTemperature: 10,
    maxTemperature: 30,
    height: 150,
    width: 100,
    fertilizerType: "Rose fertilizer",
    plantingStart: "March",
    plantingEnd: "May",
    neededMoisture: "Moist",
  },
  {
    commonName: "Carrot",
    scientificName: "Daucus carota",
    bloomingStart: "June",
    bloomingEnd: "August",
    flowerColor: "White",
    waterFrequency: "WEEKLY",
    harvestStart: "August",
    harvestEnd: "September",
    yield: "50",
    edibleParts: "Root",
    sunLight: "FULL_SUN",
    minTemperature: 10,
    maxTemperature: 25,
    height: 30,
    width: 5,
    fertilizerType: "All-purpose fertilizer",
    plantingStart: "March",
    plantingEnd: "June",
    neededMoisture: "Very Dry",
  },
];

//  check if a plant already exists in the database
const plantExists = async (commonName) => {
  const result = await pool.query(
    "SELECT 1 FROM catalog_plant WHERE common_name = $1 LIMIT 1",
    [commonName]
  );
  return result.rows.length > 0;
};

//  add plants inside a transaction
const addPlantsToPostgres = async () => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    for (const plant of plants) {
      console.log(`Processing plant: ${plant.commonName}`);

      // Check if the plant already exists
      const exists = await plantExists(plant.commonName);
      if (exists) {
        console.log(`Plant "${plant.commonName}" already exists. Skipping...`);
        continue;
      }

      // Insert plant data into the catalog_plant table
      const query = `
        INSERT INTO catalog_plant 
        (common_name, scientific_name, blooming_start, blooming_end, flower_color, water_frequency, 
        harvest_start, harvest_end, yield, edible_parts, sun_light, min_temperature, max_temperature, 
        height, width, fertilizer_type, planting_start, planting_end, needed_moisture)
        VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      `;

      const values = [
        plant.commonName,
        plant.scientificName,
        plant.bloomingStart,
        plant.bloomingEnd,
        plant.flowerColor,
        plant.waterFrequency,
        plant.harvestStart,
        plant.harvestEnd,
        plant.yield,
        plant.edibleParts,
        plant.sunLight,
        plant.minTemperature,
        plant.maxTemperature,
        plant.height,
        plant.width,
        plant.fertilizerType,
        plant.plantingStart,
        plant.plantingEnd,
        plant.neededMoisture
      ];

      await client.query(query, values);
      console.log(`Successfully added "${plant.commonName}"`);
    }

    await client.query("COMMIT"); // Commit transaction if all inserts succeed
    console.log("Finished adding plants.");
  } catch (error) {
    await client.query("ROLLBACK"); // Rollback if any error occurs
    console.error("Error processing plants:", error);
  } finally {
    client.release(); // Release the client back to the pool
  }
};

// Execute the function to add plants to the database
addPlantsToPostgres()
  .then(() => {
    console.log("All plants processed successfully.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Unexpected error:", error);
    process.exit(1);
  });
