CREATE OR REPLACE FUNCTION delete_component_reviews()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM reviews
  WHERE component_type = TG_ARGV[0]
    AND component_id = OLD.buildcores_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_delete_cpu_reviews ON cpus;
CREATE TRIGGER trg_delete_cpu_reviews
BEFORE DELETE ON cpus
FOR EACH ROW EXECUTE FUNCTION delete_component_reviews('cpu');

DROP TRIGGER IF EXISTS trg_delete_gpu_reviews ON gpus;
CREATE TRIGGER trg_delete_gpu_reviews
BEFORE DELETE ON gpus
FOR EACH ROW EXECUTE FUNCTION delete_component_reviews('gpu');

DROP TRIGGER IF EXISTS trg_delete_ram_reviews ON rams;
CREATE TRIGGER trg_delete_ram_reviews
BEFORE DELETE ON rams
FOR EACH ROW EXECUTE FUNCTION delete_component_reviews('ram');

DROP TRIGGER IF EXISTS trg_delete_motherboard_reviews ON motherboards;
CREATE TRIGGER trg_delete_motherboard_reviews
BEFORE DELETE ON motherboards
FOR EACH ROW EXECUTE FUNCTION delete_component_reviews('motherboard');

DROP TRIGGER IF EXISTS trg_delete_storage_reviews ON storage_drives;
CREATE TRIGGER trg_delete_storage_reviews
BEFORE DELETE ON storage_drives
FOR EACH ROW EXECUTE FUNCTION delete_component_reviews('storage-drive');

DROP TRIGGER IF EXISTS trg_delete_cpu_cooler_reviews ON cpu_coolers;
CREATE TRIGGER trg_delete_cpu_cooler_reviews
BEFORE DELETE ON cpu_coolers
FOR EACH ROW EXECUTE FUNCTION delete_component_reviews('cpu-cooler');

DROP TRIGGER IF EXISTS trg_delete_pc_case_reviews ON pc_cases;
CREATE TRIGGER trg_delete_pc_case_reviews
BEFORE DELETE ON pc_cases
FOR EACH ROW EXECUTE FUNCTION delete_component_reviews('pc-case');

DROP TRIGGER IF EXISTS trg_delete_power_supply_reviews ON power_supplies;
CREATE TRIGGER trg_delete_power_supply_reviews
BEFORE DELETE ON power_supplies
FOR EACH ROW EXECUTE FUNCTION delete_component_reviews('power-supply');

DROP TRIGGER IF EXISTS trg_delete_fan_reviews ON fans;
CREATE TRIGGER trg_delete_fan_reviews
BEFORE DELETE ON fans
FOR EACH ROW EXECUTE FUNCTION delete_component_reviews('fan');

DROP TRIGGER IF EXISTS trg_delete_monitor_reviews ON monitors;
CREATE TRIGGER trg_delete_monitor_reviews
BEFORE DELETE ON monitors
FOR EACH ROW EXECUTE FUNCTION delete_component_reviews('monitor');

DROP TRIGGER IF EXISTS trg_delete_keyboard_reviews ON keyboards;
CREATE TRIGGER trg_delete_keyboard_reviews
BEFORE DELETE ON keyboards
FOR EACH ROW EXECUTE FUNCTION delete_component_reviews('keyboard');

DROP TRIGGER IF EXISTS trg_delete_mouse_reviews ON mouses;
CREATE TRIGGER trg_delete_mouse_reviews
BEFORE DELETE ON mouses
FOR EACH ROW EXECUTE FUNCTION delete_component_reviews('mouse');