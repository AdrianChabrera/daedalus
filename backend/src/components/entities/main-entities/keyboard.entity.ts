import { Entity } from 'typeorm';
import { Component } from '../component.entity';

@Entity('keyboards')
export class Keyboard extends Component {}
