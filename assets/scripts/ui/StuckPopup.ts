import { _decorator, Button, Component, Label } from "cc";

const { ccclass, property } = _decorator;

@ccclass("StuckPopup")
export class StuckPopup extends Component {
  @property(Label)
  titleLabel: Label | null = null;

  @property(Label)
  descLabel: Label | null = null;

  @property(Button)
  hintButton: Button | null = null;

  @property(Button)
  addSlotButton: Button | null = null;

  @property(Button)
  restartButton: Button | null = null;

  @property(Button)
  closeButton: Button | null = null;

  private onHintCallback: (() => void) | null = null;
  private onAddSlotCallback: (() => void) | null = null;
  private onRestartCallback: (() => void) | null = null;

  protected onLoad(): void {
    this.hintButton?.node.on(Button.EventType.CLICK, () => {
      this.hide();
      this.onHintCallback?.();
    });

    this.addSlotButton?.node.on(Button.EventType.CLICK, () => {
      this.hide();
      this.onAddSlotCallback?.();
    });

    this.restartButton?.node.on(Button.EventType.CLICK, () => {
      this.hide();
      this.onRestartCallback?.();
    });

    this.closeButton?.node.on(Button.EventType.CLICK, () => {
      this.hide();
    });
  }

  show(params: {
    canUseExtraSlot: boolean;
    onHint: () => void;
    onAddSlot: () => void;
    onRestart: () => void;
  }): void {
    this.node.active = true;

    if (this.titleLabel) {
      this.titleLabel.string = "好像卡住了";
    }

    if (this.descLabel) {
      this.descLabel.string = "当前没有可移动的螺丝，可以使用帮助继续挑战。";
    }

    this.onHintCallback = params.onHint;
    this.onAddSlotCallback = params.onAddSlot;
    this.onRestartCallback = params.onRestart;

    if (this.addSlotButton) {
      this.addSlotButton.interactable = params.canUseExtraSlot;
    }
  }

  hide(): void {
    this.node.active = false;
  }
}
