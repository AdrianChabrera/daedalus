CREATE OR REPLACE FUNCTION delete_favorite_component()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM user_favorite_components
  WHERE component_type = TG_ARGV[0]
    AND component_id = OLD.buildcores_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_delete_cpu_favorites
BEFORE DELETE ON cpus
FOR EACH ROW EXECUTE FUNCTION delete_favorite_component('cpu');

CREATE TRIGGER trg_delete_gpu_favorites
BEFORE DELETE ON gpus
FOR EACH ROW EXECUTE FUNCTION delete_favorite_component('gpu');

CREATE TRIGGER trg_delete_ram_favorites
BEFORE DELETE ON rams
FOR EACH ROW EXECUTE FUNCTION delete_favorite_component('ram');

CREATE TRIGGER trg_delete_motherboard_favorites
BEFORE DELETE ON motherboards
FOR EACH ROW EXECUTE FUNCTION delete_favorite_component('motherboard');

CREATE TRIGGER trg_delete_storage_favorites
BEFORE DELETE ON storage_drives
FOR EACH ROW EXECUTE FUNCTION delete_favorite_component('storage-drive');

CREATE TRIGGER trg_delete_cpu_cooler_favorites
BEFORE DELETE ON cpu_coolers
FOR EACH ROW EXECUTE FUNCTION delete_favorite_component('cpu-cooler');

CREATE TRIGGER trg_delete_pc_case_favorites
BEFORE DELETE ON pc_cases
FOR EACH ROW EXECUTE FUNCTION delete_favorite_component('pc-case');

CREATE TRIGGER trg_delete_power_supply_favorites
BEFORE DELETE ON power_supplies
FOR EACH ROW EXECUTE FUNCTION delete_favorite_component('power-supply');

CREATE TRIGGER trg_delete_fan_favorites
BEFORE DELETE ON fans
FOR EACH ROW EXECUTE FUNCTION delete_favorite_component('fan');

CREATE TRIGGER trg_delete_monitor_favorites
BEFORE DELETE ON monitors
FOR EACH ROW EXECUTE FUNCTION delete_favorite_component('monitor');

CREATE TRIGGER trg_delete_keyboard_favorites
BEFORE DELETE ON keyboards
FOR EACH ROW EXECUTE FUNCTION delete_favorite_component('keyboard');

CREATE TRIGGER trg_delete_mouse_favorites
BEFORE DELETE ON mouses
FOR EACH ROW EXECUTE FUNCTION delete_favorite_component('mouse');