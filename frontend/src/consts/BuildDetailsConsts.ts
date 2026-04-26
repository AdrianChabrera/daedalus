export const SLOT_TO_API: Record<string, { single?: string; multi?: string; endpoint: string }> = {
  cpuId:           { single: 'cpu',          endpoint: 'cpu' },
  gpuId:           { single: 'gpu',          endpoint: 'gpu' },
  motherboardId:   { single: 'motherboard',  endpoint: 'motherboard' },
  pcCaseId:        { single: 'pcCase',       endpoint: 'pc-case' },
  powerSupplyId:   { single: 'powerSupply',  endpoint: 'power-supply' },
  cpuCoolerId:     { single: 'cpuCooler',    endpoint: 'cpu-cooler' },
  keyboardId:      { single: 'keyboard',     endpoint: 'keyboard' },
  mouseId:         { single: 'mouse',        endpoint: 'mouse' },
  ramIds:          { multi: 'rams',          endpoint: 'ram' },
  storageDriveIds: { multi: 'storageDrives', endpoint: 'storage-drive' },
  fanIds:          { multi: 'fans',          endpoint: 'fan' },
  monitorIds:      { multi: 'monitors',      endpoint: 'monitor' },
};