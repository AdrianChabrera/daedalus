CREATE EXTENSION IF NOT EXISTS pg_trgm;
 
CREATE INDEX IF NOT EXISTS idx_cpus_name_trgm           ON cpus           USING GIN(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_gpus_name_trgm           ON gpus           USING GIN(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_motherboards_name_trgm   ON motherboards   USING GIN(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_rams_name_trgm           ON rams           USING GIN(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_storages_name_trgm       ON storages       USING GIN(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_cpu_coolers_name_trgm    ON cpu_coolers    USING GIN(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_pc_cases_name_trgm       ON pc_cases       USING GIN(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_power_supplies_name_trgm ON power_supplies USING GIN(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_fans_name_trgm           ON fans           USING GIN(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_monitors_name_trgm       ON monitors       USING GIN(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_keyboards_name_trgm      ON keyboards      USING GIN(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_mouses_name_trgm         ON mouses         USING GIN(name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_builds_name_trgm         ON builds         USING GIN(name gin_trgm_ops);
 