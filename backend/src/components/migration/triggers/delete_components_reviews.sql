CREATE OR REPLACE FUNCTION delete_component_reviews()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM reviews
  WHERE component_type = TG_ARGV[0]
    AND component_id = OLD.buildcores_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_delete_cpu_reviews
BEFORE DELETE ON cpus
FOR EACH ROW EXECUTE FUNCTION delete_component_reviews('cpu');

CREATE TRIGGER trg_delete_gpu_reviews
BEFORE DELETE ON gpus
FOR EACH ROW EXECUTE FUNCTION delete_component_reviews('gpu');

CREATE TRIGGER trg_delete_ram_reviews
BEFORE DELETE ON rams
FOR EACH ROW EXECUTE FUNCTION delete_component_reviews('ram');

CREATE TRIGGER trg_delete_motherboard_reviews
BEFORE DELETE ON motherboards
FOR EACH ROW EXECUTE FUNCTION delete_component_reviews('motherboard');

CREATE TRIGGER trg_delete_storage_reviews
BEFORE DELETE ON storage_drives
FOR EACH ROW EXECUTE FUNCTION delete_component_reviews('storage-drive');

CREATE TRIGGER trg_delete_cpu_cooler_reviews
BEFORE DELETE ON cpu_coolers
FOR EACH ROW EXECUTE FUNCTION delete_component_reviews('cpu-cooler');

CREATE TRIGGER trg_delete_pc_case_reviews
BEFORE DELETE ON pc_cases
FOR EACH ROW EXECUTE FUNCTION delete_component_reviews('pc-case');

CREATE TRIGGER trg_delete_power_supply_reviews
BEFORE DELETE ON power_supplies
FOR EACH ROW EXECUTE FUNCTION delete_component_reviews('power-supply');

CREATE TRIGGER trg_delete_fan_reviews
BEFORE DELETE ON fans
FOR EACH ROW EXECUTE FUNCTION delete_component_reviews('fan');

CREATE TRIGGER trg_delete_monitor_reviews
BEFORE DELETE ON monitors
FOR EACH ROW EXECUTE FUNCTION delete_component_reviews('monitor');

CREATE TRIGGER trg_delete_keyboard_reviews
BEFORE DELETE ON keyboards
FOR EACH ROW EXECUTE FUNCTION delete_component_reviews('keyboard');

CREATE TRIGGER trg_delete_mouse_reviews
BEFORE DELETE ON mouses
FOR EACH ROW EXECUTE FUNCTION delete_component_reviews('mouse');