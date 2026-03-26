import { Column, Entity, OneToMany } from 'typeorm';
import { Component } from '../component.entity';
import { M2Slot } from '../secondary-entities/m2-slot.entity';
import { PcieSlot } from '../secondary-entities/pcie-slot.entity';

@Entity('motherboards')
export class Motherboard extends Component {
  @Column({ type: 'int', nullable: true, name: 'max_memory' })
  maxMemory: number | null;

  @Column({ type: 'int', nullable: true, name: 'memory_slots' })
  memorySlots: number | null;

  @Column({ type: 'int', nullable: true, name: 'sata_6_gb_s_ports' })
  sata6GbSPorts: number | null;

  @Column({ type: 'int', nullable: true, name: 'sata_3_gb_s_ports' })
  sata3GbSPorts: number | null;

  @Column({ type: 'int', nullable: true, name: 'u2_ports' })
  u2Ports: number | null;

  @Column({ type: 'int', nullable: true, name: 'usb_2_0_headers' })
  usb20Headers: number | null;

  @Column({ type: 'int', nullable: true, name: 'usb_3_2_gen_1_headers' })
  usb32Gen1Headers: number | null;

  @Column({ type: 'int', nullable: true, name: 'usb_3_2_gen_2_headers' })
  usb32Gen2Headers: number | null;

  @Column({ type: 'int', nullable: true, name: 'usb_3_2_gen_2x2_headers' })
  usb32Gen2x2Headers: number | null;

  @Column({ type: 'int', nullable: true, name: 'usb_4_headers' })
  usb4Headers: number | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  socket: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'ram_type' })
  ramType: string | null;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  audio: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  chipset: string | null;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'wireless_networking',
  })
  wirelessNetworking: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'form_factor' })
  formFactor: string | null;

  @Column({ type: 'simple-array', nullable: true, name: 'back_panel_ports' })
  backPanelPorts: string[] | null;

  @Column({ type: 'boolean', nullable: true, name: 'bios_flashback' })
  biosFlashback: boolean | null;

  @Column({ type: 'boolean', nullable: true, name: 'bios_clear_cmos' })
  biosClearCmos: boolean | null;

  @Column({ type: 'boolean', nullable: true, name: 'ecc_support' })
  eccSupport: boolean | null;

  @Column({ type: 'boolean', nullable: true, name: 'raid_support' })
  raidSupport: boolean | null;

  @Column({ type: 'boolean', nullable: true, name: 'back_connect' })
  backConnect: boolean | null;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'onboard_ethernet',
  })
  onboardEthernet: string | null;

  @OneToMany(() => M2Slot, (s) => s.motherboard, {
    cascade: true,
    nullable: true,
  })
  m2Slots: M2Slot[] | null;

  @OneToMany(() => PcieSlot, (s) => s.motherboard, {
    cascade: true,
    nullable: true,
  })
  pcieSlots: PcieSlot[] | null;
}
