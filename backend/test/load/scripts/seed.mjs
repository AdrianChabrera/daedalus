import pg from 'pg';

const { Client } = pg;

const DB_CONFIG = {
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '5434'),
  user:     process.env.DB_USER     || 'loadtest',
  password: process.env.DB_PASSWORD || 'loadtest',
  database: process.env.DB_NAME     || 'daedalus_loadtest',
};

const IDS = {
  cpu:          'aaaaaaaa-0001-4000-8000-000000000001',
  gpu:          'aaaaaaaa-0002-4000-8000-000000000002',
  motherboard:  'aaaaaaaa-0003-4000-8000-000000000003',
  powerSupply:  'aaaaaaaa-0004-4000-8000-000000000004',
  pcCase:       'aaaaaaaa-0005-4000-8000-000000000005',
  cpuCooler:    'aaaaaaaa-0006-4000-8000-000000000006',
  ram:          'aaaaaaaa-0007-4000-8000-000000000007',
  storageDrive: 'aaaaaaaa-0008-4000-8000-000000000008',
};

async function seed() {
  const client = new Client(DB_CONFIG);
  await client.connect();

  try {
    console.log('Seeding load test components...');

    await client.query(`
      INSERT INTO cpus (buildcores_id, name, manufacturer, socket, core_count, thread_count,
                        base_clock, boost_clock, tdp, microarchitecture, supported_memory_types,
                        integrated_graphics, includes_cooler, ecc_support)
      VALUES ($1, 'LT Ryzen 5 5600X', 'AMD', 'AM4', 6, 12, 3.7, 4.6, 65, 'Zen 3', 'DDR4',
              'None', false, false)
      ON CONFLICT (buildcores_id) DO NOTHING
    `, [IDS.cpu]);

    await client.query(`
      INSERT INTO gpus (buildcores_id, name, manufacturer, chipset, memory, memory_type,
                        gpu_interface, tdp, core_base_clock, core_boost_clock,
                        pcie_6_pin, pcie_8_pin, pcie_12vhpwr, pcie_12v_2x6, length)
      VALUES ($1, 'LT RTX 3060', 'NVIDIA', 'GA106', 12, 'GDDR6', 'PCIe 4.0 x16', 170, 1320, 1777,
              0, 2, 0, 0, 300)
      ON CONFLICT (buildcores_id) DO NOTHING
    `, [IDS.gpu]);

    await client.query(`
      INSERT INTO motherboards (buildcores_id, name, manufacturer, socket, chipset,
                                form_factor, ram_type, memory_slots, max_memory,
                                m2_slot_count, pcie_slot_count,
                                sata_6_gb_s_ports, sata_3_gb_s_ports, u2_ports,
                                ecc_support)
      VALUES ($1, 'LT B550 AORUS Elite', 'Gigabyte', 'AM4', 'B550',
              'ATX', 'DDR4', 4, 128,
              2, 2,
              6, 0, 0,
              false)
      ON CONFLICT (buildcores_id) DO NOTHING
    `, [IDS.motherboard]);

    await client.query(
      `DELETE FROM m2_slots WHERE motherboard_id = $1`,
      [IDS.motherboard],
    );
    await client.query(`
      INSERT INTO m2_slots (size, key, m2_interface, motherboard_id)
      VALUES ('2280', 'M', 'PCIe 4.0 x4', $1),
             ('2280', 'M', 'PCIe 3.0 x4', $1)
    `, [IDS.motherboard]);

    await client.query(
      `DELETE FROM pcie_slots WHERE motherboard_id = $1`,
      [IDS.motherboard],
    );
    await client.query(`
      INSERT INTO pcie_slots (gen, lanes, quantity, motherboard_id)
      VALUES ('4', 16, 1, $1),
             ('3',  1, 1, $1)
    `, [IDS.motherboard]);

    await client.query(`
      INSERT INTO power_supplies (buildcores_id, name, manufacturer, wattage,
                                  form_factor, modular, efficency_rating,
                                  atx_24_pin, eps_8_pin, pcie_6_plus_2_pin, sata, pcie_12vhpwr)
      VALUES ($1, 'LT RM750x', 'Corsair', 750,
              'ATX', 'Full', '80+ Gold',
              1, 2, 4, 6, 0)
      ON CONFLICT (buildcores_id) DO NOTHING
    `, [IDS.powerSupply]);

    await client.query(`
      INSERT INTO pc_cases (buildcores_id, name, manufacturer, form_factor,
                            supported_motherboard_form_factors, side_panel,
                            width, height, depth, volume, expansion_slots,
                            max_video_card_length, max_cpu_cooler_height,
                            internal_2_5_bays, internal_3_5_bays,
                            power_supply)
      VALUES ($1, 'LT 4000D Airflow', 'Corsair', 'Mid Tower',
              'ATX,Micro-ATX,Mini-ITX', 'Tempered Glass',
              230, 466, 453, 48.6, 7,
              400, 165,
              2, 2,
              'None')
      ON CONFLICT (buildcores_id) DO NOTHING
    `, [IDS.pcCase]);

    await client.query(`
      INSERT INTO cpu_coolers (buildcores_id, name, manufacturer, water_cooled,
                               min_fan_rpm, max_fan_rpm, fan_size, fan_quantity,
                               height, supported_sockets)
      VALUES ($1, 'LT Hyper 212 Black', 'Cooler Master', false,
              600, 2000, 120, 1,
              158.8, 'AM4,AM5,LGA1700,LGA1200')
      ON CONFLICT (buildcores_id) DO NOTHING
    `, [IDS.cpuCooler]);

    await client.query(`
      INSERT INTO rams (buildcores_id, name, manufacturer, memory_type, form_factor,
                        capacity, speed, cas_latency, voltage, quantity)
      VALUES ($1, 'LT Vengeance LPX 16GB', 'Corsair', 'DDR4', 'DIMM',
              16, 3200, 16, 1.35, 2)
      ON CONFLICT (buildcores_id) DO NOTHING
    `, [IDS.ram]);

    await client.query(`
      INSERT INTO storage_drives (buildcores_id, name, manufacturer, storage_type,
                                  form_factor, storage_interface, capacity, nvme)
      VALUES ($1, 'LT 970 EVO Plus 1TB', 'Samsung', 'SSD',
              'M.2-2280', 'M.2 PCIe 4.0 x4', 1000, true)
      ON CONFLICT (buildcores_id) DO NOTHING
    `, [IDS.storageDrive]);

    console.log('Seed completed.');

  } finally {
    await client.end();
  }
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});

export { IDS };
