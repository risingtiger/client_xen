

type str = string; type bool = boolean; type int = number;




export type MachineT = {
  cell: Array<int>,
  chip: str,
  id: str,
  dispenser: { lora_version: int, mode: int },
  gps: Array<int>,
  incrs: Array<int>,
  mchId: str,
  meters: Array<int>,
  particle: MachineParticleT,
  state: {active: bool, latest:str},
  store: MachineStoreT,
  timezone: str,
  ts: int,
  tsS: int
} 
export type MachineParticleT = {
  account: str,
  codeversion: str
  id: str,
  product: int,
  serial: str,
} 
export type MachineStoreT = {
  id: str,
  name: str
} 

export type MachineDetailsT = {
  cellsignal: int,
  cellquality: int,
  chip: str,
  id: str,
  dispenser_loraversion: str,
  dispenser_mode: str,
  gps_lat: str,
  gps_lon: str,
  gps_ts: int,
  incrs: Array<int>,
  clientid: str,
  mchId: str,
  meters: Array<int>,
  particle: MachineParticleDetailsT,
  particle_more: MachineParticleMoreDetailsT|null,
  state_isactive: bool,
  state_latest: str,
  store_id: str,
  store_name: str,
  ts: int,
  tsS: int,
}

export type MachineParticleDetailsT = {
  account: str,
  codeversion: str,
  id: str,
  product: str,
  serial: str,
}

export type MachineParticleMoreDetailsT = {
  name: str,
  last_heard: str,
  last_handshake_at: str,
  online: bool,
  system_firmware_version: str,
  firmware_version: int,
}
