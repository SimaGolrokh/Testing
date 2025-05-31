function formatCatalogPlant(row = {}) {
  return {
    id: row.id ?? null,

    name: {
      commonName: row.common_name ?? "Unknown",
      scientificName: row.scientific_name ?? "Unknown"
    },

    imageUrl: row.image_url ?? null,

    blooming: {
      start: row.blooming_start ?? null,
      end: row.blooming_end ?? null,
      flowerColor: row.flower_color ?? "Unknown"
    },

    harvest: (row.harvest_start && row.harvest_end && row.yield != null && row.edible_parts)
      ? {
        start: row.harvest_start,
        end: row.harvest_end,
        yield: row.yield,
        edibleParts: row.edible_parts
      }
      : null,

    waterFrequency: row.water_frequency ?? "Moderate",
    neededMoisture: row.needed_moisture,
    sunLight: row.sun_light ?? "Partial",

    temperature: {
      min: row.min_temperature ?? null,
      max: row.max_temperature ?? null
    },

    size: {
      height: row.height ?? null,
      width: row.width ?? null
    },

    fertilizerType: row.fertilizer_type ?? "General-purpose",

    planting: {
      start: row.planting_start ?? null,
      end: row.planting_end ?? null
    }
  };
}

function formatUserPlant(row = {}) {
  console.log(row)
  return {
    id: row.user_plant_id ?? null,
    nickName: row.nickname ?? "Unnamed Plant",
    userId: row.user_id ?? null,
    garden_id: row.garden_id ?? null,
    catalogPlant_id: row.catalog_plant_id ?? null,
    wateredDate: row.date_watered ?? null,
    plantedDate: row.date_added ?? null,
    feededDate: row.date_feed ?? null,
    moistureLevel: row.moisture_level ?? "Unknown",
    sunlightLevel: row.sunlight_level ?? "Unknown",
    harvested: row.harvest_status ?? false,
    sensorId: row.moisture_sensor_id ?? null,

    name: {
      commonName: row.common_name ?? "Unknown",
      scientificName: row.scientific_name ?? "Unknown"
    },

    blooming: {
      start: row.blooming_start ?? null,
      end: row.blooming_end ?? null,
      flowerColor: row.flower_color ?? "Unknown"
    },

    waterFrequency: row.water_frequency ?? "Moderate",
    neededMoisture: row.needed_moisture,
    sunLight: row.sun_light ?? "Partial",

    harvest: (row.harvest_start && row.harvest_end && row.yield != null && row.edible_parts)
      ? {
        start: row.harvest_start,
        end: row.harvest_end,
        yield: row.yield,
        edibleParts: row.edible_parts
      }
      : null,

    temperature: {
      min: row.min_temperature ?? null,
      max: row.max_temperature ?? null
    },

    size: {
      height: row.height ?? null,
      width: row.width ?? null
    },

    fertilizerType: row.fertilizer_type ?? "General-purpose",

    planting: {
      start: row.planting_start ?? null,
      end: row.planting_end ?? null
    },

    imageUrl: row.image_url ?? null
  };
}

module.exports = {
  formatCatalogPlant,
  formatUserPlant
};

