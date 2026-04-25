export class ComponentWithQuantityResponseDto<T> {
  component: T;
  quantity: number;

  constructor(component: T, quantity: number) {
    this.component = component;
    this.quantity = quantity;
  }
}
