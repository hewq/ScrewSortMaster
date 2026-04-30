import { _decorator, Color, Component, Graphics, UITransform } from "cc";

const { ccclass } = _decorator;

@ccclass("PieceView")
export class PieceView extends Component {
  private colorId = 0;

  init(colorId: number): void {
    this.colorId = colorId;

    const transform =
      this.node.getComponent(UITransform) ??
      this.node.addComponent(UITransform);
    transform.setContentSize(72, 72);

    const graphics =
      this.node.getComponent(Graphics) ?? this.node.addComponent(Graphics);
    graphics.clear();

    graphics.fillColor = this.getColorById(colorId);
    graphics.circle(36, 36, 30);
    graphics.fill();

    graphics.strokeColor = new Color(255, 255, 255, 180);
    graphics.lineWidth = 4;
    graphics.circle(36, 36, 30);
    graphics.stroke();
  }

  getColorId(): number {
    return this.colorId;
  }

  private getColorById(id: number): Color {
    const colors: Record<number, Color> = {
      1: new Color(239, 83, 80, 255),
      2: new Color(66, 165, 245, 255),
      3: new Color(102, 187, 106, 255),
      4: new Color(255, 202, 40, 255),
      5: new Color(171, 71, 188, 255),
      6: new Color(255, 112, 67, 255),
      7: new Color(38, 166, 154, 255),
      8: new Color(141, 110, 99, 255),
      9: new Color(236, 64, 122, 255),
      10: new Color(126, 87, 194, 255),
    };

    return colors[id] ?? new Color(180, 180, 180, 255);
  }
}
