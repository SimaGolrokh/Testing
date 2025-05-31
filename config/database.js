// seedPlants.js
const pool = require("./db");

async function seedPlants() {
  try {
    await pool.query(`
      INSERT INTO catalog_plant (common_name, scientific_name, width, height, min_temperature, max_temperature, planting_start, planting_end, blooming_start, blooming_end, flower_color, harvest_start, harvest_end, edible_parts, yield, sun_light, water_frequency, feeding_frequency, fertilizer_type)
      VALUES 
        ('Lavender', 'Lavandula angustifolia', 60, 90, -5, 30, 'April', 'June', 'June', 'August', 'Purple', NULL, NULL, NULL, NULL, 'Full Sun', 'WEEKLY', 'MONTHLY', 'All-purpose fertilizer'),
        ('Carrot', 'Daucus carota', 5, 30, 4, 24, 'March', 'July', NULL, NULL, NULL, 'June', 'November', 'Root', '1-2 kg per m²', 'Full Sun', 'EVERY 3 DAYS', 'MONTHLY', 'Balanced NPK'),
        ('Basil', 'Ocimum basilicum', 30, 60, 10, 30, 'April', 'June', 'June', 'September', 'White', 'June', 'October', 'Leaves', 'Frequent small harvests', 'Full Sun', 'DAILY', 'WEEKLY', 'Liquid Organic Fertilizer'),
        ('Blueberry', 'Vaccinium corymbosum', 120, 180, -20, 30, 'March', 'April', 'April', 'May', 'White/Pink', 'June', 'August', 'Fruit', '2-4 kg per bush', 'Full Sun to Partial Shade', 'WEEKLY', 'BIWEEKLY', 'Acidic Fertilizer'),
        ('Rosemary', 'Salvia rosmarinus', 90, 150, -10, 30, 'March', 'May', 'May', 'August', 'Blue', NULL, NULL, 'Leaves', 'Frequent small harvests', 'Full Sun', 'WEEKLY', 'MONTHLY', 'Low Nitrogen Fertilizer'),
        ('Zucchini', 'Cucurbita pepo', 90, 60, 10, 35, 'April', 'June', 'June', 'August', 'Yellow', 'June', 'September', 'Fruit', '3-9 kg per plant', 'Full Sun', 'DAILY', 'WEEKLY', 'High Potassium Fertilizer'),
        ('Strawberry', 'Fragaria × ananassa', 30, 20, -5, 30, 'March', 'May', 'April', 'June', 'White', 'May', 'July', 'Fruit', '0.5-1 kg per plant', 'Full Sun', 'DAILY', 'BIWEEKLY', 'Balanced NPK'),
        ('Sunflower', 'Helianthus annuus', 60, 300, 10, 35, 'April', 'May', 'July', 'August', 'Yellow', 'September', 'October', 'Seeds', '500-1000 seeds per plant', 'Full Sun', 'EVERY 2 DAYS', 'MONTHLY', 'Slow-release Fertilizer'),
        ('Mint', 'Mentha spicata', 45, 60, 10, 30, 'April', 'June', 'May', 'August', 'Purple', NULL, NULL, 'Leaves', 'Frequent small harvests', 'Partial Shade to Full Sun', 'DAILY', 'WEEKLY', 'Organic Compost');
    `);
    console.log("Seeding done ✅");
  } catch (err) {
    console.error("Seeding failed ❌", err);
  } finally {
    await pool.end();
  }
}

seedPlants();

