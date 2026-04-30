import { _decorator, Button, Component, Label, Node } from "cc";

const { ccclass, property } = _decorator;

@ccclass("WinPopup")
export class WinPopup extends Component {
  @property(Label)
  titleLabel: Label | null = null;

  @property(Label)
  moveCountLabel: Label | null = null;

  @property(Button)
  nextButton: Button | null = null;

  @property(Button)
  replayButton: Button | null = null;

  private onNextCallback: (() => void) | null = null;
  private onReplayCallback: (() => void) | null = null;

  protected onLoad(): void {
    this.nextButton?.node.on(Button.EventType.CLICK, () => {
      this.hide();
      this.onNextCallback?.();
    });

    this.replayButton?.node.on(Button.EventType.CLICK, () => {
      this.hide();
      this.onReplayCallback?.();
    });

    this.hide();
  }

  show(params: {
    levelId: number;
    moveCount: number;
    onNext: () => void;
    onReplay: () => void;
  }): void {
    this.node.active = true;

    if (this.titleLabel) {
      this.titleLabel.string = `第 ${params.levelId} 关完成`;
    }

    if (this.moveCountLabel) {
      this.moveCountLabel.string = `移动步数：${params.moveCount}`;
    }

    this.onNextCallback = params.onNext;
    this.onReplayCallback = params.onReplay;
  }

  hide(): void {
    this.node.active = false;
  }
}
