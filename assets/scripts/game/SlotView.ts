import {
  _decorator,
  Color,
  Component,
  Graphics,
  Node,
  UITransform,
  Vec3,
} from "cc";
import { PieceView } from "./PieceView";

const { ccclass } = _decorator;

@ccclass("SlotView")
export class SlotView extends Component {
  private slotIndex = 0;
  private maxStack = 4;
  private pieceNodes: Node[] = [];
  private clickCallback: ((slotIndex: number) => void) | null = null;

  private selected = false;
  private hinted = false;

  init(
    slotIndex: number,
    colors: number[],
    maxStack: number,
    clickCallback: (slotIndex: number) => void,
    scale = 1,
  ): void {
    this.slotIndex = slotIndex;
    this.maxStack = maxStack;
    this.clickCallback = clickCallback;
    this.node.setScale(scale, scale, 1);

    const transform =
      this.node.getComponent(UITransform) ??
      this.node.addComponent(UITransform);
    transform.setContentSize(96, 360);

    this.drawSlot();
    this.renderPieces(colors);

    this.node.off(Node.EventType.TOUCH_END);
    this.node.on(Node.EventType.TOUCH_END, this.handleClick, this);
  }

  setSelected(selected: boolean): void {
    this.selected = selected;
    this.drawSlot();
  }

  setHinted(hinted: boolean): void {
    this.hinted = hinted;
    this.drawSlot();
  }

  updatePieces(colors: number[]): void {
    this.renderPieces(colors);
  }

  getTopPieceWorldPosition(): Vec3 {
    const topPiece = this.pieceNodes[this.pieceNodes.length - 1];

    if (!topPiece) {
      return this.node.worldPosition.clone();
    }

    return topPiece.worldPosition.clone();
  }

  getNextPieceWorldPosition(): Vec3 {
    const pieceSize = 72;
    const gap = 8;
    const startY = 32;

    const nextIndex = this.pieceNodes.length;
    const localX = 12;
    const localY = startY + nextIndex * (pieceSize + gap);

    const localPos = new Vec3(localX, localY, 0);
    return this.node.getComponent(UITransform)!.convertToWorldSpaceAR(localPos);
  }

  getTopColorId(): number | null {
    const topPiece = this.pieceNodes[this.pieceNodes.length - 1];
    if (!topPiece) return null;

    const pieceView = topPiece.getComponent(PieceView);
    return pieceView?.getColorId() ?? null;
  }

  removeTopPieceNode(): Node | null {
    const topPiece = this.pieceNodes.pop();
    if (!topPiece) return null;

    topPiece.removeFromParent();
    return topPiece;
  }

  private handleClick(): void {
    this.clickCallback?.(this.slotIndex);
  }

  private drawSlot(): void {
    const graphics =
      this.node.getComponent(Graphics) ?? this.node.addComponent(Graphics);
    graphics.clear();

    if (this.selected) {
      graphics.lineWidth = 8;
      graphics.strokeColor = new Color(255, 210, 80, 255);
    } else if (this.hinted) {
      graphics.lineWidth = 8;
      graphics.strokeColor = new Color(80, 220, 120, 255);
    } else {
      graphics.lineWidth = 4;
      graphics.strokeColor = new Color(180, 180, 180, 255);
    }

    graphics.moveTo(16, 320);
    graphics.lineTo(16, 20);
    graphics.lineTo(80, 20);
    graphics.lineTo(80, 320);
    graphics.stroke();
  }

  private renderPieces(colors: number[]): void {
    this.pieceNodes.forEach((node) => node.destroy());
    this.pieceNodes = [];

    const pieceSize = 72;
    const gap = 8;
    const startY = 32;

    colors.forEach((colorId, index) => {
      const pieceNode = new Node(`Piece_${colorId}`);
      pieceNode.setParent(this.node);

      const pieceView = pieceNode.addComponent(PieceView);
      pieceView.init(colorId);

      const x = 12;
      const y = startY + index * (pieceSize + gap);

      pieceNode.setPosition(new Vec3(x, y, 0));
      this.pieceNodes.push(pieceNode);
    });
  }
}
