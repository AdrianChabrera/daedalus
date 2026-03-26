import { Entity } from 'typeorm';
import { Component } from '../component.entity';

@Entity('mouses')
export class Mouse extends Component {}
