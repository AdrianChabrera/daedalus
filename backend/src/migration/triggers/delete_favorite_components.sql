CREATE OR REPLACE FUNCTION delete_favorite_component()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM user_favorite_components
  WHERE component_type = TG_ARGV[0]
    AND component_id = OLD.buildcores_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_delete_cpu_favorites ON cpus;
CREATE TRIGGER trg_delete_cpu_favorites
BEFORE DELETE ON cpus
FOR EACH ROW EXECUTE FUNCTION delete_favorite_component('cpu');

DROP TRIGGER IF EXISTS trg_delete_gpu_favorites ON gpus;
CREATE TRIGGER trg_delete_gpu_favorites
BEFORE DELETE ON gpus
FOR EACH ROW EXECUTE FUNCTION delete_favorite_component('gpu');

DROP TRIGGER IF EXISTS trg_delete_ram_favorites ON rams;
CREATE TRIGGER trg_delete_ram_favorites
BEFORE DELETE ON rams
FOR EACH ROW EXECUTE FUNCTION delete_favorite_component('ram');

DROP TRIGGER IF EXISTS trg_delete_motherboard_favorites ON motherboards;
CREATE TRIGGER trg_delete_motherboard_favorites
BEFORE DELETE ON motherboards
FOR EACH ROW EXECUTE FUNCTION delete_favorite_component('motherboard');

DROP TRIGGER IF EXISTS trg_delete_storage_favorites ON storage_drives;
CREATE TRIGGER trg_delete_storage_favorites
BEFORE DELETE ON storage_drives
FOR EACH ROW EXECUTE FUNCTION delete_favorite_component('storage-drive');

DROP TRIGGER IF EXISTS trg_delete_cpu_cooler_favorites ON cpu_coolers;
CREATE TRIGGER trg_delete_cpu_cooler_favorites
BEFORE DELETE ON cpu_coolers
FOR EACH ROW EXECUTE FUNCTION delete_favorite_component('cpu-cooler');

DROP TRIGGER IF EXISTS trg_delete_pc_case_favorites ON pc_cases;
CREATE TRIGGER trg_delete_pc_case_favorites
BEFORE DELETE ON pc_cases
FOR EACH ROW EXECUTE FUNCTION delete_favorite_component('pc-case');

DROP TRIGGER IF EXISTS trg_delete_power_supply_favorites ON power_supplies;
CREATE TRIGGER trg_delete_power_supply_favorites
BEFORE DELETE ON power_supplies
FOR EACH ROW EXECUTE FUNCTION delete_favorite_component('power-supply');

DROP TRIGGER IF EXISTS trg_delete_fan_favorites ON fans;
CREATE TRIGGER trg_delete_fan_favorites
BEFORE DELETE ON fans
FOR EACH ROW EXECUTE FUNCTION delete_favorite_component('fan');

DROP TRIGGER IF EXISTS trg_delete_monitor_favorites ON monitors;
CREATE TRIGGER trg_delete_monitor_favorites
BEFORE DELETE ON monitors
FOR EACH ROW EXECUTE FUNCTION delete_favorite_component('monitor');

DROP TRIGGER IF EXISTS trg_delete_keyboard_favorites ON keyboards;
CREATE TRIGGER trg_delete_keyboard_favorites
BEFORE DELETE ON keyboards
FOR EACH ROW EXECUTE FUNCTION delete_favorite_component('keyboard');

DROP TRIGGER IF EXISTS trg_delete_mouse_favorites ON mouses;
CREATE TRIGGER trg_delete_mouse_favorites
BEFORE DELETE ON mouses
FOR EACH ROW EXECUTE FUNCTION delete_favorite_component('mouse');