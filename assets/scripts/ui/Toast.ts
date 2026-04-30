import { _decorator, Component, Label, tween, UIOpacity } from "cc";

const { ccclass, property } = _decorator;

@ccclass("Toast")
export class Toast extends Component {
  @property(Label)
  label: Label | null = null;

  private opacity: UIOpacity | null = null;

  protected onLoad(): void {
    this.opacity =
      this.node.getComponent(UIOpacity) ?? this.node.addComponent(UIOpacity);
    this.node.active = false;
  }

  show(text: string): void {
    if (!this.opacity) return;

    this.node.active = true;

    if (this.label) {
      this.label.string = text;
    }

    this.opacity.opacity = 255;

    tween(this.opacity)
      .delay(1.2)
      .to(0.25, { opacity: 0 })
      .call(() => {
        this.node.active = false;
      })
      .start();
  }
}
